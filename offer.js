'use strict';

async function _ensurePizZip() {
  if (window.PizZip) return window.PizZip;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/pizzip@3.1.6/dist/pizzip.min.js';
    script.async = true;
    script.onload = () => {
      if (window.PizZip) resolve(window.PizZip);
      else reject(new Error('No se pudo inicializar PizZip.'));
    };
    script.onerror = () => reject(new Error('No se pudo cargar PizZip desde CDN.'));
    document.head.appendChild(script);
  });
}

function _offerField(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || '') : '';
}

function _offerCurrentData() {
  const fromGather = (typeof gatherSelectionData === 'function') ? gatherSelectionData() : null;
  if (fromGather) {
    return {
      fecha: fromGather.fecha || '',
      cliente: fromGather.cliente || '',
      cotizacion: fromGather.cotizacion || '',
      elaboro: fromGather.elaboro || '',
      nombreTanque: fromGather.nombreTanque || '',
      tagTanque: fromGather.tagTanque || '',
      tagAgitador: fromGather.tagAgitador || '',
      proceso: fromGather.proceso || '',
      viscosidad: fromGather.viscosidad || '',
      densidad: fromGather.densidad || '',
      rpm: fromGather.rpm || '',
      agitadorSeleccionado: fromGather.agitadorSeleccionado || '',
      motoreductorSeleccionado: fromGather.motoreductorSeleccionado || '',
      codigoAgitador: fromGather.codigoAgitador || '',
      comentarios: fromGather.comentarios || '',
      potenciaRequerida: (fromGather.resultados && fromGather.resultados.potenciaRequerida) || '',
      numPropelas: (fromGather.resultados && fromGather.resultados.numPropelas) || '',
      nivelAgitacion: (fromGather.resultados && fromGather.resultados.nivelAgitacion) || '',
    };
  }

  return {
    fecha: _offerField('fecha'),
    cliente: _offerField('cliente'),
    cotizacion: _offerField('cotizacion'),
    elaboro: _offerField('elaboro'),
    nombreTanque: _offerField('nombreTanque'),
    tagTanque: _offerField('tagTanque'),
    tagAgitador: _offerField('tagAgitador'),
    proceso: _offerField('proceso'),
    viscosidad: _offerField('viscosidad'),
    densidad: _offerField('densidad'),
    rpm: _offerField('rpm'),
    agitadorSeleccionado: _offerField('agitadorSeleccionado'),
    motoreductorSeleccionado: _offerField('motoreductorSeleccionado'),
    codigoAgitador: '',
    comentarios: _offerField('comentarios'),
    potenciaRequerida: _offerField('potenciaRequerida'),
    numPropelas: _offerField('numPropelas'),
    nivelAgitacion: _offerField('nivelAgitacion'),
  };
}

function _xmlEsc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function _replaceKnownPlaceholders(xml, data) {
  const map = {
    fecha: data.fecha,
    cliente: data.cliente,
    cotizacion: data.cotizacion,
    elaboro: data.elaboro,
    nombre_tanque: data.nombreTanque,
    tag_tanque: data.tagTanque,
    tag_agitador: data.tagAgitador,
    proceso: data.proceso,
    viscosidad: data.viscosidad,
    densidad: data.densidad,
    rpm: data.rpm,
    agitador: data.agitadorSeleccionado,
    motoreductor: data.motoreductorSeleccionado,
    codigo_agitador: data.codigoAgitador,
    potencia_requerida: data.potenciaRequerida,
    num_propelas: data.numPropelas,
    nivel_agitacion: data.nivelAgitacion,
    comentarios: data.comentarios,
  };

  let out = xml;
  let replacements = 0;

  Object.keys(map).forEach(key => {
    const value = _xmlEsc(map[key]);
    const patterns = [
      new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'),
      new RegExp(`\\$\\{\\s*${key}\\s*\\}`, 'gi'),
      new RegExp(`\\[\\[\\s*${key}\\s*\\]\\]`, 'gi'),
    ];
    patterns.forEach(rx => {
      const found = out.match(rx);
      if (found && found.length) replacements += found.length;
      out = out.replace(rx, value);
    });
  });

  return { xml: out, replacements };
}

