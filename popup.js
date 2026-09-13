document.addEventListener('DOMContentLoaded', () => {
  const sortBtn = document.getElementById('sortBtn');
  const forceBtn = document.getElementById('forceBtn');
  const optionsBtn = document.getElementById('optionsBtn');
  const statusDiv = document.getElementById('status');

  // Vérifier si un tri est déjà en cours
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    if (response && response.isSorting) {
      statusDiv.textContent = response.currentStatus || 'Tri en cours...';
      statusDiv.className = 'status processing';
      sortBtn.disabled = true;
      forceBtn.disabled = true;
    }
  });

  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  function triggerSortingPreview(force = false) {
    chrome.storage.local.get(['deepseekApiKey'], (result) => {
      if (!result.deepseekApiKey) {
        statusDiv.innerHTML = '<span style="color:red;">Veuillez d\'abord configurer votre clé API.</span>';
        return;
      }

      sortBtn.disabled = true;
      forceBtn.disabled = true;
      statusDiv.textContent = force ? 'Analyse complète en cours...' : 'Génération des propositions en cours...';

      chrome.runtime.sendMessage({ action: 'startSorting', force: force }, (response) => {
        if (chrome.runtime.lastError) {
          statusDiv.innerHTML = `<span style="color:red;">Erreur : ${chrome.runtime.lastError.message}</span>`;
          sortBtn.disabled = false;
          forceBtn.disabled = false;
        }
      });
    });
  }

  sortBtn.addEventListener('click', () => triggerSortingPreview(false));
  forceBtn.addEventListener('click', () => {
    if (confirm("Voulez-vous vraiment ignorer le cache et solliciter l'IA pour TOUS les favoris ?")) {
      triggerSortingPreview(true);
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateStatus') {
      statusDiv.textContent = message.status;
      if (message.done) {
        sortBtn.disabled = false;
        forceBtn.disabled = false;
      }
    }
  });
});
