/* =====================================================
   NFS – Agitator Selector – Calculator
   Replicates: SELECCION DE AG - PRONACA.xlsm (Sheet1)
   ===================================================== */

'use strict';

// =====================================================
// DATA TABLES
// =====================================================

/**
 * Propeller catalog.
 * Kp  = C_kW / (N_rpm^3 * D_mm^5)  → Power factor
 * Nq  = Q_m3h / (60 * N_rpm * (D_mm/1000)^3) → Flow number
 * Usage:
 *   Power (kW)  = Kp * rpm^3 * D_mm^5
 *   Flow (m³/h) = Nq * rpm * (D_mm/1000)^3 * 60
 */
const PROPELLERS = {
  'VR3A-020': { rpm: 364,  D: 200,  Kp: 4.5357e-21, Nq: 0.8585, type: 'TRIPALA'      },
  'VR3A-030': { rpm: 359,  D: 300,  Kp: 4.5361e-21, Nq: 0.8563, type: 'TRIPALA'      },
  'VR3A-040': { rpm: 359,  D: 400,  Kp: 5.2165e-21, Nq: 0.9847, type: 'TRIPALA'      },
  'VR3A-050': { rpm: 99,   D: 500,  Kp: 4.5063e-21, Nq: 0.8573, type: 'TRIPALA'      },
  'VR3A-060': { rpm: 99,   D: 600,  Kp: 4.5063e-21, Nq: 0.8573, type: 'TRIPALA'      },
  'VR3A-070': { rpm: 99,   D: 700,  Kp: 4.5063e-21, Nq: 0.8573, type: 'TRIPALA'      },
  'VR3A-080': { rpm: 113,  D: 800,  Kp: 4.2276e-22, Nq: 0.3389, type: 'TRIPALA'      },
  'VR3A-100': { rpm: 113,  D: 1000, Kp: 4.2276e-22, Nq: 0.3389, type: 'TRIPALA'      },
  'VR3A-120': { rpm: 100,  D: 1200, Kp: 4.2599e-22, Nq: 0.3390, type: 'TRIPALA'      },
  'VR3A-150': { rpm: 90,   D: 1500, Kp: 4.2579e-22, Nq: 0.3390, type: 'TRIPALA'      },
  'VR3A-180': { rpm: 57,   D: 1800, Kp: 4.2579e-22, Nq: 0.3390, type: 'TRIPALA'      },
  'VR2A-020': { rpm: 103,  D: 200,  Kp: 8.5795e-21, Nq: 0.9304, type: 'TURBINA'      },
  'VR2A-035': { rpm: 126,  D: 350,  Kp: 4.7590e-21, Nq: 0.5368, type: 'TURBINA'      },
  'VR2A-050': { rpm: 100,  D: 500,  Kp: 3.2000e-21, Nq: 0.3747, type: 'TURBINA'      },
  'VR2A-055': { rpm: 137,  D: 550,  Kp: 4.7136e-21, Nq: 0.5455, type: 'TURBINA'      },
  'VR2A-070': { rpm: 102,  D: 700,  Kp: 5.5507e-21, Nq: 0.6426, type: 'TURBINA'      },
  'VR2A-080': { rpm: 100,  D: 800,  Kp: 4.8523e-21, Nq: 0.5625, type: 'TURBINA'      },
  'VR4A-020': { rpm: 289,  D: 200,  Kp: 3.3532e-20, Nq: 1.0741, type: 'GRAN CAUDAL'  },
  'VR4A-030': { rpm: 293,  D: 300,  Kp: 8.5891e-21, Nq: 1.0723, type: 'GRAN CAUDAL'  },
  'VR4A-040': { rpm: 158,  D: 400,  Kp: 9.5321e-21, Nq: 1.0713, type: 'GRAN CAUDAL'  },
  'VR4A-060': { rpm: 99,   D: 600,  Kp: 1.0205e-20, Nq: 1.0748, type: 'GRAN CAUDAL'  },
  'VR4A-080': { rpm: 126,  D: 800,  Kp: 4.2717e-21, Nq: 1.0727, type: 'GRAN CAUDAL'  },
  'VR4A-100': { rpm: 69.3, D: 1000, Kp: 4.6272e-21, Nq: 1.0702, type: 'GRAN CAUDAL'  },
  'VR4A-120': { rpm: 63.7, D: 1200, Kp: 4.3534e-21, Nq: 1.0697, type: 'GRAN CAUDAL'  },
  'VR4A-140': { rpm: 53.3, D: 1400, Kp: 4.7276e-21, Nq: 1.0702, type: 'GRAN CAUDAL'  },
  'VR4A-160': { rpm: 47.7, D: 1600, Kp: 4.6132e-21, Nq: 1.0705, type: 'GRAN CAUDAL'  },
  'VR5-040':  { rpm: 70.3, D: 400,  Kp: 7.2800e-20, Nq: 0.5742, type: 'FLOC. BIPALA' },
  'VR5-050':  { rpm: 56.3, D: 500,  Kp: 4.6443e-20, Nq: 0.5684, type: 'FLOC. BIPALA' },
  'VR5-060':  { rpm: 49.3, D: 600,  Kp: 2.7797e-20, Nq: 0.5713, type: 'FLOC. BIPALA' },
  'VR5-080':  { rpm: 35.2, D: 800,  Kp: 1.8123e-20, Nq: 0.5734, type: 'FLOC. BIPALA' },
  'VR5-100':  { rpm: 28.7, D: 1000, Kp: 2.5381e-21, Nq: 0.5807, type: 'FLOC. BIPALA' },
  'VR5-120':  { rpm: 22.6, D: 1200, Kp: 9.0171e-21, Nq: 0.5761, type: 'FLOC. BIPALA' },
  'VR5-140':  { rpm: 18.7, D: 1400, Kp: 7.3644e-21, Nq: 0.5684, type: 'FLOC. BIPALA' },
  'VR5-160':  { rpm: 16.7, D: 1600, Kp: 5.3034e-21, Nq: 0.5726, type: 'FLOC. BIPALA' },
  'VR5-200':  { rpm: 15,   D: 2000, Kp: 2.3981e-21, Nq: 0.5632, type: 'FLOC. BIPALA' },
  'VR5-250':  { rpm: 11.6, D: 2500, Kp: 2.5257e-21, Nq: 0.5425, type: 'FLOC. BIPALA' },
  'VR5-300':  { rpm: 9.8,  D: 3000, Kp: 2.2955e-21, Nq: 0.5669, type: 'FLOC. BIPALA' },
  'VR5-360':  { rpm: 8,    D: 3600, Kp: 2.4872e-21, Nq: 0.5693, type: 'FLOC. BIPALA' },
  'VR5-040-T':{ rpm: 72.6, D: 400,  Kp: 2.5521e-21, Nq: 0.5667, type: 'FLOC. TRIPALA'},
  'VR5-050-T':{ rpm: 53.7, D: 500,  Kp: 2.0665e-21, Nq: 0.5661, type: 'FLOC. TRIPALA'},
  'VR5-060-T':{ rpm: 47,   D: 600,  Kp: 2.4773e-21, Nq: 0.5664, type: 'FLOC. TRIPALA'},
  'VR5-080-T':{ rpm: 35.2, D: 800,  Kp: 2.7989e-21, Nq: 0.5669, type: 'FLOC. TRIPALA'},
  'VR5-100-T':{ rpm: 27,   D: 1000, Kp: 2.5403e-21, Nq: 0.5673, type: 'FLOC. TRIPALA'},
  'VR5-120-T':{ rpm: 24.7, D: 1200, Kp: 2.6669e-21, Nq: 0.5670, type: 'FLOC. TRIPALA'},
  'VR5-140-T':{ rpm: 19.2, D: 1400, Kp: 2.6270e-21, Nq: 0.5669, type: 'FLOC. TRIPALA'},
  'VR5-160-T':{ rpm: 16.7, D: 1600, Kp: 2.6619e-21, Nq: 0.5670, type: 'FLOC. TRIPALA'},
  'VR5-200-T':{ rpm: 15,   D: 2000, Kp: 2.5926e-21, Nq: 0.5669, type: 'FLOC. TRIPALA'},
  'VR5-250-T':{ rpm: 11.6, D: 2500, Kp: 2.6241e-21, Nq: 0.5670, type: 'FLOC. TRIPALA'},
  'VR5-300-T':{ rpm: 9.6,  D: 3000, Kp: 2.6048e-21, Nq: 0.5670, type: 'FLOC. TRIPALA'},
  'VR5-360-T':{ rpm: 8,    D: 3600, Kp: 2.5841e-21, Nq: 0.5670, type: 'FLOC. TRIPALA'},
  'N.A.':     { rpm: 0,    D: 0,    Kp: 0,           Nq: 0,      type: 'N.A.'         },
};

