/* =====================================================
   NFS – Selection Records Module
   • Saves selection history to localStorage
   • Exports to Excel 2003 XML (.xls) – no external lib
   • Imports from NFS-generated .xls files
   ===================================================== */

'use strict';

// =====================================================
// RECORDS STORAGE  (localStorage)
// =====================================================
const NFS_RECORDS = (function () {
  const KEY = 'nfs_selections_v1';
  let _list = [];

  function _persist() {
    try { localStorage.setItem(KEY, JSON.stringify(_list)); } catch (e) {}
  }

  function _load() {
    try {
      const raw = localStorage.getItem(KEY);
      _list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(_list)) _list = [];
    } catch (e) { _list = []; }
  }

  return {
    init()      { _load(); },
    getAll()    { return [..._list].reverse(); },   // newest first
    getById(id) { return _list.find(r => r.id === id); },
    count()     { return _list.length; },

    add(data) {
      const id = Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      _list.push({ id, fechaRegistro: new Date().toLocaleString('es-CO'), ...data });
      _persist();
      return id;
    },

    remove(id) {
      _list = _list.filter(r => r.id !== id);
      _persist();
    },
  };
})();

// =====================================================
// GATHER  – read every editable field + computed results
// =====================================================
function gatherSelectionData() {
  const v  = id => { const el = document.getElementById(id); return el ? el.value : ''; };
  const rb = name => { const el = document.querySelector(`input[name="${name}"]:checked`); return el ? el.value : ''; };
  const tx = id => { const el = document.getElementById(id); return el ? el.textContent.trim() : ''; };

  return {
    // Header
    fecha:      v('fecha'),
    cotizacion: v('cotizacion'),
    cliente:    v('cliente'),
    elaboro:    v('elaboro'),

    // Tank identifiers
    nombreTanque: v('nombreTanque'),
    tagTanque:    v('tagTanque'),
    tagAgitador:  v('tagAgitador'),

    // 1. Tank
    tipoTanque:       rb('tipoTanque'),
    diametro:         v('diametro'),
    ancho:            v('ancho'),
    longitud:         v('longitud'),
    alturaUtil:       v('alturaUtil'),
    alturaTotal:      v('alturaTotal'),
    bafles:           rb('bafles'),
    paramCirculacion: rb('paramCirculacion'),

    // 2. Fluid
    proceso:    v('proceso'),
    viscosidad: v('viscosidad'),
    densidad:   v('densidad'),

    // 3. Propellers
    rpm:      v('rpm'),
    pctFondo: v('pctFondo'),
    propelas: [1, 2, 3, 4].map(n => ({
      tipo:   v('tipo' + n),
      modelo: v('modelo' + n),
    })),

    // 4. Final fields
    agitadorSeleccionado:     v('agitadorSeleccionado'),
    motoreductorSeleccionado: v('motoreductorSeleccionado'),
    comentarios:              v('comentarios'),

    // Coding section
    cod_tipo1:     v('cod_tipo1'),
    cod_num1:      v('cod_num1'),
    cod_diam1:     v('cod_diam1'),
    cod_tipo2:     v('cod_tipo2'),
    cod_num2:      v('cod_num2'),
    cod_diam2:     v('cod_diam2'),
    cod_velocidad: v('cod_velocidad'),
    cod_motor:     v('cod_motor'),
    cod_linterna:  v('cod_linterna'),
    cod_sello:     v('cod_sello'),
    cod_material:  v('cod_material'),
    cod_adicional: v('cod_adicional'),
    codigoAgitador: tx('cod_resultado'),

    // Computed results (display-only in records; not re-applied on restore)
    resultados: {
      areaSuperficial:       v('areaSuperficial'),
      volumenUtil:           v('volumenUtil'),
      diametroEquiv:         v('diametroEquiv'),
      factorViscosidad:      v('factorViscosidad'),
      intensidadRecomendada: v('intensidadRecomendada'),
      numPropelas:           v('numPropelas'),
      rpmRef:                v('rpmRef'),
      rpmMax:                v('rpmMax'),
      caudal1:               v('caudal1'),
      caudal2:               v('caudal2'),
      caudal3:               v('caudal3'),
      caudal4:               v('caudal4'),
      vueltas:               v('vueltas'),
      potAgua1:              v('potAgua1'),
      potAgua2:              v('potAgua2'),
      potAgua3:              v('potAgua3'),
      potAgua4:              v('potAgua4'),
      potAguaTotal:          v('potAguaTotal'),
      longitudEje:           v('longitudEje'),
      nivelAgitacion:        v('nivelAgitacion'),
      estadoAgitacion:       v('estadoAgitacion'),
      potenciaRequerida:     v('potenciaRequerida'),
      motorCercano:          v('motorCercano'),
    },
  };
}

