'use strict';

const STANDARD_PRODUCT_FIELDS = [
  'motoreductorSeleccionado', 'cod_velocidad', 'cod_motor', 'cod_linterna',
  'cod_sello', 'cod_material', 'cod_adicional',
  'sh_material', 'sh_diam_in', 'sh_schedule', 'sh_FS', 'sh_SF', 'sh_Sb',
  'sh_coup_diam', 'sh_coup_L', 'sh_D64', 'sh_D65',
  'og_material', 'og_sigmaS', 'og_sigmaT', 'og_schedule',
  'og_fH1', 'og_fH2', 'og_fH3', 'og_fH4',
];
let appliedStandard = null;
let standardBudgetQuantity = 1;
let standardDraft = null;

const cloneStandardData = value => JSON.parse(JSON.stringify(value));
const standardValue = id => document.getElementById(id).value;

function validateStandard(row) {
  if (!row || typeof row.id !== 'string' || !row.id ||
      typeof row.model !== 'string' || !row.model.trim() ||
      typeof row.description !== 'string' || typeof row.active !== 'boolean') {
    throw new Error('Ficha de estándar inválida: id, modelo, descripción y estado son obligatorios.');
  }
  const positive = (value, label, zero = false) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || (zero ? value < 0 : value <= 0)) {
      throw new Error(row.model + ': revise ' + label + '.');
    }
  };
  positive(row.minLength, 'longitud mínima');
  positive(row.maxLength, 'longitud máxima');
  if (row.maxLength < row.minLength) throw new Error('La longitud máxima debe ser mayor o igual a la mínima.');
  positive(row.price, 'precio', true);
  if (!['COP', 'USD'].includes(row.currency)) throw new Error('Moneda no válida.');
  const p = row.product;
  if (!p || !Array.isArray(p.models) || p.models.length !== 4 ||
      p.models.some(model => typeof model !== 'string') ||
      p.models[0] === 'N.A.' || !p.models[0]) {
    throw new Error('El estándar debe tener propela 1 y cuatro posiciones de modelo (use N.A. donde no aplique).');
  }
  let gap = false;
  for (const model of p.models) {
    if (model === 'N.A.') gap = true;
    else if (gap) throw new Error('Las propelas deben ocupar posiciones consecutivas desde la propela 1.');
  }
  positive(p.power, 'potencia instalada');
  positive(p.rpm, 'RPM');
  if (p.mount !== 'VERTICAL') throw new Error('El selector actual admite estándares de montaje vertical.');
  if (!['TUBULAR', 'MACIZO'].includes(p.construction)) throw new Error('Construcción del eje no válida.');
  if (!Array.isArray(p.percentages) || p.percentages.length !== 4) throw new Error('Faltan separaciones de propelas.');
  p.percentages.forEach(value => positive(value, 'separación', true));
  if (!p.fields || STANDARD_PRODUCT_FIELDS.some(id => typeof p.fields[id] !== 'string')) {
    throw new Error('Faltan datos constructivos del agitador.');
  }
  if (!p.propellerData || typeof p.propellerData !== 'object') throw new Error('Falta referencia técnica de las propelas.');
  for (const model of p.models.filter(model => model !== 'N.A.')) {
    const data = Object.hasOwn(p.propellerData, model) ? p.propellerData[model] : null;
    if (!data || ['D', 'rpm', 'Kp', 'Nq', 'peso'].some(key =>
      typeof data[key] !== 'number' || !Number.isFinite(data[key]) || data[key] <= 0) ||
      typeof data.type !== 'string' || typeof data.codType !== 'string') {
      throw new Error('Referencia técnica incompleta para ' + model);
    }
  }
  if (typeof row.technical !== 'string' || typeof row.commercial !== 'string') {
    throw new Error('Consideraciones para el cliente inválidas.');
  }
  for (const key of ['materials', 'services']) {
    if (!Array.isArray(row[key])) throw new Error('Lista de presupuesto inválida.');
    for (const item of row[key]) {
      if (!item || typeof item.desc !== 'string') throw new Error('Descripción de presupuesto inválida.');
      positive(item.qty, 'cantidad de presupuesto', true);
      positive(item.unit, 'precio de presupuesto', true);
      if (key === 'materials' && ['categoria', 'codigo', 'codigoManual', 'comentarios']
        .some(field => typeof item[field] !== 'string')) throw new Error('Parte de presupuesto inválida.');
      if (key === 'materials' && !NFS_COST_CATEGORIES.some(category => category.code === item.categoria)) {
        throw new Error('Categoría de parte no admitida: ' + item.categoria);
      }
    }
  }
  for (const [id, value] of Object.entries(p.fields)) {
    const control = document.getElementById(id);
    if (STANDARD_PRODUCT_FIELDS.includes(id) && control?.tagName === 'SELECT' &&
        ![...control.options].some(option => option.value === value)) {
      throw new Error('Valor no admitido para ' + id + ': ' + value);
    }
    if (STANDARD_PRODUCT_FIELDS.includes(id) && control?.type === 'number' &&
        (value === '' || !Number.isFinite(Number(value)) ||
         (control.min !== '' && Number(value) < Number(control.min)) ||
         (control.max !== '' && Number(value) > Number(control.max)))) {
      throw new Error('Valor numérico no válido para ' + id);
    }
  }
  return cloneStandardData(row);
}