/** Standard motor sizes in kW (descending). Motor is valid when motor*1.05 >= required power. */
const STANDARD_MOTORS = [
  160, 132, 110, 90, 75, 55, 45, 37, 30, 22,
  18.5, 15, 11, 9.2, 7.5, 5.5, 4, 3, 2.2, 1.5,
  1.1, 0.75, 0.55, 0.37, 0.25, 0.18, 0.12, 0.09
];

/* Process intensity data is now managed by NFS_DB (database.js). */

/** Maps propeller type label → list of model names */
const TYPE_MODELS = {};
for (const [model, data] of Object.entries(PROPELLERS)) {
  if (!TYPE_MODELS[data.type]) TYPE_MODELS[data.type] = [];
  TYPE_MODELS[data.type].push(model);
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Viscosity correction factor.
 * =IF(visc<20, 1.1, 0.18612*LN(visc)+0.54256)
 */
function viscosityFactor(visc) {
  if (visc < 20) return 1.1;
  return 0.18612 * Math.log(visc) + 0.54256;
}

/**
 * Flow rate of one propeller at given rpm.
 * Q = Nq * rpm * (D_mm/1000)^3 * 60  [m³/h]
 */
function propellerFlow(Nq, rpm, D_mm) {
  return Nq * rpm * Math.pow(D_mm / 1000, 3) * 60;
}

/**
 * Power absorbed in water by one propeller.
 * P = Kp * rpm^3 * D_mm^5  [kW]
 */
function propellerPower(Kp, rpm, D_mm) {
  return Kp * Math.pow(rpm, 3) * Math.pow(D_mm, 5);
}

/**
 * Select the smallest standard motor where motor*1.05 >= powerRequired.
 * Replicates: INDEX(B198:B222, MATCH(power, A198:A222, -1))
 * where A = B * 1.05 (descending).
 */
function selectMotor(powerRequired) {
  for (let i = STANDARD_MOTORS.length - 1; i >= 0; i--) {
    if (STANDARD_MOTORS[i] * 1.05 >= powerRequired) return STANDARD_MOTORS[i];
  }
  return null;
}

/**
 * Get intensity range for a process from the live DB.
 */
function getIntensity(process) {
  return NFS_DB.getIntensity(process);
}

/**
 * Check if an agitation level value falls within a recommended range (e.g. "4 - 5").
 * Returns 'ok' | 'low' | 'high'
 */
function checkIntensity(value, rangeStr) {
  const m = rangeStr.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
  if (!m || isNaN(value)) return 'unknown';
  const lo = parseFloat(m[1]), hi = parseFloat(m[2]);
  if (value < lo) return 'low';
  if (value > hi) return 'high';
  return 'ok';
}

/** Format number to N decimal places, or '–' if NaN/null */
function fmt(val, dec = 2) {
  if (val === null || val === undefined || isNaN(val) || !isFinite(val)) return '–';
  return parseFloat(val.toFixed(dec)).toLocaleString('es-CO', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec
  });
}