// =====================================================
// RESTORE  – populate every form field from a record
// =====================================================
function restoreSelectionData(rec) {
  if (!rec) return;

  const sv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
  const sr = (name, val) => {
    document.querySelectorAll(`input[name="${name}"]`).forEach(el => { if (el.value === val) el.checked = true; });
  };

  // Header
  sv('fecha',      rec.fecha);
  sv('cotizacion', rec.cotizacion);
  sv('cliente',    rec.cliente);
  sv('elaboro',    rec.elaboro);

  // Tank identifiers
  sv('nombreTanque', rec.nombreTanque);
  sv('tagTanque',    rec.tagTanque);
  sv('tagAgitador',  rec.tagAgitador);

  // 1. Tank
  sr('tipoTanque', rec.tipoTanque);
  const isRect = rec.tipoTanque === 'RECTANGULAR';
  const circ = document.getElementById('inputsCircular');
  const rect = document.getElementById('inputsRectangular');
  if (circ) circ.classList.toggle('hidden', isRect);
  if (rect) rect.classList.toggle('hidden', !isRect);
  sv('diametro',    rec.diametro);
  sv('ancho',       rec.ancho);
  sv('longitud',    rec.longitud);
  sv('alturaUtil',  rec.alturaUtil);
  sv('alturaTotal', rec.alturaTotal);
  sr('bafles',           rec.bafles);
  sr('paramCirculacion', rec.paramCirculacion);

  // 2. Fluid
  const procesoSel = document.getElementById('proceso');
  if (procesoSel) {
    [...procesoSel.options].forEach(o => { o.selected = (o.value === rec.proceso); });
  }
  sv('viscosidad', rec.viscosidad);
  sv('densidad',   rec.densidad);

  // 3. Propellers
  sv('rpm',      rec.rpm);
  sv('pctFondo', rec.pctFondo);
  if (rec.propelas && typeof populateModelDropdown === 'function') {
    rec.propelas.forEach((p, i) => {
      const n      = i + 1;
      const tipoEl = document.getElementById('tipo' + n);
      const modEl  = document.getElementById('modelo' + n);
      if (!tipoEl || !modEl) return;
      tipoEl.value = p.tipo;
      populateModelDropdown(modEl, p.tipo);
      modEl.value = p.modelo;
    });
  }

  // 4. Final fields
  sv('agitadorSeleccionado',     rec.agitadorSeleccionado);
  sv('motoreductorSeleccionado', rec.motoreductorSeleccionado);
  sv('comentarios',              rec.comentarios);

  // Coding
  sv('cod_tipo1',     rec.cod_tipo1);
  sv('cod_num1',      rec.cod_num1);
  sv('cod_diam1',     rec.cod_diam1);
  sv('cod_tipo2',     rec.cod_tipo2);
  sv('cod_num2',      rec.cod_num2);
  sv('cod_diam2',     rec.cod_diam2);
  sv('cod_velocidad', rec.cod_velocidad);
  sv('cod_motor',     rec.cod_motor);
  sv('cod_linterna',  rec.cod_linterna);
  sv('cod_sello',     rec.cod_sello);
  sv('cod_material',  rec.cod_material);
  sv('cod_adicional', rec.cod_adicional);

  // Trigger full recalculation
  if (typeof calculate        === 'function') calculate();
  if (typeof buildAgitatorCode === 'function') buildAgitatorCode();
}

