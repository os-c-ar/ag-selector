/* =====================================================
   NFS – Agitator Code Generator
   Based on: CODIGO AGITADOR 2.xlsx (HERR CODS sheet)

   Formula (cell A1 of CODIFICADOR sheet):
   CONCATENATE(
     LOOKUP(montaje),           →  V | H
     LOOKUP(tipo1),             →  digit 1–9 | 0
     LOOKUP(nProp1),            →  A–D
     LOOKUP(diam1),             →  letter
     LOOKUP(tipo2),             →  digit | ""
     IF(tipo2≠NA, LOOKUP(n2)), →  letter | ""
     IF(tipo2≠NA, LOOKUP(d2), "-"),
     shaftDm padded 2,
     LOOKUP(potencia),          →  letter
     rpm padded,
     LOOKUP(velControl),        →  D | R
     LOOKUP(motorType),         →  letter
     LOOKUP(linterna),          →  L | ""
     LOOKUP(sello),             →  W | ""
     LOOKUP(material),          →  letter
     LOOKUP(adicional)          →  letter | ""
   )
   ===================================================== */

'use strict';

/* ── Lookup tables ──────────────────────────────────── */
const COD = {

  // A83:B84
  montaje: { 'VERTICAL': 'V', 'HORIZONTAL': 'H' },

  // C91:D101  – propeller type → single digit
  tipoPropela: {
    'HIPERBOLICA':                     '1',
    'TURBINA':                         '2',
    'CURVA TRIPALA - CT':              '3',
    'GRAN CAUDAL - GC':                '4',
    'BIPALA - CB':                     '5',
    'CURVA TRIPALA ESQUALIZABLE - CE': '6',
    'TURBINA TRIPALA - TT':            '7',
    'CURVA TRIPALA COMBINADA - CTT':   '8',
    'COWLES - CW':                     '9',
    'ITC POLIPROPILENO':               '0',
    'NO APLICA':                       '',
  },

  // E92:F96  – count → letter
  nPropelas: { 1: 'A', 2: 'B', 3: 'C', 4: 'D' },

  // G102:H128  – diameter mm → letter
  diametro: {
    160: 'A', 200: 'B', 300: 'C', 350: 'D',
    400: 'E', 500: 'F', 550: 'G', 600: 'H',
    700: 'I', 750: 'W', 800: 'J', 900: 'X',
    1000: 'K', 1200: 'L', 1400: 'R', 1500: 'M',
    1600: 'N', 1800: 'O', 2000: 'P', 2200: 'Z',
    2500: 'Q', 3000: 'V', 3600: 'T',
  },

  // Q103:R124  – motor power kW → letter
  potencia: {
    0.08: 'T', 0.18: 'V', 0.185: 'U',
    0.25: 'A', 0.37: 'B', 0.55: 'C', 0.75: 'D',
    1.1:  'E', 1.5:  'F', 2.2:  'G', 3:    'H',
    4:    'I', 5.5:  'J', 7.5:  'K', 9.2:  'M',
    11:   'N', 15:   'O', 18.5: 'P', 22:   'Q',
    30:   'R', 37:   'S',
  },

  // U90:V91  – REDUCIDA = default (sin letra); DIRECTA = especial
  velocidad: { 'VELOCIDAD REDUCIDA': '', 'VELOCIDAD DIRECTA': 'D' },

  // W90:X95  – TRIFASICO = default (sin letra); otros = especiales
  motor: {
    'TRIFASICO':                             '',
    'MOTOR ELECTRICO A PRUEBA DE EXPLOSIÓN': 'X',
    'MOTOR NEUMATICO':                       'N',
    'INVERT DUTY':                           'I',
    '110V (REVISAR)':                        'V',
    'WASH DOWN':                             'Z',
  },

  // Y90:Z91
  linterna: { 'Con linterna': 'L', 'Sin linterna': '' },

  // AA90:AB91
  sello: { 'Con sello': 'W', 'Sin sello': '' },

  // AC90:AD93  – 304SS = default (sin letra); otros = especiales
  material: {
    '304SS':           '',
    '316SS':           'S',
    'ACERO AL CARBON': 'R',
    '904L':            'T',
  },

  // AE89:AF95
  adicional: {
    'NINGUNO':          '',
    'ACERO 316L SCH10': 'U',
    'PINTURA EPOXICA':  'E',
    'FIBRA DE VIDRIO':  'Q',
    'POLIPROPILENO':    'Y',
    'POLIETILENO':      'P',
    'EJE':              'M',
  },
};

/* Mapping: calculator propeller types → coding propeller types */
const APP_TO_COD = {
  'TRIPALA':      'CURVA TRIPALA - CT',
  'TURBINA':      'TURBINA',
  'GRAN CAUDAL':  'GRAN CAUDAL - GC',
  'FLOC. BIPALA': 'BIPALA - CB',
  'FLOC. TRIPALA':'TURBINA TRIPALA - TT',
  'N.A.':         'NO APLICA',
};

