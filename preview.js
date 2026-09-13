document.addEventListener('DOMContentLoaded', () => {
  const previewTable = document.getElementById('previewTable');
  const selectAll = document.getElementById('selectAll');
  const applyBtn = document.getElementById('applyBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const statusDiv = document.getElementById('status');
  
  let pendingMoves = [];

  // Charger les propositions depuis le cache local
  chrome.storage.local.get(['pendingMoves'], (result) => {
    pendingMoves = result.pendingMoves || [];
    renderTable();
  });

  function renderTable() {
    if (pendingMoves.length === 0) {
      previewTable.innerHTML = '<tr><td colspan="4" style="text-align:center;">Aucun favori à trier.</td></tr>';
      applyBtn.disabled = true;
      return;
    }

    previewTable.innerHTML = '';
    pendingMoves.forEach((move, index) => {
      const tr = document.createElement('tr');
      
      // Checkbox
      const tdCheck = document.createElement('td');
      tdCheck.style.textAlign = 'center';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'move-checkbox';
      checkbox.checked = true;
      checkbox.dataset.index = index;
      tdCheck.appendChild(checkbox);

      // Titre & URL
      const tdTitle = document.createElement('td');
      tdTitle.innerHTML = `<strong>${escapeHtml(move.title)}</strong><span class="url">${escapeHtml(move.url)}</span>`;

      // Thème
      const tdTheme = document.createElement('td');
      tdTheme.innerHTML = `<strong>📁 ${escapeHtml(move.theme)}</strong>`;

      // Source
      const tdSource = document.createElement('td');
      let sourceText = '';
      let sourceClass = '';
      if (move.source === 'ai') { sourceText = '✨ IA (DeepSeek)'; sourceClass = 'source-ai'; }
      else if (move.source === 'cache') { sourceText = '💾 Cache Local'; sourceClass = 'source-cache'; }
      else if (move.source === 'override') { sourceText = '⚙️ Règle Manuelle'; sourceClass = 'source-override'; }
      
      tdSource.innerHTML = `<span class="${sourceClass}">${sourceText}</span>`;

      tr.appendChild(tdCheck);
      tr.appendChild(tdTitle);
      tr.appendChild(tdTheme);
      tr.appendChild(tdSource);
      previewTable.appendChild(tr);
    });
  }

  selectAll.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.move-checkbox');
    checkboxes.forEach(cb => cb.checked = e.target.checked);
  });

  cancelBtn.addEventListener('click', () => {
    chrome.storage.local.remove('pendingMoves', () => {
      window.close();
    });
  });

  applyBtn.addEventListener('click', () => {
    applyBtn.disabled = true;
    cancelBtn.disabled = true;
    statusDiv.textContent = "Déplacement en cours...";
    
    // Récupérer les indices cochés
    const checkboxes = document.querySelectorAll('.move-checkbox');
    const approvedMoves = [];
    checkboxes.forEach(cb => {
      if (cb.checked) {
        approvedMoves.push(pendingMoves[parseInt(cb.dataset.index)]);
      }
    });

    // Envoyer l'ordre au background
    chrome.runtime.sendMessage({ action: 'applyMoves', moves: approvedMoves }, (response) => {
      statusDiv.textContent = "Terminé ! Vous pouvez fermer cet onglet.";
      setTimeout(() => window.close(), 2000);
    });
  });

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
  }
});
