/* =====================================================
   NFS – Centralized Database Link Panel
   Aggregates the file-link status of every independent
   database module (procesos, materiales, partes de costeo,
   historial, clientes, personal) into:
     1. A global header badge (N/N vinculadas)
     2. A single modal listing all databases + their status
     3. A "Vincular carpeta DATABASE…" bulk action that detects
        and links every known file in one folder selection
        (FILES/DATABASE/*.json)
   Does not replace the per-module "Vincular archivo JSON…"
   buttons already present in each module's own modal.
   ===================================================== */

'use strict';

const DB_LINK_REGISTRY = [
  {
    key: 'database', handleKey: 'database', icon: '🗄', label: 'Procesos de agitación',
    filename: 'database.json',
    getModule: () => (typeof NFS_DB !== 'undefined' ? NFS_DB : null),
    connectFn: 'dbConnectFile', updateFn: '_dbUpdateFileStatus',
    apply(mod, text) {
      if (!text.trim()) return;
      const parsed = JSON.parse(text);
      if (parsed && Array.isArray(parsed.procesos)) mod.loadFromObject(parsed);
    },
    refreshUI() { if (typeof _dbRenderTable === 'function') _dbRenderTable(); },
  },
  {
    key: 'materials', handleKey: 'materials', icon: '🧱', label: 'Materiales e insumos',
    filename: 'materiales.json',
    getModule: () => (typeof NFS_MATERIALS !== 'undefined' ? NFS_MATERIALS : null),
    connectFn: 'materialsConnectFile', updateFn: '_materialsUpdateFileStatus',
    apply(mod, text) { if (text.trim()) mod.importJSON(text); },
    refreshUI() {
      if (typeof _renderMaterialsTable === 'function') _renderMaterialsTable();
      if (typeof _populateMaterialCategoryDatalist === 'function') _populateMaterialCategoryDatalist();
    },
  },
  {
    key: 'costparts', handleKey: 'costparts', icon: '💲', label: 'Partes de costeo',
    filename: 'partes_costeo.json',
    getModule: () => (typeof NFS_COSTEO_DB !== 'undefined' ? NFS_COSTEO_DB : null),
    connectFn: 'costPartsConnectFile', updateFn: '_costPartsUpdateFileStatus',
    apply(mod, text) { if (text.trim()) mod.importJSON(text); },
    refreshUI() { if (typeof _renderCostPartsTable === 'function') _renderCostPartsTable(); },
  },
  {
    key: 'records', handleKey: 'records', icon: '📋', label: 'Historial de selecciones',
    filename: 'registros.json',
    getModule: () => (typeof NFS_RECORDS !== 'undefined' ? NFS_RECORDS : null),
    connectFn: 'recConnectFile', updateFn: '_recUpdateFileStatus',
    apply(mod, text) {
      if (!text.trim()) return;
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) mod.importObject(parsed);
    },
    refreshUI() {
      if (typeof _recRenderTable === 'function') _recRenderTable();
      if (typeof _recRenderBadge === 'function') _recRenderBadge();
    },
  },
  {
    key: 'clients', handleKey: 'clients', icon: '👥', label: 'Clientes',
    filename: 'clientes.json',
    getModule: () => (typeof NFS_CLIENTS !== 'undefined' ? NFS_CLIENTS : null),
    connectFn: 'clientsConnectFile', updateFn: '_clientsUpdateFileStatus',
    apply(mod, text) {
      if (!text.trim()) return;
      const parsed = JSON.parse(text);
      if (parsed && Array.isArray(parsed.contacts)) mod.importObject(parsed);
    },
    refreshUI() {
      if (typeof _clientsRefreshFilter === 'function') _clientsRefreshFilter();
      if (typeof _clientsRefreshHeaderList === 'function') _clientsRefreshHeaderList();
      if (typeof clientsRenderTable === 'function') clientsRenderTable();
    },
  },
  {
    key: 'staff', handleKey: 'staff', icon: '👤', label: 'Personal / Elaboradores',
    filename: 'elaboradores.json',
    getModule: () => (typeof NFS_STAFF !== 'undefined' ? NFS_STAFF : null),
    connectFn: 'staffConnectFile', updateFn: 'staffUpdateFileStatus',
    apply(mod, text) {
      if (!text.trim()) return;
      const parsed = JSON.parse(text);
      mod.importObject(parsed);
    },
    refreshUI() {
      if (typeof staffRefreshFilter === 'function') staffRefreshFilter();
      if (typeof staffRefreshHeaderList === 'function') staffRefreshHeaderList();
      if (typeof staffRenderTable === 'function') staffRenderTable();
    },
  },
];

function _dbLinkEsc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _dbLinkHandleOf(entry) {
  try {
    const mod = entry.getModule();
    return (mod && typeof mod.getFileHandle === 'function') ? mod.getFileHandle() : null;
  } catch (_) { return null; }
}

function _dbLinkStats() {
  let connected = 0;
  DB_LINK_REGISTRY.forEach(entry => { if (_dbLinkHandleOf(entry)) connected++; });
  return { connected, total: DB_LINK_REGISTRY.length };
}

