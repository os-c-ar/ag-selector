'use strict';

function getAgitatorGeometry() {
  const total = Number(document.getElementById('alturaTotal').value);
  const offsets = [];
  const heights = [];
  let offset = 0;
  for (let n = 1; n <= 4; n++) {
    const model = document.getElementById('modelo' + n).value;
    const data = Object.hasOwn(PROPELLERS, model) ? PROPELLERS[model] : PROPELLERS['N.A.'];
    const active = data.D > 0;
    const input = document.getElementById(n === 1 ? 'pctFondo' : 'pctSeparacion' + n);
    const percentage = Number(input.value);
    const valid = input.value !== '' && Number.isFinite(percentage) && percentage >= 0;
    input.closest('.propeller-position').classList.toggle('hidden', !active);
    if (n > 1 && active) offset += valid ? percentage / 100 * data.D / 1000 : NaN;
    offsets.push(active ? offset : null);
    if (n === 1) heights.push(active ? (valid ? percentage / 100 * data.D / 1000 : NaN) : 0);
  }
  const mode = document.getElementById('shaftLengthMode').value;
  const manual = document.getElementById('shaftLengthManual');
  manual.disabled = mode !== 'manual';
  const automatic = total - heights[0];
  const length = mode === 'manual' ? (manual.value === '' ? NaN : Number(manual.value)) : automatic;
  const clearance = total - length;
  const positions = offsets.map(value => value === null ? null : clearance + value);
  return { length, automatic, clearance, positions, arms: offsets.map(value => value === null ? 0 : length - value) };
}

function updateAgitatorGeometry() {
  const geometry = getAgitatorGeometry();
  for (let n = 1; n <= 4; n++) {
    const arm = geometry.arms[n - 1];
    document.getElementById('og_L' + n).value = Number.isFinite(arm) ? String(arm) : '';
    document.getElementById('og_L' + n).readOnly = true;
  }
  for (const [id, n] of [['sh_L3', 2], ['sh_L2', 3], ['sh_L1', 4]]) {
    const arm = geometry.arms[n - 1];
    document.getElementById(id).value = Number.isFinite(arm) ? String(arm) : '';
    document.getElementById(id).readOnly = true;
  }
  const total = Number(document.getElementById('alturaTotal').value);
  const invalid = !Number.isFinite(geometry.length) || geometry.length <= 0 ||
    geometry.positions.some(h => h !== null && (!Number.isFinite(h) || h < 0 || h > total));
  const note = document.getElementById('geometryWarning');
  note.classList.toggle('hidden', !invalid);
  note.textContent = invalid
    ? 'Revise la longitud del eje y las separaciones: hay propelas fuera de la altura del tanque o datos de posición no válidos.'
    : '';
  return geometry;
}

function captureAgitatorPositions() {
  return {
    percentages: ['pctFondo', 'pctSeparacion2', 'pctSeparacion3', 'pctSeparacion4']
      .map(id => Number(document.getElementById(id).value)),
    mode: document.getElementById('shaftLengthMode').value,
    manual: document.getElementById('shaftLengthManual').value,
  };
}

function restoreAgitatorPositions(positions, legacyBottom = '90') {
  const values = positions?.percentages || [Number(legacyBottom), 100, 100, 100];
  ['pctFondo', 'pctSeparacion2', 'pctSeparacion3', 'pctSeparacion4'].forEach((id, i) => {
    document.getElementById(id).value = String(values[i]);
  });
  document.getElementById('shaftLengthMode').value = positions?.mode === 'manual' ? 'manual' : 'auto';
  document.getElementById('shaftLengthManual').value = positions?.manual || '';
}

document.addEventListener('DOMContentLoaded', () => {
  const updateLengthMode = () => {
    const manual = document.getElementById('shaftLengthManual');
    if (document.getElementById('shaftLengthMode').value === 'manual' && manual.value === '') {
      const length = getAgitatorGeometry().automatic;
      if (Number.isFinite(length)) manual.value = String(length);
    }
    calculate();
  };
  document.getElementById('shaftLengthMode').addEventListener('input', updateLengthMode);
  document.getElementById('shaftLengthMode').addEventListener('change', updateLengthMode);
  for (const id of ['pctSeparacion2', 'pctSeparacion3', 'pctSeparacion4', 'shaftLengthManual']) {
    document.getElementById(id).addEventListener('input', calculate);
    document.getElementById(id).addEventListener('change', calculate);
  }
});
