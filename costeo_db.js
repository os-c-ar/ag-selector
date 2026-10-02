/* =====================================================
   NFS – Costeo DB (P. PARTES simplificado)
   ===================================================== */

'use strict';

/* Canonical categories – mirror column A dropdown of "PLANTILLA DE P. (2)",
   sourced from the named ranges in 'P. PARTES'!A610:A620 of the base file. */
const NFS_COST_CATEGORIES = [
  { code: 'MOTOREDUCTOR',    label: 'Motoreductor' },
  { code: 'PROPELAS',        label: 'Propelas' },
  { code: 'ACOPLE_BRIDADO',  label: 'Acople bridado' },
  { code: 'ACOPLE_DIRECTO',  label: 'Acople directo' },
  { code: 'EJE_TUBULAR',     label: 'Eje tubular' },
  { code: 'EJE_MACIZO',      label: 'Eje macizo' },
  { code: 'PLETINAS',        label: 'Pletinas' },
  { code: 'PERNOS',          label: 'Pernos' },
  { code: 'PLACA',           label: 'Placa (valor fijo $50.000)' },
  { code: 'NO_APLICA',       label: 'No aplica (valor $0)' },
  { code: 'OTROS',           label: 'Otros (entrada manual)' },
];

const NFS_COSTEO_DB = (function () {
  const KEY = 'nfs_costeo_parts_v1';

  const DEFAULT_PARTS = [
    { id: 1,  categoria: 'PROPELAS', codigo: 'P2-ABM', descripcion: 'Propela Turbina 160 mm eje 1" con Manzana Acero 304SS', precio: 381250 },
    { id: 2,  categoria: 'PROPELAS', codigo: 'P2-BBM', descripcion: 'Propela Turbina  200 mm eje 1" con Manzana Acero 304SS', precio: 391250 },
    { id: 3,  categoria: 'PROPELAS', codigo: 'P3-NGCS', descripcion: 'Propela Tripala 1500 mm eje 3" con Casquete Acero 316SS', precio: 2806000 },
    { id: 4,  categoria: 'ACOPLE_BRIDADO', codigo: 'AB-1.25-20', descripcion: 'Acople bridado EJE AG 1 1/4" EJE MR 20 mm 304SS', precio: 306940 },
    { id: 5,  categoria: 'ACOPLE_BRIDADO', codigo: 'AB-3-50-S', descripcion: 'Acople bridado EJE AG 3" EJE MR 50 mm 316SS', precio: 935956 },
    { id: 6,  categoria: 'ACOPLE_DIRECTO', codigo: 'AD-014-025', descripcion: 'Acople directo EJE AG 1 " EJE MR 14 mm 304SS', precio: 197400 },
    { id: 7,  categoria: 'ACOPLE_DIRECTO', codigo: 'AD-025-038-S', descripcion: 'Acole directo EJE AG 1 1/2" EJE MR 25 mm 316SS', precio: 250000 },
    { id: 8,  categoria: 'EJE_TUBULAR', codigo: 'EJBC200D', descripcion: 'Eje tubular 1 1/2" Hasta 2000 mm 304SS', precio: 590000 },
    { id: 9,  categoria: 'EJE_TUBULAR', codigo: 'EJBC350GS', descripcion: 'Eje tubular 3"  2000-3500 mm 316SS', precio: 2315000 },
    { id: 10, categoria: 'EJE_MACIZO', codigo: 'EJDA100B', descripcion: 'Eje macizo 1" 500-1000 mm 304SS', precio: 99000 },
    { id: 11, categoria: 'EJE_MACIZO', codigo: 'EJDA100DS', descripcion: 'Eje macizo 1 1/2" 500 - 1000 mm 316SS', precio: 217000 },
    { id: 12, categoria: 'PLETINAS', codigo: 'PL-400-038-250', descripcion: 'Pletina cuadrada de 400 mm * 3/8" A36 GALVANIZADO', precio: 200000 },
    { id: 13, categoria: 'PLETINAS', codigo: 'PL-250-018-130', descripcion: 'Pletina cuadrada de 250 mm * 1/8" A36 GALVANIZADO', precio: 130000 },
    { id: 14, categoria: 'MOTOREDUCTOR', codigo: 'RF07DRS71S4', descripcion: 'Motorreductor serie RF07', precio: 1155000 },
    { id: 15, categoria: 'MOTOREDUCTOR', codigo: 'RF87DRN132S4', descripcion: 'Motorreductor engranajes cilindricos 5,5 kW 220/440 V', precio: 9773924 },
    { id: 16, categoria: 'PERNOS', codigo: 'PERNOS AG PEQUEÑO', descripcion: 'Pernos para agitador pequeño (1 propela ejes de hasta 2")', precio: 50000 },
    { id: 17, categoria: 'PERNOS', codigo: 'PERNOS AG MEDIANO', descripcion: 'Pernos para agitador mediano (2 propelas ejes de hasta 4")', precio: 80000 },
    { id: 18, categoria: 'PERNOS', codigo: 'PERNOS AG GRANDE', descripcion: 'Pernos para agitador grande (3 propelas ejes hasta 8")', precio: 120000 },
    { id: 19, categoria: 'PLACA', codigo: 'PLACAS AG.', descripcion: 'Placas de identificación y sentido de giro', precio: 50000 },
  ];

  let _parts = [];

  function _persist() {
    try { localStorage.setItem(KEY, JSON.stringify(_parts)); } catch (_) {}
  }

  function _load() {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) {
        _parts = parsed;
        return;
      }
    } catch (_) {}
    _parts = JSON.parse(JSON.stringify(DEFAULT_PARTS));
    _persist();
  }

  function _nextId() {
    return _parts.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1;
  }

  function _norm(s) {
    return String(s || '').trim().toUpperCase();
  }

  return {
    load: _load,
    getAll() { return [..._parts]; },
    getCategories() {
      const present = new Set(_parts.map(p => _norm(p.categoria)));
      return NFS_COST_CATEGORIES.map(c => c.code).filter(c => present.has(c));
    },
    getByCategory(categoria) {
      const c = _norm(categoria);
      return _parts.filter(p => _norm(p.categoria) === c);
    },
    findByCode(codigo) {
      const c = _norm(codigo);
      return _parts.find(p => _norm(p.codigo) === c) || null;
    },
    findInCategory(categoria, codigo) {
      const cat = _norm(categoria);
      const cod = _norm(codigo);
      return _parts.find(p => _norm(p.categoria) === cat && _norm(p.codigo) === cod) || null;
    },
    add(part) {
      const p = {
        id: _nextId(),
        categoria: String(part.categoria || '').trim().toUpperCase(),
        codigo: String(part.codigo || '').trim(),
        descripcion: String(part.descripcion || '').trim(),
        precio: Number(part.precio) || 0,
      };
      _parts.push(p);
      _persist();
      return p;
    },
    update(id, patch) {
      const p = _parts.find(x => Number(x.id) === Number(id));
      if (!p) return false;
      p.categoria = String(patch.categoria ?? p.categoria).trim().toUpperCase();
      p.codigo = String(patch.codigo ?? p.codigo).trim();
      p.descripcion = String(patch.descripcion ?? p.descripcion).trim();
      p.precio = Number(patch.precio ?? p.precio) || 0;
      _persist();
      return true;
    },
    remove(id) {
      _parts = _parts.filter(x => Number(x.id) !== Number(id));
      _persist();
    },
    reset() {
      _parts = JSON.parse(JSON.stringify(DEFAULT_PARTS));
      _persist();
    },
    exportJSON() {
      return JSON.stringify(_parts, null, 2);
    },
    importJSON(text) {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('Formato inválido.');
      _parts = parsed.map((x, i) => ({
        id: Number(x.id) || (i + 1),
        categoria: String(x.categoria || '').trim().toUpperCase(),
        codigo: String(x.codigo || '').trim(),
        descripcion: String(x.descripcion || '').trim(),
        precio: Number(x.precio) || 0,
      }));
      _persist();
    },
  };
})();

