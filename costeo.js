/* =====================================================
   NFS – Costeo de agitadores (base: PLANTILLA DE P. (2))
   ===================================================== */

'use strict';

/* Row model mirrors rows 5-16 of the source sheet:
   - applyK7: K7 (dólar/protección) multiplies only rows 6-9 in the source formulas.
   - factorDefault: the per-row "H" factor (H5=0.9, H6=1, H7=1.4, rest=1).
   - categories: options available in the category dropdown for that row
     (rows 5-11 come from 'P. PARTES'!A611:A620, rows 12-16 also include OTROS
     from 'P. PARTES'!A610:A620 — exactly as the source data validation defines). */
const COST_CATEGORIES_5_11 = ['MOTOREDUCTOR', 'PROPELAS', 'ACOPLE_BRIDADO', 'ACOPLE_DIRECTO', 'EJE_TUBULAR', 'EJE_MACIZO', 'PLETINAS', 'PERNOS', 'PLACA', 'NO_APLICA'];
const COST_CATEGORIES_12_16 = ['OTROS', ...COST_CATEGORIES_5_11];

const COST_ROWS = [
  { n: 5, defaultCategoria: 'MOTOREDUCTOR', factorDefault: 0.9, applyK7: false, categories: COST_CATEGORIES_5_11 },
  { n: 6, defaultCategoria: 'PROPELAS', factorDefault: 1, applyK7: true, categories: COST_CATEGORIES_5_11 },
  { n: 7, defaultCategoria: 'ACOPLE_BRIDADO', factorDefault: 1.4, applyK7: true, categories: COST_CATEGORIES_5_11 },
  { n: 8, defaultCategoria: 'EJE_TUBULAR', factorDefault: 1, applyK7: true, categories: COST_CATEGORIES_5_11 },
  { n: 9, defaultCategoria: 'PLETINAS', factorDefault: 1, applyK7: true, categories: COST_CATEGORIES_5_11 },
  { n: 10, defaultCategoria: 'PERNOS', factorDefault: 1, applyK7: false, categories: COST_CATEGORIES_5_11 },
  { n: 11, defaultCategoria: 'PLACA', factorDefault: 1, applyK7: false, categories: COST_CATEGORIES_5_11 },
  { n: 12, defaultCategoria: 'OTROS', factorDefault: 1, applyK7: false, categories: COST_CATEGORIES_12_16 },
  { n: 13, defaultCategoria: 'OTROS', factorDefault: 1, applyK7: false, categories: COST_CATEGORIES_12_16 },
  { n: 14, defaultCategoria: 'OTROS', factorDefault: 1, applyK7: false, categories: COST_CATEGORIES_12_16 },
  { n: 15, defaultCategoria: 'OTROS', factorDefault: 1, applyK7: false, categories: COST_CATEGORIES_12_16 },
  { n: 16, defaultCategoria: 'OTROS', factorDefault: 1, applyK7: false, categories: COST_CATEGORIES_12_16 },
];

/* Rows whose catalog entry is free text (no lookup in NFS_COSTEO_DB). */
const COST_FREE_TEXT_CATEGORIES = new Set(['OTROS', 'NO_APLICA']);

function _categoryLabel(code) {
  const found = NFS_COST_CATEGORIES.find(c => c.code === code);
  return found ? found.label : code;
}

function buildCosteoRows() {
  const tbody = document.getElementById('cstRowsBody');
  if (!tbody || tbody.children.length) return;

  tbody.innerHTML = COST_ROWS.map(r => {
    const catOptions = r.categories.map(code => `<option value="${code}">${_categoryLabel(code)}</option>`).join('');
    return `<tr>
      <td><select id="cst_cat_${r.n}" class="input-select-sm" onchange="onCostCategoryChange(${r.n})">${catOptions}</select></td>
      <td><select id="cst_code_${r.n}" class="input-select-sm" onchange="onCostCatalogChange(${r.n})"></select>
          <input id="cst_code_txt_${r.n}" class="input-value hidden" placeholder="Código / referencia" /></td>
      <td><input id="cst_desc_${r.n}" class="input-value" /></td>
      <td><input id="cst_qty_${r.n}" type="number" min="0" step="1" class="input-value" value="1" /></td>
      <td><input id="cst_unit_${r.n}" type="number" min="0" step="1" class="input-value" value="0" /></td>
      <td><input id="cst_factor_${r.n}" type="number" min="0" step="0.01" class="input-value" value="${r.factorDefault}" /></td>
      <td><input id="cst_part_${r.n}" class="input-calc" readonly /></td>
      <td><span id="cst_status_${r.n}" class="cst-status">–</span></td>
    </tr>`;
  }).join('');

  setCosteoDefaults();
  COST_ROWS.forEach(r => {
    const sel = document.getElementById('cst_cat_' + r.n);
    if (sel) sel.value = r.defaultCategoria;
  });
  refreshCosteoCatalogSelectors();
  attachCosteoListeners();
}

