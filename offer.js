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

function _offerText(id) {
  const el = document.getElementById(id);
  return el ? String(el.textContent || '').trim() : '';
}

function _offerCurrentData() {
  const fromGather = (typeof gatherSelectionData === 'function') ? gatherSelectionData() : null;
  if (fromGather) {
    const props = Array.isArray(fromGather.propelas) ? fromGather.propelas : [];
    const res = fromGather.resultados || {};
    return {
      fecha: fromGather.fecha || '',
      cliente: fromGather.cliente || '',
      contactoCliente: fromGather.contactoCliente || '',
      ciudadCliente: fromGather.ciudadCliente || '',
      telefonoCliente: fromGather.telefonoCliente || '',
      celularCliente: fromGather.celularCliente || '',
      correoCliente: fromGather.correoCliente || '',
      cotizacion: fromGather.cotizacion || '',
      elaboro: fromGather.elaboro || '',
      nombreTanque: fromGather.nombreTanque || '',
      tagTanque: fromGather.tagTanque || '',
      tagAgitador: fromGather.tagAgitador || '',
      tipoTanque: fromGather.tipoTanque || '',
      diametro: fromGather.diametro || '',
      ancho: fromGather.ancho || '',
      longitud: fromGather.longitud || '',
      alturaUtil: fromGather.alturaUtil || '',
      alturaTotal: fromGather.alturaTotal || '',
      bafles: fromGather.bafles || '',
      paramCirculacion: fromGather.paramCirculacion || '',
      proceso: fromGather.proceso || '',
      viscosidad: fromGather.viscosidad || '',
      densidad: fromGather.densidad || '',
      rpm: fromGather.rpm || '',
      pctFondo: fromGather.pctFondo || '',
      prop1Tipo: (props[0] && props[0].tipo) || '',
      prop1Modelo: (props[0] && props[0].modelo) || '',
      prop2Tipo: (props[1] && props[1].tipo) || '',
      prop2Modelo: (props[1] && props[1].modelo) || '',
      prop3Tipo: (props[2] && props[2].tipo) || '',
      prop3Modelo: (props[2] && props[2].modelo) || '',
      prop4Tipo: (props[3] && props[3].tipo) || '',
      prop4Modelo: (props[3] && props[3].modelo) || '',
      agitadorSeleccionado: fromGather.agitadorSeleccionado || '',
      motoreductorSeleccionado: fromGather.motoreductorSeleccionado || '',
      codigoAgitador: fromGather.codigoAgitador || '',
      comentarios: fromGather.comentarios || '',
      cod_tipo1: fromGather.cod_tipo1 || '',
      cod_num1: fromGather.cod_num1 || '',
      cod_diam1: fromGather.cod_diam1 || '',
      cod_tipo2: fromGather.cod_tipo2 || '',
      cod_num2: fromGather.cod_num2 || '',
      cod_diam2: fromGather.cod_diam2 || '',
      cod_velocidad: fromGather.cod_velocidad || '',
      cod_motor: fromGather.cod_motor || '',
      cod_linterna: fromGather.cod_linterna || '',
      cod_sello: fromGather.cod_sello || '',
      cod_material: fromGather.cod_material || '',
      cod_adicional: fromGather.cod_adicional || '',
      monedaOferta: 'COP (Pesos colombianos)',
      sitioEntrega: 'En sus instalaciones en territorio nacional',
      areaSuperficial: res.areaSuperficial || '',
      volumenUtil: res.volumenUtil || '',
      diametroEquiv: res.diametroEquiv || '',
      factorViscosidad: res.factorViscosidad || '',
      intensidadRecomendada: res.intensidadRecomendada || '',
      numPropelas: res.numPropelas || '',
      rpmRef: res.rpmRef || '',
      rpmMax: res.rpmMax || '',
      caudal1: res.caudal1 || '',
      caudal2: res.caudal2 || '',
      caudal3: res.caudal3 || '',
      caudal4: res.caudal4 || '',
      vueltas: res.vueltas || '',
      potAgua1: res.potAgua1 || '',
      potAgua2: res.potAgua2 || '',
      potAgua3: res.potAgua3 || '',
      potAgua4: res.potAgua4 || '',
      potAguaTotal: res.potAguaTotal || '',
      longitudEje: res.longitudEje || '',
      nivelAgitacion: res.nivelAgitacion || '',
      estadoAgitacion: res.estadoAgitacion || '',
      potenciaRequerida: res.potenciaRequerida || '',
      motorCercano: res.motorCercano || '',
    };
  }

  return {
    fecha: _offerField('fecha'),
    cliente: _offerField('cliente'),
    contactoCliente: _offerField('contactoCliente'),
    ciudadCliente: _offerField('ciudadCliente'),
    telefonoCliente: _offerField('telefonoCliente'),
    celularCliente: _offerField('celularCliente'),
    correoCliente: _offerField('correoCliente'),
    cotizacion: _offerField('cotizacion'),
    elaboro: _offerField('elaboro'),
    nombreTanque: _offerField('nombreTanque'),
    tagTanque: _offerField('tagTanque'),
    tagAgitador: _offerField('tagAgitador'),
    tipoTanque: _offerField('tipoCircular') ? (document.getElementById('tipoCircular').checked ? 'CIRCULAR' : 'RECTANGULAR') : '',
    diametro: _offerField('diametro'),
    ancho: _offerField('ancho'),
    longitud: _offerField('longitud'),
    alturaUtil: _offerField('alturaUtil'),
    alturaTotal: _offerField('alturaTotal'),
    bafles: (document.getElementById('baflesSi') && document.getElementById('baflesSi').checked) ? 'SI' : 'NO',
    paramCirculacion: (document.querySelector('input[name="paramCirculacion"]:checked') || {}).value || '',
    proceso: _offerField('proceso'),
    viscosidad: _offerField('viscosidad'),
    densidad: _offerField('densidad'),
    rpm: _offerField('rpm'),
    pctFondo: _offerField('pctFondo'),
    prop1Tipo: _offerField('tipo1'),
    prop1Modelo: _offerField('modelo1'),
    prop2Tipo: _offerField('tipo2'),
    prop2Modelo: _offerField('modelo2'),
    prop3Tipo: _offerField('tipo3'),
    prop3Modelo: _offerField('modelo3'),
    prop4Tipo: _offerField('tipo4'),
    prop4Modelo: _offerField('modelo4'),
    agitadorSeleccionado: _offerField('agitadorSeleccionado'),
    motoreductorSeleccionado: _offerField('motoreductorSeleccionado'),
    codigoAgitador: _offerText('cod_resultado'),
    comentarios: _offerField('comentarios'),
    potenciaRequerida: _offerField('potenciaRequerida'),
    numPropelas: _offerField('numPropelas'),
    nivelAgitacion: _offerField('nivelAgitacion'),
    cod_tipo1: _offerField('cod_tipo1'),
    cod_num1: _offerField('cod_num1'),
    cod_diam1: _offerField('cod_diam1'),
    cod_tipo2: _offerField('cod_tipo2'),
    cod_num2: _offerField('cod_num2'),
    cod_diam2: _offerField('cod_diam2'),
    cod_velocidad: _offerField('cod_velocidad'),
    cod_motor: _offerField('cod_motor'),
    cod_linterna: _offerField('cod_linterna'),
    cod_sello: _offerField('cod_sello'),
    cod_material: _offerField('cod_material'),
    cod_adicional: _offerField('cod_adicional'),
    monedaOferta: 'COP (Pesos colombianos)',
    sitioEntrega: 'En sus instalaciones en territorio nacional',
    areaSuperficial: _offerField('areaSuperficial'),
    volumenUtil: _offerField('volumenUtil'),
    diametroEquiv: _offerField('diametroEquiv'),
    factorViscosidad: _offerField('factorViscosidad'),
    intensidadRecomendada: _offerField('intensidadRecomendada'),
    rpmRef: _offerField('rpmRef'),
    rpmMax: _offerField('rpmMax'),
    caudal1: _offerField('caudal1'),
    caudal2: _offerField('caudal2'),
    caudal3: _offerField('caudal3'),
    caudal4: _offerField('caudal4'),
    vueltas: _offerField('vueltas'),
    potAgua1: _offerField('potAgua1'),
    potAgua2: _offerField('potAgua2'),
    potAgua3: _offerField('potAgua3'),
    potAgua4: _offerField('potAgua4'),
    potAguaTotal: _offerField('potAguaTotal'),
    longitudEje: _offerField('longitudEje'),
    estadoAgitacion: _offerField('estadoAgitacion'),
    motorCercano: _offerField('motorCercano'),
  };
}

