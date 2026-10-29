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
      cargoElaboro: fromGather.cargoElaboro || '',
      extensionElaboro: fromGather.extensionElaboro || '',
      celularElaboro: fromGather.celularElaboro || '',
      correoElaboro: fromGather.correoElaboro || '',
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
      prop1Diametro: (props[0] && props[0].diametro) || '',
      prop2Tipo: (props[1] && props[1].tipo) || '',
      prop2Modelo: (props[1] && props[1].modelo) || '',
      prop2Diametro: (props[1] && props[1].diametro) || '',
      prop3Tipo: (props[2] && props[2].tipo) || '',
      prop3Modelo: (props[2] && props[2].modelo) || '',
      prop3Diametro: (props[2] && props[2].diametro) || '',
      prop4Tipo: (props[3] && props[3].tipo) || '',
      prop4Modelo: (props[3] && props[3].modelo) || '',
      prop4Diametro: (props[3] && props[3].diametro) || '',
      agitadorSeleccionado: fromGather.agitadorSeleccionado || '',
      motoreductorSeleccionado: fromGather.motoreductorSeleccionado || '',
      codigoAgitador: fromGather.codigoAgitador || '',
      comentarios: fromGather.comentarios || '',
      consideraciones: [...document.querySelectorAll('.input-comentario-line')].map(i => i.value || ''),
      consideracionesComerciales: [...document.querySelectorAll('.input-cst-comercial-line')].map(i => i.value || ''),
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
    cargoElaboro: _offerField('cargoElaboro'),
    extensionElaboro: _offerField('extensionElaboro'),
    celularElaboro: _offerField('celularElaboro'),
    correoElaboro: _offerField('correoElaboro'),
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
    prop1Diametro: _offerField('diam1'),
    prop2Tipo: _offerField('tipo2'),
    prop2Modelo: _offerField('modelo2'),
    prop2Diametro: _offerField('diam2'),
    prop3Tipo: _offerField('tipo3'),
    prop3Modelo: _offerField('modelo3'),
    prop3Diametro: _offerField('diam3'),
    prop4Tipo: _offerField('tipo4'),
    prop4Modelo: _offerField('modelo4'),
    prop4Diametro: _offerField('diam4'),
    agitadorSeleccionado: _offerField('agitadorSeleccionado'),
    motoreductorSeleccionado: _offerField('motoreductorSeleccionado'),
    codigoAgitador: _offerText('cod_resultado'),
    comentarios: _offerField('comentarios'),
    consideraciones: [...document.querySelectorAll('.input-comentario-line')].map(i => i.value || ''),
    consideracionesComerciales: [...document.querySelectorAll('.input-cst-comercial-line')].map(i => i.value || ''),
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
  const map = {
    fecha: data.fecha,
    cliente: data.cliente,
    contacto_cliente: data.contactoCliente,
    ciudad_cliente: data.ciudadCliente,
    telefono_cliente: data.telefonoCliente,
    celular_cliente: data.celularCliente,
    correo_cliente: data.correoCliente,
    cotizacion: data.cotizacion,
    elaboro: data.elaboro,
    elaboro_cargo: data.cargoElaboro,
    elaboro_extension: data.extensionElaboro,
    elaboro_celular: data.celularElaboro,
    elaboro_correo: data.correoElaboro,
    elaborador_nombre: data.elaboro,
    elaborador_cargo: data.cargoElaboro,
    elaborador_extension: data.extensionElaboro,
    elaborador_celular: data.celularElaboro,
    elaborador_correo: data.correoElaboro,
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
    propela1_diametro: data.prop1Diametro,
    propela2_tipo: data.prop2Tipo,
    propela2_modelo: data.prop2Modelo,
    propela2_diametro: data.prop2Diametro,
    propela3_tipo: data.prop3Tipo,
    propela3_modelo: data.prop3Modelo,
    propela3_diametro: data.prop3Diametro,
    propela4_tipo: data.prop4Tipo,
    propela4_modelo: data.prop4Modelo,
    propela4_diametro: data.prop4Diametro,
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
    potencia_instalada: data.motorCercano,
    modelo_estandar: typeof getAppliedStandard === 'function' && getAppliedStandard()
      ? getAppliedStandard().model : '',
  };

  // One variable per line typed under "CONSIDERACIONES TÉCNICAS PARTICULARES":
  // {{consideracion1}}, {{consideracion2}}, ... up to CONSIDERACIONES_MAX.
  const CONSIDERACIONES_MAX = 10;
  const consideraciones = Array.isArray(data.consideraciones) ? data.consideraciones : [];
  for (let i = 1; i <= Math.max(CONSIDERACIONES_MAX, consideraciones.length); i++) {
    map[`consideracion${i}`] = consideraciones[i - 1] || '';
  }
  const comerciales = Array.isArray(data.consideracionesComerciales) ? data.consideracionesComerciales : [];
  for (let i = 1; i <= Math.max(CONSIDERACIONES_MAX, comerciales.length); i++) {
    map[`consideracion_comercial${i}`] = comerciales[i - 1] || '';
  }

  Object.assign(map, data.costeoOferta);
  return map;
}

