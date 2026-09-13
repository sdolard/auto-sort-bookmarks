# AI Bookmark Organizer 🔖🤖

Une extension Chrome intelligente qui utilise l'IA (modèle ultra-rapide DeepSeek-Flash) pour trier, catégoriser et organiser automatiquement vos favoris web, avec un respect maniaque de l'ordre.

## 🚀 Fonctionnalités
- **Tri par IA & Sous-dossiers** : Analyse automatique des titres et URLs pour créer des thématiques organiques. L'IA génère des sous-dossiers (jusqu'à 2 niveaux, ex: `Développement/Javascript`).
- **Croisement avec l'Historique Chrome** : Vos X favoris les plus cliqués sont isolés de l'IA et épinglés directement à la racine de la Barre de favoris, classés par fréquence d'utilisation (le plus consulté en premier).
- **Règles Manuelles & Mot-clé PIN** : Forcez manuellement des thèmes (ex: `github.com = Développement`). Utilisez le mot-clé magique `PIN` (ex: `drive.google.com = PIN`) pour épingler de force un lien sur votre barre d'accès rapide.
- **Rangement Clinique (A à Z)** : Les dossiers générés et les favoris qu'ils contiennent sont strictement triés par ordre alphabétique.
- **Nettoyage Automatique Intelligent** : 
  - L'extension supprime automatiquement les anciens dossiers devenus vides après le tri.
  - Elle "aplatit" les sous-dossiers isolés (si l'IA crée un sous-dossier contenant un seul favori, celui-ci est automatiquement remonté dans le dossier parent).
- **Aperçu interactif (Preview)** : Vérifiez, modifiez ou annulez les propositions de l'IA *avant* tout déplacement. L'aperçu reflète parfaitement la future structure.
- **Système de Cache** : Les favoris déjà validés sont mis en cache localement pour économiser vos crédits API lors des passages suivants.

---

## 🛠️ Installation et Utilisation

### 1. Compilation & Installation dans Chrome
Le projet utilise le package officiel OpenAI via `esbuild`.
1. Clonez ce dépôt : `git clone https://github.com/sdolard/auto-sort-bookmarks.git`
2. Installez les dépendances : `npm install`
3. Compilez l'extension : `npx esbuild background.js --bundle --outfile=background.bundle.js`
4. Ouvrez Google Chrome et accédez à `chrome://extensions/`.
5. Activez le **"Mode développeur"** (en haut à droite).
6. Cliquez sur **"Charger l'extension non empaquetée"** et sélectionnez le dossier du projet.

### 2. Configuration (Clé API)
1. Épinglez l'extension pour y accéder facilement.
2. Cliquez sur l'icône, puis sur **Configuration (Clé API & Règles)**.
3. Obtenez une clé API sur la [plateforme DeepSeek](https://platform.deepseek.com/).
4. Renseignez la clé API, choisissez le nombre de favoris fréquents à protéger, et ajoutez vos éventuelles règles manuelles.
5. Utilisez le bouton raccourci **"Enregistrer & Lancer l'aperçu"** pour démarrer immédiatement !

### 3. Utilisation
- Lors de sa première analyse, Chrome vous demandera d'accepter la nouvelle permission liée à l'**Historique** (nécessaire pour mesurer vos habitudes de clic).
- Validez les propositions via le tableau d'aperçu.
- Appréciez votre nouvelle arborescence `Thématiques IA` et votre barre de favoris parfaitement optimisée.

---

## 🤝 Comment Contribuer
Toutes les contributions sont les bienvenues ! Jetez un œil à l'onglet [Issues](https://github.com/sdolard/auto-sort-bookmarks/issues) pour la roadmap.

### Architecture
- `background.js` / `background.bundle.js` : Service Worker gérant l'IA, le cache, l'historique et les puissants algorithmes de tri (alphabétique/fréquence) et de nettoyage.
- `popup.html` / `popup.js` : Interface d'actions rapides et de statut.
- `preview.html` / `preview.js` : Interface de validation des déplacements.
- `options.html` / `options.js` : Interface de configuration avancée avec sauvegarde rapide.

### Environnement de développement (Tests)
Le projet utilise **Jest** pour les tests unitaires (API Chrome et SDK OpenAI mockés).
```bash
npm install
npm test
```
Assurez-vous que la suite de tests passe (`PASS`) avant de soumettre une *Pull Request*.
