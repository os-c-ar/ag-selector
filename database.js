/* =====================================================
   NFS – Database Module  v2
   Persistence strategy (priority order):
     1. FILES/DATABASE/database.json  – via File System Access API (write-through)
     2. localStorage                  – automatic fallback (same browser)
   ===================================================== */

'use strict';

const NFS_DB = (function () {

  const STORAGE_KEY = 'nfs_db_v1';

  /* Default dataset – mirrors FILES/DATABASE/database.json */
  const DEFAULTS = [
    { id: 1,  label: 'Acondicionamiento de lodos (polímero, cal, etc.)', intensidad: '5 - 7' },
    { id: 2,  label: 'Homogeinización de lodos floculentos',             intensidad: '4 - 5' },
    { id: 3,  label: 'Homogeinización de lodos no floculentos',          intensidad: '5 - 7' },
    { id: 4,  label: 'Preparación de polímeros sólidos',                 intensidad: '6 - 7' },
    { id: 5,  label: 'Maduración de polímero',                           intensidad: '5 - 6' },
    { id: 6,  label: 'Mantenimiento y preparación de lechada de cal',    intensidad: '8 - 9' },
    { id: 7,  label: 'Suspensión de carbón activado',                    intensidad: '7 - 8' },
    { id: 8,  label: 'Preparación de coagulantes sólidos',               intensidad: '5 - 6' },
    { id: 9,  label: 'Coagulación o neutralización',                     intensidad: '6 - 8' },
    { id: 10, label: 'Floculación',                                      intensidad: '1 - 3' },
    { id: 11, label: 'Mezcla de líquidos miscibles',                     intensidad: '2 - 4' },
    { id: 12, label: 'Homogeinización de temperatura',                   intensidad: '1 - 3' },
    { id: 13, label: 'Tanque de almacenamiento',                         intensidad: '2 - 4' },
  ];

  let _data       = null;
  let _fileHandle = null; // FileSystemFileHandle (File System Access API)
  let _lastSyncedText = null; // last content we read/wrote, for conflict detection

  /* ── localStorage ── */
  function _persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_data)); } catch (e) {}
  }

  /* ── File System Access API write ── */
  async function _writeFile() {
    if (!_fileHandle) return;
    try {
      let perm = await _fileHandle.queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted') {
        perm = await _fileHandle.requestPermission({ mode: 'readwrite' });
      }
      if (perm !== 'granted') { _fileHandle = null; _dbUpdateFileStatus(); return; }

      const check = await NFS_HANDLES.checkConflict(_fileHandle, _lastSyncedText);
      if (!check.proceed) {
        // Another user/computer changed the file: adopt their version instead of overwriting it.
        try {
          const parsed = check.externalText.trim() ? JSON.parse(check.externalText) : null;
          if (parsed && Array.isArray(parsed.procesos)) _data = { version: parsed.version || 1, procesos: parsed.procesos };
        } catch (_) { /* keep current in-memory data if the external file is invalid */ }
        _lastSyncedText = check.externalText;
        _persist();
        if (typeof _dbRenderTable === 'function') _dbRenderTable();
        updateProcessRecommendationsIndicator();
        _dbUpdateFileStatus();
        return;
      }

      const text = JSON.stringify(_data, null, 2);
      const writable = await _fileHandle.createWritable();
      await writable.write(text);
      await writable.close();
      _lastSyncedText = text;
      _dbFlashSaved();
    } catch (e) {
      _fileHandle = null;
      _dbUpdateFileStatus();
    }
  }

  /* Called after every data mutation */
  function _afterMutate() {
    _persist();
    updateProcessRecommendationsIndicator();
    _writeFile(); // async fire-and-forget
  }

  function _applyDefaults() {
    _data = { version: 1, procesos: JSON.parse(JSON.stringify(DEFAULTS)) };
    _afterMutate();
  }

  /* ── Public API ── */
  return {

    load() {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try { _data = JSON.parse(stored); return; } catch (e) {}
      }
      _applyDefaults();
    },

    getProcesos() { return _data ? _data.procesos : []; },

    getIntensity(label) {
      const list = _data ? _data.procesos : [];
      const p = list.find(x => x.label.toLowerCase() === String(label).toLowerCase());
      return p ? p.intensidad : '–';
    },

    /** Replace dataset from a parsed JSON object (file import) */
    loadFromObject(obj) {
      if (!obj || !Array.isArray(obj.procesos)) return;
      _data = { version: obj.version || 1, procesos: JSON.parse(JSON.stringify(obj.procesos)) };
      _afterMutate();
    },

    exportJSON() { return JSON.stringify(_data, null, 2); },

    add(label, intensidad, viscosidad = null, densidad = null, recomendaciones = '') {
      const maxId = _data.procesos.reduce((m, p) => Math.max(m, p.id), 0);
      _data.procesos.push({ id: maxId + 1, label: label.trim(), intensidad: intensidad.trim(), viscosidad, densidad, recomendaciones });
      _afterMutate();
    },

    update(id, label, intensidad, viscosidad = null, densidad = null, recomendaciones = '') {
      const p = _data.procesos.find(x => x.id === id);
      if (p) { p.label = label.trim(); p.intensidad = intensidad.trim(); p.viscosidad = viscosidad; p.densidad = densidad; p.recomendaciones = recomendaciones; _afterMutate(); }
    },

    setRecommendations(id, text) {
      const process = _data.procesos.find(p => p.id === id);
      if (!process) throw new Error('El proceso ya no existe en la base de datos.');
      process.recomendaciones = text;
      _afterMutate();
    },

    remove(id) {
      _data.procesos = _data.procesos.filter(x => x.id !== id);
      _afterMutate();
    },

    reset() { _applyDefaults(); },

    setFileHandle(h) { _fileHandle = h; },
    getFileHandle()  { return _fileHandle; },
    markSynced(text) { _lastSyncedText = text; },
  };

})();