const CATALOG_CATEGORIES = NFS_COST_CATEGORIES.filter(c => c.code !== 'OTROS' && c.code !== 'NO_APLICA');

function _populateCategorySelect(sel, selected) {
  if (!sel) return;
  sel.innerHTML = CATALOG_CATEGORIES.map(c => `<option value="${c.code}">${c.label}</option>`).join('');
  if ([...sel.options].some(o => o.value === selected)) sel.value = selected;
}

function openCostPartsModal() {
  _renderCostPartsTable();
  _populateCategorySelect(document.getElementById('cp_new_categoria'));
  document.getElementById('costPartsModal').classList.remove('hidden');
}

function closeCostPartsModal() {
  document.getElementById('costPartsModal').classList.add('hidden');
  if (typeof refreshCosteoCatalogSelectors === 'function') refreshCosteoCatalogSelectors();
  if (typeof calculateCosteo === 'function') calculateCosteo();
}

function _renderCostPartsTable() {
  const tbody = document.getElementById('costPartsTableBody');
  if (!tbody) return;
  const rows = NFS_COSTEO_DB.getAll();
  tbody.innerHTML = '';
  rows.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      `<td>${_escCP(p.categoria)}</td>` +
      `<td>${_escCP(p.codigo)}</td>` +
      `<td>${_escCP(p.descripcion)}</td>` +
      `<td>${_escCP(_fmtCOPCP(p.precio))}</td>` +
      `<td class="db-td-actions">` +
      `<button class="btn-db btn-db-edit" onclick="_editCostPart(${p.id},this)">✏ Editar</button>` +
      `<button class="btn-db btn-db-del" onclick="_deleteCostPart(${p.id})">🗑</button>` +
      `</td>`;
    tbody.appendChild(tr);
  });
}

