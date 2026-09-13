document.addEventListener('DOMContentLoaded', () => {
  const sortBtn = document.getElementById('sortBtn');
  const forceBtn = document.getElementById('forceBtn');
  const optionsBtn = document.getElementById('optionsBtn');
  const statusDiv = document.getElementById('status');

  // Vérifier si un tri est déjà en cours
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    if (response && response.isSorting) {
      statusDiv.textContent = response.currentStatus || chrome.i18n.getMessage('statusGeneratingPreview');
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
        statusDiv.innerHTML = chrome.i18n.getMessage('popupMissingKey');
        return;
      }

      sortBtn.disabled = true;
      forceBtn.disabled = true;
      statusDiv.textContent = force ? chrome.i18n.getMessage('statusFullAnalysis') : chrome.i18n.getMessage('statusGeneratingPreview');

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
    if (confirm(chrome.i18n.getMessage('popupForceConfirm'))) {
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
