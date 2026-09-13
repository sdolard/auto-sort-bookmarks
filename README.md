# DeepSeek Bookmark Organizer 🔖🤖

Une extension Chrome intelligente qui utilise l'IA (DeepSeek) pour trier, catégoriser et organiser automatiquement vos favoris web.

## 🚀 Fonctionnalités
- **Tri par IA** : Analyse automatique des titres et URLs pour créer des thématiques organiques et cohérentes.
- **Aperçu interactif (Preview)** : Vérifiez, modifiez ou annulez les propositions de l'IA *avant* que l'extension ne déplace quoi que ce soit.
- **Système de Cache** : Les favoris déjà validés sont mis en cache localement. L'IA n'est sollicitée que pour les nouveaux favoris, ce qui économise des requêtes API.
- **Règles Manuelles (Overrides)** : Forcez manuellement certains mots-clés dans des dossiers précis sans utiliser l'IA (ex: `github.com = Développement`).

---

## 🛠️ Installation et Utilisation

### 1. Installation dans Chrome
1. Clonez ce dépôt sur votre machine : `git clone https://github.com/sdolard/auto-sort-bookmarks.git`
2. Ouvrez Google Chrome et accédez à la page des extensions : `chrome://extensions/`.
3. Activez le **"Mode développeur"** (bouton en haut à droite).
4. Cliquez sur **"Charger l'extension non empaquetée"** et sélectionnez le dossier que vous venez de cloner.

### 2. Configuration (Clé API)
1. Épinglez l'extension pour y accéder facilement.
2. Cliquez sur l'icône de l'extension, puis sur **Configuration (Clé API & Règles)**.
3. Obtenez une clé API sur la [plateforme DeepSeek](https://platform.deepseek.com/).
4. Collez votre clé API (elle sera stockée de manière sécurisée et uniquement dans le stockage local de votre navigateur).

### 3. Utilisation
- Cliquez sur **"Générer un aperçu du tri"**. L'extension va analyser vos favoris.
- Un nouvel onglet s'ouvrira avec un tableau récapitulatif.
- Décochez les favoris que vous ne voulez pas déplacer, puis cliquez sur **"Valider et Déplacer"**.

---

## 🤝 Comment Contribuer

Toutes les contributions sont les bienvenues ! Qu'il s'agisse de nouvelles fonctionnalités, de corrections de bugs ou d'améliorations de l'interface. Jetez un œil à l'onglet [Issues](https://github.com/sdolard/auto-sort-bookmarks/issues) pour voir la roadmap.

### Architecture du projet
- `background.js` : Le "cerveau" (Service Worker). Il gère le cache, filtre les URLs, interroge l'API DeepSeek par lots, et effectue les déplacements finaux.
- `popup.html` / `popup.js` : Le menu déroulant de l'extension.
- `preview.html` / `preview.js` : La vue de validation avant modification de l'arborescence.
- `options.html` / `options.js` : L'interface de configuration.

### Environnement de développement (Tests)
Le projet utilise **Jest** pour les tests unitaires (la logique de Chrome et de l'API externe y est simulée/mockée).

Pour installer les dépendances de test :
```bash
npm install
```

Pour lancer la suite de tests :
```bash
npm test
```

Veuillez vous assurer que les tests passent (`PASS`) avant de soumettre une *Pull Request*.