/* =====================================================
   DB Modal – UI
   ===================================================== */

function openDbModal() {
  _dbRenderTable();
  _dbUpdateFileStatus();
  document.getElementById('dbModal').classList.remove('hidden');
}

function closeDbModal() {
  document.getElementById('dbModal').classList.add('hidden');
  if (typeof buildProcesoSelect  === 'function') buildProcesoSelect();
  if (typeof buildReferenceTable === 'function') buildReferenceTable();
  if (typeof calculate           === 'function') calculate();
}

/* ── Table ── */

let _processRecommendationsRow = null;

function updateProcessRecommendationsIndicator() {
  const selected = document.getElementById('proceso').value;
  const process = NFS_DB.getProcesos().find(p => p.label === selected);
  const hasRecommendations = Boolean(process?.recomendaciones?.trim());
  const button = document.getElementById('processRecommendationsButton');
  button.classList.toggle('has-recommendations', hasRecommendations);
  button.title = hasRecommendations
    ? 'Hay recomendaciones de selección disponibles. Pulse para consultarlas.'
    : 'Ver recomendaciones típicas del proceso';
  document.getElementById('processRecommendationsBadge').hidden = !hasRecommendations;
}

function openProcessRecommendations(button) {
  const row = button ? button.closest('tr') : null;
  const process = row
    ? NFS_DB.getProcesos().find(p => p.id === Number(row.dataset.id))
    : NFS_DB.getProcesos().find(p => p.label === document.getElementById('proceso').value);
  const editingRow = row && row.classList.contains('db-row-editing');
  _processRecommendationsRow = row;
  const text = editingRow ? row.dataset.recomendaciones : process?.recomendaciones;
  const label = editingRow ? row.querySelector('.db-input-label').value : process?.label;
  document.getElementById('processRecommendationsProcess').textContent = label || 'Proceso sin nombre';
  const editor = document.getElementById('processRecommendationsText');
  editor.value = text || '';
  editor.readOnly = !row;
  editor.placeholder = row ? 'Escriba las recomendaciones típicas para este proceso...' : 'No hay recomendaciones típicas definidas para este proceso.';
  document.getElementById('processRecommendationsSave').hidden = !row;
  document.getElementById('processRecommendationsSave').textContent = editingRow ? 'Aceptar texto para la fila' : 'Guardar recomendaciones';
  document.getElementById('processRecommendationsClose').textContent = row ? 'Cerrar sin guardar' : 'Cerrar';
  document.getElementById('processRecommendationsHelp').textContent = row
    ? (editingRow ? 'Al aceptar, el texto queda pendiente de Guardar en la fila del proceso.' : 'Guardar actualiza las recomendaciones de este proceso en la base de datos.')
    : 'Consulta de solo lectura. Las recomendaciones se administran desde Base de datos.';
  document.getElementById('processRecommendationsDialog').showModal();
}