// =====================================================
// EXPORT TO EXCEL  (Excel 2003 SpreadsheetML .xls)
// No external library required – works fully offline.
// A hidden sheet "NFS_DATA" stores the raw JSON so the
// file can be re-imported into the application later.
// =====================================================
function exportRecordToExcel(record) {
  const r   = record;
  const res = r.resultados || {};

  /* ── XML helpers ── */
  function xEsc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
  function cell(val, style) {
    const s = style ? ` ss:StyleID="${xEsc(style)}"` : '';
    return `<Cell${s}><Data ss:Type="String">${xEsc(String(val ?? ''))}</Data></Cell>`;
  }
  function row(...cells) { return `<Row>${cells.join('')}</Row>`; }
  function blankRow()    { return `<Row>${cell('')}</Row>`; }
  function section(t)    { return `<Row>${cell(t, 'sec')}</Row>`; }
  function lv(l, v, l2, v2) {
    let r = `<Row>${cell(l, 'lbl')}${cell(v)}`;
    if (l2 !== undefined) r += `${cell(l2, 'lbl')}${cell(v2)}`;
    return r + '</Row>';
  }

  const propRows = (r.propelas || []).map((p, i) =>
    row(cell(i + 1), cell(p.tipo), cell(p.modelo))
  ).join('\n');

  const mainSheet = [
    row(cell('SELECCIÓN DE AGITADOR – NFS', 'title')),
    row(cell(`Registro: ${r.fechaRegistro || ''}`)),
    blankRow(),

    section('INFORMACIÓN GENERAL'),
    lv('Fecha', r.fecha,         'Cotización / Pedido No.', r.cotizacion),
    lv('Cliente', r.cliente,     'Elaboró', r.elaboro),
    lv('Nombre del Tanque', r.nombreTanque, 'TAG Tanque', r.tagTanque),
    lv('TAG Agitador', r.tagAgitador),
    blankRow(),

    section('1. CARACTERÍSTICAS DEL TANQUE'),
    lv('Tipo de tanque', r.tipoTanque),
    r.tipoTanque === 'CIRCULAR'
      ? lv('Diámetro (m)', r.diametro)
      : lv('Ancho (m)', r.ancho, 'Longitud (m)', r.longitud),
    res.diametroEquiv ? lv('Diámetro equivalente (m)', res.diametroEquiv) : '',
    lv('Altura útil (m)', r.alturaUtil,      'Altura total (m)', r.alturaTotal),
    lv('¿Lleva bafles?',  r.bafles,          'Área superficial (m²)', res.areaSuperficial),
    lv('Volumen útil (m³)', res.volumenUtil),
    blankRow(),

    section('2. CARACTERÍSTICAS DEL FLUIDO'),
    lv('Proceso', r.proceso),
    lv('Intensidad recomendada', res.intensidadRecomendada),
    lv('Viscosidad (cps)', r.viscosidad,   'Factor por viscosidad', res.factorViscosidad),
    lv('Densidad (Ton/m³)', r.densidad),
    blankRow(),

    section('3. SELECCIÓN DE PROPELAS'),
    lv('Velocidad de rotación (rpm)', r.rpm, 'N° propelas requeridas (est.)', res.numPropelas),
    lv('RPM referencia', res.rpmRef,          'RPM máx. permitida (×1.1)',   res.rpmMax),
    row(cell('#', 'lbl'), cell('Tipo', 'lbl'), cell('Modelo', 'lbl')),
    propRows,
    blankRow(),

    section('Resultados de caudal'),
    lv('Caudal 1 propela (m³/h)',   res.caudal1, 'Caudal 2 propelas (m³/h)', res.caudal2),
    lv('Caudal 3 propelas (m³/h)',  res.caudal3, 'Caudal 4 propelas (m³/h)', res.caudal4),
    lv('Renovaciones / hora',       res.vueltas),
    blankRow(),

    section('Potencias absorbidas en agua'),
    lv('Potencia propela 1 (kW)', res.potAgua1, 'Potencia propela 2 (kW)', res.potAgua2),
    lv('Potencia propela 3 (kW)', res.potAgua3, 'Potencia propela 4 (kW)', res.potAgua4),
    lv('Potencia total en agua (kW)', res.potAguaTotal),
    blankRow(),

    section('4. RESULTADOS FINALES'),
    lv('Propela No.1 desde el fondo (%)', r.pctFondo,          'Longitud máxima del eje (m)',        res.longitudEje),
    lv('Nivel de agitación obtenido',     res.nivelAgitacion,  'Intensidad recomendada (rango)',      res.intensidadRecomendada),
    lv('Estado de agitación',             res.estadoAgitacion),
    lv('Potencia requerida (kW)',          res.potenciaRequerida, 'Motor estándar seleccionado (kW)', res.motorCercano),
    lv('Agitador seleccionado',           r.agitadorSeleccionado),
    lv('Motoreductor seleccionado',       r.motoreductorSeleccionado),
    blankRow(),

    section('CÓDIGO DEL AGITADOR'),
    row(cell(r.codigoAgitador || '–', 'code')),
    blankRow(),

    section('COMENTARIOS'),
    row(cell(r.comentarios || '')),
  ].filter(s => s !== '').join('\n');

  /* Hidden sheet with raw JSON for re-import */
  const jsonEsc = xEsc(JSON.stringify(record));
  const dataSheet = `
  <Worksheet ss:Name="NFS_DATA">
    <Table>
      <Row><Cell><Data ss:Type="String">NFS_SELECTION_DATA_v1</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">${jsonEsc}</Data></Cell></Row>
    </Table>
  </Worksheet>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="title">
      <Font ss:Bold="1" ss:Size="14" ss:Color="#0D2340"/>
    </Style>
    <Style ss:ID="sec">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#1A4880" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="lbl">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#DBE4FF" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="code">
      <Font ss:Bold="1" ss:Size="13" ss:Color="#0D2340" ss:Name="Consolas"/>
      <Interior ss:Color="#FFFBE6" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Selección Agitador">
    <Table ss:DefaultColumnWidth="60">
      <Column ss:Width="200"/>
      <Column ss:Width="200"/>
      <Column ss:Width="200"/>
      <Column ss:Width="200"/>
      ${mainSheet}
    </Table>
  </Worksheet>
  ${dataSheet}
</Workbook>`;

  const blob  = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url   = URL.createObjectURL(blob);
  const date  = (r.fecha || '').replace(/-/g, '') || new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const cli   = (r.cliente || 'NFS').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 30);
  const fname = `NFS_Agitador_${cli}_${date}.xls`;

  const a = Object.assign(document.createElement('a'), { href: url, download: fname });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// =====================================================
