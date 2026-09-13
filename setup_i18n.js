const fs = require('fs');
const path = require('path');

// 1. Create _locales directories and files
fs.mkdirSync('_locales/en', { recursive: true });
fs.mkdirSync('_locales/fr', { recursive: true });

const en = {
  "extName": { "message": "AI Bookmark Organizer" },
  "extDesc": { "message": "Automatically sorts and organizes your bookmarks by theme using AI." },
  "optionsTitle": { "message": "Extension Configuration" },
  "apiKeyLabel": { "message": "DeepSeek API Key:" },
  "apiKeyHelp": { "message": "Required for AI analysis." },
  "topCountLabel": { "message": "Keep most visited bookmarks in the Bar:" },
  "topCountHelp": { "message": "The top X most clicked bookmarks will be placed directly on the bookmarks bar. Set to 0 to disable." },
  "overridesLabel": { "message": "Overrides / Manual Rules (Optional):" },
  "overridesHelp": { "message": "Force themes for specific web addresses. Format: <code>url-fragment = Theme</code> (one per line).<br><em>The script searches for this word in the URL (bookmark name doesn't matter).</em><br>Example: <code>github.com = Development</code><br><strong>Tip:</strong> Use <code>url-fragment = PIN</code> to force pin a bookmark to the bar." },
  "overridesPlaceholder": { "message": "youtube.com = Videos\namazon = Shopping\nmy-site.com = PIN" },
  "saveBtn": { "message": "Save Settings" },
  "saveAndSortBtn": { "message": "Save & Preview" },
  "statusSaved": { "message": "Settings saved successfully!" },
  "statusErrorApiKey": { "message": "Error: Please enter an API key first." },
  "statusGeneratingPreview": { "message": "Generating preview..." },
  "statusFullAnalysis": { "message": "Full analysis in progress..." },
  "statusReady": { "message": "Status: Ready" },
  "popupConfigBtn": { "message": "Configuration" },
  "popupSortBtn": { "message": "Generate sorting preview" },
  "popupForceBtn": { "message": "Force analysis (Ignore cache)" },
  "popupMissingKey": { "message": "Please configure your API key first." },
  "popupForceConfirm": { "message": "Are you sure you want to ignore the cache and ask the AI for ALL bookmarks?" },
  "previewTitle": { "message": "AI Sorting Preview" },
  "previewDesc": { "message": "Here are the move proposals. Uncheck those you want to ignore." },
  "thBookmark": { "message": "Bookmark" },
  "thTheme": { "message": "New Theme" },
  "thSource": { "message": "Source" },
  "btnApply": { "message": "Validate and Move" },
  "btnCancel": { "message": "Cancel" },
  "statusNoPending": { "message": "No data to display. Please restart the analysis." },
  "statusApplying": { "message": "Moving bookmarks..." },
  "statusFinished": { "message": "Completed! You can close this tab." },
  "bgMissingKey": { "message": "Missing API Key" },
  "bgFetching": { "message": "Fetching your bookmarks..." },
  "bgNoBookmarks": { "message": "No bookmarks found." },
  "bgHistory": { "message": "Analyzing visit history..." },
  "bgApiError": { "message": "DeepSeek API Error (batch $BATCH$): $MSG$" },
  "bgAiAnalysis": { "message": "AI Analysis (batch $CUR$/$TOT$)..." },
  "bgOpeningPreview": { "message": "Opening preview page..." },
  "bgDone": { "message": "Done." },
  "bgUnexpectedError": { "message": "Unexpected error: $MSG$" },
  "bookmarksBar": { "message": "⭐ Bookmarks Bar" },
  "aiThemesFolder": { "message": "AI Themes - " },
  "aiPrompt": { "message": "You are an expert in web classification. Here is a batch of bookmarks.\n\nExisting themes: [$THEMES$]\n\nSTRICT INSTRUCTIONS:\n1. For each bookmark, assign a relevant theme. You can create subfolders using the '/' separator if it makes sense (e.g., \"Development/Javascript\" or \"Travel/Hotels\"). Limit to 2 levels maximum.\n2. Use existing themes with priority.\n3. Otherwise, create a NEW theme (generic, 1 to 2 words, capitalized).\n4. Reply ONLY with valid JSON in this format: [{\"id\": \"...\", \"theme\": \"...\"}]\n\nBookmarks:\n$BOOKMARKS$" }
};

