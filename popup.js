document.addEventListener('DOMContentLoaded', () => {
  const sortBtn = document.getElementById('sortBtn');
  const optionsBtn = document.getElementById('optionsBtn');
  const statusDiv = document.getElementById('status');

  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  sortBtn.addEventListener('click', () => {
    // Vérifier si la clé API est configurée
    chrome.storage.local.get(['deepseekApiKey'], (result) => {
      if (!result.deepseekApiKey) {
        statusDiv.innerHTML = '<span style="color:red;">Veuillez d\'abord configurer votre clé API.</span>';
        return;
      }

      sortBtn.disabled = true;
      statusDiv.textContent = 'Analyse des favoris en cours (cela peut prendre quelques minutes)...';

      // Envoyer un message au service worker (background.js) pour démarrer le processus
      chrome.runtime.sendMessage({ action: 'startSorting' }, (response) => {
        if (chrome.runtime.lastError) {
          statusDiv.innerHTML = `<span style="color:red;">Erreur : ${chrome.runtime.lastError.message}</span>`;
          sortBtn.disabled = false;
        }
      });
    });
  });

  // Écouter les mises à jour de progression depuis background.js
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateStatus') {
      statusDiv.textContent = message.status;
      if (message.done) {
        sortBtn.disabled = false;
      }
    }
  });
});
