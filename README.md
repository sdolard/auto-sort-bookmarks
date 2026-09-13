# AI Bookmark Organizer 🔖🤖

A smart Chrome extension that uses AI (the ultra-fast DeepSeek-Flash model) to automatically sort, categorize, and organize your web bookmarks, keeping everything meticulously ordered.

## 🚀 Features
- **AI Sorting & Subfolders**: Automatically analyzes titles and URLs to create organic themes. The AI can generate subfolders (up to 2 levels, e.g., `Development/Javascript`).
- **Chrome History Integration**: Your top X most clicked bookmarks are isolated from the AI and pinned directly to the root of the Bookmarks Bar, sorted by usage frequency (most visited first).
- **Manual Rules & PIN Keyword**: Manually force themes (e.g., `github.com = Development`). Use the magic keyword `PIN` (e.g., `drive.google.com = PIN`) to force-pin a link to your quick access bar.
- **Clinical Ordering (A to Z)**: Generated folders and their bookmarks are strictly sorted alphabetically.
- **Smart Automatic Cleanup**: 
  - The extension automatically deletes old folders that become empty after sorting.
  - It "flattens" isolated subfolders (if the AI creates a subfolder containing only one bookmark, it is automatically moved up to the parent folder).
- **Interactive Preview**: Review, modify, or cancel the AI's proposals *before* any bookmarks are moved. The preview perfectly reflects the future structure.
- **Cache System**: Previously validated bookmarks are cached locally to save API credits during subsequent runs.
- **Multilingual Support**: Available in both English and French based on your browser settings.

---

## 🛠️ Installation and Usage

### 1. Build & Install in Chrome
The project bundles the official OpenAI SDK using `esbuild`.
1. Clone this repository: `git clone https://github.com/sdolard/auto-sort-bookmarks.git`
2. Install dependencies: `npm install`
3. Build the extension: `npx esbuild background.js --bundle --outfile=background.bundle.js`
4. Open Google Chrome and go to `chrome://extensions/`.
5. Enable **"Developer mode"** (top right corner).
6. Click **"Load unpacked"** and select the project folder.

### 2. Configuration (API Key)
1. Pin the extension for easy access.
2. Click the extension icon, then click **Configuration**.
3. Get an API key from the [DeepSeek platform](https://platform.deepseek.com/).
4. Enter your API key, choose the number of frequently visited bookmarks to protect, and add any manual rules.
5. Use the **"Save & Preview"** shortcut button to start immediately!

### 3. Usage
- During the first analysis, Chrome will ask you to accept the new **History** permission (needed to measure your click habits).
- Validate the proposals via the preview table.
- Enjoy your newly created `AI Themes` tree and your perfectly optimized bookmarks bar.

---

## 🤝 How to Contribute
All contributions are welcome! Check out the [Issues](https://github.com/sdolard/auto-sort-bookmarks/issues) tab for the roadmap.

### Architecture
- `background.js` / `background.bundle.js`: Service Worker managing AI, cache, history, and the powerful sorting (alphabetical/frequency) and cleanup algorithms.
- `popup.html` / `popup.js`: Quick action and status interface.
- `preview.html` / `preview.js`: Validation interface for bookmark moves.
- `options.html` / `options.js`: Advanced configuration interface with quick save.

### Development Environment (Tests)
The project uses **Jest** for unit testing (Chrome API, i18n, and OpenAI SDK are mocked).
```bash
npm install
npm test
```
Please ensure the test suite passes (`PASS`) before submitting a *Pull Request*.
