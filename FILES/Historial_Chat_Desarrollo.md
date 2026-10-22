# Historial de desarrollo – Chat de Copilot (AG_SELECTOR)

> Registro narrativo de las solicitudes y cambios realizados en esta conversación,
> de la más antigua a la más reciente. Se actualiza manualmente al cierre de cada
> tanda de cambios relevante (ver sección **"Cómo se mantiene actualizado"** al final).

---

## 2026-10-22 10:46 — Rediseño de la pestaña "Costeo Agitador" según CA_NNN_26_PRESUPUESTO.xlsx

**Solicitud:** revisar `FILES/CA_NNN_26_PRESUPUESTO.xlsx` y reorganizar la pestaña "Costeo Agitador"
con una configuración y campos de entrada similares, estética parecida, y posibilidad de descargar
el presupuesto final en un Excel casi idéntico al de referencia.

**Análisis realizado:**
- Se extrajo y analizó el XML interno del `.xlsx` de referencia (hojas **Presupuesto**, **Ingeniería**
  y **Rev**) para identificar campos, fórmulas, colores de relleno y formatos numéricos.
- Se confirmó que la hoja **Presupuesto** es la plantilla de costeo activa (encabezado, tabla de
  materiales, tabla de servicios/ingeniería, totales); **Ingeniería** es una calculadora auxiliar de
  tarifas por hora; **Rev** es solo un log de revisiones.

**Cambios implementados:**
- Reescritura completa de `costeo.js`: nuevo modelo de datos editable (`_cstState.materiales` /
  `_cstState.servicios`), filas que se pueden **agregar/editar/eliminar** libremente, motor de
  cálculo que replica exactamente las fórmulas de la hoja de referencia (validado contra los
  subtotales originales: 8.808.000 / 12.582.857,14 / 14.992.137,14).
- Rediseño de la sección `page4` en `index.html`: encabezado (Aplicación, Diligenció, Modelo, Fecha,
  Notas 1-3, Cotización/Pedido, Cantidad, TAG, Dólar hoy), tabla de materiales, tabla de servicios e
  ingeniería, y bloque de totales (imprevistos, gastos financieros, administrativos, comisión,
  pólizas, empaque, transporte, TOTAL/UNITARIO COP y USD).
- Nuevos estilos en `styles.css` para las secciones de materiales (azul), ingeniería (verde) y
  totales, reutilizando la paleta ya existente en la app.
- Exportación a Excel: función `exportCosteoToExcel()` usando **ExcelJS** (cargado on-demand desde
  CDN, mismo patrón que las demás exportaciones del proyecto) para generar un `.xlsx` con la misma
  estructura, colores por sección y **fórmulas reales de Excel** (no solo valores).
- Se corrigió un bug de caché de fórmulas: los valores "result" cacheados para las celdas con
  fórmula se tomaban de los campos ya formateados en pantalla (con separador de miles), lo que
  producía resultados truncados. Se introdujo un snapshot numérico interno (`_cstComputed`) para
  que la exportación use los números exactos, no el texto formateado.

**Validación:** pruebas en navegador (Playwright) sin errores de consola: cálculos por defecto
coinciden con la referencia, alta/baja de filas, exportación a `.xlsx` verificada extrayendo y
comparando el XML resultante, guardado/restauración de un registro de historial.

---

## 2026-10-22 11:38 — Corrección: los materiales deben usar la Base de Partes de costeo

**Solicitud:** la adición y edición de materiales (y su precio) debía seguir haciéndose contra la
**Base de Partes** (categoría → código → precio), tal como funcionaba antes del rediseño; esto se
había perdido en la reescritura.

**Cambios implementados:**
- Se reincorporó en cada fila de materiales el selector de **Categoría** (Motoreductor, Propelas,
  Acople bridado/directo, Eje tubular/macizo, Pletinas, Pernos, Placa, Otros, No aplica) y de
  **Código**, alimentado dinámicamente desde `NFS_COSTEO_DB` (`costeo_db.js`).
- Al elegir un código del catálogo se autocompletan Descripción y Unitario con el precio de la base
  de partes (los campos siguen siendo editables para ajustes puntuales).