function _editCostPart(id, btn) {
  const tr = btn.closest('tr');
  const p = NFS_COSTEO_DB.getAll().find(x => Number(x.id) === Number(id));
  if (!tr || !p) return;
  tr.innerHTML =
    `<td><select class="db-input" data-role="categoria"></select></td>` +
    `<td><input class="db-input" value="${_escCP(p.codigo)}" /></td>` +
    `<td><input class="db-input" value="${_escCP(p.descripcion)}" /></td>` +
    `<td><input class="db-input" type="number" step="1" min="0" value="${Number(p.precio) || 0}" /></td>` +
    `<td class="db-td-actions">` +
    `<button class="btn-db btn-db-save" onclick="_saveCostPart(${p.id},this)">✔ Guardar</button>` +
    `<button class="btn-db btn-db-cancel" onclick="_renderCostPartsTable()">✖</button>` +
    `</td>`;
  _populateCategorySelect(tr.querySelector('[data-role="categoria"]'), p.categoria);
}

function _saveCostPart(id, btn) {
  const tr = btn.closest('tr');
  const inputs = tr.querySelectorAll('input');
  const categoria = tr.querySelector('[data-role="categoria"]').value;
  const codigo = inputs[0].value;
  const descripcion = inputs[1].value;
  const precio = Number(inputs[2].value) || 0;
  if (!categoria.trim() || !codigo.trim()) {
    alert('Categoría y código son obligatorios.');
    return;
  }
  NFS_COSTEO_DB.update(id, { categoria, codigo, descripcion, precio });
  _renderCostPartsTable();
}

function _deleteCostPart(id) {
  if (!confirm('¿Eliminar esta parte del catálogo?')) return;
  NFS_COSTEO_DB.remove(id);
  _renderCostPartsTable();
}

