/* =====================================================
   NFS – Shaft Design Calculator
   Replicates: SELECCION DE AG - PRONACA.xlsm (Sheet2)
   "Selección del Eje"
   ===================================================== */

'use strict';

// =====================================================
// MATERIAL YIELD STRENGTHS (Pa)  H49:I55
// =====================================================
const SIGMA_Y = {
  '4140':   735e6,
  '1045':   530e6,
  '1020':   351.571e6,
  'SS 304': 207e6,
  'SS 316': 138e6,
  '4340':   784e6,
  'A36':    250e6,
};

// =====================================================
// PIPE DIMENSION TABLES
// Columns: [D_in, I_solid_m4, I_tube_m4, D_ext_m, D_int_m, W_tube_kg/m, W_solid_kg/m]
// SCH80 → J68:P79 | SCH40 → J81:P92
// =====================================================
const TUBE_SCH80 = [
  [1,    2.0431712e-8,  4.3957597e-8,  0.033410, 0.024308, 3.237592, 3.986220],
  [1.25, 4.9882110e-8,  1.0064079e-7,  0.042164, 0.032461, 4.467907, 6.227631],
  [1.5,  1.0343554e-7,  1.6283257e-7,  0.048260, 0.038099, 5.414877, 8.967132],
  [2,    3.2690740e-7,  3.6125614e-7,  0.060325, 0.049251, 7.486280, 15.94190],
  [2.5,  7.9811376e-7,  8.0092700e-7,  0.073025, 0.059004, 11.42329, 24.90903],
  [3,    1.6549687e-6,  1.6209376e-6,  0.088900, 0.073660, 15.28573, 35.86555],
  [3.5,  3.0660338e-6,  2.6139703e-6,  0.101600, 0.085446, 18.64114, 48.82486],
  [4,    5.2305184e-6,  4.0001896e-6,  0.114300, 0.097180, 22.33954, 63.76760],
  [5,    1.2769820e-5,  8.6037757e-6,  0.141300, 0.122250, 30.98902, 99.63314],
  [6,    2.6479499e-5,  1.6853490e-5,  0.168275, 0.146329, 42.60618, 143.4771],
  [8,    8.3688294e-5,  4.4002406e-5,  0.219075, 0.193675, 64.70711, 255.0704],
  [10,   2.0431712e-4,  8.8220303e-5,  0.273050, 0.247650, 81.63326, 405.3650],
];
const TUBE_SCH40 = [
  [1,    2.0431712e-8,  3.6364661e-8,  0.033400, 0.026640, 2.550159, 3.986220],
  [1.25, 4.9882110e-8,  8.1002313e-8,  0.042160, 0.035050, 3.449237, 6.227631],
  [1.5,  1.0343554e-7,  1.2904151e-7,  0.048260, 0.040890, 4.128276, 8.967132],
  [2,    3.2690740e-7,  2.7710486e-7,  0.060325, 0.052502, 5.443212, 15.94190],
  [2.5,  7.9811376e-7,  6.3664840e-7,  0.073025, 0.062713, 8.634574, 24.90903],
  [3,    1.6549687e-6,  1.2558354e-6,  0.088900, 0.077927, 11.30398, 35.86555],
  [3.5,  3.0660338e-6,  1.9927989e-6,  0.101600, 0.090119, 13.58566, 48.82486],
  [4,    5.2305184e-6,  3.0104355e-6,  0.114300, 0.102260, 16.09103, 63.76760],
  [5,    1.2769820e-5,  6.3109771e-6,  0.141300, 0.128194, 21.80267, 99.63314],
  [6,    2.6479499e-5,  1.1713659e-5,  0.168275, 0.154051, 28.28979, 143.4771],
  [8,    8.3688294e-5,  3.0172300e-5,  0.219075, 0.202717, 42.57635, 255.0704],
  [10,   2.0431712e-4,  6.6902643e-5,  0.273050, 0.254508, 60.36745, 405.3650],
];

// Shaft bore for coupling weight: D_in → SCH40 inner diameter (m)  B33:C42
const COUPLING_BORE = {
  1.5: 0.040890, 2: 0.052502, 2.5: 0.062713, 3: 0.077927,
  3.5: 0.090119, 4: 0.102260, 5:  0.128194,  6: 0.154051,
  8:   0.202717, 10: 0.254508,
};

