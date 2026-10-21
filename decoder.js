/* =====================================================
   NFS – Agitator Code Decoder
   Inverse of coding.js (buildAgitatorCode). Given a model
   code generated with the rules in CODIGO AGITADOR 2.xlsx,
   recovers each field and renders a description + a
   schematic diagram.

   Parsing strategy
   -----------------
   The code is a concatenation of fixed-width fields
   (montaje, tipo1, n1, d1, [tipo2,n2,d2 | "-"], eje(2),
   potencia) followed by a variable-length numeric RPM run
   and a tail of single-letter OPTIONAL flags (velocidad,
   motor, linterna, sello, material, adicional). Those six
   flag code sets never share a letter with one another, so
   the tail can be parsed unambiguously left-to-right: for
   each flag, consume the next character only if it belongs
   to that flag's code set, otherwise assume its default
   (empty) value and move on.
   ===================================================== */

'use strict';

/* ── Helpers over COD (defined in coding.js) ──────────── */

/** Builds code → label map from a label → code map, skipping the default ("") entry. */
function _decInvMap(map) {
  const inv = {};
  for (const label in map) {
    const code = map[label];
    if (code === '' || code == null) continue;
    if (!(code in inv)) inv[code] = label;
  }
  return inv;
}

/** Finds the label whose code is "" (the implicit default for optional flags). */
function _decDefaultLabel(map) {
  for (const label in map) {
    if (map[label] === '') return label;
  }
  return null;
}

/* ── Core decoder ──────────────────────────────────────── */