- Casos especiales replicados del comportamiento original: **Placa** usa $50.000 por defecto si no
  hay código específico elegido; **No aplica** fuerza precio $0 y bloquea los campos; **Otros**
  habilita código/descripción/precio totalmente libres.
- Se restauró el indicador de **Estado** (✔ Válido / ⚠ No encontrado / Manual / Libre / N/A).
- Se corrigió un bug introducido en el primer intento: el campo `codigo` (texto) se estaba
  convirtiendo con un parser numérico, perdiendo el valor seleccionado.

---

## 2026-10-22 11:51 — Eliminación de columnas de verificación (etapa de ejecución, no de presupuesto)

**Solicitud:** las columnas QTY verif., Unitario verif., Parcial verif. y Diferencia pertenecen a la
etapa de ejecución del pedido, no a la etapa de presupuesto; deben eliminarse.

**Cambios implementados:**
- Se quitaron esas 4 columnas de la tabla de materiales en `index.html`, `costeo.js` (render de
  filas, cálculo, restauración de registros) y en la exportación a Excel (la columna
  "Comentarios" se recorrió para ocupar el lugar inmediato tras "Valor parcial").
- Ajuste del ancho mínimo de la tabla en `styles.css` acorde a las columnas restantes.
- Validado: los totales por defecto siguen coincidiendo con la referencia, catálogo y exportación
  siguen funcionando sin errores.

---

## 2026-10-22 12:16 — Color de la etiqueta "Consideraciones técnicas particulares - Internas"

**Solicitud:** esa etiqueta estaba en naranja/marrón (clase especial para contenido interno) y debía
quedar en el mismo azul que las demás secciones.

**Cambios implementados:**
- Se quitó la clase `section-title-internal` del `<h2>` correspondiente en `index.html` (hereda el
  azul estándar de `.section-title`).
- Se eliminó la regla CSS `.section-title-internal` en `styles.css` por quedar sin uso.

---

## 2026-10-22 12:18 — Intercambio de orden de las secciones de consideraciones técnicas

**Solicitud:** intercambiar el orden de "Para el cliente en oferta" e "Internas" (y sus campos).

**Cambios implementados:**
- Se invirtió el orden de los dos bloques `<section class="card">` en `index.html`: ahora
  "Internas" aparece primero y "Para el cliente en oferta" después.

---

## 2026-10-22 12:20 — Resaltado de la etiqueta "Para el cliente en oferta"

**Solicitud:** la etiqueta "Para el cliente en oferta" debía resaltar con un naranja llamativo, y el
texto "PARA EL CLIENTE EN OFERTA" debía verse más grande, en negrita y en un color contrastante.

**Cambios implementados:**
- Nueva clase `.section-title-highlight` (banner naranja) y `.section-title-highlight-text`
  (texto más grande, negrita, color contrastante) aplicadas al `<h2>` de esa sección.

---

## 2026-10-22 12:23 — Revisión de diseño y recomendaciones

**Solicitud:** opinión sobre si el resultado cumple el objetivo de dejar claro que esos comentarios
van al cliente, y recomendaciones.

**Observaciones entregadas:**
1. El naranja ya se usa en el resto de la app como "advertencia" (estados `cst-status-warn`, campos
   resaltados en costeo); podía generar una leve ambigüedad semántica.
2. No depender solo del color (accesibilidad / daltonismo).
3. Riesgo de bajo contraste del texto amarillo si cae sobre la zona más clara del degradado.

**Recomendaciones propuestas:** iconos distintivos (🔒 interno / 📤 cliente), una frase explicativa
bajo cada título, reforzar el contraste del texto resaltado, y —como alternativa opcional si
preocupaba el choque con "naranja = advertencia"— usar un verde institucional en vez de naranja.

---

## 2026-10-22 12:26 — Implementación de las recomendaciones (parte 1)

**Solicitud:** proceder con las recomendaciones.

