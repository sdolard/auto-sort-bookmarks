// Service worker d'arrière-plan pour gérer les requêtes réseau et l'API de favoris

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startSorting') {
    startSortingProcess();
    sendResponse({ started: true });
  }
  return true; 
});

async function updateStatus(statusText, done = false) {
  chrome.runtime.sendMessage({ action: 'updateStatus', status: statusText, done: done })
    .catch(() => {}); // Ignorer l'erreur si la popup est fermée
}

async function startSortingProcess() {
  try {
    const { deepseekApiKey } = await chrome.storage.local.get(['deepseekApiKey']);
    if (!deepseekApiKey) throw new Error("Clé API manquante");

    await updateStatus("Récupération de vos favoris...");
    
    const tree = await chrome.bookmarks.getTree();
    const bookmarks = [];
    function extractUrls(node) {
      if (node.url) {
        bookmarks.push({ id: node.id, title: node.title, url: node.url, parentId: node.parentId });
      }
      if (node.children) node.children.forEach(extractUrls);
    }
    extractUrls(tree[0]);

    if (bookmarks.length === 0) {
      await updateStatus("Aucun favori trouvé.", true);
      return;
    }

    // Création du dossier racine pour le tri
    await updateStatus(`Création du dossier principal...`);
    const rootFolder = await chrome.bookmarks.create({ title: "Thématiques IA" });
    
    const batchSize = 40; // Nombre de favoris par requête pour éviter les limites de contexte
    let knownThemes = []; // Mémoire des thématiques inventées
    const themeFolders = {}; // Cache des IDs de dossiers : { "Nom du Thème": "id_du_dossier" }

    const totalBatches = Math.ceil(bookmarks.length / batchSize);

    for (let i = 0; i < bookmarks.length; i += batchSize) {
      const batch = bookmarks.slice(i, i + batchSize);
      const currentBatchNum = Math.floor(i / batchSize) + 1;
      
      await updateStatus(`Analyse avec DeepSeek (lot ${currentBatchNum}/${totalBatches})...`);

      const prompt = `Tu es un expert en classification web. Voici un lot de favoris.

Thématiques que tu as DÉJÀ inventées lors des lots précédents :
[${knownThemes.length > 0 ? knownThemes.join(', ') : 'Aucune, tu dois créer les premières.'}]

CONSIGNES STRICTES :
1. Pour chaque favori, attribue une thématique pertinente.
2. Essaie en priorité d'utiliser l'une des thématiques DÉJÀ inventées si elle correspond bien.
3. Si aucune ne correspond, crée une NOUVELLE thématique (générique, 1 à 2 mots, avec une majuscule au début. Ex: Développement, Actualités, Finance).
4. Ne crée pas de thématiques trop spécifiques (évite de créer "React" et "VueJS", regroupe sous "Développement").
5. RÉPONSE ATTENDUE : UNIQUEMENT un tableau JSON valide. Aucun texte avant, aucun texte après.

Format exact attendu : [{"id": "...", "theme": "..."}]

Favoris à classer :
${JSON.stringify(batch.map(b => ({id: b.id, title: b.title, url: b.url})))}
`;

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekApiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Tu es un système strict qui ne renvoie QUE du JSON valide. N\'utilise pas de bloc markdown ```json dans ta réponse.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1 // Température très basse pour garantir le format JSON et la cohérence
        })
      });

      if (!response.ok) {
          const err = await response.text();
          throw new Error(`Erreur API DeepSeek (lot ${currentBatchNum}): ` + err);
      }

      const data = await response.json();
      let content = data.choices[0].message.content;
      
      // Sécurité : Nettoyage au cas où l'IA mettrait quand même des balises markdown
      content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      
      let classifications;
      try {
        classifications = JSON.parse(content);
      } catch (e) {
        console.error("Erreur de parsing JSON sur ce lot :", content);
        throw new Error("DeepSeek a renvoyé un format invalide pour le lot " + currentBatchNum);
      }

      // Mise à jour de notre taxonomie et déplacement des favoris
      for (const item of classifications) {
        const { id, theme } = item;
        
        // Formater proprement le thème (majuscule, pas d'espaces superflus)
        const cleanTheme = theme.trim().charAt(0).toUpperCase() + theme.trim().slice(1);

        // Si le thème est nouveau, on l'ajoute à notre mémoire
        if (!knownThemes.includes(cleanTheme)) {
          knownThemes.push(cleanTheme);
        }
        
        // Créer le sous-dossier s'il n'existe pas encore dans ce run
        if (!themeFolders[cleanTheme]) {
          const folder = await chrome.bookmarks.create({
            parentId: rootFolder.id,
            title: cleanTheme
          });
          themeFolders[cleanTheme] = folder.id;
        }
        
        // Déplacer le favori
        await chrome.bookmarks.move(id, { parentId: themeFolders[cleanTheme] });
      }
    }

    await updateStatus(`Terminé ! Vos ${bookmarks.length} favoris ont été classés dans "${knownThemes.length}" thématiques.`, true);

  } catch (error) {
    console.error(error);
    await updateStatus(`Erreur : ${error.message}`, true);
  }
}