function decodeAgitatorCode(rawCode) {
  const C = COD;
  const code = String(rawCode || '').toUpperCase().replace(/\s+/g, '');
  if (!code) return { ok: false, error: 'Ingrese un código para decodificar.' };

  const invMont  = _decInvMap(C.montaje);
  const invTipo  = _decInvMap(C.tipoPropela);
  const invNProp = _decInvMap(C.nPropelas);
  const invDiam  = _decInvMap(C.diametro);
  const invPot   = _decInvMap(C.potencia);
  const invVel   = _decInvMap(C.velocidad);
  const invMotor = _decInvMap(C.motor);
  const invLint  = _decInvMap(C.linterna);
  const invSello = _decInvMap(C.sello);
  const invMat   = _decInvMap(C.material);
  const invAdic  = _decInvMap(C.adicional);

  const warnings = [];
  const parts = [];
  let i = 0;

  const take = (n, label) => {
    if (i + n > code.length) throw new Error(`Código incompleto: falta "${label}".`);
    const s = code.substr(i, n);
    i += n;
    return s;
  };
  const peek = () => code[i];

  try {
    /* 1. Montaje */
    const cMont = take(1, 'montaje');
    const montaje = invMont[cMont] || null;
    if (!montaje) warnings.push(`Carácter de montaje "${cMont}" no reconocido (se esperaba V u H).`);
    parts.push({ code: cMont, label: 'Montaje', desc: montaje || '¿?' });

    /* 2. Propela 1 – tipo, cantidad, diámetro */
    const cT1 = take(1, 'tipo de propela 1');
    const tipo1 = invTipo[cT1] || null;
    if (!tipo1) warnings.push(`Carácter de tipo de propela 1 "${cT1}" no reconocido.`);
    parts.push({ code: cT1, label: 'Tipo P1', desc: tipo1 || '¿?' });

    const cN1 = take(1, 'cantidad de propelas 1');
    const n1 = invNProp[cN1] ? parseInt(invNProp[cN1], 10) : null;
    parts.push({ code: cN1, label: 'N° P1', desc: n1 ? `${n1} propela${n1 > 1 ? 's' : ''}` : '¿?' });

    const cD1 = take(1, 'diámetro de propela 1');
    const d1 = invDiam[cD1] ? parseInt(invDiam[cD1], 10) : null;
    parts.push({ code: cD1, label: 'Ø P1', desc: d1 ? `${d1} mm` : '¿?' });

    /* 3. Propela 2 (optional) – "-" means not applicable */
    let tipo2 = 'NO APLICA', n2 = null, d2 = null, cT2 = '–', cN2 = '–', cD2 = '-';
    if (peek() === '-') {
      take(1, 'grupo de propela 2');
    } else {
      cT2 = take(1, 'tipo de propela 2');
      tipo2 = invTipo[cT2] || null;
      if (!tipo2) warnings.push(`Carácter de tipo de propela 2 "${cT2}" no reconocido.`);

      cN2 = take(1, 'cantidad de propelas 2');
      n2 = invNProp[cN2] ? parseInt(invNProp[cN2], 10) : null;

      cD2 = take(1, 'diámetro de propela 2');
      d2 = invDiam[cD2] ? parseInt(invDiam[cD2], 10) : null;
    }
    const noP2 = tipo2 === 'NO APLICA';
    parts.push({ code: cT2, label: 'Tipo P2', desc: noP2 ? 'N/A' : (tipo2 || '¿?') });
    parts.push({ code: cN2, label: 'N° P2',   desc: noP2 ? 'N/A' : (n2 ? `${n2} prop.` : '¿?') });
    parts.push({ code: cD2, label: 'Ø P2',    desc: noP2 ? 'N/A' : (d2 ? `${d2} mm` : '¿?') });

    /* Helper: consumes a run of digits (variable length — e.g. the shaft field is
       only zero-padded to a MINIMUM of 2 digits via padStart, so shafts ≥10 m
       naturally produce 3+ digits). Falls back to a run of "?" placeholders,
       which the generator emits when the source value was undetermined. */
    const takeDigitRun = () => {
      let s = '';
      while (i < code.length && /[0-9]/.test(code[i])) { s += code[i]; i++; }
      if (!s) {
        while (i < code.length && code[i] === '?') { s += code[i]; i++; }
      }
      return s;
    };

    /* 4. Longitud del eje (decímetros, ancho variable, mínimo 2 dígitos) */
    const cEje = takeDigitRun();
    if (!cEje) throw new Error('Código incompleto: falta "longitud de eje".');
    const shaftDm = /^[0-9]+$/.test(cEje) ? parseInt(cEje, 10) : null;
    const ejeM = shaftDm != null ? shaftDm / 10 : null;
    if (shaftDm == null) warnings.push(`Longitud de eje "${cEje}" no numérica.`);
    parts.push({ code: cEje, label: 'Eje', desc: ejeM != null ? `${ejeM.toFixed(1)} m` : '¿?' });

    /* 5. Potencia del motor (normally 1 letter; "!!" marks an out-of-table value) */
    let cPot = take(1, 'potencia del motor');
    if (cPot === '!' && peek() === '!') cPot += take(1, 'potencia del motor');
    const potencia = cPot === '!!' ? null : (invPot[cPot] ?? null);
    if (potencia == null) warnings.push(`Código de potencia "${cPot}" fuera de tabla.`);
    parts.push({ code: cPot, label: 'Potencia', desc: potencia != null ? `${potencia} kW` : '¿?' });

    /* 6. RPM – run of digits (fallback: run of "?" means undetermined) */
    const cRpm = takeDigitRun();
    const rpm = /^[0-9]+$/.test(cRpm) ? parseInt(cRpm, 10) : null;
    if (cRpm && rpm == null) warnings.push('RPM no determinado en el código.');
    parts.push({ code: cRpm || '–', label: 'RPM', desc: rpm != null ? `${rpm} rpm` : '¿?' });

    /* 7. Trailing optional flags – disjoint code sets, parsed greedily */
    let velocidad = _decDefaultLabel(C.velocidad);
    let cVel = '–';
    if (peek() && invVel[peek()]) { cVel = take(1, 'velocidad'); velocidad = invVel[cVel]; }
    parts.push({ code: cVel, label: 'Vel. control', desc: velocidad === 'VELOCIDAD DIRECTA' ? 'Directa' : 'Reducida' });

    let motor = _decDefaultLabel(C.motor);
    let cMot = '–';
    if (peek() && invMotor[peek()]) { cMot = take(1, 'elemento motriz'); motor = invMotor[cMot]; }
    parts.push({ code: cMot, label: 'Motriz', desc: (motor || '').replace('MOTOR ', '').substring(0, 14) || '¿?' });

    let linterna = _decDefaultLabel(C.linterna);
    let cLint = '–';
    if (peek() && invLint[peek()]) { cLint = take(1, 'linterna'); linterna = invLint[cLint]; }
    parts.push({ code: cLint, label: 'Linterna', desc: linterna });

    let sello = _decDefaultLabel(C.sello);
    let cSel = '–';
    if (peek() && invSello[peek()]) { cSel = take(1, 'sello'); sello = invSello[cSel]; }
    parts.push({ code: cSel, label: 'Sello', desc: sello });

    let material = _decDefaultLabel(C.material);
    let cMat = '–';
    if (peek() && invMat[peek()]) { cMat = take(1, 'material'); material = invMat[cMat]; }
    parts.push({ code: cMat, label: 'Material', desc: material });

    let adicional = _decDefaultLabel(C.adicional);
    let cAdic = '–';
    if (peek() && invAdic[peek()]) { cAdic = take(1, 'adicional'); adicional = invAdic[cAdic]; }
    parts.push({ code: cAdic, label: 'Adicional', desc: adicional || '–' });

    if (i < code.length) {
      warnings.push(`Caracteres finales no reconocidos: "${code.slice(i)}".`);
    }

    return {
      ok: true,
      code,
      warnings,
      parts,
      data: {
        montaje, tipo1, n1, d1, tipo2: noP2 ? 'NO APLICA' : tipo2, n2, d2,
        ejeM, shaftDm, potencia, rpm, velocidad, motor, linterna, sello, material, adicional,
      },
    };
  } catch (e) {
    return { ok: false, error: e.message, warnings };
  }
}