function setCosteoDefaults() {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = String(val);
  };

  set('cst_dolar', 3664);
  set('cst_k7', 1.5);
  set('cst_imprevistos_pct', 0.05);
  set('cst_margen_materiales_pct', 0);
  set('cst_financiero_pct', 0.015);
  set('cst_margen_ingenieria_pct', 0);
  set('cst_margen_sugerido_pct', 0.35);
  set('cst_margen_neg_pct', 0.03);

  set('cst_qty_5', 1);
  set('cst_qty_6', 1);
  set('cst_qty_7', 1);
  set('cst_qty_8', 1);
  set('cst_qty_9', 1);

  set('cst_desc_10', 'Pernos para agitador mediano (2 propelas ejes de hasta 4")');
  set('cst_unit_10', 80000);
  set('cst_desc_11', 'Placas de identificación y sentido de giro');
  set('cst_unit_11', 50000);
  set('cst_desc_12', 'Sello mecanico + linterna');
  set('cst_unit_12', 10000000);
  set('cst_desc_13', 'Empaque (madera)');
  set('cst_unit_13', 1000000);
  set('cst_desc_14', 'Recubrimiento');
  set('cst_unit_14', 0);
  set('cst_desc_15', 'Pruebas y documentacion');
  set('cst_unit_15', 1000000);
  set('cst_desc_16', 'Pintura');
  set('cst_unit_16', 0);

  set('cst_ing_dir_h', 0);
  set('cst_ing_dir_rate', 0);
  set('cst_ing_proj_d', 0);
  set('cst_ing_proj_rate', 0);
  set('cst_manejo_pedido_d', 0);
  set('cst_manejo_pedido_rate', 1500000);
  set('cst_asis_cont_d', 0);
  set('cst_asis_cont_rate', 0);

  set('cst_pack_l', 0);
  set('cst_pack_w', 0);
  set('cst_pack_h', 0);
  set('cst_pack_peso', 0);
}

function refreshCosteoCatalogSelectors() {
  COST_ROWS.forEach(r => onCostCategoryChange(r.n, { keepCode: true }));
}

/* Called when the row's category dropdown changes: rebuilds the code list
   (or switches to free text) and recalculates, mirroring the source's
   B5:B16 = INDIRECT(A5) dynamic validation. */
function onCostCategoryChange(n, opts) {
  const keepCode = opts && opts.keepCode;
  const cat = document.getElementById('cst_cat_' + n)?.value || '';
  const sel = document.getElementById('cst_code_' + n);
  const txt = document.getElementById('cst_code_txt_' + n);
  const desc = document.getElementById('cst_desc_' + n);
  if (!sel || !txt) return;

  const useCatalog = !COST_FREE_TEXT_CATEGORIES.has(cat);

  if (cat === 'NO_APLICA') {
    sel.classList.add('hidden');
    txt.classList.add('hidden');
    if (desc) { desc.value = 'No aplica'; desc.readOnly = true; }
    _set('cst_unit_' + n, 0, 0);
    document.getElementById('cst_unit_' + n).readOnly = true;
    _setStatus(n, 'ok', 'N/A');
    calculateCosteo();
    return;
  }

  if (desc) desc.readOnly = false;
  const unitEl = document.getElementById('cst_unit_' + n);
  if (unitEl) unitEl.readOnly = false;

  if (useCatalog) {
    sel.classList.remove('hidden');
    txt.classList.add('hidden');
    const prev = keepCode ? sel.value : '';
    const parts = NFS_COSTEO_DB.getByCategory(cat);
    sel.innerHTML = '<option value="">Seleccione código...</option>' + parts
      .map(p => `<option value="${_escCost(p.codigo)}">${_escCost(p.codigo)} — ${_escCost(p.descripcion)}</option>`)
      .join('') + '<option value="__manual__">— Entrada manual —</option>';
    if ([...sel.options].some(o => o.value === prev) && prev) sel.value = prev;
    onCostCatalogChange(n);
  } else {
    // OTROS: free text, no catalog lookup.
    sel.classList.add('hidden');
    txt.classList.remove('hidden');
    _setStatus(n, 'ok', 'Libre');
    calculateCosteo();
  }
}

