/* =====================================================
   NFS – Eje (OG) Calculator
   Réplica exacta de "Cálculo del eje agitador_.xlsx" (hoja "Eje")
   Datos base tomados de la pestaña "① Selección de Agitador"
   ===================================================== */

'use strict';

// =====================================================
// MATERIALES DEL EJE – límites de esfuerzo derivados de SIGMA_Y (shaft.js)
// Ơs (shear) ≈ 0.30×Sy   |   Ơt (tensile) ≈ 0.435×Sy
// Ratios calibrados para reproducir 316SS = 41.4 / 60 MPa del archivo original
// =====================================================
const OG_STRESS_RATIO_S = 0.30;
const OG_STRESS_RATIO_T = 0.435;

function ogMaterialLimits(key) {
  const sy = (typeof SIGMA_Y !== 'undefined' && SIGMA_Y[key]) || SIGMA_Y['SS 316'];
  return {
    sigmaS: +(sy * OG_STRESS_RATIO_S / 1e6).toFixed(1),  // MPa
    sigmaT: +(sy * OG_STRESS_RATIO_T / 1e6).toFixed(1),  // MPa
  };
}

/** Set og_sigmaS / og_sigmaT from the selected material, then recalculate */
function ogOnMaterialChange() {
  const key = document.getElementById('og_material').value;
  const limits = ogMaterialLimits(key);
  document.getElementById('og_sigmaS').value = limits.sigmaS;
  document.getElementById('og_sigmaT').value = limits.sigmaT;
  calculateOG();
}

// =====================================================
// TUBOS COMERCIALES (HOLLOW SHAFT) 1" a 8"
// Reutiliza las tablas SCH40 / SCH80 de shaft.js: [D_in, ..., D_ext_m, D_int_m, ...]
// =====================================================
function ogPipeSizes(schedule) {
  const table = schedule === 'SCH80' ? TUBE_SCH80 : TUBE_SCH40;
  return table.filter(row => row[0] <= 8);
}

/** Format a decimal inch value as a fractional label, e.g. 1.25 → 1¼" */
function ogFmtInch(v) {
  const frac = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
  const whole = Math.floor(v);
  const rem = +(v - whole).toFixed(2);
  if (rem === 0) return whole + '"';
  return (whole > 0 ? whole : '') + (frac[rem] || rem) + '"';
}