const NFS_STANDARDS = (() => {
  const KEY = 'nfs_standard_agitators_v1';
  let items = [];
  let handle = null;
  let baseline = null;
  let error = '';
  let loadError = false;
  let queue = Promise.resolve();
  function validate(obj) {
    if (!obj || obj.version !== 1 || !Array.isArray(obj.agitadores)) {
      throw new Error('Se requiere version: 1 y lista "agitadores".');
    }
    const ids = new Set();
    const models = new Set();
    return obj.agitadores.map(item => {
      const row = validateStandard(item);
      const model = row.model.trim().toUpperCase();
      if (ids.has(row.id) || models.has(model)) throw new Error('Modelo o identificador duplicado: ' + row.model);
      ids.add(row.id);
      models.add(model);
      row.model = row.model.trim();
      return row;
    });
  }
  const serialize = (list = items) => JSON.stringify({ version: 1, agitadores: list }, null, 2);
  function adopt(list) {
    localStorage.setItem(KEY, serialize(list));
    items = list;
    error = '';
    loadError = false;
    renderStandards();
    updateStandardsFileStatus();
  }
  function enqueue(action) {
    queue = queue.then(action, action);
    return queue;
  }
  async function commit(list) {
    adopt(list);
    if (!handle) return;
    try {
      if (!await NFS_HANDLES.ensurePermission(handle)) throw new Error('Permiso de escritura denegado.');
      const check = await NFS_HANDLES.checkConflict(handle, baseline, true);
      if (!check.proceed) {
        adopt(validate(JSON.parse(check.externalText)));
        baseline = check.externalText;
        return;
      }
      const text = serialize();
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      baseline = text;
    } catch (e) {
      error = 'No se pudo guardar el archivo; cambios conservados en el navegador.';
      updateStandardsFileStatus();
      throw new Error(error + '\n' + e.message);
    }
  }
  return {
    validate,
    getItems: () => cloneStandardData(items),
    exportJSON: () => serialize(),
    load() {
      const text = localStorage.getItem(KEY);
      try {
        if (text !== null) items = validate(JSON.parse(text));
      } catch (e) {
        loadError = true;
        error = 'Base local inválida. Importe o vincule una base válida antes de editar.';
        updateStandardsFileStatus();
        throw e;
      }
      renderStandards();
      updateStandardsFileStatus();
    },
    save(row) {
      return enqueue(async () => {
        if (loadError) throw new Error(error);
        const existing = items.find(item => item.id === row.id);
        if (existing && existing.model !== row.model) throw new Error('El modelo comercial no se puede renombrar; duplique la ficha.');
        const next = items.filter(item => item.id !== row.id).concat([validateStandard(row)]);
        await commit(validate({ version: 1, agitadores: next }));
      });
    },
    replace(obj) { return enqueue(() => commit(validate(obj))); },
    getFileHandle: () => handle,
    getError: () => error,
    setFileHandle(value) { handle = value; },
    markSynced(value) { baseline = value; },
    connect(fileHandle) {
      return enqueue(async () => {
        if (!await NFS_HANDLES.ensurePermission(fileHandle)) throw new Error('Permiso de escritura denegado.');
        const text = await (await fileHandle.getFile()).text();
        const list = validate(JSON.parse(text));
        if (items.length && serialize(list) !== serialize() &&
            !confirm('Vincular cargará el catálogo del archivo y reemplazará la base local de estándares. ' +
              'Las cotizaciones conservan su versión aplicada. Exporte primero si necesita conservar la base local. ' +
              '¿Continuar? Cancelar conserva los datos actuales sin vincular.')) {
          throw new DOMException('Vinculación cancelada; se conserva la base local.', 'AbortError');
        }
        adopt(list);
        handle = fileHandle;
        baseline = text;
        await NFS_HANDLES.save('standards', fileHandle);
        updateStandardsFileStatus();
      });
    },
  };
})();