function fmtSci(val) {
  if (!val || isNaN(val)) return '–';
  return val.toExponential(4);
}

// =====================================================
// POPULATE DROPDOWNS
// =====================================================

function populateModelDropdown(selectEl, typeLabel) {
  const current = selectEl.value;
  selectEl.innerHTML = '';
  if (typeLabel === 'N.A.') {
    const opt = document.createElement('option');
    opt.value = 'N.A.'; opt.textContent = 'N.A.';
    selectEl.appendChild(opt);
    return;
  }
  const models = TYPE_MODELS[typeLabel] || [];
  models.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name; opt.textContent = name;
    if (name === current) opt.selected = true;
    selectEl.appendChild(opt);
  });
  // Default first option
  if (!models.includes(current) && models.length) selectEl.value = models[0];
}

function onTipoChange(n) {
  const tipoEl  = document.getElementById('tipo' + n);
  const modelEl = document.getElementById('modelo' + n);
  populateModelDropdown(modelEl, tipoEl.value);
  calculate();
}

// =====================================================
// MAIN CALCULATION
// =====================================================

function calculate() {
  /* ── 1. Tank ── */
  const tankType = document.querySelector('input[name="tipoTanque"]:checked').value;
  let tankDiameter; // effective tank diameter used for Rp ratio

  let areaSuperficial, volumenUtil;
  const alturaUtil  = parseFloat(document.getElementById('alturaUtil').value)  || 0;
  const alturaTotal = parseFloat(document.getElementById('alturaTotal').value) || 0;

  if (tankType === 'CIRCULAR') {
    tankDiameter = parseFloat(document.getElementById('diametro').value) || 0;
    areaSuperficial = Math.pow(tankDiameter, 2) * 0.7854;          // π/4 * D²
  } else {
    const ancho   = parseFloat(document.getElementById('ancho').value)   || 0;
    const longitud = parseFloat(document.getElementById('longitud').value) || 0;
    const dEquiv  = Math.sqrt(ancho * longitud * 4 / Math.PI);           // equiv diameter
    tankDiameter  = dEquiv;
    areaSuperficial = ancho * longitud;                                   // actual rectangular area
    document.getElementById('diametroEquiv').value = fmt(dEquiv, 3);
  }
  volumenUtil = areaSuperficial * alturaUtil;

  document.getElementById('areaSuperficial').value = fmt(areaSuperficial, 4);
  document.getElementById('volumenUtil').value      = fmt(volumenUtil, 4);

  /* ── 2. Fluid ── */
  const proceso   = document.getElementById('proceso').value;
  const viscosidad = parseFloat(document.getElementById('viscosidad').value) || 1;
  const densidad   = parseFloat(document.getElementById('densidad').value)   || 1;
  const fVisc      = viscosityFactor(viscosidad);
  const bafles     = document.querySelector('input[name="bafles"]:checked').value === 'SI';
  const intensity  = getIntensity(proceso);

  document.getElementById('factorViscosidad').value    = fmt(fVisc, 4);
  document.getElementById('intensidadRecomendada').value  = intensity;
  document.getElementById('intensidadRecomendada2').value = intensity;

  /* ── 3. Propellers ── */
  const rpm = parseFloat(document.getElementById('rpm').value) || 0;
  const pct = parseFloat(document.getElementById('pctFondo').value) / 100 || 0.9;

  const props = [1, 2, 3, 4].map(n => {
    const tipoEl  = document.getElementById('tipo' + n);
    const modelEl = document.getElementById('modelo' + n);
    const tipo    = tipoEl ? tipoEl.value : 'N.A.';
    const modelo  = modelEl ? modelEl.value : 'N.A.';
    const data    = PROPELLERS[modelo] || PROPELLERS['N.A.'];
    return { tipo, modelo, data };
  });

  // Number of required propellers (based on propeller #1 diameter)
  const D1_mm = props[0].data.D;
  const D1_m  = D1_mm / 1000;
  let numPropelasReq = '–';
  if (D1_mm > 0 && alturaUtil > 0) {
    numPropelasReq = fmt((alturaUtil - 1.5 * D1_m) / D1_m, 2);
  }
  document.getElementById('numPropelas').value = numPropelasReq;

  // Per-propeller outputs
  props.forEach((p, idx) => {
    const n    = idx + 1;
    const data = p.data;
    const D_mm = data.D;
    const D_m  = D_mm / 1000;
    const Kp   = data.Kp;
    const Nq   = data.Nq;

    const Rp   = (tankDiameter > 0 && D_mm > 0) ? D_m / tankDiameter : 0;

    document.getElementById('diam' + n).value = D_mm > 0 ? D_mm.toFixed(0) : '–';
    document.getElementById('rp' + n).value   = Rp > 0 ? fmt(Rp, 4) : '–';
    document.getElementById('kp' + n).value   = Kp > 0 ? fmtSci(Kp) : '–';
    document.getElementById('nq' + n).value   = Nq > 0 ? fmt(Nq, 4) : '–';

    // Local agitation index = Q_local / (area * 108)
    let idxLocal = '–';
    if (D_mm > 0 && rpm > 0 && areaSuperficial > 0) {
      const Qlocal = propellerFlow(Nq, rpm, D_mm);
      idxLocal = fmt(Qlocal / (areaSuperficial * 108), 3);
    }
    document.getElementById('idxLocal' + n).value = idxLocal;
  });

  // RPM reference / max for propeller 1
  const rpmRef = props[0].data.rpm;
  document.getElementById('rpmRef').value = rpmRef > 0 ? rpmRef.toFixed(1) : '–';
  document.getElementById('rpmMax').value = rpmRef > 0 ? (rpmRef * 1.1).toFixed(1) : '–';

  // ── Flows ──
  // Q1 = full flow of propeller 1
  // Q_total_N = Q1 + 0.25*Q2 + 0.25*Q3 + 0.25*Q4  (secondary propellers = 25% contribution)
  const flows = props.map(p => {
    if (p.data.D === 0 || rpm === 0) return 0;
    return propellerFlow(p.data.Nq, rpm, p.data.D);
  });

  const caudal1 = flows[0];
  const caudal2 = caudal1 + 0.25 * flows[1];
  const caudal3 = caudal2 + 0.25 * flows[2];
  const caudal4 = caudal3 + 0.25 * flows[3];

  document.getElementById('caudal1').value = caudal1 > 0 ? fmt(caudal1, 1) : '–';
  document.getElementById('caudal2').value = caudal2 > 0 ? fmt(caudal2, 1) : '–';
  document.getElementById('caudal3').value = caudal3 > 0 ? fmt(caudal3, 1) : '–';
  document.getElementById('caudal4').value = caudal4 > 0 ? fmt(caudal4, 1) : '–';

  // Vueltas/h = caudal4 / volumen
  const vueltas = (volumenUtil > 0 && caudal4 > 0) ? caudal4 / volumenUtil : NaN;
  document.getElementById('vueltas').value = isNaN(vueltas) ? '–' : fmt(vueltas, 2);

  // ── Powers ──
  const powers = props.map(p => {
    if (p.data.D === 0 || rpm === 0) return 0;
    return propellerPower(p.data.Kp, rpm, p.data.D);
  });

  document.getElementById('potAgua1').value = fmt(powers[0], 4);
  document.getElementById('potAgua2').value = fmt(powers[1], 4);
  document.getElementById('potAgua3').value = fmt(powers[2], 4);
  document.getElementById('potAgua4').value = fmt(powers[3], 4);

  const potAguaTotal = powers.reduce((a, b) => a + b, 0);
  document.getElementById('potAguaTotal').value = fmt(potAguaTotal, 4);

  /* ── 4. Results ── */

  // Shaft length: totalHeight – pct * D1_m
  const longitudEje = D1_m > 0 ? alturaTotal - pct * D1_m : NaN;
  document.getElementById('longitudEje').value = isNaN(longitudEje) ? '–' : fmt(longitudEje, 3);

  // Agitation level: totalFlow / (area * 108)
  const nivelAgitacion = (areaSuperficial > 0 && caudal4 > 0)
    ? caudal4 / (areaSuperficial * 108)
    : NaN;
  const nivelEl = document.getElementById('nivelAgitacion');
  nivelEl.value = isNaN(nivelAgitacion) ? '–' : fmt(nivelAgitacion, 3);

  // Color-code agitation level vs recommended range
  nivelEl.classList.remove('status-ok', 'status-warn', 'status-error');
  if (!isNaN(nivelAgitacion) && intensity !== '–') {
    const status = checkIntensity(nivelAgitacion, intensity);
    if (status === 'ok')   nivelEl.classList.add('status-ok');
    if (status === 'low')  nivelEl.classList.add('status-warn');
    if (status === 'high') nivelEl.classList.add('status-error');
    document.getElementById('estadoAgitacion').value =
      status === 'ok'   ? '✔ DENTRO DEL RANGO RECOMENDADO' :
      status === 'low'  ? '⚠ POR DEBAJO DEL RANGO RECOMENDADO' :
                          '⚠ POR ENCIMA DEL RANGO RECOMENDADO';
  } else {
    document.getElementById('estadoAgitacion').value = '–';
  }

  // Required power:
  // =IF(bafles, potAguaTotal*fVisc*densidad*1.4*1.3, potAguaTotal*fVisc*densidad*1.3)
  const potenciaRequerida = bafles
    ? potAguaTotal * fVisc * densidad * 1.4 * 1.3
    : potAguaTotal * fVisc * densidad * 1.3;

  document.getElementById('potenciaRequerida').value = fmt(potenciaRequerida, 2);

  // Standard motor selection
  const motor = selectMotor(potenciaRequerida);
  document.getElementById('motorCercano').value = motor !== null ? motor.toFixed(2) : '–';

  /* ── Summary ── */
  document.getElementById('sumCaudal').textContent     = caudal4 > 0 ? fmt(caudal4, 1) : '–';
  document.getElementById('sumIntensidad').textContent = !isNaN(nivelAgitacion) ? fmt(nivelAgitacion, 1) : '–';
  document.getElementById('sumRenovaciones').textContent = !isNaN(vueltas) ? fmt(vueltas, 1) : '–';
  document.getElementById('sumPotencia').textContent   = fmt(potenciaRequerida, 1);

  /* ── Reference table highlight ── */
  document.querySelectorAll('#refTableBody tr').forEach(tr => {
    const proc = tr.dataset.proceso;
    tr.classList.toggle('active-row', proc === proceso);
  });

  /* ── Tank diagram ── */
  if (typeof drawTankDiagram === 'function') drawTankDiagram();

  /* ── Coding section ── */
  if (typeof updateCodingFromCalc === 'function') updateCodingFromCalc();
}