function _xmlEsc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function _buildOfferPlaceholderMap(data) {
  return {
    fecha: data.fecha,
    cliente: data.cliente,
    contacto_cliente: data.contactoCliente,
    ciudad_cliente: data.ciudadCliente,
    telefono_cliente: data.telefonoCliente,
    celular_cliente: data.celularCliente,
    correo_cliente: data.correoCliente,
    cotizacion: data.cotizacion,
    elaboro: data.elaboro,
    nombre_tanque: data.nombreTanque,
    tag_tanque: data.tagTanque,
    tag_agitador: data.tagAgitador,
    tipo_tanque: data.tipoTanque,
    diametro: data.diametro,
    ancho: data.ancho,
    longitud: data.longitud,
    altura_util: data.alturaUtil,
    altura_total: data.alturaTotal,
    bafles: data.bafles,
    param_circulacion: data.paramCirculacion,
    proceso: data.proceso,
    viscosidad: data.viscosidad,
    densidad: data.densidad,
    rpm: data.rpm,
    pct_fondo: data.pctFondo,
    propela1_tipo: data.prop1Tipo,
    propela1_modelo: data.prop1Modelo,
    propela2_tipo: data.prop2Tipo,
    propela2_modelo: data.prop2Modelo,
    propela3_tipo: data.prop3Tipo,
    propela3_modelo: data.prop3Modelo,
    propela4_tipo: data.prop4Tipo,
    propela4_modelo: data.prop4Modelo,
    agitador: data.agitadorSeleccionado,
    agitador_seleccionado: data.agitadorSeleccionado,
    motoreductor: data.motoreductorSeleccionado,
    motoreductor_seleccionado: data.motoreductorSeleccionado,
    codigo_agitador: data.codigoAgitador,
    comentarios: data.comentarios,
    observaciones: data.comentarios,
    cod_tipo1: data.cod_tipo1,
    cod_num1: data.cod_num1,
    cod_diam1: data.cod_diam1,
    cod_tipo2: data.cod_tipo2,
    cod_num2: data.cod_num2,
    cod_diam2: data.cod_diam2,
    cod_velocidad: data.cod_velocidad,
    cod_motor: data.cod_motor,
    cod_linterna: data.cod_linterna,
    cod_sello: data.cod_sello,
    cod_material: data.cod_material,
    cod_adicional: data.cod_adicional,
    moneda_oferta: data.monedaOferta,
    sitio_entrega: data.sitioEntrega,
    area_superficial: data.areaSuperficial,
    volumen_util: data.volumenUtil,
    diametro_equiv: data.diametroEquiv,
    factor_viscosidad: data.factorViscosidad,
    intensidad_recomendada: data.intensidadRecomendada,
    num_propelas: data.numPropelas,
    rpm_ref: data.rpmRef,
    rpm_max: data.rpmMax,
    caudal1: data.caudal1,
    caudal2: data.caudal2,
    caudal3: data.caudal3,
    caudal4: data.caudal4,
    vueltas: data.vueltas,
    pot_agua1: data.potAgua1,
    pot_agua2: data.potAgua2,
    pot_agua3: data.potAgua3,
    pot_agua4: data.potAgua4,
    pot_agua_total: data.potAguaTotal,
    longitud_eje: data.longitudEje,
    nivel_agitacion: data.nivelAgitacion,
    estado_agitacion: data.estadoAgitacion,
    potencia_requerida: data.potenciaRequerida,
    motor_cercano: data.motorCercano,
  };
}

function _replaceKnownPlaceholders(xml, data) {
  const map = _buildOfferPlaceholderMap(data);

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
    _wP(`Contacto: ${data.contactoCliente}`),
    _wP(`Ciudad: ${data.ciudadCliente}`),
    _wP(`Telefono: ${data.telefonoCliente}`),
    _wP(`Celular: ${data.celularCliente}`),
    _wP(`Correo: ${data.correoCliente}`),
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