const fr = {
  "extName": { "message": "AI Bookmark Organizer" },
  "extDesc": { "message": "Trie et organise automatiquement vos favoris par thématique grâce à l'IA." },
  "optionsTitle": { "message": "Configuration de l'Extension" },
  "apiKeyLabel": { "message": "Clé API DeepSeek :" },
  "apiKeyHelp": { "message": "Nécessaire pour l'analyse par l'IA." },
  "topCountLabel": { "message": "Garder les favoris les plus visités dans la Barre :" },
  "topCountHelp": { "message": "Les X favoris les plus cliqués seront placés directement sur la barre de favoris. Mettez 0 pour désactiver." },
  "overridesLabel": { "message": "Surcharges / Règles Manuelles (Optionnel) :" },
  "overridesHelp": { "message": "Forcez des thématiques pour certaines adresses web. Format : <code>morceau-url = Thème</code> (un par ligne).<br><em>Le script cherche ce mot dans l'URL (le nom du favori n'a pas d'importance).</em><br>Exemple : <code>github.com = Développement</code><br><strong>Astuce :</strong> Utilisez <code>morceau-url = PIN</code> pour épingler de force un favori sur la barre." },
  "overridesPlaceholder": { "message": "youtube.com = Vidéos\namazon = Shopping\nmon-site.fr = PIN" },
  "saveBtn": { "message": "Enregistrer les paramètres" },
  "saveAndSortBtn": { "message": "Enregistrer & Lancer l'aperçu" },
  "statusSaved": { "message": "Paramètres enregistrés avec succès !" },
  "statusErrorApiKey": { "message": "Erreur : Veuillez d'abord saisir une clé API." },
  "statusGeneratingPreview": { "message": "Génération de l'aperçu en cours..." },
  "statusFullAnalysis": { "message": "Analyse complète en cours..." },
  "statusReady": { "message": "Statut : Prêt" },
  "popupConfigBtn": { "message": "Configuration" },
  "popupSortBtn": { "message": "Générer un aperçu du tri" },
  "popupForceBtn": { "message": "Forcer l'analyse (Ignorer le cache)" },
  "popupMissingKey": { "message": "Veuillez d'abord configurer votre clé API." },
  "popupForceConfirm": { "message": "Voulez-vous vraiment ignorer le cache et solliciter l'IA pour TOUS les favoris ?" },
  "previewTitle": { "message": "Aperçu du tri IA" },
  "previewDesc": { "message": "Voici les propositions de déplacement. Décochez ceux que vous souhaitez ignorer." },
  "thBookmark": { "message": "Favori" },
  "thTheme": { "message": "Nouvelle Thématique" },
  "thSource": { "message": "Origine" },
  "btnApply": { "message": "Valider et Déplacer" },
  "btnCancel": { "message": "Annuler" },
  "statusNoPending": { "message": "Aucune donnée à afficher. Veuillez relancer l'analyse." },
  "statusApplying": { "message": "Déplacement en cours..." },
  "statusFinished": { "message": "Terminé ! Vous pouvez fermer cet onglet." },
  "bgMissingKey": { "message": "Clé API manquante" },
  "bgFetching": { "message": "Récupération de vos favoris..." },
  "bgNoBookmarks": { "message": "Aucun favori trouvé." },
  "bgHistory": { "message": "Analyse de l'historique des visites..." },
  "bgApiError": { "message": "Erreur API DeepSeek (lot $BATCH$): $MSG$" },
  "bgAiAnalysis": { "message": "Analyse IA (lot $CUR$/$TOT$)..." },
  "bgOpeningPreview": { "message": "Ouverture de la page d'aperçu..." },
  "bgDone": { "message": "Terminé." },
  "bgUnexpectedError": { "message": "Erreur inattendue : $MSG$" },
  "bookmarksBar": { "message": "⭐ Barre de favoris" },
  "aiThemesFolder": { "message": "Thématiques IA - " },
  "aiPrompt": { "message": "Tu es un expert en classification web. Voici un lot de favoris.\n\nThématiques déjà existantes : [$THEMES$]\n\nCONSIGNES STRICTES:\n1. Pour chaque favori, attribue une thématique pertinente. Tu peux créer des sous-dossiers en utilisant le séparateur '/' si cela a du sens (ex: \"Développement/Javascript\" ou \"Voyage/Hôtels\"). Limite-toi à 2 niveaux maximum.\n2. Utilise les thématiques existantes en priorité.\n3. Sinon, crée une NOUVELLE thématique (générique, 1 à 2 mots, majuscule au début).\n4. UNIQUEMENT du JSON valide au format : [{\"id\": \"...\", \"theme\": \"...\"}]\n\nFavoris:\n$BOOKMARKS$" }
};