function saveProcessRecommendations() {
  const row = _processRecommendationsRow;
  if (!row || !row.isConnected) {
    alert('La fila del proceso ya no esta disponible. Cierre y vuelva a abrir el editor.');
    return;
  }
  const text = document.getElementById('processRecommendationsText').value;
  if (row.classList.contains('db-row-editing')) row.dataset.recomendaciones = text;
  else NFS_DB.setRecommendations(Number(row.dataset.id), text);
  const button = row.querySelector('.db-recommendations');
  button.title = text.trim() ? 'Editar recomendaciones típicas' : 'Agregar recomendaciones típicas';
  document.getElementById('processRecommendationsDialog').close();
}

function _dbRecommendationsCell() {
  return '<td class="db-td-recommendations"><button type="button" class="btn-db btn-db-edit db-recommendations" onclick="openProcessRecommendations(this)" title="Recomendaciones típicas" aria-label="Abrir recomendaciones típicas">📝</button></td>';
}

function _dbRenderTable() {
  const tbody = document.getElementById('dbTableBody');
  tbody.innerHTML = '';
  NFS_DB.getProcesos().forEach(p => tbody.appendChild(_dbRowRead(p)));
}

function _dbRowRead(p) {
  const tr = document.createElement('tr');
  tr.dataset.id = p.id;
  tr.innerHTML =
    `<td class="db-td-num">${p.id}</td>` +
    `<td>${_esc(p.label)}</td>` +
    `<td class="db-td-intens"><span class="intensity-badge">${_esc(p.intensidad)}</span></td>` +
    `<td>${_esc(p.viscosidad ?? '—')}</td>` +
    `<td>${_esc(p.densidad ?? '—')}</td>` +
    _dbRecommendationsCell() +
    `<td class="db-td-actions">` +
      `<button class="btn-db btn-db-edit" onclick="dbEditRow(${p.id},this)">✏ Editar</button>` +
      `<button class="btn-db btn-db-del"  onclick="dbDeleteRow(${p.id},this)">🗑</button>` +
    `</td>`;
  return tr;
}

function _dbFluidInputs(p) {
  return `<td><input type="number" class="db-input db-input-viscosidad" min="1" step="1" aria-label="Viscosidad típica (cps)" placeholder="Sin definir" value="${_esc(p.viscosidad ?? '')}" /></td>` +
    `<td><input type="number" class="db-input db-input-densidad" min="0.1" step="0.01" aria-label="Densidad típica (Ton/m³)" placeholder="Sin definir" value="${_esc(p.densidad ?? '')}" /></td>`;
}

function _dbReadFluidInputs(tr) {
  const result = {};
  for (const key of ['viscosidad', 'densidad']) {
    const input = tr.querySelector('.db-input-' + key);
    if (!input.reportValidity()) {
      alert('Revise la viscosidad y densidad tipicas. Puede dejarlas vacias si no estan definidas.');
      return null;
    }
    result[key] = input.value === '' ? null : Number(input.value);
  }
  return result;
}