function getAppliedStandard() { return appliedStandard; }
function captureStandardApplication() {
  return appliedStandard ? { standard: cloneStandardData(appliedStandard), budgetQuantity: standardBudgetQuantity } : null;
}

function standardLockedControls() {
  return [...STANDARD_PRODUCT_FIELDS,
    ...[1, 2, 3, 4].flatMap(n => ['tipo' + n, 'modelo' + n]),
    'rpm', 'pctFondo', 'pctSeparacion2', 'pctSeparacion3', 'pctSeparacion4',
    'cod_tipo1', 'cod_num1', 'cod_diam1', 'cod_tipo2', 'cod_num2', 'cod_diam2',
    'cod_eje', 'cod_potencia', 'cod_rpm',
  ];
}

function lockStandardControls() {
  for (const id of standardLockedControls()) document.getElementById(id).disabled = Boolean(appliedStandard);
  document.getElementById('detachStandardButton').classList.toggle('hidden', !appliedStandard);
}

function restoreStandardApplication(state) {
  const standard = state ? validateStandard(state.standard) : null;
  const quantity = state ? Number(state.budgetQuantity) : 1;
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('Cantidad de referencia del estándar inválida en el registro.');
  }
  appliedStandard = standard;
  standardBudgetQuantity = quantity;
  if (appliedStandard) {
    for (const id of STANDARD_PRODUCT_FIELDS) document.getElementById(id).value = appliedStandard.product.fields[id];
  }
  lockStandardControls();
}

function detachStandard() {
  if (!appliedStandard) return;
  if (!confirm('¿Desvincular el estándar? Se conservarán las propelas, datos constructivos, presupuesto y precio actuales. La potencia volverá a ser la recomendada por el selector y podrá modificar el diseño.')) return;
  appliedStandard = null;
  lockStandardControls();
  calculate();
}

function updateStandardOfferNote() {
  const el = document.getElementById('standardOfferNote');
  el.classList.toggle('hidden', !appliedStandard);
  el.textContent = appliedStandard
    ? 'Agitador Estándar: ' + appliedStandard.model + '. Precio de venta recomendado: ' +
      appliedStandard.price.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
      ' ' + appliedStandard.currency + ' por equipo. El precio unitario final es editable.'
    : '';
  const quantity = Number(standardValue('cst_cantidad'));
  if (appliedStandard && (!Number.isFinite(quantity) || quantity <= 0)) {
    el.textContent += ' Cantidad cotizada no válida: ingrese un valor mayor que cero; el presupuesto no se ha reescalado.';
  }
}

function standardCatalogWarnings(standard) {
  const warnings = [];
  for (const model of standard.product.models) {
    if (model === 'N.A.') continue;
    if (!Object.hasOwn(PROPELLERS, model)) warnings.push('Propela no disponible: ' + model);
    else if (JSON.stringify(PROPELLERS[model]) !== JSON.stringify(standard.product.propellerData[model])) {
      // Compare values, not JSON property order.
      const expected = standard.product.propellerData[model];
      if (!expected || ['D', 'rpm', 'Kp', 'Nq', 'peso', 'type', 'codType']
        .some(key => PROPELLERS[model][key] !== expected[key])) {
        warnings.push('Datos técnicos de ' + model + ' cambiaron: verificar diseño');
      }
    }
  }
  for (const item of _cstState.materiales) {
    if (!COST_FREE_TEXT_CATEGORIES.has(item.categoria) && item.codigo &&
        item.codigo !== '__manual__' && !NFS_COSTEO_DB.findInCategory(item.categoria, item.codigo)) {
      warnings.push('Parte no encontrada: ' + item.codigo + ' (se conserva su precio guardado)');
    }
  }
  return [...new Set(warnings)];
}

