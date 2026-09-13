document.addEventListener('DOMContentLoaded', () => {
  const sortBtn = document.getElementById('sortBtn');
  const forceBtn = document.getElementById('forceBtn');
  const optionsBtn = document.getElementById('optionsBtn');
  const statusDiv = document.getElementById('status');

  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  function triggerSorting(force = false) {
    chrome.storage.local.get(['deepseekApiKey'], (result) => {
      if (!result.deepseekApiKey) {
        statusDiv.innerHTML = '<span style="color:red;">Veuillez d\'abord configurer votre clé API.</span>';
        return;
      }

      sortBtn.disabled = true;
      forceBtn.disabled = true;
      statusDiv.textContent = force ? 'Réorganisation complète en cours...' : 'Analyse des nouveaux favoris en cours...';

      chrome.runtime.sendMessage({ action: 'startSorting', force: force }, (response) => {
        if (chrome.runtime.lastError) {
          statusDiv.innerHTML = `<span style="color:red;">Erreur : ${chrome.runtime.lastError.message}</span>`;
          sortBtn.disabled = false;
          forceBtn.disabled = false;
        }
      });
    });
  }

  sortBtn.addEventListener('click', () => triggerSorting(false));
  forceBtn.addEventListener('click', () => {
    if (confirm("Voulez-vous vraiment ignorer le cache et relancer l'IA sur TOUS les favoris ?")) {
      triggerSorting(true);
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
