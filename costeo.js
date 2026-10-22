/* =====================================================
   NFS – Presupuesto de agitador
   (base: hoja "Presupuesto" de CA_NNN_26_PRESUPUESTO.xlsx)
   ===================================================== */

'use strict';

/* Default rows mirror B8:E14 (materiales) and B20:E34 (servicios e
   ingeniería) of the source sheet. Both tables are fully editable:
   the user can change every value and add/remove rows with the
   "+ Agregar" buttons; everything is persisted as a small JSON blob
   in a hidden input so the generic cst_ save/restore in records.js
   keeps working without changes. */
const CST_DEFAULT_MATERIALES = [
  { desc: 'Motorreductores de engranajes cilíndricos RF87DRN132S4 // 7,5 Kw // 110 rpm', categoria: 'MOTOREDUCTOR', qty: 1, unit: 0 },
  { desc: 'Fabricación Pletina de apoyo', categoria: 'PLETINAS', qty: 0, unit: 0 },
  { desc: 'Propela Tripala 1000 mm eje 3" con Casquete Acero 316SS', categoria: 'PROPELAS', qty: 4, unit: 0 },
  { desc: 'Eje bridado 3" 304SS', categoria: 'EJE_TUBULAR', qty: 1, unit: 0 },
  { desc: 'Tornillería, 304SS', categoria: 'PERNOS', qty: 1, unit: 0 },
  { desc: 'Placa', categoria: 'PLACA', qty: 1, unit: 0 },
  { desc: '', categoria: 'OTROS', qty: 1, unit: 0 },
];

/* Rows whose catalog entry is free text (no lookup in NFS_COSTEO_DB),
   mirrors the previous (pre-Presupuesto) behaviour of the materiales table. */
const COST_FREE_TEXT_CATEGORIES = new Set(['OTROS', 'NO_APLICA']);

function _categoryLabel(code) {
  const found = NFS_COST_CATEGORIES.find(c => c.code === code);
  return found ? found.label : code;
}

const CST_DEFAULT_SERVICIOS = [
  { desc: 'Diseño mecánico y planos, Externo', qty: 1, unit: 2000000 },
  { desc: 'Selección y diseño NFS', qty: 1, unit: 500000 },
  { desc: 'Visita Técnica previa', qty: 1, unit: 200000 },
  { desc: 'Manejo e interventoría del pedido', qty: 1, unit: 2000000 },
  { desc: 'Acompañamiento técnico en planta', qty: 0, unit: 300000 },
  { desc: 'Pruebas asistidas', qty: 1, unit: 300000 },
  { desc: 'Pruebas y documentación', qty: 2, unit: 1404000 },
  { desc: 'Manual de Operación y mantenimiento', qty: 1, unit: 1000000 },
  { desc: 'Visita Técnica previa', qty: 0, unit: 0 },
  { desc: 'Acompañamiento técnico en planta (se cotizó por aparte)', qty: 0, unit: 0 },
  { desc: 'Pruebas asistidas', qty: 0, unit: 0 },
  { desc: 'Diseño mecánico y planos, Externo', qty: 0, unit: 0 },
  { desc: 'Simulación, CFD', qty: 0, unit: 0 },
];

let _cstRowSeq = 1;
const _cstState = { materiales: [], servicios: [] };

function _cstNextId(prefix) {
  return prefix + (_cstRowSeq++);
}

function _cstCloneDefaults() {
  _cstState.materiales = CST_DEFAULT_MATERIALES.map(r => ({ id: _cstNextId('m'), categoria: r.categoria, codigo: '', codigoManual: '', desc: r.desc, qty: r.qty, unit: r.unit, comentarios: '' }));
  _cstState.servicios = CST_DEFAULT_SERVICIOS.map(r => ({ id: _cstNextId('s'), desc: r.desc, qty: r.qty, unit: r.unit }));
}

