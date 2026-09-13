// Mock global de l'API Chrome
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn().mockResolvedValue(),
    getURL: jest.fn().mockReturnValue('preview.html')
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
  },
  tabs: {
    create: jest.fn()
  }
};

// Mock de la librairie OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: '[{"id": "1", "theme": "Recherche"}]'
              }
            }]
          })
        }
      }
    };
  });
});

describe('Tests du Background Script (Worker)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('doit enregistrer un écouteur de messages à l\'initialisation', () => {
    require('../background.js');
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
  });

  it('doit générer une preview au lieu de déplacer directement', async () => {
    require('../background.js');
    const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
    const sendResponse = jest.fn();
    
    // Simuler l'appel normal (sans force)
    messageListener({ action: 'startSorting', force: false }, {}, sendResponse);
    expect(sendResponse).toHaveBeenCalledWith({ started: true });
    
    await new Promise(resolve => setTimeout(resolve, 150));

    // Vérification supprimée car on utilise openai maintenant
    
    // Les résultats doivent être sauvegardés dans pendingMoves
    expect(chrome.storage.local.set).toHaveBeenCalled();
    const setCall = chrome.storage.local.set.mock.calls[0][0];
    expect(setCall.pendingMoves).toBeDefined();
    expect(setCall.pendingMoves.length).toBe(2);
    
    // Un onglet doit s'ouvrir
    expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'preview.html' });
  });
  
  it('doit appliquer les mouvements validés et mettre en cache', async () => {
    require('../background.js');
    const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
    const sendResponse = jest.fn();
    
    // Simuler la validation via la page preview
    const moves = [{ id: '1', title: 'Google', url: 'https://google.com', theme: 'Recherche', source: 'ai' }];
    messageListener({ action: 'applyMoves', moves }, {}, sendResponse);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(chrome.bookmarks.create).toHaveBeenCalled();
    expect(chrome.bookmarks.move).toHaveBeenCalled();
    expect(chrome.storage.local.set).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ done: true });
  });
});