// =====================================================
// INITIALISATION
// =====================================================

function buildReferenceTable() {
  const tbody = document.getElementById('refTableBody');
  tbody.innerHTML = '';
  NFS_DB.getProcesos().forEach(p => {
    const tr = document.createElement('tr');
    tr.dataset.proceso = p.label;
    tr.innerHTML = `<td>${p.label}</td><td><span class="intensity-badge">${p.intensidad}</span></td>`;
    tbody.appendChild(tr);
  });
}

function buildProcesoSelect() {
  const sel = document.getElementById('proceso');
  const prev = sel.value;
  sel.innerHTML = '';
  NFS_DB.getProcesos().forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.label;
    opt.textContent = p.label;
    sel.appendChild(opt);
  });
  /* Restore previous selection when possible */
  if ([...sel.options].some(o => o.value === prev)) sel.value = prev;
}

function initModelDropdowns() {
  [1, 2, 3, 4].forEach(n => {
    const tipoEl  = document.getElementById('tipo' + n);
    const modelEl = document.getElementById('modelo' + n);
    populateModelDropdown(modelEl, tipoEl.value);
    // Set defaults from the original Excel example: props 1 & 2 → VR2A-055
    if ((n === 1 || n === 2) && PROPELLERS['VR2A-055']) {
      modelEl.value = 'VR2A-055';
    }
  });
}

