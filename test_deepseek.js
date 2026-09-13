const fs = require('fs');
const en = JSON.parse(fs.readFileSync('_locales/en/messages.json', 'utf8'));

// Simulating what background.js does:
const prompt = en.aiPrompt.message
  .replace('__THEMES__', '')
  .replace('__BOOKMARKS__', JSON.stringify([
    { id: "1", title: "Billets de train pas cher - Voyages SNCF", url: "https://www.sncf-connect.com/" },
    { id: "2", title: "Le Monde.fr - Actualités à la Une", url: "https://www.lemonde.fr/" },
    { id: "3", title: "Recette de crêpes bretonnes faciles", url: "https://www.marmiton.org/" }
  ]));

const systemPrompt = en.aiSystem.message;

console.log("=== SYSTEM PROMPT ===");
console.log(systemPrompt);
console.log("=== USER PROMPT ===");
console.log(prompt);