/** Parse numbers from UI fields (supports es-CO like 1.234,56). */
function ogParseNum(raw) {
  let s = String(raw ?? '').trim();
  if (!s || s === '–' || s === '-') return 0;
  s = s.replace(/\s+/g, '');

  if (s.includes(',') && s.includes('.')) {
    // 1.234,56 -> 1234.56
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,234.56 -> 1234.56
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    // 0,3456 -> 0.3456
    s = s.replace(',', '.');
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function ogReadNum(id) {
  const el = document.getElementById(id);
  return ogParseNum(el ? el.value : '');
}

let OG_LAST_SIZES = [];

/** Build the hollow-shaft validation blocks (1" to 8") for the selected schedule */
function ogBuildHollowBlocks(schedule) {
  const container = document.getElementById('og_hollowContainer');
  if (!container) return;

  const rows = ogPipeSizes(schedule);
  OG_LAST_SIZES = rows.map(r => r[0]);

  container.innerHTML = rows.map(row => {
    const d_in = row[0];
    return `
    <div class="subsection-title">Tubo nominal ${ogFmtInch(d_in)}</div>
    <div class="form-grid">
      <div class="form-row">
        <label class="field-label">do – Diámetro externo:</label>
        <input type="text" id="og_do_${d_in}" class="input-calc" readonly />
        <span class="unit">m</span>
      </div>
      <div class="form-row">
        <label class="field-label">di – Diámetro interno:</label>
        <input type="text" id="og_di_${d_in}" class="input-calc" readonly />
        <span class="unit">m</span>
      </div>
      <div class="form-row">
        <label class="field-label">Ơs-c – Shear Stress calc:</label>
        <input type="text" id="og_shearC_${d_in}" class="input-calc" readonly />
        <span class="unit">N/m²</span>
      </div>
      <div class="form-row">
        <label class="field-label">¿Cumple shear?</label>
        <input type="text" id="og_shearOK_${d_in}" class="input-calc" readonly />
      </div>
      <div class="form-row">
        <label class="field-label">Ơt-c – Tensil Stress calc:</label>
        <input type="text" id="og_tensC_${d_in}" class="input-calc" readonly />
        <span class="unit">N/m²</span>
      </div>
      <div class="form-row">
        <label class="field-label">¿Cumple tensile?</label>
        <input type="text" id="og_tensOK_${d_in}" class="input-calc" readonly />
      </div>
    </div>`;
  }).join('');
}

/**
 * Main calculation – replicates sheet "Eje" of the original workbook.
 */
function calculateOG() {
  const schedule = (document.getElementById('og_schedule') || {}).value || 'SCH40';
  ogBuildHollowBlocks(schedule);

  // ── Datos base desde página 1 (Selección de Agitador) ──
  const P_kW = ogReadNum('motorCercano') || ogReadNum('potAguaTotal') || 0;
  const N_rpm = ogReadNum('rpm') || 0;

  document.getElementById('og_P').value = fmt(P_kW, 2);
  document.getElementById('og_N').value = fmt(N_rpm, 0);

  const C3 = P_kW * 1000;          // W
  const C5 = N_rpm / 60;           // rps
  document.getElementById('og_C3').value = fmt(C3, 1);
  document.getElementById('og_C5').value = fmt(C5, 4);

  const TQmax = C5 > 0 ? C3 / (2 * Math.PI * C5) : 0;
  document.getElementById('og_TQmax').value = fmt(TQmax, 3);

  // ── Momento flector máximo (por propela) ──
  let sumPcalc = 0;
  const Pcalc = [], Dm = [], Li = [], fHi = [];
  for (let i = 1; i <= 4; i++) {
    const potAgua = ogReadNum('potAgua' + i) || 0; // kW
    const diam_mm = ogReadNum('diam' + i) || 0;    // mm
    Pcalc[i] = potAgua * 1000;   // W
    Dm[i]    = diam_mm / 1000;   // m
    Li[i]    = ogReadNum('og_L' + i) || 0;
    fHi[i]   = ogReadNum('og_fH' + i) || 0;
    sumPcalc += Pcalc[i];

    document.getElementById('og_Pcalc' + i).value = fmt(Pcalc[i], 1);
    document.getElementById('og_D' + i).value      = fmt(Dm[i], 3);
  }

  let Mmax = 0;
  for (let i = 1; i <= 4; i++) {
    const Pi = sumPcalc > 0 ? (Pcalc[i] / sumPcalc) * C3 : 0;
    const Mi = (Dm[i] > 0 && C5 > 0) ? 0.048 * Pi * Li[i] * fHi[i] / (Dm[i] * C5) : 0;
    Mmax += Mi;
    document.getElementById('og_Pi' + i).value = fmt(Pi, 1);
    document.getElementById('og_Mi' + i).value = fmt(Mi, 2);
  }
  document.getElementById('og_Mmax').value = fmt(Mmax, 2);

  // ── Diámetro mínimo eje macizo – shear stress ──
  const sigmaS = (ogReadNum('og_sigmaS') || 0) * 1e6; // N/m2
  const dsShear_m = sigmaS > 0
    ? Math.pow(16 * Math.sqrt(TQmax * TQmax + Mmax * Mmax) / (Math.PI * sigmaS), 1 / 3)
    : 0;
  const dsShear_in = dsShear_m * 1000 / 25.4;
  document.getElementById('og_dsShear_m').value  = fmt(dsShear_m, 5);
  document.getElementById('og_dsShear_in').value = fmt(dsShear_in, 3);

  // ── Diámetro mínimo eje macizo – tensile stress ──
  const sigmaT = (ogReadNum('og_sigmaT') || 0) * 1e6; // N/m2
  const dsTensile_m = sigmaT > 0
    ? Math.pow(16 * (Mmax + Math.sqrt(TQmax * TQmax + Mmax * Mmax)) / (Math.PI * sigmaT), 1 / 3)
    : 0;
  const dsTensile_mm = dsTensile_m * 1000;
  const dsTensile_in = dsTensile_mm / 25.4;
  document.getElementById('og_dsTensile_m').value  = fmt(dsTensile_m, 5);
  document.getElementById('og_dsTensile_mm').value = fmt(dsTensile_mm, 3);
  document.getElementById('og_dsTensile_in').value = fmt(dsTensile_in, 3);

  // ── Eco del material aplicado (visible también en la sección de tubos) ──
  const materialSel = document.getElementById('og_material');
  const materialLabel = materialSel ? materialSel.options[materialSel.selectedIndex].text : '–';
  document.getElementById('og_materialEcho').value =
    `${materialLabel}  (Ơs=${fmt(sigmaS / 1e6, 1)} MPa · Ơt=${fmt(sigmaT / 1e6, 1)} MPa)`;

  // ── Validación eje tubular (hollow shaft) – 1" a 8" (SCH40/SCH80) ──
  ogPipeSizes(schedule).forEach(row => {
    const d_in = row[0];
    const doM  = row[3];   // D_ext_m
    const diM  = row[4];   // D_int_m
    const denom = Math.PI * (Math.pow(doM, 4) - Math.pow(diM, 4));

    const shearC = denom > 0 ? 16 * Math.sqrt(TQmax * TQmax + Mmax * Mmax) * doM / denom : 0;
    const tensC  = denom > 0 ? 16 * (Mmax + Math.sqrt(TQmax * TQmax + Mmax * Mmax)) * doM / denom : 0;

    document.getElementById('og_do_' + d_in).value = fmt(doM, 5);
    document.getElementById('og_di_' + d_in).value = fmt(diM, 5);
    document.getElementById('og_shearC_' + d_in).value = fmt(shearC, 1);
    document.getElementById('og_tensC_' + d_in).value  = fmt(tensC, 1);

    setPass('og_shearOK_' + d_in, sigmaS > 0 && shearC < sigmaS, 'SI', 'NO');
    setPass('og_tensOK_' + d_in, sigmaT > 0 && tensC < sigmaT, 'SI', 'NO');
  });
}

// =====================================================
// ATTACH LISTENERS
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  const ogInputIds = [
    'og_L1', 'og_fH1', 'og_L2', 'og_fH2', 'og_L3', 'og_fH3', 'og_L4', 'og_fH4',
    'og_sigmaS', 'og_sigmaT', 'og_schedule',
  ];
  ogInputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', calculateOG);
      el.addEventListener('change', calculateOG);
    }
  });
});