function onCostCatalogChange(n) {
  const cat = document.getElementById('cst_cat_' + n)?.value || '';
  if (COST_FREE_TEXT_CATEGORIES.has(cat)) { calculateCosteo(); return; }

  const sel = document.getElementById('cst_code_' + n);
  const txt = document.getElementById('cst_code_txt_' + n);
  const code = sel?.value || '';
  const desc = document.getElementById('cst_desc_' + n);
  const unit = document.getElementById('cst_unit_' + n);

  if (code === '__manual__') {
    sel.classList.add('hidden');
    txt.classList.remove('hidden');
    txt.value = '';
    if (desc) desc.value = '';
    _setStatus(n, 'warn', 'Manual');
    calculateCosteo();
    return;
  }

  txt.classList.add('hidden');
  sel.classList.remove('hidden');

  const part = NFS_COSTEO_DB.findInCategory(cat, code);

  if (cat === 'PLACA') {
    if (desc) desc.value = part ? part.descripcion : 'Placa';
    if (unit) unit.value = String(part ? Number(part.precio) || 50000 : 50000);
  } else if (part) {
    if (desc) desc.value = part.descripcion;
    if (unit) unit.value = String(Number(part.precio) || 0);
  } else if (desc) {
    desc.value = '';
  }

  if (!code) {
    _setStatus(n, 'warn', 'Sin código');
  } else if (part || cat === 'PLACA') {
    _setStatus(n, 'ok', '✔ Válido');
  } else {
    _setStatus(n, 'error', '⚠ No encontrado');
  }

  calculateCosteo();
}

function _setStatus(n, kind, text) {
  const el = document.getElementById('cst_status_' + n);
  if (!el) return;
  el.textContent = text;
  el.className = 'cst-status cst-status-' + kind;
}

function attachCosteoListeners() {
  const ids = [
    'cst_dolar', 'cst_k7',
    'cst_imprevistos_pct', 'cst_margen_materiales_pct', 'cst_financiero_pct',
    'cst_margen_ingenieria_pct', 'cst_margen_sugerido_pct', 'cst_margen_neg_pct',
    'cst_ing_dir_h', 'cst_ing_dir_rate',
    'cst_ing_proj_d', 'cst_ing_proj_rate',
    'cst_manejo_pedido_d', 'cst_manejo_pedido_rate',
    'cst_asis_cont_d', 'cst_asis_cont_rate',
    'cst_pack_l', 'cst_pack_w', 'cst_pack_h', 'cst_pack_peso',
    'cst_codigo_equipo', 'cst_cotizacion_no',
  ];

  COST_ROWS.forEach(r => {
    ids.push('cst_qty_' + r.n, 'cst_unit_' + r.n, 'cst_factor_' + r.n, 'cst_desc_' + r.n, 'cst_code_txt_' + r.n);
  });

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', calculateCosteo);
    el.addEventListener('change', calculateCosteo);
  });

  document.querySelectorAll('input[name="cst_distribuidor"]').forEach(el => {
    el.addEventListener('change', calculateCosteo);
  });
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

