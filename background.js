chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startSorting') {
    startSortingProcess(message.force);
    sendResponse({ started: true });
  }
  return true; 
});

async function updateStatus(statusText, done = false) {
  chrome.runtime.sendMessage({ action: 'updateStatus', status: statusText, done: done })
    .catch(() => {});
}

async function startSortingProcess(force = false) {
  try {
    const data = await chrome.storage.local.get(['deepseekApiKey', 'bookmarkCache', 'overrides']);
    const deepseekApiKey = data.deepseekApiKey;
    let bookmarkCache = data.bookmarkCache || {};
    const overridesText = data.overrides || "";
    
    if (!deepseekApiKey) throw new Error("Clé API manquante");
    if (force) bookmarkCache = {}; // On vide le cache si on force

    // Construire les règles de surcharge : { "github.com": "Développement" }
    const overrideRules = overridesText.split('\n')
      .map(line => line.split('='))
      .filter(parts => parts.length === 2)
      .map(([key, value]) => [key.trim().toLowerCase(), value.trim()]);

    await updateStatus("Récupération de vos favoris...");
    
    const tree = await chrome.bookmarks.getTree();
    const allBookmarks = [];
    function extractUrls(node) {
      if (node.url) {
        allBookmarks.push({ id: node.id, title: node.title, url: node.url, parentId: node.parentId });
      }
      if (node.children) node.children.forEach(extractUrls);
    }
    extractUrls(tree[0]);

    if (allBookmarks.length === 0) {
      await updateStatus("Aucun favori trouvé.", true);
      return;
    }

    const toAskAI = [];
    const directMoves = []; // Fichiers à déplacer via le cache ou les règles manuelles

    // Étape 1 : Filtrage (Cache & Règles manuelles)
    for (const b of allBookmarks) {
      const urlLower = b.url.toLowerCase();
      
      // A. Vérifier les règles manuelles
      let matchedOverride = false;
      for (const [keyword, theme] of overrideRules) {
        if (urlLower.includes(keyword)) {
          directMoves.push({ id: b.id, theme: theme, source: 'override' });
          matchedOverride = true;
          break;
        }
      }
      if (matchedOverride) continue;

      // B. Vérifier le cache
      if (bookmarkCache[b.url]) {
        directMoves.push({ id: b.id, theme: bookmarkCache[b.url], source: 'cache' });
        continue;
      }

      // C. Sinon, on doit demander à l'IA
      toAskAI.push(b);
    }

    // Création du dossier racine
    await updateStatus(`Préparation des dossiers...`);
    // Note : On pourrait vérifier si "Thématiques IA" existe déjà pour ne pas en recréer un à chaque fois.
    // Pour l'instant, on crée un dossier daté pour voir le résultat du run.
    const rootFolder = await chrome.bookmarks.create({ title: "Thématiques IA - " + new Date().toLocaleTimeString() });
    const themeFolders = {}; 
    let knownThemes = [...new Set(Object.values(bookmarkCache))]; // On initialise la mémoire avec les thèmes du cache

    // Fonction utilitaire pour déplacer
    async function moveToThemeFolder(id, theme) {
      const cleanTheme = theme.trim().charAt(0).toUpperCase() + theme.trim().slice(1);
      if (!knownThemes.includes(cleanTheme)) knownThemes.push(cleanTheme);
      
      if (!themeFolders[cleanTheme]) {
        const folder = await chrome.bookmarks.create({ parentId: rootFolder.id, title: cleanTheme });
        themeFolders[cleanTheme] = folder.id;
      }
      await chrome.bookmarks.move(id, { parentId: themeFolders[cleanTheme] });
    }

    // Étape 2 : Déplacer les favoris résolus localement (Cache + Règles)
    for (const item of directMoves) {
      await moveToThemeFolder(item.id, item.theme);
    }

    // Étape 3 : Demander à l'IA pour le reste
    if (toAskAI.length > 0) {
      const batchSize = 40;
      const totalBatches = Math.ceil(toAskAI.length / batchSize);

      for (let i = 0; i < toAskAI.length; i += batchSize) {
        const batch = toAskAI.slice(i, i + batchSize);
        const currentBatchNum = Math.floor(i / batchSize) + 1;
        
        await updateStatus(`Analyse IA des nouveaux favoris (lot ${currentBatchNum}/${totalBatches})...`);

        const prompt = `Tu es un expert en classification web. Voici un lot de favoris.

Thématiques que tu as DÉJÀ inventées : [${knownThemes.join(', ')}]

CONSIGNES STRICTES :
1. Pour chaque favori, attribue une thématique pertinente.
2. Essaie en priorité d'utiliser l'une des thématiques DÉJÀ inventées.
3. Sinon, crée une NOUVELLE thématique (générique, 1 à 2 mots, majuscule au début).
4. Ne renvoie QUE du JSON valide.

Format : [{"id": "...", "theme": "..."}]

Favoris :
${JSON.stringify(batch.map(b => ({id: b.id, title: b.title, url: b.url})))}`;

        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekApiKey}` },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'Tu es un système strict qui ne renvoie QUE du JSON valide. Pas de markdown.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.1
          })
        });

        if (!response.ok) throw new Error(`Erreur API DeepSeek (lot ${currentBatchNum})`);

        const data = await response.json();
        let content = data.choices[0].message.content.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        const classifications = JSON.parse(content);

        // Déplacer et mettre en cache
        for (const item of classifications) {
          const { id, theme } = item;
          const cleanTheme = theme.trim().charAt(0).toUpperCase() + theme.trim().slice(1);
          
          await moveToThemeFolder(id, cleanTheme);
          
          // Sauvegarder dans le cache local l'URL associée à son thème
          const bookmarkInfo = batch.find(b => b.id === id);
          if (bookmarkInfo) {
            bookmarkCache[bookmarkInfo.url] = cleanTheme;
          }
        }
      }
      
      // Sauvegarder le nouveau cache
      await chrome.storage.local.set({ bookmarkCache: bookmarkCache });
    }

    await updateStatus(`Terminé ! Déplacements locaux : ${directMoves.length} | Analysés par l'IA : ${toAskAI.length}`, true);

  } catch (error) {
    console.error(error);
    await updateStatus(`Erreur : ${error.message}`, true);
  }
}