function refreshStandardApplication(requiredPower) {
  const note = document.getElementById('standardSelectionNote');
  document.getElementById('motorPowerLabel').textContent = appliedStandard
    ? 'Potencia instalada del estándar:' : 'Motor más cercano (tamaño comercial):';
  note.classList.toggle('hidden', !appliedStandard);
  if (!appliedStandard) { note.textContent = ''; return; }
  const length = getAgitatorGeometry().length;
  const warnings = standardCatalogWarnings(appliedStandard);
  if (!Number.isFinite(length) || length < appliedStandard.minLength || length > appliedStandard.maxLength) {
    warnings.push('Longitud fuera del rango recomendado: revisar diseño y precio');
  }
  if (requiredPower > appliedStandard.product.power) warnings.push('Potencia requerida superior a la instalada: revisar la aplicación');
  note.textContent = 'Agitador Estándar: ' + appliedStandard.model +
    '. Eje ' + appliedStandard.product.construction.toLowerCase() +
    ', diámetro nominal ' + appliedStandard.product.fields.sh_diam_in + '", ' +
    appliedStandard.product.fields.sh_material + '. Rango recomendado: ' +
    appliedStandard.minLength + '–' + appliedStandard.maxLength +
    ' m. Modelo y presupuesto corresponden a longitud máxima. ' +
    warnings.join('. ');
  lockStandardControls();
  const current = NFS_STANDARDS.getItems().find(item => item.id === appliedStandard.id);
  if (current && !current.active) note.textContent += '. Este modelo fue desactivado; la cotización conserva su versión aplicada.';
}

function scaleStandardBudget() {
  if (!appliedStandard) return;
  const qty = Number(standardValue('cst_cantidad'));
  if (!Number.isFinite(qty) || qty <= 0) {
    updateStandardOfferNote();
    return;
  }
  if (qty === standardBudgetQuantity) return;
  const ratio = qty / standardBudgetQuantity;
  for (const rows of [_cstState.materiales, _cstState.servicios]) {
    rows.forEach(row => { row.qty *= ratio; });
  }
  standardBudgetQuantity = qty;
  renderMatRows();
  renderSrvRows();
}

function captureStandardConfiguration() {
  const qty = Number(standardValue('cst_cantidad'));
  if (!Number.isFinite(qty) || qty <= 0) throw new Error('La cantidad cotizada debe ser mayor que cero.');
  const models = [1, 2, 3, 4].map(n => standardValue('modelo' + n));
  if (models.some(model => !Object.hasOwn(PROPELLERS, model))) throw new Error('Seleccione modelos de propela válidos.');
  if (['pctFondo', 'pctSeparacion2', 'pctSeparacion3', 'pctSeparacion4'].some(id =>
    standardValue(id) === '' || !document.getElementById(id).checkValidity())) {
    throw new Error('Revise los porcentajes de posición de las propelas.');
  }
  const percentages = captureAgitatorPositions().percentages;
  const fields = Object.fromEntries(STANDARD_PRODUCT_FIELDS.map(id => [id, standardValue(id)]));
  const normalize = rows => rows.map(row => ({ ...cloneStandardData(row), qty: row.qty / qty }));
  return {
    product: {
      models, percentages, fields,
      mount: 'VERTICAL',
      rpm: Number(standardValue('rpm')),
      power: ogReadNum('motorCercano'),
      construction: appliedStandard?.product.construction || 'TUBULAR',
      propellerData: Object.fromEntries(models.filter(model => model !== 'N.A.')
        .map(model => [model, cloneStandardData(PROPELLERS[model])])),
    },
    materials: normalize(_cstState.materiales),
    services: normalize(_cstState.servicios),
    technical: standardValue('comentarios'),
    commercial: standardValue('cst_comerciales'),
  };
}

