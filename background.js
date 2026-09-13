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
    
    // 1. Récupérer l'arbre des favoris
    const tree = await chrome.bookmarks.getTree();
    
    // 2. Aplatir l'arbre pour récupérer tous les liens (exclure les dossiers)
    const bookmarks = [];
    function extractUrls(node) {
      if (node.url) {
        // On exclut les favoris qui pourraient déjà être bien classés si besoin, 
        // ou on les prend tous. Ici, on prend tout.
        bookmarks.push({ id: node.id, title: node.title, url: node.url, parentId: node.parentId });
      }
      if (node.children) {
        node.children.forEach(extractUrls);
      }
    }
    extractUrls(tree[0]);

    if (bookmarks.length === 0) {
      await updateStatus("Aucun favori trouvé.", true);
      return;
    }

    await updateStatus(`Analyse de ${bookmarks.length} favoris via DeepSeek...`);

    // Pour éviter de surcharger l'API, on pourrait traiter par lots (ex: 30 favoris par requête).
    // Pour cet exemple initial, on prend les 20 premiers s'il y en a beaucoup pour tester
    // A ADAPTER SELON LE BESOIN REEL
    const batch = bookmarks.slice(0, 30); 
    const prompt = `
Voici une liste de favoris (navigateur web) au format JSON. 
Pour chaque favori, détermine une thématique pertinente, courte (1 ou 2 mots max, ex: "Développement", "Actualités", "Outils", "Loisirs", "Réseaux Sociaux").
Retourne UNIQUEMENT un tableau JSON valide contenant des objets avec l'id du favori et le thème proposé. 
Exemple de sortie : [{"id": "1", "theme": "Développement"}]

Favoris:
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
          { role: 'system', content: 'Tu es un assistant qui classe des sites web en thématiques.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1 // Température basse pour avoir un résultat déterministe
      })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error("Erreur de l'API DeepSeek: " + err);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extraire le JSON de la réponse (au cas où il y a des backticks markdown)
    const jsonStr = content.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const classifications = JSON.parse(jsonStr);

    await updateStatus(`Création des dossiers et déplacement...`);
    
    // Créer un dossier principal "Thématiques IA" pour ne pas polluer la barre personnelle
    const rootFolder = await chrome.bookmarks.create({ title: "Thématiques IA" });
    
    // Gérer les dossiers thématiques
    const themeFolders = {}; // Cache pour ne pas créer le même dossier 2 fois
    
    for (const item of classifications) {
      const { id, theme } = item;
      
      // Créer le sous-dossier s'il n'existe pas encore
      if (!themeFolders[theme]) {
        const folder = await chrome.bookmarks.create({
          parentId: rootFolder.id,
          title: theme
        });
        themeFolders[theme] = folder.id;
      }
      
      // Déplacer le favori
      await chrome.bookmarks.move(id, { parentId: themeFolders[theme] });
    }

    await updateStatus(`Terminé ! Vos ${batch.length} favoris ont été classés dans le dossier "Thématiques IA".`, true);

  } catch (error) {
    console.error(error);
    await updateStatus(`Erreur : ${error.message}`, true);
  }
}