**Cambios implementados:**
- Icono 🔒 antepuesto al título "...INTERNAS" e icono 📤 al título "...PARA EL CLIENTE EN OFERTA".
- Párrafo `.section-note` bajo cada título explicando su alcance ("Uso interno: no se envían al
  cliente..." / "Se incluyen tal cual en el documento de oferta...").
- `text-shadow` sutil en `.section-title-highlight-text` para mantener legibilidad del texto
  resaltado independientemente de en qué punto del degradado caiga.

---

## 2026-10-22 12:31 — Implementación de las recomendaciones (parte 2): verde institucional

**Solicitud:** el usuario notó que la alternativa de cambiar el naranja por un verde institucional no
se había aplicado (se había presentado como opción, no como cambio firme). Tras confirmar mediante
una pregunta directa, se solicitó aplicar el verde.

**Cambios implementados:**
- `.section-title-highlight` ahora usa un degradado verde institucional
  (`#166534 → #22c55e`) en vez de naranja, evitando el choque semántico con "naranja = advertencia"
  usado en el resto de la app. Se conservan el icono 📤, el texto resaltado en amarillo con
  `text-shadow`, y la frase explicativa.

---

## 2026-10-22 12:31 — Creación de este historial

**Solicitud:** crear un archivo en `FILES/` con el historial más completo de este chat, y evaluar
cómo mantenerlo actualizado a medida que avance el proceso.

**Cambio implementado:** este mismo archivo (`FILES/Historial_Chat_Desarrollo.md`).

---

## 2026-10-22 12:34 — Trazabilidad técnica vía git commit

**Solicitud:** proceder con la alternativa complementaria propuesta anteriormente: confirmar
(`git commit`) los cambios de este chat con mensajes descriptivos, para tener un historial técnico
verificable vía `git log` independiente de la conversación.

**Cambios implementados:**
- Se dividieron los cambios acumulados en 3 commits lógicos (separando hunks por tema, no solo por
  archivo, incluso dentro de `index.html` y `styles.css` que mezclaban ambos temas):
  1. `8652635` — Costeo Agitador: rediseño basado en hoja Presupuesto, catálogo de partes y
     exportación a Excel (`costeo.js`, `records.js`, y los fragmentos de `index.html`/`styles.css`
     correspondientes a la pestaña de costeo).
  2. `fbd38e7` — Consideraciones técnicas: reordena secciones y destaca la de cliente en oferta
     (fragmentos de `index.html`/`styles.css` correspondientes a esas dos secciones).
  3. `c7dc084` — docs: agrega este historial narrativo.
- `FILES/CA_NNN_26_PRESUPUESTO.xlsx` (el archivo de referencia que ya existía en la carpeta antes de
  este chat) quedó **sin confirmar** (untracked); no es un cambio hecho en esta conversación, así que
  no se incluyó en los commits salvo que se pida explícitamente.
- Los 3 commits quedaron en la rama `main` local, **adelante de `origin/main`** (no se hizo `git
  push`); si se desea publicarlos al remoto, debe solicitarse explícitamente.

---

## Cómo se mantiene actualizado

Este archivo **no se regenera automáticamente** (es un documento narrativo, no un reporte generado
por un script ni por un hook de git). La forma en que se mantiene al día es:

1. **Dentro de esta misma conversación**: al cierre de cada tanda de cambios relevante, se añade una
   nueva entrada fechada al final de este archivo, siguiendo el mismo formato de las anteriores. Esto
   se hace como parte del flujo normal de trabajo del asistente en este chat, sin que el usuario deba
   pedirlo cada vez — basta con continuar la conversación.
2. **Si se abre un chat nuevo** (otra sesión), el asistente no tiene memoria automática de esta
   conversación a menos que se le indique continuarla o se le pida leer este archivo como contexto;
   en ese caso conviene pedir explícitamente "actualiza `FILES/Historial_Chat_Desarrollo.md` con lo
   avanzado en este chat".
3. **Trazabilidad técnica vía git (activa desde 2026-10-22 12:34)**: los cambios de este chat se
   van confirmando con `git commit` y mensajes descriptivos tras cada tanda aceptada; `git log`
   queda como fuente de verdad técnica (diffs exactos, autoría, fecha), y este Markdown sigue
   sirviendo como resumen narrativo legible en español. Los commits quedan en `main` local; **no se
   publican al remoto (`git push`) a menos que se solicite explícitamente**.