function calculateCosteo() {
  let subtotalMateriales = 0;
  const k7 = _num('cst_k7') || 1;

  COST_ROWS.forEach(r => {
    const qty = _num('cst_qty_' + r.n);
    const unit = _num('cst_unit_' + r.n);
    const factor = _num('cst_factor_' + r.n) || 0;

    const unitCalc = r.applyK7 ? (unit * k7 * factor) : (unit * factor);
    const parcial = unitCalc * qty;

    _set('cst_part_' + r.n, parcial, 0);
    subtotalMateriales += parcial;
  });

  const imprevPct = _num('cst_imprevistos_pct');
  const imp = subtotalMateriales * imprevPct;
  const totalMat = subtotalMateriales + imp;

  const margenMatPct = _num('cst_margen_materiales_pct');
  const margenMatVal = _safeMargin(totalMat, margenMatPct);

  const ingDir = _num('cst_ing_dir_h') * _num('cst_ing_dir_rate');
  const ingProj = _num('cst_ing_proj_d') * _num('cst_ing_proj_rate');
  const manejo = _num('cst_manejo_pedido_d') * _num('cst_manejo_pedido_rate');
  const asis = _num('cst_asis_cont_d') * _num('cst_asis_cont_rate');
  const ingSubtotal = ingDir + ingProj + manejo + asis;

  const margIngPct = _num('cst_margen_ingenieria_pct');
  const margIngVal = _safeMargin(ingSubtotal, margIngPct);

  const finPct = _num('cst_financiero_pct');
  const finVal = totalMat * finPct;

  const ventaNfs = margenMatVal + totalMat + ingSubtotal + margIngVal + finVal;

  const margSugPct = _num('cst_margen_sugerido_pct');
  const margSugVal = _safeMargin(ventaNfs, margSugPct);
  const precioDist = ventaNfs + margSugVal;

  const margNegPct = _num('cst_margen_neg_pct');
  const margNegVal = _safeMargin(precioDist, margNegPct);
  const precioCliente = precioDist + margNegVal;

  const dolar = _num('cst_dolar') || 1;
  const margenGlobal = ventaNfs > 0 ? (margenMatVal + ingSubtotal + margIngVal + finVal) / ventaNfs : 0;

  _set('cst_subtotal_mat', subtotalMateriales, 0);
  _set('cst_imprevistos_val', imp, 0);
  _set('cst_total_mat', totalMat, 0);
  _set('cst_margen_materiales_val', margenMatVal, 0);

  _set('cst_ing_subtotal', ingSubtotal, 0);
  _set('cst_margen_ingenieria_val', margIngVal, 0);
  _set('cst_financiero_val', finVal, 0);

  _set('cst_venta_nfs', ventaNfs, 0);
  _set('cst_venta_nfs_usd', ventaNfs / dolar, 0);

  _set('cst_margen_sugerido_val', margSugVal, 0);
  _set('cst_precio_dist', precioDist, 0);
  _set('cst_precio_dist_usd', precioDist / dolar, 0);

  _set('cst_margen_neg_val', margNegVal, 0);
  _set('cst_precio_cliente', precioCliente, 0);
  _set('cst_precio_cliente_usd', precioCliente / dolar, 0);

  const rent = document.getElementById('cst_rentabilidad');
  if (rent) rent.value = (margenGlobal * 100).toFixed(2) + '%';

  _applyDistribuidorLabels();
  _updatePackingSummary();
}

/* Mirrors D39/D40/D41 = IF(A36="SI", ...) label swap in the source sheet.
   The underlying G38..G41 math never changes — only how each step is named. */
function _applyDistribuidorLabels() {
  const esDistribuidor = document.querySelector('input[name="cst_distribuidor"]:checked')?.value === 'SI';

  const lbl39 = document.getElementById('cst_lbl_39');
  const lbl39b = document.getElementById('cst_lbl_39b');
  const lbl40 = document.getElementById('cst_lbl_40');
  const lbl41 = document.getElementById('cst_lbl_41');

  if (lbl39) lbl39.textContent = 'Margen sugerido (valor):';
  if (lbl39b) lbl39b.textContent = esDistribuidor ? 'Precio sugerido para el distribuidor:' : 'Margen de negociación:';
  if (lbl40) lbl40.textContent = esDistribuidor ? 'Margen Distribuidor (valor):' : 'Margen de Negociación (valor):';
  if (lbl41) lbl41.textContent = esDistribuidor ? 'Margen de negociación (valor):' : 'Precio sugerido al cliente:';
}

function _updatePackingSummary() {
  const l = _num('cst_pack_l');
  const w = _num('cst_pack_w');
  const h = _num('cst_pack_h');
  const peso = _num('cst_pack_peso');
  const el = document.getElementById('cst_pack_resumen');
  if (!el) return;
  if (!l && !w && !h && !peso) { el.value = '–'; return; }
  const fmt1 = n => n.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  el.value = `${fmt1(l)} m * ${fmt1(w)} m * ${fmt1(h)} m  ${Math.round(peso)} kg`;
}