// =====================================================
// MEMORIA DE CÁLCULO (reporte imprimible)
// =====================================================

function generarMemoriaEje() {
  calculateOG();

  const v = id => (document.getElementById(id) || {}).value || '–';
  const nombreTanque = v('nombreTanque');
  const tagAgitador  = v('tagAgitador');
  const fecha        = v('fecha');
  const cliente      = v('cliente');

  const propRows = [1, 2, 3, 4].map(i => `
    <tr>
      <td>${i}</td>
      <td>${v('og_Pcalc' + i)}</td>
      <td>${v('og_L' + i)}</td>
      <td>${v('og_fH' + i)}</td>
      <td>${v('og_D' + i)}</td>
      <td>${v('og_Pi' + i)}</td>
      <td>${v('og_Mi' + i)}</td>
    </tr>`).join('');

  const hollowRows = OG_LAST_SIZES.map(sz => `
    <tr>
      <td>${ogFmtInch(sz)}</td>
      <td>${v('og_do_' + sz)}</td>
      <td>${v('og_di_' + sz)}</td>
      <td>${v('og_shearC_' + sz)}</td>
      <td>${v('og_shearOK_' + sz)}</td>
      <td>${v('og_tensC_' + sz)}</td>
      <td>${v('og_tensOK_' + sz)}</td>
    </tr>`).join('');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Memoria de Cálculo – Eje (OG)</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1e2a35; margin: 30px; }
  h1 { font-size: 18px; color: #0d2340; border-bottom: 3px solid #1a4880; padding-bottom: 8px; }
  h2 { font-size: 13px; color: #fff; background: #1a4880; padding: 6px 10px; margin-top: 22px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 4px; }
  th, td { border: 1px solid #c8d0d9; padding: 5px 8px; font-size: 12px; text-align: center; }
  th { background: #f5f7fa; }
  .meta { display: flex; gap: 24px; font-size: 12px; margin-bottom: 6px; flex-wrap: wrap; }
  .formula { font-family: Consolas, monospace; font-size: 11.5px; background: #f5f7fa; border: 1px dashed #c8d0d9;
             border-radius: 4px; padding: 5px 9px; display: inline-block; margin: 4px 0 10px; color: #0e6b74; }
  .result { font-weight: 700; color: #c25e00; }
  @media print { body { margin: 10mm; } }
</style>
</head>
<body>
  <h1>Memoria de Cálculo – Diseño del Eje Agitador (OG)</h1>
  <div class="meta">
    <span><b>Fecha:</b> ${fecha}</span>
    <span><b>Cliente:</b> ${cliente}</span>
    <span><b>Tanque:</b> ${nombreTanque}</span>
    <span><b>Agitador:</b> ${tagAgitador}</span>
  </div>

  <h2>1. Datos base</h2>
  <table>
    <tr><th>P – Potencia instalada (kW)</th><th>N – Velocidad (rpm)</th><th>C3 = P×1000 (W)</th><th>C5 = N/60 (rps)</th><th>Tq(max) (N.m)</th></tr>
    <tr><td>${v('og_P')}</td><td>${v('og_N')}</td><td>${v('og_C3')}</td><td>${v('og_C5')}</td><td class="result">${v('og_TQmax')}</td></tr>
  </table>
  <div class="formula">C3 = P[kW] × 1000&nbsp;&nbsp;|&nbsp;&nbsp;C5 = N[rpm] / 60&nbsp;&nbsp;|&nbsp;&nbsp;Tq(max) = C3 / (2·π·C5)</div>

  <h2>2. Max Bending Moment</h2>
  <table>
    <tr><th>#</th><th>P calc (W)</th><th>L (m)</th><th>fH</th><th>D (m)</th><th>P (W)</th><th>M (N.m)</th></tr>
    ${propRows}
  </table>
  <div class="formula">Pi = (P_calc,i / ΣP_calc) × C3&nbsp;&nbsp;|&nbsp;&nbsp;Mi = 0.048 × Pi × Li × fHi / (Di × C5)</div>
  <p><b>Mmax = ΣMi = <span class="result">${v('og_Mmax')} N.m</span></b></p>

  <h2>3. Diámetro mínimo de eje macizo</h2>
  <table>
    <tr><th>Criterio</th><th>Límite (MPa)</th><th>ds (m)</th><th>ds (in)</th></tr>
    <tr><td>Shear stress (Ơs)</td><td>${v('og_sigmaS')}</td><td class="result">${v('og_dsShear_m')}</td><td class="result">${v('og_dsShear_in')}</td></tr>
    <tr><td>Tensile stress (Ơt)</td><td>${v('og_sigmaT')}</td><td class="result">${v('og_dsTensile_m')}</td><td class="result">${v('og_dsTensile_in')}</td></tr>
  </table>
  <div class="formula">ds(shear) = [16×√(Tq²+Mmax²) / (π×Ơs)]^(1/3)</div><br/>
  <div class="formula">ds(tensile) = [16×(Mmax+√(Tq²+Mmax²)) / (π×Ơt)]^(1/3)</div>

  <h2>4. Validación del eje tubular (Hollow Shaft)</h2>
  <table>
    <tr><th>Ø nominal</th><th>do (m)</th><th>di (m)</th><th>Ơs-c (N/m²)</th><th>¿Cumple shear?</th><th>Ơt-c (N/m²)</th><th>¿Cumple tensile?</th></tr>
    ${hollowRows}
  </table>
  <div class="formula">di = do − 2×e&nbsp;&nbsp;|&nbsp;&nbsp;Ơs-c = 16×√(Tq²+Mmax²)×do / (π×(do⁴−di⁴))&nbsp;&nbsp;|&nbsp;&nbsp;Ơt-c = 16×(Mmax+√(Tq²+Mmax²))×do / (π×(do⁴−di⁴))</div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) {
    alert('El navegador bloqueó la ventana emergente. Habilite las ventanas emergentes para generar la memoria de cálculo.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