function attachListeners() {
  const ids = [
    'tipoCircular', 'tipoRectangular',
    'diametro', 'ancho', 'longitud',
    'alturaUtil', 'alturaTotal',
    'baflesSi', 'baflesNo',
    'proceso',
    'viscosidad', 'densidad',
    'rpm', 'pctFondo',
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculate);
    if (el) el.addEventListener('change', calculate);
  });

  // Tank type toggle: show/hide dimension inputs
  document.querySelectorAll('input[name="tipoTanque"]').forEach(el => {
    el.addEventListener('change', () => {
      const isRect = document.getElementById('tipoRectangular').checked;
      document.getElementById('inputsCircular').classList.toggle('hidden', isRect);
      document.getElementById('inputsRectangular').classList.toggle('hidden', !isRect);
      calculate();
    });
  });

  document.querySelectorAll('input[name="paramCirculacion"]').forEach(el => {
    el.addEventListener('change', calculate);
  });

  // Model selects
  [1, 2, 3, 4].forEach(n => {
    document.getElementById('modelo' + n).addEventListener('change', calculate);
  });
}

function setDefaultDate() {
  const d = new Date();
  const iso = d.toISOString().split('T')[0];
  document.getElementById('fecha').value = iso;
}

document.addEventListener('DOMContentLoaded', () => {
  NFS_DB.load();
  setDefaultDate();
  buildProcesoSelect();
  buildReferenceTable();
  initModelDropdowns();
  attachListeners();
  calculate();
});