/* ── Human-readable description ───────────────────────── */

function _decBuildDescription(d) {
  const s = [];

  s.push(`Agitador de montaje <strong>${d.montaje || 'DESCONOCIDO'}</strong>.`);

  s.push(
    `Propela inferior (P1): <strong>${d.tipo1 || '¿?'}</strong>` +
    (d.n1 ? `, ${d.n1} unidad${d.n1 > 1 ? 'es' : ''}` : '') +
    (d.d1 ? `, Ø ${d.d1} mm.` : '.')
  );

  if (d.tipo2 && d.tipo2 !== 'NO APLICA') {
    s.push(
      `Propela superior (P2): <strong>${d.tipo2}</strong>` +
      (d.n2 ? `, ${d.n2} unidad${d.n2 > 1 ? 'es' : ''}` : '') +
      (d.d2 ? `, Ø ${d.d2} mm.` : '.')
    );
  } else {
    s.push('Sin segunda propela (configuración de una sola etapa).');
  }

  if (d.ejeM != null) s.push(`Eje de <strong>${d.ejeM.toFixed(1)} m</strong> de longitud.`);
  if (d.potencia != null) s.push(`Motorreductor de <strong>${d.potencia} kW</strong>` + (d.rpm != null ? ` a ${d.rpm} rpm.` : '.'));

  s.push(
    `Control de velocidad <strong>${d.velocidad === 'VELOCIDAD DIRECTA' ? 'directa' : 'reducida (motorreductor)'}</strong>, ` +
    `elemento motriz <strong>${d.motor || 'TRIFASICO'}</strong>.`
  );

  s.push(`${d.linterna === 'Con linterna' ? 'Con' : 'Sin'} linterna de accionamiento.`);
  s.push(`${d.sello === 'Con sello' ? 'Con' : 'Sin'} sello mecánico.`);
  s.push(`Materiales húmedos en <strong>${d.material || '304SS'}</strong>.`);

  if (d.adicional && d.adicional !== 'NINGUNO') {
    s.push(`Característica adicional: <strong>${d.adicional}</strong>.`);
  }

  return s.join(' ');
}

/* ── Breakdown grid (reuses coding.js styles) ─────────── */

function _decRenderBreakdown(parts) {
  const box = document.getElementById('dec_breakdown');
  if (!box) return;
  box.innerHTML = parts.map(p =>
    `<div class="cod-part">
      <span class="cod-part-code">${p.code}</span>
      <span class="cod-part-label">${p.label}</span>
      <span class="cod-part-desc">${p.desc}</span>
    </div>`
  ).join('');
}

/* ── Schematic diagram ──────────────────────────────────
   Styled after the tank elevation diagram of the selection
   tab (diagram.js): a reference vessel (dashed outline,
   since the code does not encode real tank dimensions) with
   liquid, baffles, shaft/motor and propellers to relative
   scale, plus the same "Referencia" legend and a dimension
   arrow for the one length the code *does* encode (the
   shaft). ──────────────────────────────────────────────── */