/* ── Code generation ──────────────────────────────────── */

function buildAgitatorCode() {
  const g = id => document.getElementById(id);
  const C = COD;

  /* Read form values */
  const tipo1  = g('cod_tipo1')?.value     || 'TURBINA';
  const num1   = parseInt(g('cod_num1')?.value)    || 1;
  const diam1  = parseInt(g('cod_diam1')?.value)   || 0;
  const tipo2  = g('cod_tipo2')?.value     || 'NO APLICA';
  const num2   = parseInt(g('cod_num2')?.value)    || 1;
  const diam2  = parseInt(g('cod_diam2')?.value)   || 0;
  const ejeM   = parseFloat(g('cod_eje')?.value)   || 0;
  const pot    = parseFloat(g('cod_potencia')?.value) || 0;
  const rpm    = parseInt(g('cod_rpm')?.value)     || 0;
  const vel    = g('cod_velocidad')?.value || 'VELOCIDAD DIRECTA';
  const mot    = g('cod_motor')?.value     || 'TRIFASICO';
  const lint   = g('cod_linterna')?.value  || 'Sin linterna';
  const sello  = g('cod_sello')?.value     || 'Sin sello';
  const mat    = g('cod_material')?.value  || '316SS';
  const adic   = g('cod_adicional')?.value || 'NINGUNO';

  /* ── Build parts ── */
  const p_mont  = 'V';                               // always top-entry
  const p_t1    = C.tipoPropela[tipo1]  ?? '?';
  const p_n1    = C.nPropelas[num1]     ?? 'A';
  const p_d1    = C.diametro[diam1]     ?? '?';

  const noP2    = (tipo2 === 'NO APLICA');
  const p_t2    = noP2 ? ''  : (C.tipoPropela[tipo2] ?? '?');
  const p_n2    = noP2 ? ''  : (C.nPropelas[num2]    ?? 'A');
  const p_d2    = noP2 ? '-' : (C.diametro[diam2]    ?? '?');

  /* Shaft: metres → decimetres, padded to 2 chars */
  const shaftDm = Math.round(ejeM * 10);
  const p_eje   = ejeM > 0 ? String(shaftDm).padStart(2, '0') : '??';

  /* Power: exact lookup */
  const p_pot   = C.potencia[pot] ?? (pot > 37 ? '!!' : '?');

  /* RPM: pad to minimum 3 chars */
  const p_rpm   = rpm > 0 ? (rpm < 100 ? '0' + rpm : String(rpm)) : '???';

  const p_vel   = C.velocidad[vel]  ?? 'D';
  const p_mot   = C.motor[mot]      ?? '';
  const p_lint  = C.linterna[lint]  ?? '';
  const p_sel   = C.sello[sello]    ?? '';
  const p_mat   = C.material[mat]   ?? 'S';
  const p_adic  = C.adicional[adic] ?? '';

  const code = [
    p_mont,
    p_t1, p_n1, p_d1,
    p_t2, p_n2, p_d2,
    p_eje,
    p_pot,
    p_rpm,
    p_vel, p_mot, p_lint, p_sel, p_mat, p_adic,
  ].join('');

  /* Update display */
  const display = g('cod_resultado');
  if (display) display.textContent = code || '–';

  /* Sync "Agitador seleccionado" in section 4 with the generated code */
  const agSel = g('agitadorSeleccionado');
  if (agSel) agSel.value = code;

  /* Breakdown */
  _renderBreakdown({
    parts: [
      { code: p_mont, label: 'Montaje',      desc: 'VERTICAL' },
      { code: p_t1,   label: 'Tipo P1',      desc: tipo1 },
      { code: p_n1,   label: 'N° P1',        desc: num1 + ' propela' + (num1 > 1 ? 's' : '') },
      { code: p_d1,   label: 'Ø P1',         desc: diam1 ? diam1 + ' mm' : '–' },
      { code: p_t2,   label: 'Tipo P2',      desc: noP2 ? 'N/A' : tipo2 },
      { code: p_n2 || '–', label: 'N° P2',   desc: noP2 ? 'N/A' : num2 + ' prop.' },
      { code: p_d2,   label: 'Ø P2',         desc: noP2 ? 'N/A' : (diam2 ? diam2 + ' mm' : '–') },
      { code: p_eje,  label: 'Eje (dm)',      desc: shaftDm + ' dm' },
      { code: p_pot,  label: 'Potencia',      desc: pot + ' kW' },
      { code: p_rpm,  label: 'RPM',           desc: rpm + ' rpm' },
      { code: p_vel,  label: 'Vel. control',  desc: vel === 'VELOCIDAD DIRECTA' ? 'Directa' : 'Reducida' },
      { code: p_mot,  label: 'Motriz',        desc: mot.replace('MOTOR ', '').substring(0, 14) },
      { code: p_lint || '–', label: 'Linterna', desc: lint },
      { code: p_sel  || '–', label: 'Sello',    desc: sello },
      { code: p_mat,  label: 'Material',      desc: mat },
      { code: p_adic || '–', label: 'Adicional', desc: adic || '–' },
    ],
  });

  return code;
}