function addCostPartRow() {
  const categoria = document.getElementById('cp_new_categoria').value.trim();
  const codigo = document.getElementById('cp_new_codigo').value.trim();
  const descripcion = document.getElementById('cp_new_desc').value.trim();
  const precio = Number(document.getElementById('cp_new_precio').value) || 0;
  if (!categoria || !codigo) {
    alert('Ingrese categoría y código.');
    return;
  }
  NFS_COSTEO_DB.add({ categoria, codigo, descripcion, precio });
  document.getElementById('cp_new_codigo').value = '';
  document.getElementById('cp_new_desc').value = '';
  document.getElementById('cp_new_precio').value = '';
  _renderCostPartsTable();
}

function resetCostParts() {
  if (!confirm('¿Restaurar catálogo de partes por defecto?')) return;
  NFS_COSTEO_DB.reset();
  _renderCostPartsTable();
}

function exportCostPartsJSON() {
  const blob = new Blob([NFS_COSTEO_DB.exportJSON()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: 'costeo_partes.json' });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importCostPartsJSON() {
  const input = Object.assign(document.createElement('input'), { type: 'file', accept: '.json,application/json' });
  input.onchange = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      NFS_COSTEO_DB.importJSON(text);
      _renderCostPartsTable();
    } catch (err) {
      alert('No fue posible importar el archivo: ' + err.message);
    }
  };
  input.click();
}

async function importCostPartsFromExcel() {
  const input = Object.assign(document.createElement('input'), {
    type: 'file',
    accept: '.xlsx,.xlsm,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
  });

  input.onchange = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const XLSX = await _ensureXLSXCosteoLib();
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array', cellNF: false });

      const sheetName = _findPPartesSheetName(wb.SheetNames);
      if (!sheetName) {
        alert('No se encontró una hoja compatible con "P. PARTES".');
        return;
      }

      const ws = wb.Sheets[sheetName];

      let parsed = _parseByNamedRanges(wb, ws, sheetName);
      let method = 'rangos con nombre (fiel a las categorías del archivo origen)';

      if (!parsed.length) {
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '', blankrows: false });
        parsed = _parsePPartesRows(rows);
        method = 'encabezados de sección (modo de respaldo)';
      }

      if (!parsed.length) {
        alert('No se encontraron filas válidas para importar en la hoja ' + sheetName + '.');
        return;
      }

      if (!confirm(
        'Se importarán ' + parsed.length + ' partes desde la hoja ' + sheetName + '.\n' +
        'Método de lectura: ' + method + '.\n\n' +
        'Esto reemplazará el catálogo actual. ¿Desea continuar?'
      )) return;

      NFS_COSTEO_DB.importJSON(JSON.stringify(parsed));
      _renderCostPartsTable();

      if (typeof refreshCosteoCatalogSelectors === 'function') refreshCosteoCatalogSelectors();
      if (typeof calculateCosteo === 'function') calculateCosteo();

      alert('Importación completada: ' + parsed.length + ' partes cargadas (' + method + ').');
    } catch (err) {
      alert('No fue posible importar el archivo Excel: ' + err.message);
    }
  };

  input.click();
}

/* Robust parser: uses the workbook's defined names (e.g. PROPELAS, EJE_TUBULAR)
   which point to the exact row ranges per category in the base file, avoiding
   ambiguity from duplicated or inconsistent section headers in the raw text. */