function _decRenderDiagram(d) {
  const svg = document.getElementById('dec_svg');
  if (!svg) return;

  const W = 580, H = 440;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const NAVY = typeof _DIAG_NAVY === 'string' ? _DIAG_NAVY : '#0d2340';
  const DIM  = typeof _DIAG_DIM === 'string' ? _DIAG_DIM : '#475569';
  const PROPCOLS = Array.isArray(_DIAG_PROPCOLS) ? _DIAG_PROPCOLS : [NAVY, '#1a4880', '#2062a8', '#4a90c4'];

  /* Own <defs> with IDs unique to this SVG: the tab-1 tank diagrams
     (tankDiagram/tankDiagramTop) stay in the DOM when hidden and define
     the same "liqGr"/"shaftGr" ids, which makes url(#...) resolution
     ambiguous across the document and the fill silently fails to paint. */
  const E = [`<defs>
    <linearGradient id="decLiqGr" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#bfdbfe" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.4"/>
    </linearGradient>
    <linearGradient id="decShaftGr" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#374151"/>
      <stop offset="50%" stop-color="#6b7280"/>
      <stop offset="100%" stop-color="#374151"/>
    </linearGradient>
  </defs>`];

  /* ── Layout – same ML/MR margin scheme as the selection-tab elevation
     diagram (tank in the middle, propeller Ø labels just outside its
     walls, legend reserved in the right margin). ── */
  const MR = 150;
  const tankX = 165, tankW = 170;
  const tankTop = 84, tankBot = 354;
  const cx = tankX + tankW / 2;
  const mW = 74, mH = 34, mTop = 14;

  /* Reference vessel – dashed outline: the real tank size isn't part of the code */
  E.push(`<rect x="${tankX}" y="${tankTop}" width="${tankW}" height="${tankBot - tankTop}"
    fill="none" stroke="${NAVY}" stroke-width="2" stroke-dasharray="7,4"/>`);

  /* Liquid */
  const liquidY = tankTop + 16;
  E.push(`<rect x="${tankX + 2}" y="${liquidY}" width="${tankW - 4}"
    height="${tankBot - liquidY - 2}" fill="url(#decLiqGr)"/>`);

  /* Baffles */
  const bafW = 7;
  E.push(`<rect x="${tankX + 2}" y="${liquidY}" width="${bafW}" height="${tankBot - liquidY - 2}" fill="#94a3b8" rx="2"/>`);
  E.push(`<rect x="${tankX + tankW - bafW - 2}" y="${liquidY}" width="${bafW}" height="${tankBot - liquidY - 2}" fill="#94a3b8" rx="2"/>`);

  /* Motor + subtitle (power, rpm and the shaft length the code encodes) */
  E.push(`<rect x="${cx - mW / 2}" y="${mTop}" width="${mW}" height="${mH}" fill="${NAVY}" rx="5"/>`);
  E.push(`<text x="${cx}" y="${mTop + mH / 2 + 4}" text-anchor="middle" font-size="10.5"
    fill="#fff" font-family="Segoe UI,sans-serif" font-weight="700">MOTOR</text>`);
  const subtitle = [
    d.potencia != null ? d.potencia + ' kW' : '¿? kW',
    d.rpm != null ? d.rpm + ' rpm' : '¿? rpm',
    d.ejeM != null ? 'Eje ' + d.ejeM.toFixed(1) + ' m' : 'Eje ¿? m',
  ].join(' · ');
  E.push(`<text x="${cx}" y="${mTop + mH + 16}" text-anchor="middle" font-size="11.5"
    fill="${DIM}" font-family="Segoe UI,sans-serif">${subtitle}</text>`);

  /* Shaft */
  const shaftTop = mTop + mH + 4;
  const shaftBot = tankBot - 14;
  E.push(`<rect x="${cx - 3}" y="${shaftTop}" width="6" height="${shaftBot - shaftTop}" fill="url(#decShaftGr)"/>`);

  /* Propellers – the code groups propellers by (type, diameter), so n1
     (and n2, if a second group is present) means that many *separate*
     impellers stacked along the shaft at that diameter — not one bigger
     symbol. Lay them out bottom-to-top as individual P# marks, exactly
     like the selection-tab diagram (clearance + i·D spacing). */
  const hasP2 = !!(d.tipo2 && d.tipo2 !== 'NO APLICA');
  const propList = [];
  for (let i = 0; i < Math.max(d.n1 || 1, 1); i++) propList.push({ diam: d.d1 });
  if (hasP2) for (let i = 0; i < Math.max(d.n2 || 1, 1); i++) propList.push({ diam: d.d2 });

  const maxDiam = Math.max(...propList.map(p => p.diam || 0), 1);
  const maxHalf = tankW / 2 - 14;
  const scaleHalf = Dmm => (Dmm ? Math.max(24, Math.min(maxHalf, (Dmm / maxDiam) * maxHalf)) : 24);

  const drawProp = (py, Dmm, col, label) => {
    const half = scaleHalf(Dmm);
    E.push(`<line x1="${cx - half}" y1="${py + 2}" x2="${cx + half}" y2="${py + 2}"
      stroke="rgba(0,0,0,0.15)" stroke-width="7" stroke-linecap="round"/>`);
    E.push(`<line x1="${cx - half}" y1="${py}" x2="${cx + half}" y2="${py}"
      stroke="${col}" stroke-width="6" stroke-linecap="round"/>`);
    E.push(`<circle cx="${cx}" cy="${py}" r="5.5" fill="${col}"/>`);
    E.push(`<text x="${tankX - 10}" y="${py + 4}" text-anchor="end" font-size="13"
      font-weight="700" fill="${col}" font-family="Segoe UI,sans-serif">${label}</text>`);
    E.push(`<text x="${tankX + tankW + 10}" y="${py + 4}" font-size="12.5" fill="${col}"
      font-family="Segoe UI,sans-serif">${Dmm ? 'Ø ' + Dmm + ' mm' : 'Ø ¿?'}</text>`);
  };

  const pyBottom = tankBot - 24;
  const pyTop = tankTop + 30;
  const step = propList.length > 1 ? (pyBottom - pyTop) / (propList.length - 1) : 0;
  propList.forEach((p, i) => {
    const py = pyBottom - i * step;
    drawProp(py, p.diam, PROPCOLS[i % PROPCOLS.length], `P${i + 1}`);
  });

  /* Legend – same component used by the selection-tab diagram, reserved
     in the right margin so it never collides with the Ø labels. */
  if (typeof _diagLegend === 'function') {
    const activePropNames = propList.map((_, i) => `P${i + 1}`);
    _diagLegend(E, W - MR + 12, mTop + 6, null, activePropNames);
  }

  /* Captions */
  E.push(`<text x="${cx}" y="${tankBot + 20}" text-anchor="middle" font-size="11"
    fill="${DIM}" font-style="italic" font-family="Segoe UI,sans-serif">Tanque de referencia (dimensiones reales no incluidas en el código)</text>`);
  E.push(`<text x="${cx}" y="${tankBot + 38}" text-anchor="middle" font-size="12" font-weight="700"
    fill="${NAVY}" font-family="Segoe UI,sans-serif">Montaje: ${d.montaje || '¿?'}</text>`);
  if (d.montaje === 'HORIZONTAL') {
    E.push(`<text x="${cx}" y="${tankBot + 54}" text-anchor="middle" font-size="10.5"
      fill="${DIM}" font-style="italic" font-family="Segoe UI,sans-serif">(vista esquemática mostrada en orientación vertical)</text>`);
  }

  svg.innerHTML = E.join('');
}