const _OFFER_W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function _offerParseXml(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) {
    throw new Error('El documento Word contiene XML no valido.');
  }
  return doc;
}

// Join only split placeholders, never the surrounding text or text across tabs/breaks.
function _normalizePlaceholderRuns(xml) {
  const doc = _offerParseXml(xml);
  function normalize(nodes) {
    const combined = nodes.map(t => t.textContent).join('');
    const matches = [...combined.matchAll(/\{\{\s*\w+\s*\}\}|\$\{\s*\w+\s*\}|\[\[\s*\w+\s*\]\]/g)];
    const starts = [];
    let offset = 0;
    nodes.forEach(t => { starts.push(offset); offset += t.textContent.length; });
    for (const match of matches.reverse()) {
      const start = match.index;
      const end = start + match[0].length;
      const first = nodes.findIndex((t, i) => start >= starts[i] && start < starts[i] + t.textContent.length);
      const last = nodes.findIndex((t, i) => end > starts[i] && end <= starts[i] + t.textContent.length);
      if (first < 0 || last <= first) continue;
      const suffix = nodes[last].textContent.slice(end - starts[last]);
      nodes[first].textContent = nodes[first].textContent.slice(0, start - starts[first]) + match[0];
      nodes[first].setAttribute('xml:space', 'preserve');
      for (let i = first + 1; i < last; i++) nodes[i].textContent = '';
      nodes[last].textContent = suffix;
      nodes[last].setAttribute('xml:space', 'preserve');
    }
  }
  Array.from(doc.getElementsByTagNameNS(_OFFER_W_NS, 'p')).forEach(p => {
    let nodes = [];
    const flush = () => { normalize(nodes); nodes = []; };
    const visit = element => {
      if (element !== p && element.namespaceURI === _OFFER_W_NS &&
          ['p', 'tab', 'br', 'cr', 'drawing', 'pict', 'fldChar', 'instrText', 'sym'].includes(element.localName)) {
        flush();
        return;
      }
      if (element.namespaceURI === _OFFER_W_NS && element.localName === 't') nodes.push(element);
      else Array.from(element.children).forEach(visit);
    };
    visit(p);
    flush();
  });

  let serialized = new XMLSerializer().serializeToString(doc);
  const declMatch = xml.match(/^<\?xml[^>]*\?>/);
  if (declMatch && !/^<\?xml/.test(serialized)) serialized = declMatch[0] + serialized;
  return serialized;
}