fs.writeFileSync('_locales/en/messages.json', JSON.stringify(en, null, 2));
fs.writeFileSync('_locales/fr/messages.json', JSON.stringify(fr, null, 2));

// 2. manifest.json
let manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
manifest.default_locale = "en";
manifest.name = "__MSG_extName__";
manifest.description = "__MSG_extDesc__";
if (manifest.action) manifest.action.default_title = "__MSG_extName__";
fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));

// 3. i18n.js
const i18nJs = `
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const msg = chrome.i18n.getMessage(el.getAttribute('data-i18n'));
    if (msg) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.getAttribute('placeholder')) el.placeholder = msg;
        else el.value = msg;
      } else {
        el.innerHTML = msg;
      }
    }
  });
});
`;
fs.writeFileSync('i18n.js', i18nJs);

// 4. Update HTML files
function replaceHTML(file, replacements) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('<script src="i18n.js"></script>')) {
    content = content.replace('</body>', '  <script src="i18n.js"></script>\n</body>');
  }
  for (const [search, replace] of replacements) {
    content = content.split(search).join(replace);
  }
  fs.writeFileSync(file, content);
}

replaceHTML('options.html', [
  ['<title>Options - AI Bookmark Organizer</title>', '<title data-i18n="optionsTitle">Options - AI Bookmark Organizer</title>'],
  ['<h2>Configuration de l\'Extension</h2>', '<h2 data-i18n="optionsTitle">Configuration de l\'Extension</h2>'],
  ['<label for="apiKey">Clé API DeepSeek :</label>', '<label for="apiKey" data-i18n="apiKeyLabel">Clé API DeepSeek :</label>'],
  ['<div class="help">Nécessaire pour l\'analyse par l\'IA.</div>', '<div class="help" data-i18n="apiKeyHelp">Nécessaire pour l\'analyse par l\'IA.</div>'],
  ['<label for="topCount">Garder les favoris les plus visités dans la Barre :</label>', '<label for="topCount" data-i18n="topCountLabel">Garder les favoris les plus visités dans la Barre :</label>'],
  ['<div class="help">Les X favoris les plus cliqués seront placés directement sur la barre de favoris. Mettez 0 pour désactiver.</div>', '<div class="help" data-i18n="topCountHelp">Les X favoris les plus cliqués seront placés directement sur la barre de favoris. Mettez 0 pour désactiver.</div>'],
  ['<label for="overrides">Surcharges / Règles Manuelles (Optionnel) :</label>', '<label for="overrides" data-i18n="overridesLabel">Surcharges / Règles Manuelles (Optionnel) :</label>'],
  ['<div class="help">\n    Forcez des thématiques pour certaines adresses web. Format : <code>morceau-url = Thème</code> (un par ligne).<br>\n    <em>Le script cherche ce mot dans l\'URL (le nom du favori n\'a pas d\'importance).</em><br>\n    Exemple : <code>github.com = Développement</code><br>\n    <strong>Astuce :</strong> Utilisez <code>morceau-url = PIN</code> pour épingler de force un favori sur la barre.\n  </div>', '<div class="help" data-i18n="overridesHelp"></div>'],
  ['placeholder="youtube.com = Vidéos&#10;amazon = Shopping&#10;mon-site.fr = PIN"', 'data-i18n="overridesPlaceholder" placeholder="youtube.com = Vidéos&#10;amazon = Shopping&#10;mon-site.fr = PIN"'],
  ['<button id="saveBtn">Enregistrer les paramètres</button>', '<button id="saveBtn" data-i18n="saveBtn">Enregistrer les paramètres</button>'],
  ['<button id="saveAndSortBtn" style="background-color: #2196F3; margin-left: 10px;">Enregistrer & Lancer l\'aperçu</button>', '<button id="saveAndSortBtn" style="background-color: #2196F3; margin-left: 10px;" data-i18n="saveAndSortBtn">Enregistrer & Lancer l\'aperçu</button>']
]);