/** Refresh the always-visible header badge (and the modal table, if open). */
function _dbLinkRefreshGlobalBadge() {
  const badge = document.getElementById('dbLinkGlobalBadge');
  if (badge) {
    const { connected, total } = _dbLinkStats();
    let cls = 'db-link-global-badge ';
    let icon = '🔗';
    if (connected === total) {
      cls += 'db-link-all-ok';
    } else if (connected === 0) {
      cls += 'db-link-all-off';
      icon = '⚠';
    } else {
      cls += 'db-link-partial';
      icon = '⚠';
    }
    badge.className = cls;
    badge.textContent = icon + ' ' + connected + '/' + total + ' vinculadas';
    badge.title = connected === total
      ? 'Todas las bases de datos están vinculadas a sus archivos JSON.'
      : 'Algunas bases de datos aún no están vinculadas a un archivo. Clic para administrar.';
  }
  const modal = document.getElementById('dbLinkModal');
  if (modal && !modal.classList.contains('hidden')) _renderDbLinkRows();
}

function _renderDbLinkRows() {
  const tbody = document.getElementById('dbLinkTableBody');
  if (!tbody) return;
  tbody.innerHTML = DB_LINK_REGISTRY.map(entry => {
    const handle = _dbLinkHandleOf(entry);
    const statusHtml = handle
      ? '<span class="db-file-icon">🔗</span> Vinculado a <strong>' + _dbLinkEsc(handle.name) + '</strong>'
      : '<span class="db-file-icon">💾</span> Solo en el navegador (no vinculado)';
    return (
      '<tr>' +
      '<td>' + entry.icon + '</td>' +
      '<td>' + _dbLinkEsc(entry.label) + '</td>' +
      '<td class="' + (handle ? 'db-link-row-ok' : 'db-link-row-off') + '">' + statusHtml + '</td>' +
      '<td class="rec-td-actions"><button class="btn-db" onclick="' + entry.connectFn + '()">' +
      (handle ? '🔄 Re-vincular' : '🔗 Vincular…') + '</button></td>' +
      '</tr>'
    );
  }).join('');
}

function openDbLinkModal() {
  _renderDbLinkRows();
  document.getElementById('dbLinkModal').classList.remove('hidden');
}

function closeDbLinkModal() {
  document.getElementById('dbLinkModal').classList.add('hidden');
}

function _dbLinkModalOverlayClick(event) {
  if (event.target.id === 'dbLinkModal') closeDbLinkModal();
}

/** Bulk-link every known database by picking the FILES/DATABASE folder once. */
async function linkAllDatabasesFromFolder() {
  if (!window.showDirectoryPicker) {
    alert(
      'Tu navegador no soporta selección de carpetas (File System Access API).\n\n' +
      'Vincula cada base individualmente con su botón "Vincular…", o usa Chrome/Edge 86+.'
    );
    return;
  }

  let dirHandle;
  try {
    dirHandle = await window.showDirectoryPicker({ id: 'nfs-database-folder', mode: 'readwrite' });
  } catch (e) {
    if (e.name !== 'AbortError') alert('Error al abrir la carpeta:\n' + e.message);
    return;
  }

  let linked = 0;
  const skipped = [];

  /* If the user picked FILES (habit) instead of FILES/DATABASE, look one
     level deeper for a DATABASE subfolder and use that instead. */
  let dataDir = dirHandle;
  try { dataDir = await dirHandle.getDirectoryHandle('DATABASE'); } catch (_) { /* already inside DATABASE, or a custom folder with the JSONs directly */ }

  for (const entry of DB_LINK_REGISTRY) {
    const mod = entry.getModule();
    if (!mod) { skipped.push(entry.label + ' (módulo no disponible)'); continue; }
    try {
      const fileHandle = await dataDir.getFileHandle(entry.filename);
      const ok = await NFS_HANDLES.ensurePermission(fileHandle);
      if (!ok) { skipped.push(entry.label + ' (permiso denegado)'); continue; }

      const text = await (await fileHandle.getFile()).text();
      try { entry.apply(mod, text); } catch (_) { /* archivo vacío o inválido: se vincula igual, conservando los datos actuales */ }
      if (typeof mod.markSynced === 'function') mod.markSynced(text);

      mod.setFileHandle(fileHandle);
      await NFS_HANDLES.save(entry.handleKey, fileHandle);
      if (typeof window[entry.updateFn] === 'function') window[entry.updateFn]();
      if (typeof entry.refreshUI === 'function') entry.refreshUI();
      linked++;
    } catch (e) {
      skipped.push(entry.label + ' (' + entry.filename + ' no encontrado en la carpeta)');
    }
  }

  _dbLinkRefreshGlobalBadge();

  alert(
    'Vinculación por carpeta completada: ' + linked + ' de ' + DB_LINK_REGISTRY.length + ' bases vinculadas.' +
    (skipped.length ? '\n\nNo vinculadas:\n- ' + skipped.join('\n- ') : '')
  );
}

/* Initial paint: run once immediately, then again shortly after to catch
   the async auto-reconnect attempts each module fires on DOMContentLoaded. */
document.addEventListener('DOMContentLoaded', () => {
  _dbLinkRefreshGlobalBadge();
  setTimeout(_dbLinkRefreshGlobalBadge, 400);
});
