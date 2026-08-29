/* =====================================================
   NFS – Database Module  v2
   Persistence strategy (priority order):
     1. FILES/database.json  – via File System Access API (write-through)
     2. localStorage         – automatic fallback (same browser)
   ===================================================== */

'use strict';

const NFS_DB = (function () {

  const STORAGE_KEY = 'nfs_db_v1';

  /* Default dataset – mirrors FILES/database.json */
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

      const writable = await _fileHandle.createWritable();
      await writable.write(JSON.stringify(_data, null, 2));
      await writable.close();
      _dbFlashSaved();
    } catch (e) {
      _fileHandle = null;
      _dbUpdateFileStatus();
    }
  }

  /* Called after every data mutation */
  function _afterMutate() {
    _persist();
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

    add(label, intensidad) {
      const maxId = _data.procesos.reduce((m, p) => Math.max(m, p.id), 0);
      _data.procesos.push({ id: maxId + 1, label: label.trim(), intensidad: intensidad.trim() });
      _afterMutate();
    },

    update(id, label, intensidad) {
      const p = _data.procesos.find(x => x.id === id);
      if (p) { p.label = label.trim(); p.intensidad = intensidad.trim(); _afterMutate(); }
    },

    remove(id) {
      _data.procesos = _data.procesos.filter(x => x.id !== id);
      _afterMutate();
    },

    reset() { _applyDefaults(); },

    setFileHandle(h) { _fileHandle = h; },
    getFileHandle()  { return _fileHandle; },
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
    `<td class="db-td-actions">` +
      `<button class="btn-db btn-db-edit" onclick="dbEditRow(${p.id},this)">✏ Editar</button>` +
      `<button class="btn-db btn-db-del"  onclick="dbDeleteRow(${p.id},this)">🗑</button>` +
    `</td>`;
  return tr;
}

function _dbRowEdit(p) {
  const tr = document.createElement('tr');
  tr.dataset.id = p.id;
  tr.classList.add('db-row-editing');
  tr.innerHTML =
    `<td class="db-td-num">${p.id}</td>` +
    `<td><input class="db-input db-input-label" value="${_esc(p.label)}" /></td>` +
    `<td class="db-td-intens"><input class="db-input db-input-intens" value="${_esc(p.intensidad)}" /></td>` +
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
  NFS_DB.update(id, label, intensidad);
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
  NFS_DB.add(label, intens || '–');
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
 * Connect the app to FILES/database.json.
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
    const parsed = JSON.parse(await file.text());
    if (parsed && Array.isArray(parsed.procesos)) {
      NFS_DB.loadFromObject(parsed);
      _dbRenderTable();
    }

    NFS_DB.setFileHandle(handle);
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
