document.addEventListener('DOMContentLoaded', () => {
  // Charger la clé existante et les règles
  chrome.storage.local.get(['deepseekApiKey', 'overrides', 'topCount'], (result) => {
    if (result.deepseekApiKey) document.getElementById('apiKey').value = result.deepseekApiKey;
    if (result.overrides) document.getElementById('overrides').value = result.overrides;
    if (result.topCount !== undefined) document.getElementById('topCount').value = result.topCount;
  });

  // Fonction de sauvegarde réutilisable
  function saveOptions(callback) {
    const apiKey = document.getElementById('apiKey').value.trim();
    const overrides = document.getElementById('overrides').value.trim();
    const topCount = parseInt(document.getElementById('topCount').value) || 0;
    
    chrome.storage.local.set({ 
      deepseekApiKey: apiKey,
      overrides: overrides,
      topCount: topCount
    }, () => {
      const status = document.getElementById('status');
      status.textContent = 'Paramètres enregistrés avec succès !';
      status.style.color = 'green';
      setTimeout(() => { 
        if (status.textContent === 'Paramètres enregistrés avec succès !') status.textContent = ''; 
      }, 3000);
      if (callback) callback(apiKey);
    });
  }

  // Clic sur Sauvegarder uniquement
  document.getElementById('saveBtn').addEventListener('click', () => saveOptions());

  // Clic sur Sauvegarder & Trier
  document.getElementById('saveAndSortBtn').addEventListener('click', () => {
    saveOptions((apiKey) => {
      const status = document.getElementById('status');
      if (!apiKey) {
        status.textContent = "Erreur : Veuillez d'abord saisir une clé API.";
        status.style.color = 'red';
        return;
      }
      
      status.textContent = "Génération de l'aperçu en cours...";
      status.style.color = 'blue';
      
      chrome.runtime.sendMessage({ action: 'startSorting', force: false }, (response) => {
        if (chrome.runtime.lastError) {
          status.textContent = 'Erreur : ' + chrome.runtime.lastError.message;
          status.style.color = 'red';
        }
      });
    });
  });

  // Écouter les mises à jour de progression du tri
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateStatus') {
      const status = document.getElementById('status');
      status.textContent = message.status;
      status.style.color = 'blue';
    }
  });
});