function _renderBreakdown({ parts }) {
  const box = document.getElementById('cod_breakdown');
  if (!box) return;
  box.innerHTML = parts.map(p =>
    `<div class="cod-part">
      <span class="cod-part-code">${p.code}</span>
      <span class="cod-part-label">${p.label}</span>
      <span class="cod-part-desc">${p.desc}</span>
    </div>`
  ).join('');
}

/* ── Auto-populate from calculator ──────────────────── */

function updateCodingFromCalc() {
  const g = id => document.getElementById(id);

  /* Get active propeller types and diameters from the calculator */
  const props = [1, 2, 3, 4].map(n => {
    const tipo = g('tipo' + n)?.value || 'N.A.';
    const D_mm = parseFloat(g('diam' + n)?.value) || 0;
    return { tipo, D_mm, active: tipo !== 'N.A.' && D_mm > 0 };
  });

  /* Group by coding type (preserving insertion order = bottom to top) */
  const groups = new Map();
  for (const p of props) {
    if (!p.active) continue;
    const codType = APP_TO_COD[p.tipo] || 'CURVA TRIPALA - CT';
    if (!groups.has(codType)) groups.set(codType, { count: 0, firstDiam: p.D_mm });
    groups.get(codType).count++;
  }

  const keys   = [...groups.keys()];
  const tipo1K = keys[0] || 'TURBINA';
  const tipo2K = keys[1] || 'NO APLICA';

  _setSelect('cod_tipo1', tipo1K);
  _setSelect('cod_tipo2', tipo2K);
  if (g('cod_num1')) g('cod_num1').value = groups.get(tipo1K)?.count || 1;
  if (g('cod_num2')) g('cod_num2').value = tipo2K !== 'NO APLICA' ? (groups.get(tipo2K)?.count || 1) : 1;
  _setSelect('cod_diam1', String(Math.round(groups.get(tipo1K)?.firstDiam || 0)));
  _setSelect('cod_diam2', String(Math.round(tipo2K !== 'NO APLICA' ? (groups.get(tipo2K)?.firstDiam || 0) : 0)));

  /* Shaft length (m → keep as m, the generator converts to dm) */
  const L = parseFloat(g('longitudEje')?.value) || 0;
  if (g('cod_eje') && L > 0) g('cod_eje').value = L;

  /* Motor power */
  const mot = parseFloat(g('motorCercano')?.value) || 0;
  if (g('cod_potencia') && mot > 0) g('cod_potencia').value = mot;

  /* RPM */
  const r = parseInt(g('rpm')?.value) || 0;
  if (g('cod_rpm') && r > 0) g('cod_rpm').value = r;

  /* Sync P2 fields visibility */
  _syncP2Visibility();

  buildAgitatorCode();
}

function _setSelect(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  if ([...el.options].some(o => o.value === value)) el.value = value;
}

function _syncP2Visibility() {
  const tipo2 = document.getElementById('cod_tipo2')?.value;
  const hide  = tipo2 === 'NO APLICA';
  ['cod_p2_num_row', 'cod_p2_diam_row'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = hide ? 'none' : '';
  });
}

/* ── Copy code ───────────────────────────────────────── */

function copyCodigo() {
  const code = document.getElementById('cod_resultado')?.textContent?.trim() || '';
  if (!code || code === '–') return;

  const btn = document.querySelector('.btn-copy-code');

  const flash = () => {
    if (btn) { btn.textContent = '✓ Copiado'; setTimeout(() => { btn.textContent = '📋 Copiar código'; }, 1500); }
  };

  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(flash).catch(() => _copyFallback(code, flash));
  } else {
    _copyFallback(code, flash);
  }
}

function _copyFallback(text, cb) {
  const ta = Object.assign(document.createElement('textarea'), { value: text });
  Object.assign(ta.style, { position: 'fixed', opacity: '0' });
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); cb(); } catch (_) {}
  document.body.removeChild(ta);
}

/* ── Initialisation ──────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  const t2 = document.getElementById('cod_tipo2');
  if (t2) t2.addEventListener('change', () => { _syncP2Visibility(); buildAgitatorCode(); });
  _syncP2Visibility();
});