// =====================================================
// PROPELLER WEIGHT TABLES  [diameter_mm, weight_kg]
// Based on AS/AT lookup tables in sheet2
// =====================================================
const PROP_WEIGHT = {
  'P.TURBINA': [
    [160, 0.90], [200, 0.97], [350, 2.91], [500, 4.00],
    [550, 4.08], [700, 16.63], [800, 24.00],
  ],
  'C.TRIPALA': [
    [200, 0.90], [300, 1.60], [500, 4.80], [600, 5.50],
    [700, 9.80], [800, 11.25], [1000, 22.50], [1200, 28.50],
    [1600, 45.00], [1800, 62.00],
  ],
  'C.BIPALA': [
    [400, 1.00], [500, 3.00], [600, 5.00], [800, 9.00],
    [1000, 13.00], [1200, 20.00], [1500, 24.00], [1600, 34.43],
    [2000, 76.14], [2200, 97.00], [2500, 128.29], [3000, 180.44], [3600, 243.02],
  ],
  'G.CAUDAL': [
    [160, 0.90], [200, 1.47], [300, 2.88], [400, 4.30],
    [600, 23.52], [800, 42.75], [1000, 61.97], [1200, 81.18],
    [1400, 100.40], [1500, 110.00], [1600, 129.20],
  ],
  'H.MARINA':   [[128, 0.34]],
  'T.TRIPALA':  [[800, 27.00], [1000, 33.75]],
  'N.A.':       [[0, 0]],
};

/** Map from sheet1 propeller types to sheet2 weight table keys */
const TYPE_TO_WEIGHT = {
  'TURBINA':      'P.TURBINA',
  'TRIPALA':      'C.TRIPALA',
  'GRAN CAUDAL':  'G.CAUDAL',
  'FLOC. BIPALA': 'C.BIPALA',
  'FLOC. TRIPALA':'T.TRIPALA',
  'N.A.':         'N.A.',
};

// =====================================================
// HELPERS
// =====================================================

/** Linear interpolation (or extrapolation at ends) on a sorted [x, y] table */
function linInterp(table, x) {
  if (!table || table.length === 0) return 0;
  if (table.length === 1) return table[0][1];
  if (x <= table[0][0]) return table[0][1];
  const last = table[table.length - 1];
  if (x >= last[0]) {
    // Extrapolate from last two points
    const n = table.length;
    const dx = table[n-1][0] - table[n-2][0];
    const dy = table[n-1][1] - table[n-2][1];
    return last[1] + (x - last[0]) * dy / dx;
  }
  for (let i = 0; i < table.length - 1; i++) {
    if (x >= table[i][0] && x <= table[i+1][0]) {
      const t = (x - table[i][0]) / (table[i+1][0] - table[i][0]);
      return table[i][1] + t * (table[i+1][1] - table[i][1]);
    }
  }
  return 0;
}

/** Lookup tube row by nominal diameter (inches) */
function tubeRow(schedTable, diam_in) {
  const row = schedTable.find(r => r[0] === diam_in);
  return row || schedTable[0];
}

/** Look up tube row – returns: {Dext, Dint, Wtube, Wsolid} in SI */
function tubeData(diam_in, schedule) {
  const tbl = schedule === 'SCH80' ? TUBE_SCH80 : TUBE_SCH40;
  const row = tubeRow(tbl, diam_in);
  return {
    I_solid: row[1], I_tube: row[2],
    Dext: row[3], Dint: row[4],
    Wtube: row[5], Wsolid: row[6],
  };
}

/**
 * Newton-Raphson solver for shaft bending critical diameter.
 * Solves: 32*Mbe/(π*d³) + 4*We*g/(π*d²) + L*8000*g = SIGMAy
 * @param {number} Mbe   Combined moment (N·m)
 * @param {number} We    Weight (kg)
 * @param {number} L     Shaft length (m)
 * @param {number} sigy  Yield strength (Pa)
 * @returns {number}     Critical diameter (mm)
 */
function solveShaftDiam(Mbe, We, L, sigy) {
  const g = 9.81;
  const C = sigy - L * 8000 * g;      // constant RHS
  if (C <= 0) return 0;               // No solution (SIGMAy too low)

  function f(d) {                     // d in metres
    return 32 * Mbe / (Math.PI * d * d * d)
         + 4 * We * g / (Math.PI * d * d)
         - C;
  }
  function fp(d) {
    return -96 * Mbe / (Math.PI * Math.pow(d, 4))
           - 8 * We * g  / (Math.PI * Math.pow(d, 3));
  }

  // Initial guess from pure bending
  let d = Math.pow(32 * Mbe / (Math.PI * C), 1/3);
  if (!isFinite(d) || d <= 0) d = 0.05;

  for (let i = 0; i < 200; i++) {
    const fd = f(d), fpd = fp(d);
    if (!isFinite(fd) || Math.abs(fpd) < 1e-40) break;
    const step = fd / fpd;
    const dn = d - step;
    if (dn <= 0) { d = d / 2; continue; }
    if (Math.abs(dn - d) / d < 1e-10) { d = dn; break; }
    d = dn;
  }
  return d * 1000;   // mm
}

