import OpenAI from 'openai';

let isSorting = false;
let currentStatus = "";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getStatus') {
    sendResponse({ isSorting: isSorting, currentStatus: currentStatus });
    return true;
  } else if (message.action === 'startSorting') {
    if (isSorting) {
      sendResponse({ started: false });
      return true;
    }
    isSorting = true;
    currentStatus = "Démarrage...";
    generateSortingPreview(message.force).catch(e => {
      isSorting = false;
      updateStatus(`Erreur inattendue : ${e.message}`, true);
    });
    sendResponse({ started: true });
    return true;
  } else if (message.action === 'applyMoves') {
    applyValidatedMoves(message.moves).then(() => sendResponse({ done: true }));
    return true; 
  }
  return true; 
});

async function updateStatus(statusText, done = false) {
  currentStatus = statusText;
  if (done) isSorting = false;
  chrome.runtime.sendMessage({ action: 'updateStatus', status: statusText, done: done }).catch(() => {});
}

async function generateSortingPreview(force = false) {
  try {
    const data = await chrome.storage.local.get(['deepseekApiKey', 'bookmarkCache', 'overrides', 'topCount']);
    const deepseekApiKey = data.deepseekApiKey;
    let bookmarkCache = data.bookmarkCache || {};
    const overridesText = data.overrides || "";
    const topCount = data.topCount !== undefined ? parseInt(data.topCount) : 10;
    
    if (!deepseekApiKey) throw new Error("Clé API manquante");
    if (force) bookmarkCache = {};

    // Initialiser le client OpenAI pour DeepSeek
    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: deepseekApiKey,
      dangerouslyAllowBrowser: true
    });

    const overrideRules = overridesText.split('\n')
      .map(line => line.split('='))
      .filter(parts => parts.length === 2)
      .map(([key, value]) => [key.trim().toLowerCase(), value.trim()]);

    await updateStatus("Récupération de vos favoris...");
    
    const tree = await chrome.bookmarks.getTree();
    let allBookmarks = [];
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

    if (topCount > 0) {
      await updateStatus("Analyse de l'historique des visites...");
      const visitsPromises = allBookmarks.map(async (b) => {
        try {
          const visits = await chrome.history.getVisits({ url: b.url });
          b.visitCount = visits.length;
        } catch(e) {
          b.visitCount = 0;
        }
        return b;
      });
      await Promise.all(visitsPromises);
      
      // Trier par nombre de visites décroissant
      allBookmarks.sort((a, b) => b.visitCount - a.visitCount);
    }

    const toAskAI = [];
    const pendingMoves = []; 

    for (let index = 0; index < allBookmarks.length; index++) {
      const b = allBookmarks[index];
      const urlLower = b.url.toLowerCase();

      // Gestion du top favoris
      if (topCount > 0 && index < topCount && b.visitCount > 0) {
        pendingMoves.push({ 
          id: b.id, 
          title: b.title, 
          url: b.url, 
          theme: "⭐ Barre de favoris", 
          source: 'history',
          targetParentId: '1' // ID standard de la barre de favoris Chrome
        });
        continue;
      }
      
      let matchedOverride = false;
      for (const [keyword, theme] of overrideRules) {
        if (urlLower.includes(keyword)) {
          const isPinned = theme === 'pin' || theme === 'barre';
          pendingMoves.push({ 
            id: b.id, 
            title: b.title, 
            url: b.url, 
            theme: isPinned ? "⭐ Barre de favoris" : theme, 
            source: 'override',
            targetParentId: isPinned ? '1' : undefined
          });
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
1. Pour chaque favori, attribue une thématique pertinente. Tu peux créer des sous-dossiers en utilisant le séparateur '/' si cela a du sens (ex: "Développement/Javascript" ou "Voyage/Hôtels"). Limite-toi à 2 niveaux maximum.
2. Utilise les thématiques existantes en priorité.
3. Sinon, crée une NOUVELLE thématique (générique, 1 à 2 mots, majuscule au début).
4. UNIQUEMENT du JSON valide au format : [{"id": "...", "theme": "..."}]

Favoris :
${JSON.stringify(batch.map(b => ({id: b.id, title: b.title, url: b.url})))}`;

        try {
          const response = await openai.chat.completions.create({
            model: 'deepseek-flash',
            messages: [
              { role: 'system', content: 'Tu es un système strict qui ne renvoie QUE du JSON valide. Pas de markdown.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.1
          });

          let content = response.choices[0].message.content.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
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
        } catch (apiError) {
          throw new Error(`Erreur API DeepSeek (lot ${currentBatchNum}) : ${apiError.message}`);
        }
      }
    }

    // Aplatissement des sous-dossiers inutiles (contenant 1 seul favori)
    let foldersChanged = true;
    while (foldersChanged) {
      foldersChanged = false;
      const themeCounts = {};
      
      for (const m of pendingMoves) {
        if (!m.targetParentId) {
          themeCounts[m.theme] = (themeCounts[m.theme] || 0) + 1;
        }
      }

      for (const m of pendingMoves) {
        if (!m.targetParentId && m.theme.includes('/') && m.source !== 'override') {
          if (themeCounts[m.theme] === 1) {
            const parts = m.theme.split('/');
            parts.pop(); // Retire le sous-dossier (feuille) inutile
            m.theme = parts.join('/');
            foldersChanged = true;
          }
        }
      }
    }

    // Trier les propositions pour que l'affichage dans l'aperçu soit logique et ordonné
    pendingMoves.sort((a, b) => {
      // 1. Les épinglés (Barre de favoris) passent toujours en premier
      if (a.targetParentId && !b.targetParentId) return -1;
      if (!a.targetParentId && b.targetParentId) return 1;
      
      // 2. Tri alphabétique par Thématique
      const themeDiff = (a.theme || "").localeCompare(b.theme || "");
      if (themeDiff !== 0) return themeDiff;
      
      // 3. Tri alphabétique par Nom du favori
      return (a.title || "").localeCompare(b.title || "");
    });

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
    
    // SÉPARATION DES MOUVEMENTS
    const pinnedMoves = moves.filter(m => m.targetParentId);
    const themeMoves = moves.filter(m => !m.targetParentId);

    // 1. BARRE DE FAVORIS : Tri par fréquence d'usage
    for (const m of pinnedMoves) {
       try {
         const visits = await chrome.history.getVisits({ url: m.url });
         m.visitCount = visits.length;
       } catch(e) { m.visitCount = 0; }
    }
    // Ordre décroissant (le plus utilisé en premier)
    pinnedMoves.sort((a, b) => b.visitCount - a.visitCount);

    // Déplacement indexé
    for (let i = 0; i < pinnedMoves.length; i++) {
       await chrome.bookmarks.move(pinnedMoves[i].id, {
           parentId: pinnedMoves[i].targetParentId,
           index: i // Place au tout début (à gauche) de la barre
       });
    }

    // 2. DOSSIERS THÉMATIQUES : Tri alphabétique et Sous-dossiers
    const rootFolder = await chrome.bookmarks.create({ title: "Thématiques IA - " + new Date().toLocaleTimeString() });
    
    // Grouper par thème (le thème peut être un chemin complet, ex: "Dev/JS")
    const groupedThemes = {};
    for (const m of themeMoves) {
       const cleanThemePath = (m.theme || "Divers").split('/').map(s => s.trim()).filter(s => s).join('/');
       m.theme = cleanThemePath || "Divers";
       
       if (!groupedThemes[m.theme]) groupedThemes[m.theme] = [];
       groupedThemes[m.theme].push(m);
    }

    // Créer les dossiers par ordre alphabétique
    const sortedThemeNames = Object.keys(groupedThemes).sort((a, b) => a.localeCompare(b));
    const folderIdCache = {}; // Cache pour ne pas recréer les dossiers parents

    for (const themePath of sortedThemeNames) {
       const parts = themePath.split('/');
       let currentParentId = rootFolder.id;
       
       // Construire l'arborescence dossier par dossier
       for (const part of parts) {
           const key = `${currentParentId}/${part}`;
           if (!folderIdCache[key]) {
               // En créant séquentiellement depuis sortedThemeNames, 
               // Chrome ajoute à la fin, ce qui garantit l'ordre A-Z.
               const newFolder = await chrome.bookmarks.create({ parentId: currentParentId, title: part });
               folderIdCache[key] = newFolder.id;
           }
           currentParentId = folderIdCache[key];
       }
       
       // Trier les favoris dans le dossier final par ordre alphabétique
       const bmarks = groupedThemes[themePath];
       bmarks.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
       
       for (const m of bmarks) {
          // On ajoute séquentiellement à la fin (préserve A-Z)
          await chrome.bookmarks.move(m.id, { parentId: currentParentId });
          bookmarkCache[m.url] = m.theme;
       }
    }

    // Sauvegarder le cache mis à jour et vider les pendingMoves
    await chrome.storage.local.set({ bookmarkCache: bookmarkCache, pendingMoves: [] });
    
    // --- NOUVEAU : Nettoyage des dossiers désormais vides ---
    async function cleanNode(node) {
      if (node.children) {
        // Nettoyer d'abord les enfants (Bottom-Up)
        for (const child of node.children) {
          await cleanNode(child);
        }
        // Vérifier si le dossier courant est maintenant vide
        const freshNode = (await chrome.bookmarks.getSubTree(node.id))[0];
        // On ne supprime pas les dossiers racines de Chrome (ids souvent '0', '1', '2', '3')
        if (freshNode.children && freshNode.children.length === 0 && !['0', '1', '2', '3'].includes(node.id)) {
          try { 
            await chrome.bookmarks.remove(node.id); 
          } catch (e) {
            // Ignorer l'erreur si le dossier est verrouillé par le système
          }
        }
      }
    }
    
    const fullTree = await chrome.bookmarks.getTree();
    for (const rootChild of fullTree[0].children) {
      await cleanNode(rootChild);
    }
    
  } catch (error) {
    console.error("Erreur lors de l'application des mouvements :", error);
  }
}