/* ── UI wiring ─────────────────────────────────────────── */

function runDecoder() {
  const input = document.getElementById('dec_input');
  const errBox = document.getElementById('dec_error');
  const warnBox = document.getElementById('dec_warnings');
  const results = document.getElementById('dec_results');

  const result = decodeAgitatorCode(input?.value || '');

  if (!result.ok) {
    errBox.textContent = '⚠ ' + result.error;
    errBox.classList.remove('hidden');
    warnBox.classList.add('hidden');
    results.classList.add('hidden');
    return;
  }

  errBox.classList.add('hidden');
  errBox.textContent = '';

  if (result.warnings && result.warnings.length) {
    warnBox.innerHTML = result.warnings.map(w => `<li>⚠ ${w}</li>`).join('');
    warnBox.classList.remove('hidden');
  } else {
    warnBox.classList.add('hidden');
    warnBox.innerHTML = '';
  }

  document.getElementById('dec_description').innerHTML = _decBuildDescription(result.data);
  _decRenderBreakdown(result.parts);
  _decRenderDiagram(result.data);
  results.classList.remove('hidden');
}

function useGeneratedCode() {
  const code = document.getElementById('cod_resultado')?.textContent?.trim();
  const input = document.getElementById('dec_input');
  if (!code || code === '–' || !input) return;
  input.value = code;
  runDecoder();
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('dec_input');
  if (input) {
    input.addEventListener('keydown', e => { if (e.key === 'Enter') runDecoder(); });
  }
});