function _parseByNamedRanges(wb, ws, sheetName) {
  const names = (wb.Workbook && wb.Workbook.Names) || [];
  if (!names.length) return [];

  const catalogCodes = new Set(CATALOG_CATEGORIES.map(c => c.code));
  const out = [];
  const seen = new Set();

  names.forEach(n => {
    const code = String(n.Name || '').trim().toUpperCase();
    if (!catalogCodes.has(code)) return;

    const ref = String(n.Ref || '');
    const m = ref.match(/\$?([A-Z]+)\$?(\d+)(?::\$?([A-Z]+)?\$?(\d+))?/);
    if (!m) return;
    if (!ref.includes(sheetName.replace(/'/g, '')) && !ref.includes(`'${sheetName}'`)) {
      // Defined name does not target this sheet; skip.
      if (!ref.toUpperCase().includes(sheetName.toUpperCase())) return;
    }

    const startRow = parseInt(m[2], 10);
    const endRow = m[4] ? parseInt(m[4], 10) : startRow;

    for (let r = startRow; r <= endRow; r++) {
      const codigo = String(_cellText(ws, 'A' + r) || '').trim();
      const precioRaw = _cellText(ws, 'B' + r);
      const descripcion = String(_cellText(ws, 'C' + r) || '').trim();

      if (!codigo) continue;
      const upper = codigo.toUpperCase();
      if (upper === 'COD' || upper === code) continue;

      const key = (code + '||' + upper);
      if (seen.has(key)) continue;
      seen.add(key);

      out.push({
        id: out.length + 1,
        categoria: code,
        codigo,
        descripcion,
        precio: _parsePriceCP(precioRaw),
      });
    }
  });

  return out;
}

function _cellText(ws, addr) {
  const cell = ws[addr];
  if (!cell) return '';
  return cell.w !== undefined ? cell.w : cell.v;
}

async function _ensureXLSXCosteoLib() {
  if (window.XLSX) return window.XLSX;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.async = true;
    script.onload = () => {
      if (window.XLSX) resolve(window.XLSX);
      else reject(new Error('No se pudo inicializar la librería XLSX.'));
    };
    script.onerror = () => reject(new Error('No se pudo cargar la librería XLSX.'));
    document.head.appendChild(script);
  });
}

function _findPPartesSheetName(names) {
  const norm = s => String(s || '').toUpperCase().replace(/\s+/g, ' ').trim();
  return names.find(n => norm(n) === 'P. PARTES')
    || names.find(n => norm(n).includes('P. PARTES'))
    || names.find(n => norm(n).includes('PARTES'))
    || null;
}

/* Fallback parser based on section header text (used only if the workbook
   has no usable defined names for the catalog categories). */
function _parsePPartesRows(rows) {
  const headerToCode = {
    'PROPELAS': 'PROPELAS',
    'ACOPLE DIRECTO': 'ACOPLE_DIRECTO',
    'ACOPLE BRIDADO': 'ACOPLE_BRIDADO',
    'EJE MACIZO': 'EJE_MACIZO',
    'EJE TUBULAR': 'EJE_TUBULAR',
    'PLETINAS': 'PLETINAS',
    'MOTOREDUCTOR': 'MOTOREDUCTOR',
    'PERNOS': 'PERNOS',
    'PLACA': 'PLACA',
  };

  let categoria = '';
  const out = [];
  const seen = new Set();

  for (const row of rows) {
    const a = String(row[0] ?? '').trim();
    const b = String(row[1] ?? '').trim();
    const c = String(row[2] ?? '').trim();

    if (!a && !b && !c) continue;

    const aUpper = a.toUpperCase();
    const bUpper = b.toUpperCase();

    // Category row, e.g. "PROPELAS" / "ACOPLE DIRECTO"
    if (a && !b && !c && aUpper !== 'COD' && headerToCode[aUpper]) {
      categoria = headerToCode[aUpper];
      continue;
    }

    // Header row under each category, e.g. COD / PRECIO / DESCRIPCION
    if (aUpper === 'COD' || bUpper === 'PRECIO') continue;

    // Data row: code + (price or description)
    if (!a || !categoria) continue;

    const codigo = a;
    const precio = _parsePriceCP(b);
    const descripcion = c;
    const key = (categoria + '||' + codigo).toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      id: out.length + 1,
      categoria,
      codigo,
      descripcion,
      precio,
    });
  }

  return out;
}

function _parsePriceCP(raw) {
  let s = String(raw ?? '').trim();
  if (!s) return 0;
  s = s.replace(/\s+/g, '');
  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function _escCP(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function _fmtCOPCP(n) {
  return Number(n || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

function _costPartsModalOverlayClick(e) {
  if (e.target === document.getElementById('costPartsModal')) closeCostPartsModal();
}

document.addEventListener('DOMContentLoaded', () => {
  NFS_COSTEO_DB.load();
});