// Mock global de l'API Chrome
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn().mockResolvedValue(),
  },
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({ 
        deepseekApiKey: 'fake-test-key',
        bookmarkCache: {},
        overrides: 'github.com=Développement\nyoutube.com=Vidéos'
      }),
      set: jest.fn().mockResolvedValue()
    }
  },
  bookmarks: {
    getTree: jest.fn().mockResolvedValue([
      {
        id: 'root',
        children: [
          { id: '1', title: 'Google', url: 'https://google.com' },
          { id: '2', title: 'GitHub', url: 'https://github.com' }
        ]
      }
    ]),
    create: jest.fn().mockResolvedValue({ id: 'folder-ai' }),
    move: jest.fn().mockResolvedValue()
  }
};

// Mock de la fonction fetch globale
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      choices: [{ 
        message: { 
          content: '[{"id": "1", "theme": "Recherche"}]' 
        } 
      }]
    })
  })
);

describe('Tests du Background Script (Worker)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('doit enregistrer un écouteur de messages à l\'initialisation', () => {
    require('../background.js');
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
  });

  it('doit traiter correctement le message "startSorting" avec cache et overrides', async () => {
    require('../background.js');
    const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
    const sendResponse = jest.fn();
    
    // Simuler l'appel normal (sans force)
    messageListener({ action: 'startSorting', force: false }, {}, sendResponse);
    expect(sendResponse).toHaveBeenCalledWith({ started: true });
    
    await new Promise(resolve => setTimeout(resolve, 150));

    // Vérifier les appels d'API
    expect(chrome.storage.local.get).toHaveBeenCalledWith(['deepseekApiKey', 'bookmarkCache', 'overrides']);
    expect(chrome.bookmarks.getTree).toHaveBeenCalled();
    
    // fetch appelé 1 seule fois car GitHub est traité par les règles (override)
    expect(fetch).toHaveBeenCalledTimes(1);
    
    // Le dossier devrait avoir une chaîne incluant "Thématiques IA"
    expect(chrome.bookmarks.create.mock.calls[0][0].title).toMatch(/Thématiques IA/);
    expect(chrome.bookmarks.move).toHaveBeenCalledTimes(2);
    expect(chrome.storage.local.set).toHaveBeenCalled();
  });
});
