/* =====================================================
   NFS – Materiales e Insumos (base maestra tipo "INSUMOS")
   Lista maestra de materiales/servicios con precio unitario,
   que alimenta las listas de materiales (BOM) de cada parte
   del catálogo de costeo.
   ===================================================== */

'use strict';

const NFS_MATERIALS = (function () {
  const KEY = 'nfs_materials_v1';
  const HANDLE_KEY = 'materials';
  let _items = [];
  let _fileHandle = null;

  const DEFAULT_ITEMS = [
    { id: 1, categoria: 'BARRAS MACIZAS 304SS', nombre: '1"', unidad: 'm', valorUnitario: 39000, proveedor: 'CORTEACEROS', fecha: '', pesoUnitario: 3.98 },
    { id: 2, categoria: 'BARRAS MACIZAS 304SS', nombre: '1 1/2"', unidad: 'm', valorUnitario: 87000, proveedor: 'CORTEACEROS', fecha: '', pesoUnitario: 8.95 },
    { id: 3, categoria: 'SERVICIOS', nombre: 'Mecanizado eje macizo 1"', unidad: 'und', valorUnitario: 60000, proveedor: '', fecha: '', pesoUnitario: 0 },
  ];

  function _persist() {
    try { localStorage.setItem(KEY, JSON.stringify(_items)); } catch (_) {}
  }

  async function _writeFile() {
    if (!_fileHandle) return;
    try {
      const ok = await NFS_HANDLES.ensurePermission(_fileHandle);
      if (!ok) { _fileHandle = null; _materialsUpdateFileStatus(); return; }
      const writable = await _fileHandle.createWritable();
      await writable.write(JSON.stringify(_items, null, 2));
      await writable.close();
      _materialsFlashSaved();
    } catch (_) {
      _fileHandle = null;
      _materialsUpdateFileStatus();
    }
  }

  function _afterMutate() {
    _persist();
    _writeFile();
  }

  function _norm(s) { return String(s || '').trim(); }

  function _normalizeItem(raw, fallbackId) {
    const x = raw || {};
    return {
      id: Number(x.id) || fallbackId,
      categoria: _norm(x.categoria).toUpperCase(),
      nombre: _norm(x.nombre),
      unidad: _norm(x.unidad) || 'und',
      valorUnitario: Number(x.valorUnitario) || 0,
      proveedor: _norm(x.proveedor),
      fecha: _norm(x.fecha),
      pesoUnitario: Number(x.pesoUnitario) || 0,
    };
  }

  function _nextId() {
    return _items.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1;
  }

  function _load() {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) {
        _items = parsed.map((x, i) => _normalizeItem(x, i + 1));
        return;
      }
    } catch (_) {}
    _items = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
    _persist();
  }

  return {
    load: _load,
    getAll() { return [..._items]; },
    getCategories() {
      return [...new Set(_items.map(x => x.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
    },
    findById(id) {
      return _items.find(x => Number(x.id) === Number(id)) || null;
    },
    add(item) {
      const it = _normalizeItem(item, _nextId());
      it.id = _nextId();
      _items.push(it);
      _afterMutate();
      return it;
    },
    update(id, patch) {
      const it = _items.find(x => Number(x.id) === Number(id));
      if (!it) return false;
      Object.assign(it, _normalizeItem({ ...it, ...patch }, it.id));
      _afterMutate();
      return true;
    },
    remove(id) {
      _items = _items.filter(x => Number(x.id) !== Number(id));
      _afterMutate();
    },
    reset() {
      _items = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
      _afterMutate();
    },
    exportJSON() {
      return JSON.stringify(_items, null, 2);
    },
    importJSON(text) {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('Formato inválido.');
      _items = parsed.map((x, i) => _normalizeItem(x, i + 1));
      _afterMutate();
    },
    setFileHandle(h) { _fileHandle = h; },
    getFileHandle() { return _fileHandle; },
    handleKey: HANDLE_KEY,
  };
})();

function _escMat(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _fmtCOPMat(n) {
  return '$' + (Number(n) || 0).toLocaleString('es-CO');
}

function openMaterialsModal() {
  _renderMaterialsTable();
  _populateMaterialCategoryDatalist();
  _materialsUpdateFileStatus();
  document.getElementById('materialsModal').classList.remove('hidden');
}

function closeMaterialsModal() {
  document.getElementById('materialsModal').classList.add('hidden');
  if (typeof recalcCostPartsFromMaterials === 'function') recalcCostPartsFromMaterials();
  if (typeof calculateCosteo === 'function') calculateCosteo();
}

function _materialsModalOverlayClick(e) {
  if (e.target.id === 'materialsModal') closeMaterialsModal();
}

function _populateMaterialCategoryDatalist() {
  const dl = document.getElementById('mat_categorias');
  if (!dl) return;
  dl.innerHTML = NFS_MATERIALS.getCategories().map(c => `<option value="${_escMat(c)}"></option>`).join('');
}

function _renderMaterialsTable() {
  const tbody = document.getElementById('materialsTableBody');
  if (!tbody) return;
  const filter = (document.getElementById('mat_filter')?.value || '').trim().toLowerCase();
  let rows = NFS_MATERIALS.getAll();
  if (filter) {
    rows = rows.filter(r =>
      r.nombre.toLowerCase().includes(filter) ||
      r.categoria.toLowerCase().includes(filter) ||
      r.proveedor.toLowerCase().includes(filter));
  }
  tbody.innerHTML = '';
  rows.forEach(m => {
    const tr = document.createElement('tr');
    tr.dataset.id = m.id;
    tr.innerHTML =
      `<td>${_escMat(m.categoria)}</td>` +
      `<td>${_escMat(m.nombre)}</td>` +
      `<td>${_escMat(m.unidad)}</td>` +
      `<td>${_escMat(_fmtCOPMat(m.valorUnitario))}</td>` +
      `<td>${_escMat(m.proveedor)}</td>` +
      `<td>${_escMat(m.fecha)}</td>` +
      `<td class="db-td-actions">` +
      `<button class="btn-db btn-db-edit" onclick="_editMaterial(${m.id},this)">✏ Editar</button>` +
      `<button class="btn-db btn-db-del" onclick="_deleteMaterial(${m.id})">🗑</button>` +
      `</td>`;
    tbody.appendChild(tr);
  });
}

function _editMaterial(id, btn) {
  const tr = btn.closest('tr');
  const m = NFS_MATERIALS.findById(id);
  if (!tr || !m) return;
  tr.innerHTML =
    `<td><input class="db-input" list="mat_categorias" value="${_escMat(m.categoria)}" /></td>` +
    `<td><input class="db-input" value="${_escMat(m.nombre)}" /></td>` +
    `<td><input class="db-input" value="${_escMat(m.unidad)}" /></td>` +
    `<td><input class="db-input" type="number" step="1" min="0" value="${Number(m.valorUnitario) || 0}" /></td>` +
    `<td><input class="db-input" value="${_escMat(m.proveedor)}" /></td>` +
    `<td><input class="db-input" value="${_escMat(m.fecha)}" /></td>` +
    `<td class="db-td-actions">` +
    `<button class="btn-db btn-db-save" onclick="_saveMaterial(${m.id},this)">✔ Guardar</button>` +
    `<button class="btn-db btn-db-cancel" onclick="_renderMaterialsTable()">✖</button>` +
    `</td>`;
}

function _saveMaterial(id, btn) {
  const tr = btn.closest('tr');
  const inputs = tr.querySelectorAll('input');
  const [categoria, nombre, unidad, valorUnitario, proveedor, fecha] = [...inputs].map(i => i.value);
  if (!nombre.trim()) { alert('El nombre/descripción es obligatorio.'); return; }
  NFS_MATERIALS.update(id, { categoria, nombre, unidad, valorUnitario, proveedor, fecha });
  _renderMaterialsTable();
  _populateMaterialCategoryDatalist();
  if (typeof recalcCostPartsFromMaterials === 'function') recalcCostPartsFromMaterials();
}

function _deleteMaterial(id) {
  if (!confirm('¿Eliminar este material/servicio de la base?\n(Las partes que lo usan en su lista de materiales quedarán con una referencia inválida.)')) return;
  NFS_MATERIALS.remove(id);
  _renderMaterialsTable();
}

function addMaterialRow() {
  const categoria = document.getElementById('mat_new_categoria').value.trim();
  const nombre = document.getElementById('mat_new_nombre').value.trim();
  const unidad = document.getElementById('mat_new_unidad').value.trim() || 'und';
  const valorUnitario = Number(document.getElementById('mat_new_valor').value) || 0;
  const proveedor = document.getElementById('mat_new_proveedor').value.trim();
  if (!nombre) { alert('Ingrese el nombre/descripción del material o servicio.'); return; }
  NFS_MATERIALS.add({ categoria, nombre, unidad, valorUnitario, proveedor, fecha: '' });
  document.getElementById('mat_new_categoria').value = '';
  document.getElementById('mat_new_nombre').value = '';
  document.getElementById('mat_new_unidad').value = '';
  document.getElementById('mat_new_valor').value = '';
  document.getElementById('mat_new_proveedor').value = '';
  _renderMaterialsTable();
  _populateMaterialCategoryDatalist();
}

function resetMaterials() {
  if (!confirm('¿Restaurar base de materiales por defecto?')) return;
  NFS_MATERIALS.reset();
  _renderMaterialsTable();
  _populateMaterialCategoryDatalist();
}

function exportMaterialsJSON() {
  const blob = new Blob([NFS_MATERIALS.exportJSON()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: 'materiales.json' });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importMaterialsJSON() {
  const input = Object.assign(document.createElement('input'), { type: 'file', accept: '.json,application/json' });
  input.onchange = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      if (!confirm('Esto reemplazará la base de materiales actual. ¿Continuar?')) return;
      NFS_MATERIALS.importJSON(text);
      _renderMaterialsTable();
      _populateMaterialCategoryDatalist();
      if (typeof recalcCostPartsFromMaterials === 'function') recalcCostPartsFromMaterials();
    } catch (err) {
      alert('No fue posible importar el archivo: ' + err.message);
    }
  };
  input.click();
}

/* ── File System Access API – connect materials file ── */

async function materialsConnectFile() {
  if (!window.showOpenFilePicker) {
    alert('Tu navegador no soporta escritura directa a archivos (File System Access API).\n\nUsa "Exportar"/"Importar". Chrome/Edge 86+ soportan esta función.');
    return;
  }
  try {
    const [handle] = await window.showOpenFilePicker({
      id: 'nfs-materials',
      types: [{ description: 'Base de materiales NFS (JSON)', accept: { 'application/json': ['.json'] } }],
      multiple: false,
    });
    const ok = await NFS_HANDLES.ensurePermission(handle);
    if (!ok) { alert('Se requiere permiso de escritura para vincular el archivo.'); return; }

    const file = await handle.getFile();
    const text = await file.text();
    if (text.trim()) {
      try { NFS_MATERIALS.importJSON(text); } catch (_) { /* keep current if invalid */ }
    }

    NFS_MATERIALS.setFileHandle(handle);
    await NFS_HANDLES.save(NFS_MATERIALS.handleKey, handle);
    _renderMaterialsTable();
    _populateMaterialCategoryDatalist();
    _materialsUpdateFileStatus();
  } catch (e) {
    if (e.name !== 'AbortError') alert('Error al conectar con el archivo:\n' + e.message);
  }
}

async function _materialsTryAutoReconnect() {
  const handle = await NFS_HANDLES.load(NFS_MATERIALS.handleKey);
  if (!handle) return;
  const ok = await NFS_HANDLES.ensurePermission(handle);
  if (!ok) return;
  NFS_MATERIALS.setFileHandle(handle);
  _materialsUpdateFileStatus();
}

function _materialsUpdateFileStatus() {
  const el = document.getElementById('materialsFileStatus');
  if (!el) return;
  const h = NFS_MATERIALS.getFileHandle();
  if (h) {
    el.className = 'db-file-status db-file-connected';
    el.innerHTML =
      '<span class="db-file-icon">🔗</span>' +
      'Vinculado a <strong>' + _escMat(h.name) + '</strong> – cambios guardados automáticamente en el archivo' +
      '<span id="materialsSaveIndicator" class="db-save-indicator"></span>';
  } else {
    el.className = 'db-file-status db-file-disconnected';
    el.innerHTML =
      '<span class="db-file-icon">💾</span>' +
      'Cambios guardados en el navegador. ' +
      '<button class="btn-db-link" onclick="materialsConnectFile()">Vincular archivo JSON…</button>' +
      ' para persistencia permanente.';
  }
}

function _materialsFlashSaved() {
  const el = document.getElementById('materialsSaveIndicator');
  if (!el) return;
  el.textContent = ' ✓ guardado';
  el.style.opacity = '1';
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => { el.style.opacity = '0'; }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
  NFS_MATERIALS.load();
  _materialsTryAutoReconnect();
});
