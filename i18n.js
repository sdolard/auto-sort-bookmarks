document.addEventListener('DOMContentLoaded', async () => {
  if (typeof loadLanguageOverride === 'function') {
    await loadLanguageOverride();
  }
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const msg = chrome.i18n.getMessage(el.getAttribute('data-i18n'));
    if (msg) {
      if (el.tagName === 'INPUT' && el.type === 'text') {
        el.placeholder = msg;
      } else {
        el.innerText = msg;
      }
    }
  });
});
