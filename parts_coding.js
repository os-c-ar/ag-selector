'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const reducerModels = {
    SEW: ['R57', 'R77', 'R87', 'F77', 'FA87', 'KF87', 'K97', 'KF97RM'],
    NORD: [
      'SK02', 'SK03', 'SK12', 'SK13', 'SK22', 'SK23', 'SK32', 'SK33N',
      'SK42', 'SK43', 'SK52', 'SK53', 'SK62', 'SK63', 'SK72', 'SK73',
      'SK82', 'SK83', 'SK92', 'SK93', 'SK102', 'SK103',
      'SK11E', 'SK21E', 'SK41E', 'SK51E', 'SK372.1F',
    ],
  };
  const ids = [
    'partFamily', 'partShaftDiameter', 'partShaftMaterial', 'partReducerBrand', 'partReducer',
    'partFlange', 'partBearings', 'partHeight', 'partMaterial',
  ];
  const fields = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  const codeOutput = document.getElementById('partCode');
  const description = document.getElementById('partDescription');
  const heightError = document.getElementById('partHeightError');
  const copyButton = document.getElementById('partCopy');
  const copyStatus = document.getElementById('partCopyStatus');
  let code = '';
  let copyTimer;

  const selectedDescription = field => field.selectedOptions[0].dataset.description;

  function updatePartCode() {
    const height = fields.partHeight;
    const value = height.valueAsNumber;
    const valid = height.validity.valid && Number.isSafeInteger(value);
    height.setAttribute('aria-invalid', String(!valid));
    heightError.textContent = valid ? '' : 'Ingrese una altura entera desde 200 mm, en incrementos de 10 mm.';
    heightError.classList.toggle('hidden', valid);
    clearTimeout(copyTimer);
    copyButton.textContent = 'Copiar código';
    copyStatus.textContent = '';
    copyButton.disabled = !valid;

    if (!valid) {
      code = '';
      codeOutput.textContent = 'Altura no válida';
      description.textContent = 'Corrija la altura para generar la descripción.';
      return;
    }

    code = [
      fields.partFamily.value,
      fields.partShaftDiameter.value + fields.partShaftMaterial.value,
      fields.partReducer.value,
      fields.partFlange.value,
      fields.partBearings.value,
      'H' + value,
      fields.partMaterial.value,
    ].join('-');
    codeOutput.textContent = code;
    description.textContent =
      `${selectedDescription(fields.partFamily)}; eje Ø ${Number(fields.partShaftDiameter.value)} mm, ` +
      `${selectedDescription(fields.partShaftMaterial)}; reductor ${fields.partReducerBrand.value} ${fields.partReducer.value}; ` +
      `brida de tanque ${fields.partFlange.value}; rodamientos: ${selectedDescription(fields.partBearings)}; ` +
      `altura total ${value} mm; material de la linterna: ${selectedDescription(fields.partMaterial)}.`;
  }

  fields.partReducerBrand.addEventListener('change', () => {
    fields.partReducer.replaceChildren(...reducerModels[fields.partReducerBrand.value].map(model =>
      new Option(fields.partReducerBrand.value === 'NORD' ? model.replace('SK', 'SK ') : model, model)));
    document.getElementById('partNordNote').classList.toggle('hidden', fields.partReducerBrand.value !== 'NORD');
    updatePartCode();
  });

  Object.entries(fields).filter(([id]) => id !== 'partReducerBrand').forEach(([, field]) => {
    field.addEventListener('input', updatePartCode);
    field.addEventListener('change', updatePartCode);
  });

  copyButton.addEventListener('click', async () => {
    const codeToCopy = code;
    if (!codeToCopy) return;
    clearTimeout(copyTimer);
    copyButton.textContent = 'Copiar código';
    copyStatus.textContent = '';
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error('Portapapeles no disponible');
      }
      await navigator.clipboard.writeText(codeToCopy);
      if (code !== codeToCopy) return;
      copyButton.textContent = '¡Copiado!';
      copyStatus.textContent = 'Código copiado al portapapeles.';
      copyTimer = setTimeout(() => {
        copyButton.textContent = 'Copiar código';
        copyStatus.textContent = '';
      }, 2000);
    } catch (error) {
      if (code !== codeToCopy) return;
      copyStatus.textContent = 'No se pudo copiar el código. Selecciónelo y cópielo manualmente.';
      console.error('Error al copiar el código de la linterna:', error);
    }
  });

  updatePartCode();
});