function _dbRowEdit(p) {
  const tr = document.createElement('tr');
  tr.dataset.id = p.id;
  tr.classList.add('db-row-editing');
  tr.dataset.recomendaciones = p.recomendaciones || '';
  tr.innerHTML =
    `<td class="db-td-num">${p.id}</td>` +
    `<td><input class="db-input db-input-label" value="${_esc(p.label)}" /></td>` +
    `<td class="db-td-intens"><input class="db-input db-input-intens" value="${_esc(p.intensidad)}" /></td>` +
    _dbFluidInputs(p) +
    _dbRecommendationsCell() +
    `<td class="db-td-actions">` +
      `<button class="btn-db btn-db-save"   onclick="dbSaveRow(${p.id},this)">✔ Guardar</button>` +
      `<button class="btn-db btn-db-cancel" onclick="dbCancelRow(${p.id},this)">✖</button>` +
    `</td>`;
  return tr;
}

function dbEditRow(id, btn) {
  const tr = btn.closest('tr');
  const p  = NFS_DB.getProcesos().find(x => x.id === id);
  if (p) tr.parentNode.replaceChild(_dbRowEdit(p), tr);
}

function dbSaveRow(id, btn) {
  const tr       = btn.closest('tr');
  const label    = tr.querySelector('.db-input-label').value;
  const intensidad = tr.querySelector('.db-input-intens').value;
  if (!label.trim()) { alert('La descripción no puede estar vacía.'); return; }
  const fluid = _dbReadFluidInputs(tr);
  if (!fluid) return;
  NFS_DB.update(id, label, intensidad, fluid.viscosidad, fluid.densidad, tr.dataset.recomendaciones || '');
  const p = NFS_DB.getProcesos().find(x => x.id === id);
  tr.parentNode.replaceChild(_dbRowRead(p), tr);
}

function dbCancelRow(id, btn) {
  const tr = btn.closest('tr');
  const p  = NFS_DB.getProcesos().find(x => x.id === id);
  if (p) tr.parentNode.replaceChild(_dbRowRead(p), tr);
}

function dbDeleteRow(id, btn) {
  if (!confirm('¿Eliminar este proceso de la base de datos?')) return;
  NFS_DB.remove(id);
  btn.closest('tr').remove();
}

function dbAddRow() {
  const tbody = document.getElementById('dbTableBody');
  if (tbody.querySelector('.db-row-new')) return;
  const tr = document.createElement('tr');
  tr.classList.add('db-row-new', 'db-row-editing');
  tr.innerHTML =
    `<td class="db-td-num">–</td>` +
    `<td><input class="db-input db-input-label" placeholder="Descripción del proceso" /></td>` +
    `<td class="db-td-intens"><input class="db-input db-input-intens" placeholder="Ej. 4 - 6" /></td>` +
    _dbFluidInputs({}) +
    _dbRecommendationsCell() +
    `<td class="db-td-actions">` +
      `<button class="btn-db btn-db-save"   onclick="dbSaveNewRow(this)">✔ Guardar</button>` +
      `<button class="btn-db btn-db-cancel" onclick="this.closest('tr').remove()">✖</button>` +
    `</td>`;
  tbody.appendChild(tr);
  tr.querySelector('.db-input-label').focus();
}

function dbSaveNewRow(btn) {
  const tr     = btn.closest('tr');
  const label  = tr.querySelector('.db-input-label').value.trim();
  const intens = tr.querySelector('.db-input-intens').value.trim();
  if (!label) { alert('La descripción no puede estar vacía.'); return; }
  const fluid = _dbReadFluidInputs(tr);
  if (!fluid) return;
  NFS_DB.add(label, intens || '–', fluid.viscosidad, fluid.densidad, tr.dataset.recomendaciones || '');
  const list = NFS_DB.getProcesos();
  tr.parentNode.replaceChild(_dbRowRead(list[list.length - 1]), tr);
}

function dbResetAll() {
  if (!confirm(
    '¿Restaurar todos los procesos a los valores predeterminados?\n' +
    'Se perderán los cambios realizados.'
  )) return;
  NFS_DB.reset();
  _dbRenderTable();
}


/* =====================================================
   File System Access API  – connect / export / import
   ===================================================== */

/**
 * Connect the app to FILES/DATABASE/database.json.
 * After connecting, every change is written through to the file automatically.
 */
