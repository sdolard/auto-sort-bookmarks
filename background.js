chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startSorting') {
    generateSortingPreview(message.force);
    sendResponse({ started: true });
  } else if (message.action === 'applyMoves') {
    applyValidatedMoves(message.moves).then(() => sendResponse({ done: true }));
    return true; // Asynchrone
  }
  return true; 
});

async function updateStatus(statusText, done = false) {
  chrome.runtime.sendMessage({ action: 'updateStatus', status: statusText, done: done }).catch(() => {});
}

async function generateSortingPreview(force = false) {
  try {
    const data = await chrome.storage.local.get(['deepseekApiKey', 'bookmarkCache', 'overrides']);
    const deepseekApiKey = data.deepseekApiKey;
    let bookmarkCache = data.bookmarkCache || {};
    const overridesText = data.overrides || "";
    
    if (!deepseekApiKey) throw new Error("Clé API manquante");
    if (force) bookmarkCache = {};

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
    const pendingMoves = []; 

    for (const b of allBookmarks) {
      const urlLower = b.url.toLowerCase();
      
      let matchedOverride = false;
      for (const [keyword, theme] of overrideRules) {
        if (urlLower.includes(keyword)) {
          pendingMoves.push({ id: b.id, title: b.title, url: b.url, theme: theme, source: 'override' });
          matchedOverride = true;
          break;
        }
      }
      if (matchedOverride) continue;

      if (bookmarkCache[b.url]) {
        pendingMoves.push({ id: b.id, title: b.title, url: b.url, theme: bookmarkCache[b.url], source: 'cache' });
        continue;
      }

      toAskAI.push(b);
    }

    let knownThemes = [...new Set(Object.values(bookmarkCache))];

    if (toAskAI.length > 0) {
      const batchSize = 40;
      const totalBatches = Math.ceil(toAskAI.length / batchSize);

      for (let i = 0; i < toAskAI.length; i += batchSize) {
        const batch = toAskAI.slice(i, i + batchSize);
        const currentBatchNum = Math.floor(i / batchSize) + 1;
        
        await updateStatus(`Analyse IA (lot ${currentBatchNum}/${totalBatches})...`);

        const prompt = `Tu es un expert en classification web. Voici un lot de favoris.

Thématiques déjà existantes : [${knownThemes.join(', ')}]

CONSIGNES STRICTES :
1. Pour chaque favori, attribue une thématique pertinente.
2. Utilise les thématiques existantes en priorité.
3. Sinon, crée une NOUVELLE thématique (générique, 1 à 2 mots, majuscule au début).
4. UNIQUEMENT du JSON valide au format : [{"id": "...", "theme": "..."}]

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

        for (const item of classifications) {
          const { id, theme } = item;
          const cleanTheme = theme.trim().charAt(0).toUpperCase() + theme.trim().slice(1);
          if (!knownThemes.includes(cleanTheme)) knownThemes.push(cleanTheme);
          
          const bookmarkInfo = batch.find(b => b.id === id);
          if (bookmarkInfo) {
            pendingMoves.push({ id: id, title: bookmarkInfo.title, url: bookmarkInfo.url, theme: cleanTheme, source: 'ai' });
          }
        }
      }
    }

    // Sauvegarder les propositions et ouvrir la page d'aperçu
    await updateStatus(`Ouverture de la page d'aperçu...`);
    await chrome.storage.local.set({ pendingMoves: pendingMoves });
    chrome.tabs.create({ url: chrome.runtime.getURL("preview.html") });
    await updateStatus(`Terminé.`, true);

  } catch (error) {
    console.error(error);
    await updateStatus(`Erreur : ${error.message}`, true);
  }
}

// Fonction appelée quand l'utilisateur valide l'aperçu
async function applyValidatedMoves(moves) {
  try {
    const data = await chrome.storage.local.get(['bookmarkCache']);
    const bookmarkCache = data.bookmarkCache || {};
    
    // Créer un dossier principal daté pour cette session
    const rootFolder = await chrome.bookmarks.create({ title: "Thématiques IA - " + new Date().toLocaleTimeString() });
    const themeFolders = {}; 
    
    for (const move of moves) {
      // S'assurer que le dossier thématique existe
      if (!themeFolders[move.theme]) {
        const folder = await chrome.bookmarks.create({ parentId: rootFolder.id, title: move.theme });
        themeFolders[move.theme] = folder.id;
      }
      
      // Déplacer le favori
      await chrome.bookmarks.move(move.id, { parentId: themeFolders[move.theme] });
      
      // Ajouter au cache local pour les futurs tris
      bookmarkCache[move.url] = move.theme;
    }

    // Sauvegarder le cache mis à jour et vider les pendingMoves
    await chrome.storage.local.set({ bookmarkCache: bookmarkCache, pendingMoves: [] });
    
  } catch (error) {
    console.error("Erreur lors de l'application des mouvements :", error);
  }
}