function _escCost(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function _num(id) {
  let raw = String(document.getElementById(id)?.value ?? '').trim();
  if (!raw) return 0;

  raw = raw.replace(/\s+/g, '');
  if (raw.includes(',') && raw.includes('.')) {
    if (raw.lastIndexOf(',') > raw.lastIndexOf('.')) {
      raw = raw.replace(/\./g, '').replace(',', '.');
    } else {
      raw = raw.replace(/,/g, '');
    }
  } else if (raw.includes(',')) {
    raw = raw.replace(',', '.');
  }

  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function _set(id, val, dec = 0) {
  const el = document.getElementById(id);
  if (!el) return;
  const n = Number(val) || 0;
  el.value = n.toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function _safeMargin(base, pct) {
  if (pct <= 0 || pct >= 1) return 0;
  return base / (1 - pct) - base;
}

function _cstFieldNum(row, field) {
  const v = row[field];
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/* Same grouped-thousands look as the "Valor parcial" column, used for the
   Unitario field so it reads like a currency value while at rest; the raw
   number is shown instead while the field has focus, for easy editing. */
function _cstMoneyFmt(n) {
  return (Number(n) || 0).toLocaleString('es-CO');
}

/* ── Catalog-driven category/code helpers (mirrors the previous
   onCostCategoryChange/onCostCatalogChange behaviour, now scoped to a
   single dynamic row instead of a fixed row number). ── */
function _matCategoryOptionsHtml(selected) {
  return NFS_COST_CATEGORIES.map(c => `<option value="${c.code}"${c.code === selected ? ' selected' : ''}>${_categoryLabel(c.code)}</option>`).join('');
}

function _matCodeOptionsHtml(categoria, selectedCode) {
  const parts = NFS_COSTEO_DB.getByCategory(categoria);
  const opts = ['<option value="">Seleccione código...</option>']
    .concat(parts.map(p => `<option value="${_escCost(p.codigo)}"${p.codigo === selectedCode ? ' selected' : ''}>${_escCost(p.codigo)} — ${_escCost(p.descripcion)}</option>`))
    .concat([`<option value="__manual__"${selectedCode === '__manual__' ? ' selected' : ''}>— Entrada manual —</option>`]);
  return opts.join('');
}

/* Applies the catalog lookup/forced-value rules for a row's current
   categoria + codigo, mutating desc/unit in place. */
function _applyMatCatalogRules(row) {
  if (row.categoria === 'NO_APLICA') {
    row.codigo = '';
    row.codigoManual = '';
    row.desc = 'No aplica';
    row.unit = 0;
    return;
  }
  if (row.categoria === 'OTROS') {
    row.codigo = '';
    return; // free text: desc/unit stay as typed by the user
  }
  if (row.codigo === '__manual__') return; // manual code: leave desc/unit as typed

  const part = NFS_COSTEO_DB.findInCategory(row.categoria, row.codigo);
  if (row.categoria === 'PLACA') {
    // Placa has a fixed default price even before a specific code is chosen.
    row.desc = part ? part.descripcion : 'Placa';
    row.unit = part ? (Number(part.precio) || 50000) : 50000;
  } else if (!row.codigo) {
    return; // no code chosen yet for a regular catalog category
  } else if (part) {
    row.desc = part.descripcion;
    row.unit = Number(part.precio) || 0;
  }
}

function _matRowStatus(row) {
  if (row.categoria === 'NO_APLICA') return { kind: 'ok', text: 'N/A' };
  if (row.categoria === 'OTROS') return { kind: 'ok', text: 'Libre' };
  if (row.codigo === '__manual__') return { kind: 'warn', text: 'Manual' };
  if (!row.codigo) return { kind: 'warn', text: 'Sin código' };
  const part = NFS_COSTEO_DB.findInCategory(row.categoria, row.codigo);
  if (part || row.categoria === 'PLACA') return { kind: 'ok', text: '✔ Válido' };
  return { kind: 'error', text: '⚠ No encontrado' };
}

/* ── Rows markup ── */
function _matRowHtml(r) {
  const parcial = _cstFieldNum(r, 'qty') * _cstFieldNum(r, 'unit');
  const isNoAplica = r.categoria === 'NO_APLICA';
  const useCatalog = !COST_FREE_TEXT_CATEGORIES.has(r.categoria);
  const showManualTxt = !useCatalog && r.categoria !== 'NO_APLICA' ? true : (r.codigo === '__manual__');
  const status = _matRowStatus(r);
  return `<tr data-row-id="${r.id}">
    <td><select class="cst-input" data-field="categoria">${_matCategoryOptionsHtml(r.categoria)}</select></td>
    <td>
      <select class="cst-input${useCatalog ? '' : ' hidden'}" data-field="codigo">${useCatalog ? _matCodeOptionsHtml(r.categoria, r.codigo) : ''}</select>
      <input class="cst-input${showManualTxt ? '' : ' hidden'}" data-field="codigoManual" placeholder="Código / referencia" value="${_escCost(r.codigoManual)}" />
    </td>
    <td><input class="cst-input" data-field="desc" value="${_escCost(r.desc)}"${isNoAplica ? ' readonly' : ''} /></td>
    <td><input class="cst-input cst-input-qty" type="number" min="0" max="99" step="1" data-field="qty" value="${r.qty}" /></td>
    <td><input class="cst-input cst-input-money" type="text" inputmode="decimal" data-field="unit" value="${_cstMoneyFmt(r.unit)}"${isNoAplica ? ' readonly' : ''} /></td>
    <td><input class="cst-input input-calc" data-out="parcial" readonly value="${parcial.toLocaleString('es-CO')}" /></td>
    <td><input class="cst-input" data-field="comentarios" value="${_escCost(r.comentarios)}" /></td>
    <td><span class="cst-status cst-status-${status.kind}">${status.text}</span></td>
    <td><button type="button" class="btn-db btn-db-del" data-action="del-mat">✕</button></td>
  </tr>`;
}

function _srvRowHtml(r) {
  const parcial = _cstFieldNum(r, 'qty') * _cstFieldNum(r, 'unit');
  return `<tr data-row-id="${r.id}">
    <td><input class="cst-input" data-field="desc" value="${_escCost(r.desc)}" /></td>
    <td><input class="cst-input" type="number" min="0" step="1" data-field="qty" value="${r.qty}" /></td>
    <td><input class="cst-input" type="number" min="0" step="1" data-field="unit" value="${r.unit}" /></td>
    <td><input class="cst-input input-calc" data-out="parcial" readonly value="${parcial.toLocaleString('es-CO')}" /></td>
    <td><button type="button" class="btn-db btn-db-del" data-action="del-srv">✕</button></td>
  </tr>`;
}

function renderMatRows() {
  const tbody = document.getElementById('cstMatBody');
  if (!tbody) return;
  tbody.innerHTML = _cstState.materiales.map(_matRowHtml).join('');
}

function renderSrvRows() {
  const tbody = document.getElementById('cstSrvBody');
  if (!tbody) return;
  tbody.innerHTML = _cstState.servicios.map(_srvRowHtml).join('');
}

function addCostRow(kind) {
  if (kind === 'materiales') {
    _cstState.materiales.push({ id: _cstNextId('m'), categoria: 'OTROS', codigo: '', codigoManual: '', desc: '', qty: 1, unit: 0, comentarios: '' });
    renderMatRows();
  } else {
    _cstState.servicios.push({ id: _cstNextId('s'), desc: '', qty: 1, unit: 0 });
    renderSrvRows();
  }
  calculateCosteo();
}

function removeCostRow(kind, id) {
  if (kind === 'materiales') {
    _cstState.materiales = _cstState.materiales.filter(r => r.id !== id);
    renderMatRows();
  } else {
    _cstState.servicios = _cstState.servicios.filter(r => r.id !== id);
    renderSrvRows();
  }
  calculateCosteo();
}

/* ── Delegated listeners: typing updates state + the row's own
   computed cells without re-rendering the whole table (keeps focus). ── */
function _attachRowTableListeners() {
  const matBody = document.getElementById('cstMatBody');
  const srvBody = document.getElementById('cstSrvBody');

  const TEXT_FIELDS = new Set(['desc', 'comentarios', 'codigoManual', 'categoria', 'codigo']);
  const STRUCTURAL_FIELDS = new Set(['categoria', 'codigo']);

  const onMatInput = e => {
    const field = e.target.dataset.field;
    if (!field) return;
    const tr = e.target.closest('tr');
    const id = tr?.dataset.rowId;
    const row = _cstState.materiales.find(r => r.id === id);
    if (!row) return;

    row[field] = TEXT_FIELDS.has(field) ? e.target.value : _numFromInput(e.target.value);

    if (STRUCTURAL_FIELDS.has(field)) {
      // Category/code selection drives catalog lookups and toggles the
      // código select vs. manual-entry input, so the row needs a full
      // re-render (rebuilds the dependent <option> list / visibility).
      if (field === 'categoria') { row.codigo = ''; row.codigoManual = ''; }
      _applyMatCatalogRules(row);
      tr.outerHTML = _matRowHtml(row);
    }

    calculateCosteo();
  };

  const onSrvInput = e => {
    const field = e.target.dataset.field;
    if (!field) return;
    const tr = e.target.closest('tr');
    const id = tr?.dataset.rowId;
    const row = _cstState.servicios.find(r => r.id === id);
    if (!row) return;
    row[field] = field === 'desc' ? e.target.value : _numFromInput(e.target.value);
    calculateCosteo();
  };

  if (matBody) {
    matBody.addEventListener('input', onMatInput);
    matBody.addEventListener('focusin', e => {
      if (e.target.dataset.field !== 'unit') return;
      const tr = e.target.closest('tr');
      const row = _cstState.materiales.find(r => r.id === tr?.dataset.rowId);
      if (row) e.target.value = row.unit ? String(row.unit) : '';
    });
    matBody.addEventListener('focusout', e => {
      if (e.target.dataset.field !== 'unit') return;
      const tr = e.target.closest('tr');
      const row = _cstState.materiales.find(r => r.id === tr?.dataset.rowId);
      if (row) e.target.value = _cstMoneyFmt(row.unit);
    });
    matBody.addEventListener('click', e => {
      if (e.target.dataset.action === 'del-mat') {
        const id = e.target.closest('tr')?.dataset.rowId;
        if (id) removeCostRow('materiales', id);
      }
    });
  }
  if (srvBody) {
    srvBody.addEventListener('input', onSrvInput);
    srvBody.addEventListener('click', e => {
      if (e.target.dataset.action === 'del-srv') {
        const id = e.target.closest('tr')?.dataset.rowId;
        if (id) removeCostRow('servicios', id);
      }
    });
  }
}


function _numFromInput(raw) {
  const n = Number(String(raw ?? '').replace(/,/g, '.'));
  return Number.isFinite(n) ? n : 0;
}

/* ── Updates a row's own readonly output cells in place (no full rebuild). ── */
function _refreshMatRowOutputs(row) {
  const tr = document.querySelector(`#cstMatBody tr[data-row-id="${row.id}"]`);
  if (!tr) return 0;
  const parcial = _cstFieldNum(row, 'qty') * _cstFieldNum(row, 'unit');
  const el = tr.querySelector('[data-out="parcial"]');
  if (el) el.value = parcial.toLocaleString('es-CO');
  return parcial;
}

function _refreshSrvRowOutputs(row) {
  const tr = document.querySelector(`#cstSrvBody tr[data-row-id="${row.id}"]`);
  if (!tr) return 0;
  const parcial = _cstFieldNum(row, 'qty') * _cstFieldNum(row, 'unit');
  const el = tr.querySelector('[data-out="parcial"]');
  if (el) el.value = parcial.toLocaleString('es-CO');
  return parcial;
}

function setCosteoDefaults() {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = String(val);
  };

  set('cst_dolar', 3196);
  set('cst_cantidad', 1);
  set('cst_imprevistos_pct', 0.05);
  set('cst_margen_materiales_pct', 0.3);
  set('cst_margen_ingenieria_pct', 0.3);
  set('cst_financiero_cuotas', 2);
  set('cst_financiero_pct', 0.011);
  set('cst_administrativos_pct', 0.02);
  set('cst_comision_pct', 0.02);
  set('cst_polizas_pct', 0);
  set('cst_empaque_val', 500000);
  set('cst_transporte_val', 500000);
}

function buildCosteoRows() {
  if (!_cstState.materiales.length && !_cstState.servicios.length) {
    _cstCloneDefaults();
  }
  setCosteoDefaults();
  renderMatRows();
  renderSrvRows();
  _attachRowTableListeners();
  attachCosteoListeners();
}

function attachCosteoListeners() {
  const ids = [
    'cst_dolar', 'cst_cantidad',
    'cst_imprevistos_pct', 'cst_margen_materiales_pct', 'cst_margen_ingenieria_pct',
    'cst_financiero_cuotas', 'cst_financiero_pct', 'cst_administrativos_pct',
    'cst_comision_pct', 'cst_polizas_pct', 'cst_empaque_val', 'cst_transporte_val',
    'cst_codigo_equipo', 'cst_cotizacion_no', 'cst_aplicacion', 'cst_tag',
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', calculateCosteo);
    el.addEventListener('change', calculateCosteo);
  });
}

/* Numeric snapshot of every computed value, kept alongside the
   formatted (es-CO, "." as thousands separator) display strings.
   The export function reads from here instead of re-parsing the
   already-localized display strings (which would misread "986.286"
   as 986.286 instead of 986286). */
const _cstComputed = {};

function calculateCosteo() {
  let subtotalMateriales = 0;
  _cstState.materiales.forEach(row => { subtotalMateriales += _refreshMatRowOutputs(row); });

  let subtotalServicios = 0;
  _cstState.servicios.forEach(row => { subtotalServicios += _refreshSrvRowOutputs(row); });

  const margenMatPct = _num('cst_margen_materiales_pct');
  const margenMatVal = _safeMargin(subtotalMateriales, margenMatPct);
  const subtotalMatMargen = subtotalMateriales + margenMatVal;

  const margenIngPct = _num('cst_margen_ingenieria_pct');
  const margenIngVal = _safeMargin(subtotalServicios, margenIngPct);
  const subtotalIngMargen = subtotalServicios + margenIngVal;

  const subtotalMatIng = subtotalMatMargen + subtotalIngMargen;

  const imprevPct = _num('cst_imprevistos_pct');
  const imprevVal = subtotalMatIng * imprevPct;

  const finCuotas = _num('cst_financiero_cuotas');
  const finPct = _num('cst_financiero_pct');
  const finVal = subtotalMatIng * finPct * finCuotas;

  const admPct = _num('cst_administrativos_pct');
  const admVal = subtotalMatIng * admPct;

  const comPct = _num('cst_comision_pct');
  const comVal = subtotalMatIng * comPct;

  const polPct = _num('cst_polizas_pct');
  const polVal = subtotalMatIng * polPct;

  const empaqueVal = _num('cst_empaque_val');
  const transporteVal = _num('cst_transporte_val');

  const totalCop = subtotalMatIng + imprevVal + finVal + admVal + comVal + polVal + empaqueVal + transporteVal;
  const dolar = _num('cst_dolar') || 1;
  const totalUsd = totalCop / dolar;

  const cantidad = _num('cst_cantidad') || 1;
  const unitarioCop = totalCop / cantidad;
  const unitarioUsd = totalUsd / cantidad;

  _set('cst_subtotal_mat', subtotalMateriales, 0);
  _set('cst_margen_materiales_val', margenMatVal, 0);
  _set('cst_subtotal_mat_margen', subtotalMatMargen, 0);

  _set('cst_ing_subtotal', subtotalServicios, 0);
  _set('cst_margen_ingenieria_val', margenIngVal, 0);
  _set('cst_ing_subtotal_margen', subtotalIngMargen, 0);

  _set('cst_subtotal_mat_ing', subtotalMatIng, 0);
  _set('cst_imprevistos_val', imprevVal, 0);
  _set('cst_financiero_val', finVal, 0);
  _set('cst_administrativos_val', admVal, 0);
  _set('cst_comision_val', comVal, 0);
  _set('cst_polizas_val', polVal, 0);

  _set('cst_total_cop', totalCop, 0);
  _set('cst_total_usd', totalUsd, 2);
  _set('cst_unitario_cop', unitarioCop, 0);
  _set('cst_unitario_usd', unitarioUsd, 2);

  Object.assign(_cstComputed, {
    subtotalMateriales, margenMatVal, subtotalMatMargen,
    subtotalServicios, margenIngVal, subtotalIngMargen,
    subtotalMatIng, imprevVal, finVal, admVal, comVal, polVal,
    empaqueVal, transporteVal, totalCop, totalUsd, unitarioCop, unitarioUsd,
  });

  _persistRowsJson();
}

function _persistRowsJson() {
  const matEl = document.getElementById('cst_mat_rows_json');
  const srvEl = document.getElementById('cst_srv_rows_json');
  if (matEl) matEl.value = JSON.stringify(_cstState.materiales);
  if (srvEl) srvEl.value = JSON.stringify(_cstState.servicios);
}

function restoreCosteoFromRecord(fields) {
  if (!fields) return;
  const setVal = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };

  [
    'cst_dolar', 'cst_cantidad', 'cst_codigo_equipo', 'cst_cotizacion_no',
    'cst_aplicacion', 'cst_tag',
    'cst_imprevistos_pct', 'cst_margen_materiales_pct', 'cst_margen_ingenieria_pct',
    'cst_financiero_cuotas', 'cst_financiero_pct', 'cst_administrativos_pct',
    'cst_comision_pct', 'cst_polizas_pct', 'cst_empaque_val', 'cst_transporte_val',
  ].forEach(id => { if (fields[id] !== undefined) setVal(id, fields[id]); });

  const parseRows = (json, fallback) => {
    if (!json) return fallback();
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch (e) { /* fall through */ }
    return fallback();
  };

  _cstState.materiales = parseRows(fields.cst_mat_rows_json, () => CST_DEFAULT_MATERIALES.map(r => ({ ...r, codigo: '', codigoManual: '', comentarios: '' })))
    .map(r => ({
      id: r.id || _cstNextId('m'),
      categoria: r.categoria || 'OTROS',
      codigo: r.codigo || '',
      codigoManual: r.codigoManual || '',
      desc: r.desc || '',
      qty: Number(r.qty) || 0,
      unit: Number(r.unit) || 0,
      comentarios: r.comentarios || '',
    }));

  _cstState.servicios = parseRows(fields.cst_srv_rows_json, () => CST_DEFAULT_SERVICIOS.slice())
    .map(r => ({ id: r.id || _cstNextId('s'), desc: r.desc || '', qty: Number(r.qty) || 0, unit: Number(r.unit) || 0 }));

  renderMatRows();
  renderSrvRows();

  renderComentariosFromString(fields.cst_comerciales || '', 'cstComercialesList', 'input-cst-comercial-line', 'cst_comerciales');
  renderComentariosFromString(fields.cst_comerciales_internas || '', 'cstComercialesInternasList', 'input-cst-comercial-interna-line', 'cst_comerciales_internas');

  calculateCosteo();
}

function updateCostingFromSelection() {
  const modelo = document.getElementById('agitadorSeleccionado')?.value || '';
  const fecha = document.getElementById('fecha')?.value || '';
  const elaboro = document.getElementById('elaboro')?.value || '';
  const cotizacion = document.getElementById('cotizacion')?.value || '';

  const setv = (id, val) => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = val;
  };

  document.getElementById('cst_modelo') && (document.getElementById('cst_modelo').value = modelo);
  document.getElementById('cst_fecha') && (document.getElementById('cst_fecha').value = fecha);
  document.getElementById('cst_elaboro') && (document.getElementById('cst_elaboro').value = elaboro);
  setv('cst_codigo_equipo', modelo);
  setv('cst_cotizacion_no', cotizacion);

  calculateCosteo();
}