function applyStandard(id) {
  const standard = NFS_STANDARDS.getItems().find(item => item.id === id);
  if (!standard || !standard.active) { alert('El estándar no está disponible o está inactivo.'); return; }
  const missing = standard.product.models.filter(model => !Object.hasOwn(PROPELLERS, model));
  if (missing.length) { alert('No se puede aplicar: faltan propelas en la base técnica: ' + missing.join(', ')); return; }
  const qty = Number(standardValue('cst_cantidad'));
  if (!Number.isFinite(qty) || qty <= 0) { alert('Defina una cantidad cotizada mayor que cero antes de aplicar.'); return; }
  const materials = standard.materials.map(row => {
    const item = { ...cloneStandardData(row), id: _cstNextId('m'), qty: row.qty * qty };
    const part = !COST_FREE_TEXT_CATEGORIES.has(item.categoria) && item.codigo !== '__manual__'
      ? NFS_COSTEO_DB.findInCategory(item.categoria, item.codigo) : null;
    if (part) {
      item.desc = part.descripcion;
      item.unit = Number(part.precio);
    } else if (item.categoria === 'NO_APLICA') {
      item.desc = 'No aplica';
      item.unit = 0;
    }
    return item;
  });
  if (materials.some(row => !Number.isFinite(row.unit) || row.unit < 0)) {
    alert('No se puede aplicar el estándar: revise los precios de sus partes en el catálogo.');
    return;
  }
  if (!confirm('¿Aplicar ' + standard.model + '? Se reemplazarán diseño, filas de presupuesto y consideraciones para el cliente. Se conservan tanque, fluido, datos de cotización, cantidad, factores, condiciones e información interna.')) return;
  appliedStandard = cloneStandardData(standard);
  standardBudgetQuantity = qty;
  for (const id of STANDARD_PRODUCT_FIELDS) document.getElementById(id).value = standard.product.fields[id];
  for (let n = 1; n <= 4; n++) {
    const model = standard.product.models[n - 1];
    document.getElementById('tipo' + n).value = PROPELLERS[model].type;
    populateModelDropdown(document.getElementById('modelo' + n), PROPELLERS[model].type);
    document.getElementById('modelo' + n).value = model;
  }
  document.getElementById('rpm').value = String(standard.product.rpm);
  restoreAgitatorPositions({ percentages: standard.product.percentages, mode: 'auto', manual: '' });
  renderComentariosFromString(standard.technical);
  renderComentariosFromString(standard.commercial, 'cstComercialesList', 'input-cst-comercial-line', 'cst_comerciales');
  _cstState.materiales = materials;
  _cstState.servicios = standard.services.map(row =>
    ({ ...cloneStandardData(row), id: _cstNextId('s'), qty: row.qty * qty }));
  renderMatRows();
  renderSrvRows();
  document.getElementById('cst_moneda_oferta').value = standard.currency;
  document.getElementById('cst_precio_unitario_oferta').value = standard.price.toFixed(2);
  document.getElementById('cst_precio_oferta_manual').value = 'true';
  document.getElementById('cst_codigo_equipo').value = standard.model;
  calculate();
  switchTab(1);
}

function renderStandards() {
  const tbody = document.getElementById('standardsTableBody');
  if (!tbody) return;
  const filter = standardValue('standardsFilter').trim().toLowerCase();
  const inactive = document.getElementById('standardsShowInactive').checked;
  const items = NFS_STANDARDS.getItems().filter(row =>
    (inactive || row.active) && (row.model + ' ' + row.description).toLowerCase().includes(filter));
  tbody.replaceChildren();
  document.getElementById('standardsEmpty').classList.toggle('hidden', items.length > 0);
  for (const row of items) {
    const tr = tbody.insertRow();
    for (const text of [
      row.model, row.description, row.product.models.filter(model => model !== 'N.A.').join(', '),
      row.product.power + ' kW / ' + row.product.rpm + ' rpm',
      row.minLength + '–' + row.maxLength,
      row.price.toLocaleString('es-CO', { minimumFractionDigits: 2 }) + ' ' + row.currency,
      row.active ? 'Activo' : 'Inactivo',
    ]) tr.insertCell().textContent = text;
    const cell = tr.insertCell();
    for (const [label, action, disabled] of [
      ['Aplicar', () => applyStandard(row.id), !row.active],
      ['Editar ficha', () => editStandard(row.id), false],
      ['Actualizar configuración', () => updateStandardFromCurrent(row.id), false],
      ['Duplicar', () => editStandard(row.id, true), false],
      [row.active ? 'Desactivar' : 'Activar', () => toggleStandard(row.id), false],
    ]) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'btn-db btn-db-edit';
      button.textContent = label; button.disabled = disabled; button.onclick = action;
      cell.appendChild(button);
    }
  }
}

