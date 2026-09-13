document.addEventListener('DOMContentLoaded', () => {
  // Charger la clé existante
  chrome.storage.local.get(['deepseekApiKey'], (result) => {
    if (result.deepseekApiKey) {
      document.getElementById('apiKey').value = result.deepseekApiKey;
    }
  });

  // Sauvegarder la nouvelle clé
  document.getElementById('saveBtn').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    chrome.storage.local.set({ deepseekApiKey: apiKey }, () => {
      const status = document.getElementById('status');
      status.textContent = 'Clé API enregistrée avec succès !';
      setTimeout(() => { status.textContent = ''; }, 3000);
    });
  });
});