document.addEventListener('DOMContentLoaded', () => {
  buildCosteoRows();
  updateCostingFromSelection();
  renderComentariosFromString('', 'cstComercialesList', 'input-cst-comercial-line', 'cst_comerciales');
  renderComentariosFromString('', 'cstComercialesInternasList', 'input-cst-comercial-interna-line', 'cst_comerciales_internas');
  calculateCosteo();
});

/* =====================================================
   EXPORT TO EXCEL (.xlsx) – replicates the layout, colors
   and formulas of the "Presupuesto" sheet in the reference
   file, using ExcelJS (loaded on demand from CDN).
   ===================================================== */
async function _ensureExcelJSLib() {
  if (window.ExcelJS) return window.ExcelJS;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
    script.async = true;
    script.onload = () => {
      if (window.ExcelJS) resolve(window.ExcelJS);
      else reject(new Error('No se pudo inicializar la libreria ExcelJS.'));
    };
    script.onerror = () => reject(new Error('No se pudo cargar la libreria ExcelJS.'));
    document.head.appendChild(script);
  });
}

const CST_FILL_BLUE_HEADER  = 'FFDBEEF4';
const CST_FILL_BLUE_SUB     = 'FFDEEAF6';
const CST_FILL_GREEN_HEADER = 'FFE2EFD9';
const CST_FILL_GREEN_SUB    = 'FFE2EFD9';
const CST_FILL_TOTAL        = 'FFDEEBF7';
const CST_FILL_TOTAL_ALT    = 'FFDBEEF4';
const CST_FMT_COP = '"$" #,##0';
const CST_FMT_USD = '"$" #,##0.00';
const CST_FMT_PCT = '0.0%';