function _wP(text, bold) {
  const esc = _xmlEsc(text);
  const runPr = bold ? '<w:rPr><w:b/></w:rPr>' : '';
  return `<w:p><w:r>${runPr}<w:t xml:space="preserve">${esc}</w:t></w:r></w:p>`;
}

function _appendOfferBlock(xml, data) {
  const block = [
    _wP('BORRADOR DE OFERTA - DATOS GENERADOS DESDE SELECCIONADOR', true),
    _wP(`Fecha: ${data.fecha}`),
    _wP(`Cliente: ${data.cliente}`),
    _wP(`Cotizacion/Pedido: ${data.cotizacion}`),
    _wP(`Elaboro: ${data.elaboro}`),
    _wP(`Tanque: ${data.nombreTanque}`),
    _wP(`TAG Tanque: ${data.tagTanque}`),
    _wP(`TAG Agitador: ${data.tagAgitador}`),
    _wP(`Proceso: ${data.proceso}`),
    _wP(`Viscosidad (cps): ${data.viscosidad}`),
    _wP(`Densidad (Ton/m3): ${data.densidad}`),
    _wP(`RPM: ${data.rpm}`),
    _wP(`No. Propelas: ${data.numPropelas}`),
    _wP(`Nivel de agitacion: ${data.nivelAgitacion}`),
    _wP(`Potencia requerida (kW): ${data.potenciaRequerida}`),
    _wP(`Agitador seleccionado: ${data.agitadorSeleccionado}`),
    _wP(`Motoreductor seleccionado: ${data.motoreductorSeleccionado}`),
    _wP(`Codigo agitador: ${data.codigoAgitador}`),
    _wP(`Comentarios: ${data.comentarios}`),
  ].join('');

  const sectIdx = xml.indexOf('<w:sectPr');
  if (sectIdx !== -1) {
    return xml.slice(0, sectIdx) + block + xml.slice(sectIdx);
  }

  const bodyClose = xml.lastIndexOf('</w:body>');
  if (bodyClose !== -1) {
    return xml.slice(0, bodyClose) + block + xml.slice(bodyClose);
  }

  return xml + block;
}

function _downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: fileName });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function _pickOfferTemplateDocx() {
  return new Promise((resolve, reject) => {
    const input = Object.assign(document.createElement('input'), {
      type: 'file',
      accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    input.onchange = e => {
      const file = e.target.files && e.target.files[0];
      if (file) resolve(file);
      else reject(new Error('No se selecciono plantilla.'));
    };
    input.click();
  });
}

function _offerOutputName(data) {
  const date = (data.fecha || '').replace(/-/g, '') || new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const cli = (data.cliente || 'Cliente').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 30);
  return `Borrador_Oferta_Agitador_${cli}_${date}_${hh}${mm}${ss}.docx`;
}

async function generateOfferDraft() {
  try {
    const data = _offerCurrentData();
    const anyKey = [data.cliente, data.cotizacion, data.agitadorSeleccionado, data.codigoAgitador].join('').trim();
    if (!anyKey) {
      alert('No hay datos de seleccion para generar el borrador.');
      return;
    }

    const PizZip = await _ensurePizZip();
    const file = await _pickOfferTemplateDocx();
    const arr = await file.arrayBuffer();
    const zip = new PizZip(arr);
    const docPath = 'word/document.xml';
    const f = zip.file(docPath);
    if (!f) {
      alert('La plantilla .docx no contiene word/document.xml valido.');
      return;
    }

    const originalXml = f.asText();
    const replaced = _replaceKnownPlaceholders(originalXml, data);
    const finalXml = replaced.replacements > 0
      ? replaced.xml
      : _appendOfferBlock(originalXml, data);

    zip.file(docPath, finalXml);
    const outBlob = zip.generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const outName = _offerOutputName(data);
    _downloadBlob(outBlob, outName);

    if (typeof _showToast === 'function') {
      _showToast('✔ Borrador de oferta generado.');
    } else {
      alert('Borrador de oferta generado correctamente.');
    }
  } catch (err) {
    if (String(err && err.message || '').includes('No se selecciono plantilla')) return;
    alert('No se pudo generar el borrador de oferta:\n' + err.message);
  }
}
