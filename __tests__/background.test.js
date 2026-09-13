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
      get: jest.fn().mockResolvedValue({ deepseekApiKey: 'fake-test-key' })
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
          content: '[{"id": "1", "theme": "Recherche"}, {"id": "2", "theme": "Développement"}]' 
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
    // L'import du fichier exécute le code racine
    require('../background.js');
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
  });

  it('doit traiter correctement le message "startSorting"', async () => {
    // 1. Charger le script pour qu'il enregistre son écouteur
    require('../background.js');
    
    // 2. Récupérer la fonction callback passée à addListener
    const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
    
    // 3. Simuler l'envoi du message "startSorting" par la popup
    const sendResponse = jest.fn();
    const result = messageListener({ action: 'startSorting' }, {}, sendResponse);
    
    // 4. Vérifier que la réponse immédiate est envoyée
    expect(sendResponse).toHaveBeenCalledWith({ started: true });
    
    // On attend un court instant pour laisser les promesses asynchrones (startSortingProcess) se résoudre
    await new Promise(resolve => setTimeout(resolve, 100));

    // 5. Vérifier les appels d'API
    expect(chrome.storage.local.get).toHaveBeenCalledWith(['deepseekApiKey']);
    expect(chrome.bookmarks.getTree).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
    
    // Vérifier l'appel API vers DeepSeek
    const fetchCallUrl = fetch.mock.calls[0][0];
    expect(fetchCallUrl).toBe('https://api.deepseek.com/chat/completions');
    
    // Vérifier les créations et déplacements de dossiers
    expect(chrome.bookmarks.create).toHaveBeenCalledWith({ title: 'Thématiques IA' });
    expect(chrome.bookmarks.move).toHaveBeenCalledTimes(2);
  });
});