/** Suggest the next standard shaft size in inches equal to or larger than d_mm */
function standardShaftSize(d_mm) {
  const stds = [1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10];
  for (const s of stds) {
    if (s * 25.4 >= d_mm) return s;
  }
  return stds[stds.length - 1];
}

function fmtS(val, dec = 2) {
  if (val === null || val === undefined || isNaN(val) || !isFinite(val)) return '–';
  return parseFloat(val.toFixed(dec)).toLocaleString('es-CO', {
    minimumFractionDigits: dec, maximumFractionDigits: dec,
  });
}

function setPass(id, pass, cumple = 'Cumple', nocumple = 'No Cumple') {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = pass ? cumple : nocumple;
  el.classList.remove('status-ok', 'status-error');
  el.classList.add(pass ? 'status-ok' : 'status-error');
}

// =====================================================
// MAIN SHAFT CALCULATION
// =====================================================

function calculateShaft() {
  // ── Read data from page1 results ──────────────────
  // These come from global calculation() in calculator.js
  const L_str = document.getElementById('longitudEje').value;
  const P_str = document.getElementById('motorCercano').value;
  const rpm_str = document.getElementById('rpm').value;
  const D1_str = document.getElementById('diam1').value;
  const D2_str = document.getElementById('diam2').value;
  const D3_str = document.getElementById('diam3').value;
  const D4_str = document.getElementById('diam4').value;
  const tipo1 = document.getElementById('tipo1').value;
  const tipo2 = document.getElementById('tipo2').value;
  const tipo3 = document.getElementById('tipo3').value;
  const tipo4 = document.getElementById('tipo4').value;

  const L     = parseFloat(L_str) || 0;
  const Pmotor = parseFloat(P_str) || 0;   // kW
  const rpm   = parseFloat(rpm_str) || 0;
  const D1_mm = parseFloat(D1_str) || 0;
  const D2_mm = parseFloat(D2_str) || 0;
  const D3_mm = parseFloat(D3_str) || 0;
  const D4_mm = parseFloat(D4_str) || 0;

  // Display auto-read values on page2
  document.getElementById('sh_L').value     = fmtS(L, 3);
  document.getElementById('sh_Pmotor').value = fmtS(Pmotor, 2);
  document.getElementById('sh_rpm').value   = fmtS(rpm, 0);
  document.getElementById('sh_D1').value    = D1_mm > 0 ? D1_mm.toFixed(0) : '–';
  document.getElementById('sh_D2').value    = D2_mm > 0 ? D2_mm.toFixed(0) : '–';
  document.getElementById('sh_D3').value    = D3_mm > 0 ? D3_mm.toFixed(0) : '–';
  document.getElementById('sh_D4').value    = D4_mm > 0 ? D4_mm.toFixed(0) : '–';

  if (L <= 0 || Pmotor <= 0 || rpm <= 0) {
    // Not enough data from page1 yet
    return;
  }

  // ── Read user inputs ──────────────────────────────
  const material  = document.getElementById('sh_material').value;
  const diam_in   = parseFloat(document.getElementById('sh_diam_in').value);
  const schedule  = document.getElementById('sh_schedule').value;
  const FS        = parseFloat(document.getElementById('sh_FS').value)     || 2;
  const SF        = parseFloat(document.getElementById('sh_SF').value)     || 4;
  const Sb        = parseFloat(document.getElementById('sh_Sb').value)     || 0;
  const coup_in   = parseFloat(document.getElementById('sh_coup_diam').value);
  const coup_L    = parseFloat(document.getElementById('sh_coup_L').value) || 0;
  const L1        = parseFloat(document.getElementById('sh_L1').value)     || 0; // dist prop4
  const L2        = parseFloat(document.getElementById('sh_L2').value)     || 0; // dist prop3
  const L3        = parseFloat(document.getElementById('sh_L3').value)     || 0; // dist prop2
  const D64       = parseFloat(document.getElementById('sh_D64').value)    || 200;  // mm
  const D65       = parseFloat(document.getElementById('sh_D65').value)    || 20300; // N

  const sigy    = SIGMA_Y[material]   || SIGMA_Y['SS 304'];
  const sigy_mr = SIGMA_Y['1045'];   // MR shaft uses 1045 steel per Excel A108
  document.getElementById('sh_sigmay').value = fmtS(sigy / 1e6, 0);

  // ── Tube / solid shaft data ───────────────────────
  const tube  = tubeData(diam_in, schedule);
  const Dext  = tube.Dext;   // m
  const Dint  = tube.Dint;   // m
  const Wtube = tube.Wtube;  // kg/m
  const Wsol  = tube.Wsolid; // kg/m

  // D48 = L * Wtube, D49 = L * Wsol
  const D48 = L * Wtube;
  const D49 = L * Wsol;

  // ── Propeller weights ─────────────────────────────
  function propWeight(typeLabel, d_mm) {
    const key = TYPE_TO_WEIGHT[typeLabel] || 'N.A.';
    if (key === 'N.A.' || d_mm <= 0) return 0;
    const tbl = PROP_WEIGHT[key] || PROP_WEIGHT['N.A.'];
    return linInterp(tbl, d_mm);
  }

  const W1 = propWeight(tipo1, D1_mm);  // F7  – prop 1 (at shaft tip = full weight)
  const W2 = propWeight(tipo2, D2_mm);  // F9  – prop 2  at distance L3
  const W3 = propWeight(tipo3, D3_mm);  // F11 – prop 3  at distance L2
  const W4 = propWeight(tipo4, D4_mm);  // F13 – prop 4  at distance L1

  // Coupling (embone) weight: D24 = π/4 * d_bore² * coup_L * 8000
  const d_bore = COUPLING_BORE[coup_in] || COUPLING_BORE[3];
  const D24    = (Math.PI / 4) * d_bore * d_bore * coup_L * 8000;

  // Equivalent weight at shaft tip  C20
  // We = W3*(L2/L)³ + W2*(L3/L)³ + W1 + W4*(L1/L)³
  const We = (L > 0)
    ? W3 * Math.pow(L2 / L, 3)
    + W2 * Math.pow(L3 / L, 3)
    + W1
    + W4 * Math.pow(L1 / L, 3)
    : W1;

  const D47 = D24 + We;  // total: coupling + equiv propeller mass

  document.getElementById('sh_W1').value   = fmtS(W1, 3);
  document.getElementById('sh_W2').value   = fmtS(W2, 3);
  document.getElementById('sh_W3').value   = fmtS(W3, 3);
  document.getElementById('sh_W4').value   = fmtS(W4, 3);
  document.getElementById('sh_Wcoup').value = fmtS(D24, 3);
  document.getElementById('sh_We').value   = fmtS(We, 3);
  document.getElementById('sh_D47').value  = fmtS(D47, 3);
  document.getElementById('sh_D48').value  = fmtS(D48, 3);
  document.getElementById('sh_D49').value  = fmtS(D49, 3);

  // ── Moments ───────────────────────────────────────
  const omega = 2 * Math.PI * rpm / 60;           // rad/s
  const Mr    = Pmotor * 1000 / omega;             // L52 motor torque N·m

  // Bending moment  L53  =  0.048 * P[W] * L * SF / (omega * D_prop1[m])
  const D1_m = D1_mm / 1000;
  const Mb   = (D1_m > 0 && omega > 0)
    ? (0.048 * Pmotor * 1000 * L * SF) / (omega * D1_m)
    : 0;

  const Mbe  = Math.sqrt(Mb * Mb + Mr * Mr) * FS;  // L56 combined moment N·m

  document.getElementById('sh_Mr').value  = fmtS(Mr,  1);
  document.getElementById('sh_Mb').value  = fmtS(Mb,  1);
  document.getElementById('sh_Mbe').value = fmtS(Mbe, 1);

  // ── Critical diameters ────────────────────────────
  // D53 – torsion  (Von Mises)
  const D53 = 1000 * Math.pow(16 * Mr * FS / (0.577 * Math.PI * sigy), 1/3);

  // D52 – bending  (Newton-Raphson), using D49 as weight (shaft self-weight)
  const D52 = solveShaftDiam(Mbe, D49, L, sigy);

  // D54 – critical (governs)
  const D54 = Math.max(D52, D53);

  // Suggest next standard size
  const D54_in  = standardShaftSize(D54);

  document.getElementById('sh_D53').value   = fmtS(D53, 2);
  document.getElementById('sh_D52').value   = fmtS(D52, 2);
  document.getElementById('sh_D54').value   = fmtS(D54, 2);
  document.getElementById('sh_D54in').value = D54_in.toString() + '"';

  // ── Stress checks ─────────────────────────────────
  // Helper – bending stress in a solid shaft of diameter d_m
  function stressSolid(d_m) {
    return 32 * Mbe / (Math.PI * Math.pow(d_m, 3))
         + 4  * D47 * 9.81 / (Math.PI * d_m * d_m)
         + L  * 8000 * 9.81;
  }

  const D54_m = D54 / 1000;
  const D56_m = diam_in * 25.4 / 1000;   // selected solid shaft m

  const D55 = stressSolid(D54_m);   // critical stress at D54 (≈ SIGMAy)
  const D58 = stressSolid(D56_m);   // stress in solid @ selected D56

  // Hollow shaft bending stress  D59
  // σ = 32*Mbe*Dext / (π*(Dext⁴–Dint⁴))  + 4*D47*g/(π*(Dext²–Dint²)) + L*ρ*g
  const D59 = (Dext > 0 && Dint < Dext)
    ? 32 * Mbe * Dext / (Math.PI * (Math.pow(Dext,4) - Math.pow(Dint,4)))
      + 4 * D47 * 9.81 / (Math.PI * (Dext*Dext - Dint*Dint))
      + L * 8000 * 9.81
    : Infinity;

  document.getElementById('sh_D55').value = fmtS(D55 / 1e6, 2);
  document.getElementById('sh_D58').value = fmtS(D58 / 1e6, 2);
  document.getElementById('sh_D59').value = fmtS(D59 / 1e6, 2);

  setPass('sh_F58', D58 <= D55);
  setPass('sh_F59', D59 <= D55);

  // ── Critical speeds ───────────────────────────────
  // Tubular  D69
  const sqrtEoRho = Math.sqrt(200e9 / 8000);  // ≈ 5000 m/s
  const denom = L * Math.sqrt(L + Sb) * Math.sqrt(D47 + D48 / 4);

  const D69 = (denom > 0)
    ? 5.33 * 60 * Math.sqrt(Math.pow(Dext,4) - Math.pow(Dint,4)) * sqrtEoRho / denom
    : 0;

  // Solid  D70  – uses POWER(D56*0.0254,4)^0.5 = (D56*0.0254)^2
  const denomSol = L * Math.sqrt(L + Sb) * Math.sqrt(D47 + D49 / 4);
  const D70 = (denomSol > 0)
    ? 5.33 * 60 * (D56_m * D56_m) * sqrtEoRho / denomSol
    : 0;

  document.getElementById('sh_D69').value = fmtS(D69, 1);
  document.getElementById('sh_D70').value = fmtS(D70, 1);

  setPass('sh_F69', D69 * 0.9 >= rpm);
  setPass('sh_F70', D70 * 0.9 >= rpm);

  // ── Gearmotor MR shaft ────────────────────────────
  // D83 / Z52: same bending formula but using 1045 steel SIGMAy & D49 as weight
  const D83 = solveShaftDiam(Mbe, D49, L, sigy_mr);

  // Required radial load  D63
  // = ((L * Mb/L) / (D64_mm*1.5/1000)) * 1.5 = Mb * 1000 / D64_mm
  const D63 = D64 > 0 ? Mb * 1000 / D64 : 0;

  document.getElementById('sh_D83').value = fmtS(D83, 2);
  document.getElementById('sh_D63').value = fmtS(D63, 1);
  setPass('sh_F65', D63 <= D65);
}

// =====================================================
// TAB SWITCHING
// =====================================================

function switchTab(n) {
  [1, 2, 3].forEach(i => {
    document.getElementById('page' + i).classList.toggle('hidden', i !== n);
    document.getElementById('tabBtn' + i).classList.toggle('active', i === n);
  });
  if (n === 2) calculateShaft();
  if (n === 3 && typeof calculateOG === 'function') calculateOG();
}

// =====================================================
// ATTACH LISTENERS
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  const shaftInputIds = [
    'sh_material', 'sh_diam_in', 'sh_schedule',
    'sh_FS', 'sh_SF', 'sh_Sb',
    'sh_coup_diam', 'sh_coup_L',
    'sh_L1', 'sh_L2', 'sh_L3',
    'sh_D64', 'sh_D65',
  ];
  shaftInputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', calculateShaft);
      el.addEventListener('input',  calculateShaft);
    }
  });
});