async function dbConnectFile() {
  if (!window.showOpenFilePicker) {
    alert(
      'Tu navegador no soporta escritura directa a archivos (File System Access API).\n\n' +
      'Usa "Exportar JSON" para descargar la base de datos actualizada y\n' +
      '"Importar JSON" para cargar una versión guardada.\n\n' +
      'Chrome / Edge 86+ soportan esta función.'
    );
    return;
  }
  try {
    const [handle] = await window.showOpenFilePicker({
      id: 'nfs-db',
      types: [{
        description: 'Base de datos NFS (JSON)',
        accept: { 'application/json': ['.json'] },
      }],
      multiple: false,
    });

    /* Request write permission up-front */
    const perm = await handle.requestPermission({ mode: 'readwrite' });
    if (perm !== 'granted') {
      alert('Se requiere permiso de escritura para vincular el archivo.');
      return;
    }

    /* Load data from the file */
    const file   = await handle.getFile();
    const text   = await file.text();
    const parsed = text.trim() ? JSON.parse(text) : null;
    if (parsed && Array.isArray(parsed.procesos)) {
      NFS_DB.loadFromObject(parsed);
      _dbRenderTable();
    }
    NFS_DB.markSynced(text);

    NFS_DB.setFileHandle(handle);
    await NFS_HANDLES.save('database', handle);
    _dbUpdateFileStatus();

  } catch (e) {
    if (e.name !== 'AbortError') {
      alert('Error al conectar con el archivo:\n' + e.message);
    }
  }
}

/** Download the current database as database.json */
function dbExportJSON() {
  const blob = new Blob([NFS_DB.exportJSON()], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url, download: 'database.json',
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Import a database.json chosen by the user */
function dbImportJSON() {
  const input = Object.assign(document.createElement('input'), {
    type: 'file', accept: '.json,application/json',
  });
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || !Array.isArray(parsed.procesos)) {
        alert('Archivo inválido. Debe contener un array "procesos".');
        return;
      }
      if (!confirm(
        `¿Importar ${parsed.procesos.length} procesos desde "${file.name}"?\n` +
        'Esto reemplazará la lista actual.'
      )) return;
      NFS_DB.loadFromObject(parsed);
      _dbRenderTable();
      _dbUpdateFileStatus();
    } catch (err) {
      alert('Error al importar:\n' + err.message);
    }
  };
  input.click();
}

/* ── File status bar ── */

function _dbUpdateFileStatus() {
  const el = document.getElementById('dbFileStatus');
  if (!el) return;
  const h = NFS_DB.getFileHandle();
  if (h) {
    el.className = 'db-file-status db-file-connected';
    el.innerHTML =
      `<span class="db-file-icon">🔗</span>` +
      `Vinculado a <strong>${_esc(h.name)}</strong> – cambios guardados automáticamente en el archivo` +
      `<span id="dbSaveIndicator" class="db-save-indicator"></span>`;
  } else {
    el.className = 'db-file-status db-file-disconnected';
    el.innerHTML =
      `<span class="db-file-icon">💾</span>` +
      `Cambios guardados en el navegador. ` +
      `<button class="btn-db-link" onclick="dbConnectFile()">Vincular archivo JSON…</button>` +
      ` para persistencia permanente.`;
  }
  if (typeof _dbLinkRefreshGlobalBadge === 'function') _dbLinkRefreshGlobalBadge();
}

function _dbFlashSaved() {
  const el = document.getElementById('dbSaveIndicator');
  if (!el) return;
  el.textContent = ' ✓ guardado';
  el.style.opacity = '1';
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => { el.style.opacity = '0'; }, 2000);
}

/* ── Utility ── */
function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function _dbTryAutoReconnect() {
  const handle = await NFS_HANDLES.load('database');
  if (!handle) return;
  const ok = await NFS_HANDLES.ensurePermission(handle);
  if (!ok) return;
  NFS_DB.setFileHandle(handle);
  NFS_DB.markSynced(await NFS_HANDLES.readText(handle));
  _dbUpdateFileStatus();
}

document.addEventListener('DOMContentLoaded', _dbTryAutoReconnect);