function _xlFill(ws, ref, argb) {
  ws.getCell(ref).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}
function _xlLabelRow(ws, row, label, value) {
  ws.getCell(`B${row}`).value = label;
  ws.getCell(`E${row}`).value = value || '';
  ws.getCell(`B${row}`).font = { size: 10 };
}

async function exportCosteoToExcel() {
  const btn = document.getElementById('btnExportCosteo');
  const prevTxt = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Generando...'; }
  try {
    const ExcelJS = await _ensureExcelJSLib();
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Presupuesto', { views: [{ showGridLines: false }] });

    ws.columns = [
      { width: 3 }, { width: 42 }, { width: 10 }, { width: 14 },
      { width: 14 }, { width: 24 },
    ];

    const v = id => document.getElementById(id)?.value || '';

    _xlLabelRow(ws, 2, 'Aplicación:', v('cst_aplicacion'));
    ws.getCell('D2').value = 'Diligenció:'; ws.getCell('D2').font = { size: 10 };
    ws.getCell('F2').value = v('cst_elaboro');
    _xlLabelRow(ws, 3, 'Modelo:', v('cst_modelo'));
    ws.getCell('D3').value = 'Fecha:'; ws.getCell('D3').font = { size: 10 };
    ws.getCell('F3').value = v('cst_fecha');
    ws.getCell('D4').value = 'Cotización/Pedido:'; ws.getCell('D4').font = { size: 10 };
    ws.getCell('F4').value = v('cst_cotizacion_no');
    ws.getCell('D5').value = 'Cantidad:'; ws.getCell('D5').font = { size: 10, bold: true };
    ws.getCell('F5').value = Number(v('cst_cantidad')) || 1;
    ws.getCell('D6').value = 'TAG:'; ws.getCell('D6').font = { size: 10 };
    ws.getCell('F6').value = v('cst_tag');

    // ── Materiales ──
    const matHeaderRow = 8;
    const matHeaders = ['DESCRIPCIÓN MATERIALES', 'QTY', 'UNITARIO', 'VALOR PARCIAL', 'COMENTARIOS'];
    matHeaders.forEach((h, i) => {
      const cell = ws.getCell(matHeaderRow, 2 + i);
      cell.value = h;
      cell.font = { bold: true, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CST_FILL_BLUE_HEADER } };
    });

    let r = matHeaderRow + 1;
    const matFirstDataRow = r;
    _cstState.materiales.forEach(row => {
      ws.getCell(`B${r}`).value = row.desc;
      ws.getCell(`C${r}`).value = _cstFieldNum(row, 'qty');
      ws.getCell(`D${r}`).value = _cstFieldNum(row, 'unit');
      ws.getCell(`D${r}`).numFmt = CST_FMT_COP;
      ws.getCell(`E${r}`).value = { formula: `C${r}*D${r}`, result: _cstFieldNum(row, 'qty') * _cstFieldNum(row, 'unit') };
      ws.getCell(`E${r}`).numFmt = CST_FMT_COP;
      ws.getCell(`F${r}`).value = row.comentarios || '';
      r++;
    });
    const matLastDataRow = r - 1;

    ws.getCell(`B${r}`).value = 'SUBTOTAL MATERIALES';
    ws.getCell(`E${r}`).value = { formula: `SUM(E${matFirstDataRow}:E${matLastDataRow})`, result: _cstComputed.subtotalMateriales };
    ['B', 'E'].forEach(c => { ws.getCell(`${c}${r}`).font = { bold: true }; ws.getCell(`${c}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CST_FILL_BLUE_SUB } }; });
    ws.getCell(`E${r}`).numFmt = CST_FMT_COP;
    const subtotalMatRow = r; r++;

    ws.getCell(`B${r}`).value = 'MARGEN';
    ws.getCell(`D${r}`).value = _num('cst_margen_materiales_pct');
    ws.getCell(`D${r}`).numFmt = CST_FMT_PCT;
    ws.getCell(`E${r}`).value = { formula: `(E${subtotalMatRow}/(1-D${r}))-E${subtotalMatRow}`, result: _cstComputed.margenMatVal };
    ws.getCell(`E${r}`).numFmt = CST_FMT_COP;
    ['B', 'E'].forEach(c => { ws.getCell(`${c}${r}`).font = { bold: true }; ws.getCell(`${c}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CST_FILL_BLUE_SUB } }; });
    const margenMatRow = r; r++;

    ws.getCell(`B${r}`).value = 'SUBTOTAL MATERIALES CON MARGEN';
    ws.getCell(`E${r}`).value = { formula: `E${subtotalMatRow}+E${margenMatRow}`, result: _cstComputed.subtotalMatMargen };
    ws.getCell(`E${r}`).numFmt = CST_FMT_COP;
    ['B', 'E'].forEach(c => { ws.getCell(`${c}${r}`).font = { bold: true }; ws.getCell(`${c}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CST_FILL_BLUE_SUB } }; });
    const subtotalMatMargenRow = r; r += 2;

    // ── Servicios e ingeniería ──
    const srvHeaderRow = r;
    ['SERVICIOS E INGENIERÍA', 'CANT', 'UNITARIO', 'VALOR PARCIAL'].forEach((h, i) => {
      const cell = ws.getCell(srvHeaderRow, 2 + i);
      cell.value = h;
      cell.font = { bold: true, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CST_FILL_GREEN_HEADER } };
    });
    r++;
    const srvFirstDataRow = r;
    _cstState.servicios.forEach(row => {
      ws.getCell(`B${r}`).value = row.desc;
      ws.getCell(`C${r}`).value = _cstFieldNum(row, 'qty');
      ws.getCell(`D${r}`).value = _cstFieldNum(row, 'unit');
      ws.getCell(`D${r}`).numFmt = CST_FMT_COP;
      ws.getCell(`E${r}`).value = { formula: `C${r}*D${r}`, result: _cstFieldNum(row, 'qty') * _cstFieldNum(row, 'unit') };
      ws.getCell(`E${r}`).numFmt = CST_FMT_COP;
      r++;
    });
    const srvLastDataRow = r - 1;

    ws.getCell(`B${r}`).value = 'SUBTOTAL INGENIERÍA';
    ws.getCell(`E${r}`).value = { formula: `SUM(E${srvFirstDataRow}:E${srvLastDataRow})`, result: _cstComputed.subtotalServicios };
    ws.getCell(`E${r}`).numFmt = CST_FMT_COP;
    ['B', 'E'].forEach(c => { ws.getCell(`${c}${r}`).font = { bold: true }; ws.getCell(`${c}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CST_FILL_GREEN_SUB } }; });
    const subtotalSrvRow = r; r++;

    ws.getCell(`B${r}`).value = 'MARGEN';
    ws.getCell(`D${r}`).value = _num('cst_margen_ingenieria_pct');
    ws.getCell(`D${r}`).numFmt = CST_FMT_PCT;
    ws.getCell(`E${r}`).value = { formula: `(E${subtotalSrvRow}/(1-D${r}))-E${subtotalSrvRow}`, result: _cstComputed.margenIngVal };
    ws.getCell(`E${r}`).numFmt = CST_FMT_COP;
    ['B', 'E'].forEach(c => { ws.getCell(`${c}${r}`).font = { bold: true }; ws.getCell(`${c}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CST_FILL_GREEN_SUB } }; });
    const margenSrvRow = r; r++;

    ws.getCell(`B${r}`).value = 'SUBTOTAL INGENIERÍA CON MARGEN';
    ws.getCell(`E${r}`).value = { formula: `E${subtotalSrvRow}+E${margenSrvRow}`, result: _cstComputed.subtotalIngMargen };
    ws.getCell(`E${r}`).numFmt = CST_FMT_COP;
    ['B', 'E'].forEach(c => { ws.getCell(`${c}${r}`).font = { bold: true }; ws.getCell(`${c}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CST_FILL_GREEN_SUB } }; });
    const subtotalSrvMargenRow = r; r += 2;

    // ── Totales ──
    ws.getCell(`B${r}`).value = 'Subtotal materiales+ING';
    ws.getCell(`E${r}`).value = { formula: `E${subtotalMatMargenRow}+E${subtotalSrvMargenRow}`, result: _cstComputed.subtotalMatIng };
    ws.getCell(`E${r}`).numFmt = CST_FMT_COP;
    ws.getCell(`B${r}`).font = { bold: true, size: 13 };
    ws.getCell(`E${r}`).font = { bold: true, size: 13 };
    _xlFill(ws, `B${r}`, CST_FILL_TOTAL); _xlFill(ws, `E${r}`, CST_FILL_TOTAL);
    const baseRow = r; r++;

    const addPctLine = (label, pctRaw, resultVal) => {
      ws.getCell(`B${r}`).value = label;
      ws.getCell(`D${r}`).value = pctRaw;
      ws.getCell(`D${r}`).numFmt = CST_FMT_PCT;
      ws.getCell(`E${r}`).value = { formula: `E${baseRow}*D${r}`, result: resultVal };
      ws.getCell(`E${r}`).numFmt = CST_FMT_COP;
      r++;
    };

    addPctLine('Imprevistos', _num('cst_imprevistos_pct'), _cstComputed.imprevVal);

    ws.getCell(`B${r}`).value = 'Gastos Financieros';
    ws.getCell(`C${r}`).value = _num('cst_financiero_cuotas');
    ws.getCell(`D${r}`).value = _num('cst_financiero_pct');
    ws.getCell(`D${r}`).numFmt = CST_FMT_PCT;
    ws.getCell(`E${r}`).value = { formula: `E${baseRow}*D${r}*C${r}`, result: _cstComputed.finVal };
    ws.getCell(`E${r}`).numFmt = CST_FMT_COP;
    r++;

    addPctLine('Gastos administrativos', _num('cst_administrativos_pct'), _cstComputed.admVal);
    addPctLine('Comisión grupo', _num('cst_comision_pct'), _cstComputed.comVal);
    addPctLine('Polizas', _num('cst_polizas_pct'), _cstComputed.polVal);

    ws.getCell(`B${r}`).value = 'Empaque de madera';
    ws.getCell(`E${r}`).value = _cstComputed.empaqueVal;
    ws.getCell(`E${r}`).numFmt = CST_FMT_COP;
    r++;

    ws.getCell(`B${r}`).value = 'Transporte';
    ws.getCell(`E${r}`).value = _cstComputed.transporteVal;
    ws.getCell(`E${r}`).numFmt = CST_FMT_COP;
    const lastExtraRow = r; r++;

    ws.getCell(`B${r}`).value = 'TOTAL COP';
    ws.getCell(`E${r}`).value = { formula: `SUM(E${baseRow}:E${lastExtraRow})`, result: _cstComputed.totalCop };
    ws.getCell(`E${r}`).numFmt = CST_FMT_COP;
    ws.getCell(`B${r}`).font = { bold: true, size: 16 };
    ws.getCell(`E${r}`).font = { bold: true, size: 16 };
    _xlFill(ws, `B${r}`, CST_FILL_TOTAL); _xlFill(ws, `E${r}`, CST_FILL_TOTAL);
    const totalCopRow = r; r++;

    const dolarRow = r + 3;

    ws.getCell(`B${r}`).value = 'TOTAL USD';
    ws.getCell(`E${r}`).value = { formula: `E${totalCopRow}/C${dolarRow}`, result: _cstComputed.totalUsd };
    ws.getCell(`E${r}`).numFmt = CST_FMT_USD;
    ws.getCell(`B${r}`).font = { bold: true, size: 16 };
    ws.getCell(`E${r}`).font = { bold: true, size: 16 };
    _xlFill(ws, `B${r}`, CST_FILL_TOTAL_ALT); _xlFill(ws, `E${r}`, CST_FILL_TOTAL_ALT);
    const totalUsdRow = r; r++;

    ws.getCell(`B${r}`).value = 'UNITARIO COP';
    ws.getCell(`E${r}`).value = { formula: `E${totalCopRow}/F5`, result: _cstComputed.unitarioCop };
    ws.getCell(`E${r}`).numFmt = CST_FMT_COP;
    ws.getCell(`B${r}`).font = { bold: true, size: 16 };
    ws.getCell(`E${r}`).font = { bold: true, size: 16 };
    _xlFill(ws, `B${r}`, CST_FILL_TOTAL); _xlFill(ws, `E${r}`, CST_FILL_TOTAL);
    r++;

    ws.getCell(`B${r}`).value = 'UNITARIO USD';
    ws.getCell(`E${r}`).value = { formula: `E${totalUsdRow}/F5`, result: _cstComputed.unitarioUsd };
    ws.getCell(`E${r}`).numFmt = CST_FMT_USD;
    ws.getCell(`B${r}`).font = { bold: true, size: 16 };
    ws.getCell(`E${r}`).font = { bold: true, size: 16 };
    _xlFill(ws, `B${r}`, CST_FILL_TOTAL_ALT); _xlFill(ws, `E${r}`, CST_FILL_TOTAL_ALT);
    r += 2;

    ws.getCell(`B${dolarRow}`).value = `DÓLAR HOY ${new Date().toLocaleDateString('es-CO')}`;
    ws.getCell(`C${dolarRow}`).value = _num('cst_dolar');
    ws.getCell(`B${dolarRow}`).font = { italic: true, size: 9 };

    const date = new Date();
    const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const codigo = (v('cst_codigo_equipo') || v('cst_modelo') || 'Agitador').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const fileName = `Presupuesto_${codigo}_${stamp}.xlsx`;

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: fileName });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    if (typeof _showToast === 'function') _showToast('✔ Presupuesto .xlsx generado correctamente.');
  } catch (err) {
    console.error('Fallo exportacion presupuesto XLSX:', err);
    alert('No se pudo generar el archivo .xlsx del presupuesto. Intente de nuevo.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = prevTxt; }
  }
}