/* Restores a saved history record's costeo fields, rebuilding each row's
   category-dependent code dropdown before applying the saved values
   (a plain value assignment would be ignored on an not-yet-rebuilt select). */
function restoreCosteoFromRecord(fields) {
  if (!fields) return;
  const setVal = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };

  [
    'cst_dolar', 'cst_k7', 'cst_codigo_equipo', 'cst_cotizacion_no',
    'cst_imprevistos_pct', 'cst_margen_materiales_pct', 'cst_financiero_pct',
    'cst_margen_ingenieria_pct', 'cst_margen_sugerido_pct', 'cst_margen_neg_pct',
    'cst_ing_dir_h', 'cst_ing_dir_rate', 'cst_ing_proj_d', 'cst_ing_proj_rate',
    'cst_manejo_pedido_d', 'cst_manejo_pedido_rate', 'cst_asis_cont_d', 'cst_asis_cont_rate',
    'cst_pack_l', 'cst_pack_w', 'cst_pack_h', 'cst_pack_peso',
  ].forEach(id => { if (fields[id] !== undefined) setVal(id, fields[id]); });

  if (fields.cst_distribuidor) {
    document.querySelectorAll('input[name="cst_distribuidor"]').forEach(r => { r.checked = (r.value === fields.cst_distribuidor); });
  }

  COST_ROWS.forEach(r => {
    const n = r.n;
    const catSel = document.getElementById('cst_cat_' + n);
    const catVal = fields['cst_cat_' + n];
    if (catSel && catVal && [...catSel.options].some(o => o.value === catVal)) catSel.value = catVal;

    const cat = catSel?.value || r.defaultCategoria;
    const sel = document.getElementById('cst_code_' + n);
    const txt = document.getElementById('cst_code_txt_' + n);
    const useCatalog = !COST_FREE_TEXT_CATEGORIES.has(cat);

    if (cat === 'NO_APLICA') {
      sel.classList.add('hidden');
      txt.classList.add('hidden');
    } else if (useCatalog) {
      const parts = NFS_COSTEO_DB.getByCategory(cat);
      sel.innerHTML = '<option value="">Seleccione código...</option>' + parts
        .map(p => `<option value="${_escCost(p.codigo)}">${_escCost(p.codigo)} — ${_escCost(p.descripcion)}</option>`)
        .join('') + '<option value="__manual__">— Entrada manual —</option>';

      const codeVal = fields['cst_code_' + n];
      if (codeVal && [...sel.options].some(o => o.value === codeVal)) {
        sel.value = codeVal;
        sel.classList.remove('hidden');
        txt.classList.add('hidden');
      } else if (fields['cst_code_txt_' + n]) {
        sel.value = '__manual__';
        sel.classList.add('hidden');
        txt.classList.remove('hidden');
      } else {
        sel.classList.remove('hidden');
        txt.classList.add('hidden');
      }
    } else {
      sel.classList.add('hidden');
      txt.classList.remove('hidden');
    }

    setVal('cst_code_txt_' + n, fields['cst_code_txt_' + n] ?? '');
    setVal('cst_desc_' + n, fields['cst_desc_' + n] ?? '');
    setVal('cst_qty_' + n, fields['cst_qty_' + n] ?? '1');
    setVal('cst_unit_' + n, fields['cst_unit_' + n] ?? '0');
    setVal('cst_factor_' + n, fields['cst_factor_' + n] ?? String(r.factorDefault));
    _setStatus(n, 'ok', '—');
  });

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

  const activeProps = [1, 2, 3, 4].map(n => document.getElementById('tipo' + n)?.value || 'N.A.').filter(t => t !== 'N.A.').length;
  const q6 = document.getElementById('cst_qty_6');
  if (q6 && (!q6.value || Number(q6.value) <= 0)) q6.value = String(Math.max(activeProps, 1));

  calculateCosteo();
}

document.addEventListener('DOMContentLoaded', () => {
  buildCosteoRows();
  updateCostingFromSelection();
  calculateCosteo();
});

function _escCost(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