replaceHTML('popup.html', [
  ['<title>AI Bookmark Organizer</title>', '<title data-i18n="extName">AI Bookmark Organizer</title>'],
  ['<h1>AI Bookmark Organizer</h1>', '<h1 data-i18n="extName">AI Bookmark Organizer</h1>'],
  ['<div id="status" class="status ready">Statut : Prêt</div>', '<div id="status" class="status ready" data-i18n="statusReady">Statut : Prêt</div>'],
  ['<button id="sortBtn" class="btn">Générer un aperçu du tri</button>', '<button id="sortBtn" class="btn" data-i18n="popupSortBtn">Générer un aperçu du tri</button>'],
  ['<button id="forceBtn" class="btn btn-secondary">Forcer l\'analyse (Ignorer le cache)</button>', '<button id="forceBtn" class="btn btn-secondary" data-i18n="popupForceBtn">Forcer l\'analyse (Ignorer le cache)</button>'],
  ['<button id="optionsBtn" class="btn btn-secondary">Configuration</button>', '<button id="optionsBtn" class="btn btn-secondary" data-i18n="popupConfigBtn">Configuration</button>']
]);

replaceHTML('preview.html', [
  ['<title>Aperçu du tri</title>', '<title data-i18n="previewTitle">Aperçu du tri</title>'],
  ['<h2>Aperçu du tri IA</h2>', '<h2 data-i18n="previewTitle">Aperçu du tri IA</h2>'],
  ['<p>Voici les propositions de déplacement. Décochez ceux que vous souhaitez ignorer.</p>', '<p data-i18n="previewDesc">Voici les propositions de déplacement. Décochez ceux que vous souhaitez ignorer.</p>'],
  ['<th>Favori</th>', '<th data-i18n="thBookmark">Favori</th>'],
  ['<th>Nouvelle Thématique</th>', '<th data-i18n="thTheme">Nouvelle Thématique</th>'],
  ['<th>Origine</th>', '<th data-i18n="thSource">Origine</th>'],
  ['<button id="applyBtn" class="btn">Valider et Déplacer</button>', '<button id="applyBtn" class="btn" data-i18n="btnApply">Valider et Déplacer</button>'],
  ['<button id="cancelBtn" class="btn cancel">Annuler</button>', '<button id="cancelBtn" class="btn cancel" data-i18n="btnCancel">Annuler</button>']
]);

// 5. Update JS files
function replaceJS(file, replacements) {
  let content = fs.readFileSync(file, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.split(search).join(replace);
  }
  fs.writeFileSync(file, content);
}

replaceJS('options.js', [
  ["'Paramètres enregistrés avec succès !'", "chrome.i18n.getMessage('statusSaved')"],
  ["\"Erreur : Veuillez d'abord saisir une clé API.\"", "chrome.i18n.getMessage('statusErrorApiKey')"],
  ["\"Génération de l'aperçu en cours...\"", "chrome.i18n.getMessage('statusGeneratingPreview')"]
]);