async function _offerDiagramPng() {
  drawTankDiagram();
  drawTankTopView();
  const svgs = ['tankDiagram', 'tankDiagramTop'].map(id => document.getElementById(id));
  if (svgs.some(svg => !svg || svg.textContent.includes('Ingrese dimensiones válidas'))) {
    throw new Error('Ingrese dimensiones validas para incluir el diagrama general en la oferta.');
  }
  const width = 580;
  let height = 0;
  const parts = svgs.map(svg => {
    const clone = svg.cloneNode(true);
    const box = svg.viewBox.baseVal;
    const scaledHeight = width * box.height / box.width;
    clone.setAttribute('x', '0');
    clone.setAttribute('y', String(height));
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(scaledHeight));
    height += scaledHeight;
    return new XMLSerializer().serializeToString(clone);
  });
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="white"/>${parts.join('')}</svg>`;
  const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('No se pudo convertir el diagrama general a imagen.'));
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = Math.ceil(height * 2);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('El navegador no permite exportar el diagrama general.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('No se pudo crear la imagen PNG del diagrama general.');
    return { bytes: await blob.arrayBuffer(), width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function _insertOfferDiagram(zip, xml) {
  if (!/\{\{\s*diagrama_general\s*\}\}|\$\{\s*diagrama_general\s*\}|\[\[\s*diagrama_general\s*\]\]/i.test(xml)) {
    return { xml, replacements: 0 };
  }
  const doc = _offerParseXml(xml);
  const paragraphs = Array.from(doc.getElementsByTagNameNS(_OFFER_W_NS, 'p')).filter(p => {
    if (p.getElementsByTagNameNS(_OFFER_W_NS, 'p').length) return false;
    const text = Array.from(p.getElementsByTagNameNS(_OFFER_W_NS, 't')).map(t => t.textContent).join('');
    return /\{\{\s*diagrama_general\s*\}\}|\$\{\s*diagrama_general\s*\}|\[\[\s*diagrama_general\s*\]\]/i.test(text);
  });
  for (const p of paragraphs) {
    const text = Array.from(p.getElementsByTagNameNS(_OFFER_W_NS, 't')).map(t => t.textContent).join('');
    if (!/^\s*(\{\{\s*diagrama_general\s*\}\}|\$\{\s*diagrama_general\s*\}|\[\[\s*diagrama_general\s*\]\])\s*$/i.test(text) ||
        p.getElementsByTagNameNS(_OFFER_W_NS, 'drawing').length ||
        p.getElementsByTagNameNS(_OFFER_W_NS, 'pict').length) {
      throw new Error('Coloque la variable diagrama_general sola en un parrafo de la plantilla.');
    }
  }
  if (!paragraphs.length) throw new Error('No se pudo localizar la marca diagrama_general en un parrafo de Word.');
  const image = await _offerDiagramPng();
  const relNs = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const relPath = 'word/_rels/document.xml.rels';
  const relFile = zip.file(relPath);
  const rels = _offerParseXml(relFile ? relFile.asText() : `<Relationships xmlns="${relNs}"/>`);
  let number = 1;
  while (zip.file(`word/media/nfs-diagrama-${number}.png`) ||
         Array.from(rels.documentElement.children).some(el => el.getAttribute('Id') === `rIdNfsDiagram${number}`)) number++;
  const relationshipId = `rIdNfsDiagram${number}`;
  const filename = `nfs-diagrama-${number}.png`;
  zip.file(`word/media/${filename}`, image.bytes);
  const relation = rels.createElementNS(relNs, 'Relationship');
  relation.setAttribute('Id', relationshipId);
  relation.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image');
  relation.setAttribute('Target', `media/${filename}`);
  rels.documentElement.appendChild(relation);
  zip.file(relPath, new XMLSerializer().serializeToString(rels));
  const typesFile = zip.file('[Content_Types].xml');
  if (!typesFile) throw new Error('La plantilla no contiene [Content_Types].xml.');
  const types = _offerParseXml(typesFile.asText());
  if (!Array.from(types.documentElement.children).some(el => el.localName === 'Default' && el.getAttribute('Extension').toLowerCase() === 'png')) {
    const entry = types.createElementNS(types.documentElement.namespaceURI, 'Default');
    entry.setAttribute('Extension', 'png');
    entry.setAttribute('ContentType', 'image/png');
    types.documentElement.appendChild(entry);
    zip.file('[Content_Types].xml', new XMLSerializer().serializeToString(types));
  }
  const wpNs = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
  let drawingId = Math.max(0, ...Array.from(doc.getElementsByTagNameNS(wpNs, 'docPr')).map(el => Number(el.getAttribute('id')) || 0)) + 1;
  const scale = Math.min(5 * 914400 / image.width, 6.5 * 914400 / image.height);
  const cx = Math.round(image.width * scale);
  const cy = Math.round(image.height * scale);
  for (const p of paragraphs) {
    const drawing = _offerParseXml(`<w:r xmlns:w="${_OFFER_W_NS}" xmlns:wp="${wpNs}" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${drawingId++}" name="Diagrama general" descr="Vista de elevacion y vista superior del tanque y agitador"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="${filename}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relationshipId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`);
    Array.from(p.childNodes).forEach(child => {
      if (!(child.namespaceURI === _OFFER_W_NS && child.localName === 'pPr')) p.removeChild(child);
    });
    p.appendChild(doc.importNode(drawing.documentElement, true));
  }
  return { xml: new XMLSerializer().serializeToString(doc), replacements: paragraphs.length };
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
      out = out.replace(rx, () => value);
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
    _wP(`Cargo: ${data.cargoElaboro}`),
    _wP(`Extension: ${data.extensionElaboro}`),
    _wP(`Celular: ${data.celularElaboro}`),
    _wP(`Correo: ${data.correoElaboro}`),
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
    ...(data.costeoOferta ? [
      _wP('INFORMACION COMERCIAL PARA EL CLIENTE', true),
      _wP(`Validez de la oferta: ${data.costeoOferta.validez_oferta}`),
      _wP(`Tiempo de entrega: ${data.costeoOferta.tiempo_entrega}`),
      _wP(`Forma de pago: ${data.costeoOferta.forma_pago}`),
      _wP(`Sitio de entrega: ${data.costeoOferta.sitio_entrega}`),
      _wP(`Empaque: ${data.costeoOferta.empaque}`),
      _wP(`Garantia: ${data.costeoOferta.garantia}`),
    ] : []),
    ...((data.consideracionesComerciales || []).some(line => line.trim())
      ? [
        _wP('CONSIDERACIONES COMERCIALES PARA EL CLIENTE', true),
        ...data.consideracionesComerciales.filter(line => line.trim()).map(line => _wP(line)),
      ]
      : []),
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

async function _pickOfferTemplateDocx() {
  if (window.showDirectoryPicker && window.showOpenFilePicker) {
    let directory = await NFS_HANDLES.load('offer-templates-directory');
    if (!directory) {
      alert('Seleccione la carpeta FILES\\PLANTILLAS. Se recordara como ubicacion inicial para las proximas ofertas.');
      directory = await window.showDirectoryPicker({ id: 'nfs-offer-templates', mode: 'read' });
      await NFS_HANDLES.save('offer-templates-directory', directory);
    }
    const [handle] = await window.showOpenFilePicker({
      id: 'nfs-offer-docx',
      startIn: directory,
      types: [{
        description: 'Plantilla de oferta Word',
        accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
      }],
      multiple: false,
    });
    return handle.getFile();
  }

  alert('Seleccione la plantilla Word en FILES\\PLANTILLAS. Este navegador no permite configurar la carpeta inicial del selector.');
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
    input.oncancel = () => reject(new Error('No se selecciono plantilla.'));
    input.click();
  });
}

function _offerOutputName(data) {
  const clean = value => String(value || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80);
  const quote = clean(data.cotizacion);
  const client = clean(data.cliente);
  if (!quote || !client) {
    throw new Error('Complete el numero de cotizacion y el cliente para nombrar la oferta.');
  }
  return `${quote}_${client}_AGITADOR.docx`;
}

async function generateOfferDraft() {
  try {
    const data = _offerCurrentData();
    data.costeoOferta = getCosteoOfferData();
    const anyKey = [data.cliente, data.cotizacion, data.agitadorSeleccionado, data.codigoAgitador].join('').trim();
    if (!anyKey) {
      alert('No hay datos de seleccion para generar la oferta.');
      return;
    }
    const outName = _offerOutputName(data);

    const file = await _pickOfferTemplateDocx();
    const PizZip = await _ensurePizZip();
    const arr = await file.arrayBuffer();
    const zip = new PizZip(arr);
    const docPath = 'word/document.xml';
    const f = zip.file(docPath);
    if (!f) {
      alert('La plantilla .docx no contiene word/document.xml valido.');
      return;
    }

    const originalXml = f.asText();
    const normalizedXml = _normalizePlaceholderRuns(originalXml);
    const diagram = await _insertOfferDiagram(zip, normalizedXml);
    const replaced = _replaceKnownPlaceholders(diagram.xml, data);
    const finalXml = replaced.replacements + diagram.replacements > 0
      ? replaced.xml
      : _appendOfferBlock(originalXml, data);

    zip.file(docPath, finalXml);
    const outBlob = zip.generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    _downloadBlob(outBlob, outName);

    if (typeof _showToast === 'function') {
      _showToast('✔ Oferta generada.');
    } else {
      alert('Oferta generada correctamente.');
    }
  } catch (err) {
    if (err.name === 'AbortError' || String(err && err.message || '').includes('No se selecciono plantilla')) return;
    alert('No se pudo generar la oferta:\n' + err.message);
  }
}
