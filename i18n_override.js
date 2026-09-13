let customI18nDict = null;

async function loadLanguageOverride() {
  const data = await chrome.storage.local.get(['langOverride']);
  const lang = data.langOverride || 'auto';
  
  if (lang !== 'auto') {
    try {
      const url = chrome.runtime.getURL(`_locales/${lang}/messages.json`);
      const res = await fetch(url);
      customI18nDict = await res.json();
      
      const originalGetMessage = chrome.i18n.getMessage;
      chrome.i18n.getMessage = function(key) {
        if (customI18nDict && customI18nDict[key]) {
          return customI18nDict[key].message;
        }
        return originalGetMessage.apply(chrome.i18n, arguments);
      };
    } catch(e) {
      console.error("Failed to load language override", e);
    }
  }
}