replaceJS('popup.js', [
  ["'Tri en cours...'", "chrome.i18n.getMessage('statusGeneratingPreview')"],
  ["'<span style=\"color:red;\">Veuillez d\\'abord configurer votre clé API.</span>'", "chrome.i18n.getMessage('popupMissingKey')"],
  ["force ? 'Analyse complète en cours...' : 'Génération des propositions en cours...'", "force ? chrome.i18n.getMessage('statusFullAnalysis') : chrome.i18n.getMessage('statusGeneratingPreview')"],
  ["\"Voulez-vous vraiment ignorer le cache et solliciter l'IA pour TOUS les favoris ?\"", "chrome.i18n.getMessage('popupForceConfirm')"]
]);

replaceJS('preview.js', [
  ["'Aucune donnée à afficher. Veuillez relancer l\\'analyse.'", "chrome.i18n.getMessage('statusNoPending')"],
  ["'Déplacement en cours...'", "chrome.i18n.getMessage('statusApplying')"],
  ["'Terminé ! Vous pouvez fermer cet onglet.'", "chrome.i18n.getMessage('statusFinished')"]
]);

replaceJS('background.js', [
  ["\"Clé API manquante\"", "chrome.i18n.getMessage('bgMissingKey')"],
  ["\"Récupération de vos favoris...\"", "chrome.i18n.getMessage('bgFetching')"],
  ["\"Aucun favori trouvé.\"", "chrome.i18n.getMessage('bgNoBookmarks')"],
  ["\"Analyse de l'historique des visites...\"", "chrome.i18n.getMessage('bgHistory')"],
  ["\"⭐ Barre de favoris\"", "chrome.i18n.getMessage('bookmarksBar')"],
  ["`Analyse IA (lot ${currentBatchNum}/${totalBatches})...`", "chrome.i18n.getMessage('bgAiAnalysis').replace('$CUR$', currentBatchNum).replace('$TOT$', totalBatches)"],
  ["`Erreur API DeepSeek (lot ${currentBatchNum}) : ${apiError.message}`", "chrome.i18n.getMessage('bgApiError').replace('$BATCH$', currentBatchNum).replace('$MSG$', apiError.message)"],
  ["`Ouverture de la page d'aperçu...`", "chrome.i18n.getMessage('bgOpeningPreview')"],
  ["`Terminé.`", "chrome.i18n.getMessage('bgDone')"],
  ["`Erreur inattendue : ${e.message}`", "chrome.i18n.getMessage('bgUnexpectedError').replace('$MSG$', e.message)"],
  ["\"Thématiques IA - \"", "chrome.i18n.getMessage('aiThemesFolder')"],
  // Re-write the prompt generation block completely
  ["const prompt = `Tu es un expert en classification web. Voici un lot de favoris.\\n\\nThématiques déjà existantes : [${knownThemes.join(', ')}]\\n\\nCONSIGNES STRICTES :\\n1. Pour chaque favori, attribue une thématique pertinente. Tu peux créer des sous-dossiers en utilisant le séparateur '/' si cela a du sens (ex: \"Développement/Javascript\" ou \"Voyage/Hôtels\"). Limite-toi à 2 niveaux maximum.\\n2. Utilise les thématiques existantes en priorité.\\n3. Sinon, crée une NOUVELLE thématique (générique, 1 à 2 mots, majuscule au début).\\n4. UNIQUEMENT du JSON valide au format : [{\"id\": \"...\", \"theme\": \"...\"}]\\n\\nFavoris :\\n${JSON.stringify(batch.map(b => ({id: b.id, title: b.title, url: b.url})))}`;", 
   "const prompt = chrome.i18n.getMessage('aiPrompt').replace('$THEMES$', knownThemes.join(', ')).replace('$BOOKMARKS$', JSON.stringify(batch.map(b => ({id: b.id, title: b.title, url: b.url}))));"]
]);

console.log("i18n setup complete!");
