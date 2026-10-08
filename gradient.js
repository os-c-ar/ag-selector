/* =====================================================
   NFS – Gradiente de Velocidad (G) – Floculación
   Fórmula de Camp y Stein:  G = √( P / (μ · V) )
   ===================================================== */

'use strict';

const GRAD_MU_DEFAULT = 0.001; // Pa·s, agua a 20°C

function gradReadNum(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const v = parseFloat(el.value);
  return isNaN(v) ? 0 : v;
}

// lee campos de la pestaña ① (formato es-CO: coma decimal, punto de miles)
function gradReadNumEsCO(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const raw = String(el.value).trim().replace(/\./g, '').replace(',', '.');
  const v = parseFloat(raw);
  return isNaN(v) ? 0 : v;
}

function gradFmt(val, dec) {
  return isFinite(val) && val > 0 ? val.toFixed(dec) : '–';
}

function gradClassify(G) {
  if (!isFinite(G) || G <= 0) return '';
  if (G < 20)  return `G = ${G.toFixed(1)} s⁻¹ – por debajo del rango típico de floculación (20–80 s⁻¹).`;
  if (G <= 80) return `G = ${G.toFixed(1)} s⁻¹ – dentro del rango típico de floculación (20–80 s⁻¹).`;
  if (G <= 300) return `G = ${G.toFixed(1)} s⁻¹ – rango típico de mezcla rápida / coagulación (100–300 s⁻¹).`;
  return `G = ${G.toFixed(1)} s⁻¹ – gradiente muy alto, revise potencia y volumen.`;
}

/* ── 2. Cálculo con datos de la pestaña ① Selección de Agitador ── */
function calculateGradientTab1() {
  const muEl = document.getElementById('grad1_mu');
  if (muEl && !muEl.value) muEl.value = GRAD_MU_DEFAULT;
  const mu = gradReadNum('grad1_mu') || GRAD_MU_DEFAULT;

  const P_kW = gradReadNumEsCO('potenciaRequerida');
  const V_m3 = gradReadNumEsCO('volumenUtil');
  const P_W  = P_kW * 1000;

  document.getElementById('grad1_P').value = gradFmt(P_W, 1);
  document.getElementById('grad1_V').value = gradFmt(V_m3, 2);

  const G = (P_W > 0 && mu > 0 && V_m3 > 0) ? Math.sqrt(P_W / (mu * V_m3)) : 0;
  document.getElementById('grad1_G').value = gradFmt(G, 1);
  document.getElementById('grad1_clasif').textContent = gradClassify(G);
}

/* ── 3. Cálculo manual ── */
function calculateGradientManual() {
  const muEl = document.getElementById('grad2_mu');
  const mu = gradReadNum('grad2_mu') || GRAD_MU_DEFAULT;
  if (muEl && !muEl.value) muEl.value = GRAD_MU_DEFAULT;

  const P = gradReadNum('grad2_P');
  const V = gradReadNum('grad2_V');

  const G = (P > 0 && mu > 0 && V > 0) ? Math.sqrt(P / (mu * V)) : 0;
  document.getElementById('grad2_G').value = gradFmt(G, 1);
  document.getElementById('grad2_clasif').textContent = gradClassify(G);
}

document.addEventListener('DOMContentLoaded', () => {
  const mu1 = document.getElementById('grad1_mu');
  if (mu1) mu1.value = GRAD_MU_DEFAULT;
  const mu2 = document.getElementById('grad2_mu');
  if (mu2) mu2.value = GRAD_MU_DEFAULT;

  const grad1Ids = ['grad1_mu'];
  grad1Ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.addEventListener('input', calculateGradientTab1); el.addEventListener('change', calculateGradientTab1); }
  });

  const grad2Ids = ['grad2_P', 'grad2_mu', 'grad2_V'];
  grad2Ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.addEventListener('input', calculateGradientManual); el.addEventListener('change', calculateGradientManual); }
  });

  calculateGradientTab1();
  calculateGradientManual();
});