// IMPORT FROM EXCEL  (NFS-generated .xls files only)
// =====================================================
function importFromExcelFile(file, onSuccess) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const text   = e.target.result;
      const marker = 'NFS_SELECTION_DATA_v1';
      const mi     = text.indexOf(marker);
      if (mi === -1) {
        alert(
          'Este archivo no es una selección exportada desde NFS,\n' +
          'o no contiene la hoja de datos de importación.\n\n' +
          'Solo se pueden importar archivos generados por esta aplicación.'
        );
        return;
      }
      /* The JSON is in the <Data> element immediately after the marker row */
      const afterMarker = text.indexOf('</Data>', mi);
      const nextData    = text.indexOf('<Data', afterMarker);
      const dataStart   = text.indexOf('>', nextData) + 1;
      const dataEnd     = text.indexOf('</Data>', dataStart);
      if (dataStart <= 0 || dataEnd === -1) {
        alert('No se encontraron datos válidos en el archivo.');
        return;
      }
      const jsonStr = text.slice(dataStart, dataEnd)
        .replace(/&amp;/g,  '&')
        .replace(/&lt;/g,   '<')
        .replace(/&gt;/g,   '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");

      const record = JSON.parse(jsonStr);
      if (!confirm(
        '¿Cargar la selección desde el archivo Excel?\n\n' +
        `  Cliente:    ${record.cliente    || '(sin nombre)'}\n` +
        `  Fecha:      ${record.fecha      || '(sin fecha)'}\n` +
        `  Cotización: ${record.cotizacion || '(sin número)'}\n\n` +
        'Se reemplazarán todos los datos actuales.'
      )) return;

      restoreSelectionData(record);
      if (typeof onSuccess === 'function') onSuccess(record);
      _showToast('✔ Selección importada desde Excel correctamente.');
    } catch (err) {
      alert('Error al importar el archivo:\n' + err.message);
    }
  };
  reader.readAsText(file, 'UTF-8');
}