function editStandard(id = null, duplicate = false) {
  try {
    const old = id ? NFS_STANDARDS.getItems().find(row => row.id === id) : null;
    if (id && !old) throw new Error('El estándar ya no está disponible.');
    standardDraft = old ? cloneStandardData(old) : {
      id: crypto.randomUUID(), model: '', description: '', active: true,
      minLength: 0, maxLength: 0, price: 0, currency: standardValue('cst_moneda_oferta'),
      ...captureStandardConfiguration(),
    };
    if (duplicate) { standardDraft.id = crypto.randomUUID(); standardDraft.model = ''; standardDraft.active = true; }
    const form = document.getElementById('standardForm');
    form.reset();
    const values = {
      model: standardDraft.model, description: standardDraft.description,
      minLength: old ? standardDraft.minLength : '',
      maxLength: old ? standardDraft.maxLength : '',
      price: old ? standardDraft.price : '', currency: standardDraft.currency,
      power: standardDraft.product.power, construction: standardDraft.product.construction,
      material: standardDraft.product.fields.sh_material,
      diameter: standardDraft.product.fields.sh_diam_in, schedule: standardDraft.product.fields.sh_schedule,
    };
    for (const [key, value] of Object.entries(values)) form.elements.namedItem(key).value = String(value);
    form.elements.namedItem('model').readOnly = Boolean(old && !duplicate);
    document.getElementById('standardEditorTitle').textContent = old && !duplicate ? 'Editar ficha del estándar' : 'Nuevo agitador estándar';
    document.getElementById('standardEditorHelp').textContent = old
      ? 'Esta ficha conserva la configuración y presupuesto guardados. Para cambiarlos, aplique el modelo, desvincúlelo, ajuste selección/costeo y pulse Actualizar configuración.'
      : 'Se capturaron propelas, RPM, posiciones, datos constructivos, consideraciones para el cliente y presupuesto actual, normalizado por equipo. Complete los datos del producto.';
    document.getElementById('standardEditor').showModal();
  } catch (e) { alert('No se pudo preparar la ficha:\n' + e.message); }
}

async function saveStandardForm(event) {
  event.preventDefault();
  const button = document.getElementById('standardSaveButton');
  button.disabled = true;
  try {
    const form = event.target;
    const value = key => form.elements.namedItem(key).value;
    const row = cloneStandardData(standardDraft);
    Object.assign(row, {
      model: value('model').trim(), description: value('description').trim(),
      minLength: Number(value('minLength')), maxLength: Number(value('maxLength')),
      price: Number(value('price')), currency: value('currency'),
    });
    row.product.power = Number(value('power'));
    row.product.construction = value('construction');
    Object.assign(row.product.fields, {
      sh_material: value('material'), sh_diam_in: value('diameter'), sh_schedule: value('schedule'),
      og_material: value('material'), og_schedule: value('schedule'),
    });
    const limits = ogMaterialLimits(value('material'));
    row.product.fields.og_sigmaS = String(limits.sigmaS);
    row.product.fields.og_sigmaT = String(limits.sigmaT);
    await NFS_STANDARDS.save(row);
    document.getElementById('standardEditor').close();
    if (appliedStandard?.id === row.id) alert('Ficha actualizada. La cotización conserva su versión; vuelva a aplicar el estándar para usar los cambios.');
  } catch (e) { alert('No se completó el guardado del estándar:\n' + e.message); }
  finally { button.disabled = false; }
}

