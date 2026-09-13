document.addEventListener('DOMContentLoaded', () => {
  // Charger la clé existante et les règles
  chrome.storage.local.get(['deepseekApiKey', 'overrides', 'topCount'], (result) => {
    if (result.deepseekApiKey) document.getElementById('apiKey').value = result.deepseekApiKey;
    if (result.overrides) document.getElementById('overrides').value = result.overrides;
    if (result.topCount !== undefined) document.getElementById('topCount').value = result.topCount;
  });

  // Sauvegarder
  document.getElementById('saveBtn').addEventListener('click', () => {
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
      setTimeout(() => { status.textContent = ''; }, 3000);
    });
  });
});