// =====================================================
// SAVE CURRENT SELECTION
// =====================================================
function saveCurrentSelection() {
  const data = gatherSelectionData();
  if (!data.cliente && !data.cotizacion && !data.nombreTanque) {
    if (!confirm('No se ha ingresado cliente, cotización ni nombre de tanque.\n¿Guardar de todas formas?')) return;
  }
  NFS_RECORDS.add(data);
  _showToast('✔ Selección guardada en el historial.');
  _recRenderBadge();
}

// =====================================================
// RECORDS MODAL  – UI
// =====================================================
function openRecordsModal() {
  _recRenderTable();
  document.getElementById('recModal').classList.remove('hidden');
}

function closeRecordsModal() {
  document.getElementById('recModal').classList.add('hidden');
}

function _recRenderTable() {
  const tbody = document.getElementById('recTableBody');
  tbody.innerHTML = '';
  const recs = NFS_RECORDS.getAll();
  if (!recs.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="rec-empty">No hay selecciones guardadas aún.</td></tr>';
    return;
  }
  recs.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      `<td class="rec-td-date">${_e(r.fechaRegistro || '')}</td>` +
      `<td>${_e(r.cliente || '–')}</td>` +
      `<td>${_e(r.cotizacion || '–')}</td>` +
      `<td>${_e(r.nombreTanque || '–')}</td>` +
      `<td class="rec-td-code">${_e(r.codigoAgitador || '–')}</td>` +
      `<td class="rec-td-actions">` +
        `<button class="btn-db btn-rec-load"  onclick="recLoad('${r.id}')">📂 Cargar</button>` +
        `<button class="btn-db btn-rec-excel" onclick="recExcel('${r.id}')">📊 Excel</button>` +
        `<button class="btn-db btn-db-del"    onclick="recDelete('${r.id}',this)">🗑</button>` +
      `</td>`;
    tbody.appendChild(tr);
  });
}

function recLoad(id) {
  const rec = NFS_RECORDS.getById(id);
  if (!rec) return;
  if (!confirm(
    '¿Cargar esta selección?\n\n' +
    `  Cliente: ${rec.cliente    || '(sin nombre)'}\n` +
    `  Fecha:   ${rec.fecha      || '(sin fecha)'}\n\n` +
    'Se reemplazarán todos los datos actuales.'
  )) return;
  closeRecordsModal();
  restoreSelectionData(rec);
  _showToast('✔ Selección cargada desde el historial.');
}

function recExcel(id) {
  const rec = NFS_RECORDS.getById(id);
  if (rec) exportRecordToExcel(rec);
}

function recDelete(id, btn) {
  if (!confirm('¿Eliminar esta selección del historial?')) return;
  NFS_RECORDS.remove(id);
  btn.closest('tr').remove();
  _recRenderBadge();
  if (!document.getElementById('recTableBody').children.length) _recRenderTable();
}

function recImportExcel() {
  const input = Object.assign(document.createElement('input'), {
    type:   'file',
    accept: '.xls,application/vnd.ms-excel,text/xml,application/xml',
  });
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    importFromExcelFile(file, savedRec => {
      /* Optionally also save the imported record to the local DB */
      if (confirm('¿Desea guardar esta selección importada en el historial local también?')) {
        NFS_RECORDS.add(savedRec);
        _recRenderBadge();
      }
    });
  };
  input.click();
}

/* Badge showing number of saved records */
function _recRenderBadge() {
  const badge = document.getElementById('recBadge');
  if (!badge) return;
  const n = NFS_RECORDS.count();
  badge.textContent  = n > 0 ? String(n) : '';
  badge.style.display = n > 0 ? 'inline-flex' : 'none';
}

// =====================================================
// TOAST NOTIFICATION
// =====================================================
function _showToast(msg) {
  let toast = document.getElementById('nfsToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id        = 'nfsToast';
    toast.className = 'nfs-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('visible'), 3500);
}

/* Minimal HTML-escape for inline strings */
function _e(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// =====================================================
// INIT
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  NFS_RECORDS.init();
  _recRenderBadge();
});