async function updateStandardFromCurrent(id) {
  try {
    const row = NFS_STANDARDS.getItems().find(item => item.id === id);
    if (!row) throw new Error('Estándar no disponible.');
    if (appliedStandard) throw new Error('Desvincule el estándar antes de editar el diseño y capturar la nueva configuración.');
    if (!confirm('¿Reemplazar la configuración y presupuesto por equipo de ' + row.model +
      ' con los datos actuales? Se conserva su ficha, rango, potencia instalada y precio recomendado.')) return;
    const config = captureStandardConfiguration();
    config.product.power = row.product.power;
    config.product.construction = row.product.construction;
    // Product dimensions belong to the fixed model, not to the current tank.
    for (const key of ['sh_diam_in', 'sh_material', 'sh_schedule', 'og_material', 'og_schedule', 'og_sigmaS', 'og_sigmaT']) {
      config.product.fields[key] = row.product.fields[key];
    }
    await NFS_STANDARDS.save({ ...row, ...config });
  } catch (e) { alert('No se pudo actualizar la configuración:\n' + e.message); }
}

async function toggleStandard(id) {
  try {
    const row = NFS_STANDARDS.getItems().find(item => item.id === id);
    if (!row) throw new Error('Estándar no disponible.');
    if (!confirm('¿' + (row.active ? 'Desactivar' : 'Activar') + ' ' + row.model + '? Las cotizaciones guardadas no se modificarán.')) return;
    await NFS_STANDARDS.save({ ...row, active: !row.active });
  } catch (e) { alert('No se pudo cambiar el estado:\n' + e.message); }
}

function updateStandardsFileStatus() {
  const handle = NFS_STANDARDS.getFileHandle();
  const error = NFS_STANDARDS.getError();
  const el = document.getElementById('standardsFileStatus');
  el.className = 'db-file-status ' + (handle && !error ? 'db-file-connected' : 'db-file-disconnected');
  el.textContent = error || (handle ? 'Vinculado a ' + handle.name + ' — guardado automático.'
    : 'Base local en este navegador. Exporte agitadores_estandar.json o vincule su archivo para compartirla.');
  if (typeof _dbLinkRefreshGlobalBadge === 'function') _dbLinkRefreshGlobalBadge();
}

async function standardsConnectFile() {
  if (!window.showOpenFilePicker) { alert('Use Chrome/Edge para vincular, o las opciones Importar/Exportar.'); return; }
  try {
    const [handle] = await window.showOpenFilePicker({
      id: 'nfs-standard-agitators', multiple: false,
      types: [{ description: 'Agitadores estándar', accept: { 'application/json': ['.json'] } }],
    });
    await NFS_STANDARDS.connect(handle);
  } catch (e) { if (e.name !== 'AbortError') alert('Error al vincular estándares:\n' + e.message); }
}

function standardsExportJSON() {
  const url = URL.createObjectURL(new Blob([NFS_STANDARDS.exportJSON()], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = 'agitadores_estandar.json';
  a.click(); URL.revokeObjectURL(url);
}

function standardsImportJSON() {
  const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,application/json';
  input.onchange = async () => {
    const file = input.files[0]; if (!file) return;
    try {
      const obj = JSON.parse(await file.text());
      const list = NFS_STANDARDS.validate(obj);
      if (!confirm('¿Reemplazar la base por ' + list.length + ' estándares? Las cotizaciones conservan su versión aplicada.')) return;
      await NFS_STANDARDS.replace(obj);
    } catch (e) { alert('No se pudo importar la base:\n' + e.message); }
  };
  input.click();
}

document.addEventListener('DOMContentLoaded', async () => {
  for (const [target, source] of [
    ['standardShaftDiameter', 'sh_diam_in'], ['standardShaftMaterial', 'sh_material'],
  ]) document.getElementById(target).replaceChildren(...[...document.getElementById(source).options].map(option => option.cloneNode(true)));
  document.getElementById('standardForm').addEventListener('submit', saveStandardForm);
  document.getElementById('standardsFilter').addEventListener('input', renderStandards);
  document.getElementById('standardsShowInactive').addEventListener('change', renderStandards);
  try { NFS_STANDARDS.load(); }
  catch (e) {
    alert('No se pudo cargar la base local de estándares. Importe una base válida antes de guardarla:\n' + e.message);
  }
  const handle = await NFS_HANDLES.load('standards');
  if (handle) {
    try {
      if (await NFS_HANDLES.ensurePermission(handle)) await NFS_STANDARDS.connect(handle);
    } catch (e) { alert('No se pudo reconectar estándares:\n' + e.message); }
  }
});
