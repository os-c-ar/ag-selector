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

## 2026-10-22 13:42 — Se incluye el archivo de referencia y se publica a origin/main

**Solicitud:** incluir `FILES/CA_NNN_26_PRESUPUESTO.xlsx` en el repositorio y hacer `git push`.

**Cambios implementados:**
- Commit `d292ddf` — agrega `FILES/CA_NNN_26_PRESUPUESTO.xlsx` (plantilla original de presupuesto
  usada como base para el rediseño de la pestaña Costeo Agitador).
- `git push`: los commits locales (incluidos los de esta conversación) quedaron publicados en
  `origin/main` (`https://github.com/os-c-ar/ag-selector`). La rama local queda sincronizada con el
  remoto ("up to date with 'origin/main'").

---

## 2026-10-22 14:01 — Nota sobre el flujo de trabajo para cambios pequeños

El usuario comentó que las respuestas, aunque muy completas, consumen muchos créditos, y preguntó
cómo proceder con cambios pequeños de HTML/CSS sin ese costo. Se acordó: agrupar varios cambios
pequeños en un solo mensaje, aligerar la validación (sin el ciclo completo de Playwright/screenshots
para tweaks puramente visuales) y agrupar tanto los commits de git como las entradas de este
historial por tanda en vez de una por cada micro-cambio.

---

## 2026-10-22 14:31 — Tanda de ajustes pequeños (A-F)

**Solicitud (6 puntos en un solo mensaje, aplicando el flujo acordado arriba):**

- **A.** En "3. SELECCIÓN AGITADOR", renombrar "Número de propelas requeridas (máx.)" a "Número de
  propelas recomendado" y mostrar el valor como entero (redondeado al más cercano).
- **B.** Revisar que no queden labels superpuestos sobre los campos de texto en Costeo Agitador tras
  el punto C.
- **C.** Eliminar los campos Nota 1, Nota 2 y Nota 3 (y sus labels) del encabezado de Costeo Agitador.
- **D.** Crear en Costeo Agitador dos secciones equivalentes a "Consideraciones técnicas
  particulares" (internas / para el cliente), cambiando "TÉCNICAS" por "COMERCIALES".
- **E.** En la tabla "Descripción de materiales": Código tan angosto como Categoría (el desplegable
  nativo sigue mostrando el texto completo al abrir), Descripción amplia, QTY angosta (máx. 2
  cifras), y Unitario con formato de miles igual al de "Valor parcial".
- **F.** Agrupar Cliente, Contacto, Ciudad, Teléfono y Celular del header en un desplegable para no
  ocupar espacio visual permanente.

**Cambios implementados:**
- `calculator.js`: etiqueta y formato (entero) de "Número de propelas recomendado"; cierre por
  clic-afuera/Escape del nuevo desplegable de datos del cliente.
- `index.html`: se quitaron Nota 1/2/3 de Costeo Agitador; nuevas secciones "CONSIDERACIONES
  COMERCIALES PARTICULARES - INTERNAS / PARA EL CLIENTE EN OFERTA" (mismo patrón visual, iconos y
  texto explicativo que las técnicas); encabezado reorganizado con un desplegable
  "👤 Datos del cliente" (reutilizando el mismo componente `<details>` del menú "☰ Opciones") para
  Cliente, Contacto, Ciudad, Teléfono y Celular — Correo y Elaboró siguen visibles.
- `costeo.js`: limpieza de referencias a `cst_nota1/2/3` (listeners, restauración de registros,
  exportación a Excel); inicialización/restauración de las nuevas listas de consideraciones
  comerciales (reutilizando `addComentarioField`/`renderComentariosFromString` de `calculator.js`,
  con ids `cst_comerciales`/`cst_comerciales_internas` para que el guardado genérico por prefijo
  `cst_` las capture automáticamente); columna Unitario de materiales ahora es un campo de texto con
  formato de miles igual a "Valor parcial" en reposo (muestra el número sin formato mientras tiene el
  foco, para edición fácil).
- `styles.css`: anchos de columna de la tabla de materiales (Categoría/Código angostos e iguales,
  Descripción amplia, QTY angosta con spinner nativo oculto para que no tape el dígito); estilos del
  nuevo desplegable "Datos del cliente" reutilizando la apariencia del menú "☰ Opciones".
- Revisión del punto B: se midieron las posiciones de todas las etiquetas/campos del formulario de
  Costeo Agitador en varios anchos de ventana (1260px, 1024px) sin encontrar superposición alguna;
  el ajuste del punto C (menos campos en el encabezado) ya deja el formulario sin ese problema.

**Validación:** sin errores de consola; cálculos (total por defecto 14.992.137, recalculo tras elegir
código de catálogo), alta/baja de filas, consideraciones comerciales (alta de fila + persistencia
vía `gatherSelectionData`), y el nuevo desplegable del header, verificados en navegador.

---

## 2026-10-23 10:18 — Indicador global y panel centralizado de vinculación de bases de datos

**Solicitud:** dado que la app tiene varias bases de datos y la idea es siempre trabajar vinculado a
cada una, se pidió (1) una indicación visual de que **todas** las bases están vinculadas y (2) una
forma de **centralizar** la vinculación, adicional al enlace que ya existe dentro de cada módulo.

**Análisis realizado:** se inventariaron los 6 "módulos tipo base de datos" de la app
(`database.js`/Procesos, `materials.js`, `costeo_db.js`/Partes de costeo, `records.js`/Historial,
`clients.js`, `staff.js`). Cada uno vincula su propio archivo JSON vía File System Access API de
forma **totalmente independiente y silenciosa** (sin visibilidad cruzada), y se detectó que
**Partes de costeo era el único de los 6 que solo usaba `localStorage`** (sin vínculo a archivo),
una inconsistencia frente al resto.

**Cambios implementados:**
- Nuevo archivo `dblink.js`: registro central (`DB_LINK_REGISTRY`) de las 6 bases con su icono,
  nombre, nombre de archivo esperado, función de conexión y función de refresco de UI propias de
  cada módulo (sin duplicar su lógica).
- Badge global siempre visible en el header (`🔗 N/6 vinculadas`, con color verde/amarillo/rojo
  según cuántas estén realmente vinculadas a archivo) — se actualiza automáticamente cada vez que
  cualquier módulo cambia su estado de vínculo.
- Nuevo modal **"Vinculación de bases de datos"**, accesible desde el badge y desde una nueva
  primera opción del menú "☰ Opciones", que lista las 6 bases con su estado individual y un botón
  "Vincular…"/"Re-vincular" por fila (reutiliza las funciones de conexión ya existentes).
- Acción **"Vincular carpeta…"**: un solo diálogo de carpeta (`showDirectoryPicker`) detecta los 6
  archivos por su nombre dentro de la carpeta elegida y los vincula todos de un solo paso.
- `costeo_db.js` (Partes de costeo) ganó soporte de vínculo a archivo igual que los otros 5 módulos
  (handle, escritura write-through, botón "Vincular archivo JSON…" en su propio modal), quedando los
  6 bajo el mismo esquema.

**Validación:** probado en navegador (Playwright): el badge calcula bien el conteo, el panel
centralizado lista las 6 bases y abre correctamente, y Partes de costeo ya muestra su propia barra
de estado de vínculo sin errores de consola.

---

## 2026-10-23 10:33 — Reorganización de las bases de datos en `FILES/DATABASE/` y publicación a GitHub

**Solicitud:** el usuario propuso crear una carpeta específica `DATABASE` para las 6 bases (dentro
de `FILES` o al mismo nivel) y pidió una recomendación crítica antes de proceder.

**Análisis crítico realizado:**
- Se revisó qué referencias de ruta existen realmente en el código: `FILES/logo-nfs.png` y
  `FILES/Fondo.png` están **hardcodeadas** en `index.html`/`styles.css` (deben permanecer en una
  ruta fija); en cambio, ninguna de las 6 bases JSON ni las plantillas `.docx`/`.xlsx` tienen ruta
  fija en el código — solo se abren vía selector de archivo (File System Access API), por lo que
  **se pueden mover libremente sin romper nada**.
- Se verificó que las 6 bases **sí estaban versionadas en git** con historial propio (no eran datos
  puramente locales).
- Comparación anidada (`FILES/DATABASE/`) vs. hermana (`DATABASE/` al mismo nivel que `FILES/`):
  la ventaja decisiva de la opción anidada es que la acción "Vincular carpeta…" recién creada pediría
  permiso de carpeta solo sobre los 6 JSON (principio de menor privilegio), en vez de sobre toda
  `FILES` (que incluye presupuestos de clientes en Excel, plantillas, y el propio historial de
  desarrollo). La opción hermana solo se justificaría si se quisiera dejar de versionar las bases en
  git con una regla `.gitignore` más "limpia" a nivel de raíz — lo cual, dado que es una decisión de
  estrategia y no una limitación técnica, se dejó a elección del usuario.
- **Decisión del usuario:** carpeta anidada `FILES/DATABASE/`, y además dejar de versionar esas 6
  bases en git a partir de este punto (tratarlas como datos operativos mutables).

**Cambios implementados:**
- `git mv` de `database.json`, `materiales.json`, `partes_costeo.json`, `registros.json`,
  `clientes.json` y `elaboradores.json` de `FILES/` a `FILES/DATABASE/` (preservando el historial).
- `.gitignore`: se agregó `FILES/DATABASE/`; `git rm --cached` de los 6 archivos para dejar de
  versionarlos (siguen presentes en disco, solo dejan de registrarse en futuros commits).
- `dblink.js`: la acción de vinculación por carpeta ahora apunta a `DATABASE` y, si el usuario
  selecciona `FILES` por costumbre, detecta automáticamente la subcarpeta `DATABASE` como *fallback*.
- Comentarios de ruta actualizados en `database.js` y `persist.js`; textos de la UI del panel
  centralizado actualizados ("Vincular carpeta DATABASE…").
- Commit `c0c5156` ("Centralizar vinculación de bases de datos y mover JSON a FILES/DATABASE") y
  `git push` a `origin/main` (repositorio `os-c-ar/ag-selector`).

**Validación:** recarga de la app en navegador tras el commit — el logo/fondo (rutas fijas) siguen
cargando bien, el badge y el panel centralizado muestran el texto nuevo correctamente.

---

## 2026-10-23 10:43 — Análisis crítico: ¿ubicar las bases en una carpeta de Google Drive?

**Solicitud:** el usuario preguntó si una carpeta de Google Drive sería una ubicación lógica para que
las bases de datos sean "funcionales" (compartidas/accesibles), dado que varias personas las usan.

**Preguntas de contexto planteadas y respuestas del usuario:** ecosistema de nube real = **Google
Workspace/Drive**; patrón de uso = **varias personas editando clientes/registros/precios al mismo
tiempo**; se requiere acceso **sin internet** en algunos casos (visitas a planta).

**Razonamiento / análisis crítico entregado:**
1. **Requisito técnico:** la File System Access API que usa la app solo puede leer/escribir rutas de
   disco **locales reales**. Por eso "Google Drive" solo sirve si se usa **Google Drive para
   Escritorio** (carpeta local sincronizada); la versión web (drive.google.com) no expone una ruta
   de archivo utilizable y por tanto no es compatible con el mecanismo de vínculo actual.
2. **El problema de fondo no es la ubicación, es el modelo de datos:** cada base se carga completa en
   memoria y se **reescribe completa** en cada cambio (no hay bloqueo ni fusión por registro). Con
   edición realmente simultánea de dos personas sobre el mismo archivo, la segunda persona en guardar
   sobrescribe silenciosamente los cambios de la primera ("lost update") — esto ocurre igual con
   Google Drive, OneDrive, Dropbox o un servidor de red; la sincronización en la nube no resuelve la
   concurrencia, solo resuelve la disponibilidad/respaldo del archivo.
3. **El riesgo no es igual para las 6 bases:** Clientes e Historial se editan simultáneamente por
   varias personas (riesgo alto); Procesos/Materiales/Partes de costeo las mantiene normalmente una
   sola persona y cambian poco (riesgo bajo).
4. **Recomendación en dos pasos:** (1) ahora, Google Drive para Escritorio como carpeta compartida
   —que de paso aporta historial de versiones automático de Drive, compensando que las bases ya no se
   versionan en git— **más** una validación de concurrencia en la app (releer el archivo antes de
   guardar y avisar si cambió, en vez de sobrescribir en silencio); (2) a futuro, si los choques
   reales son frecuentes en Clientes/Historial, migrar esas dos específicamente a algo con
   concurrencia real por fila (ej. Google Sheets vía API, ya que usan Google Workspace), dejando las
   demás como están.

**Decisión del usuario:** proceder con el punto 1 (validación de concurrencia) de inmediato.

---

## 2026-10-23 10:50 — Implementación: guardia de concurrencia optimista (detectar cambios externos antes de guardar)

**Solicitud:** implementar el punto 1 del análisis anterior (avisar en vez de sobrescribir cuando el
archivo cambió en disco desde la última lectura), y registrar todo este trabajo en este historial con
el razonamiento.

**Diseño de la solución:**
- Se centralizó la lógica común en `persist.js` (`NFS_HANDLES`), agregando:
  - `readText(handle)`: lee el contenido actual de un handle de archivo.
  - `checkConflict(handle, lastSyncedText)`: vuelve a leer el archivo justo antes de escribir y lo
    compara contra `lastSyncedText` (la última versión que esta pestaña leyó o escribió). Si
    coinciden, no hay conflicto. Si difieren, usa `confirm()` para preguntar al usuario: **Aceptar**
    = conservar y guardar mis cambios actuales (sobrescribe lo que la otra persona guardó);
    **Cancelar** = descartar mis cambios en memoria y adoptar la versión más reciente del archivo.
- Cada uno de los 6 módulos (`database.js`, `materials.js`, `costeo_db.js`, `clients.js`,
  `records.js`, `staff.js`) ahora mantiene una variable privada `_lastSyncedText` (línea base) y
  expone un método público `markSynced(text)`:
  - Se fija al **conectar** manualmente un archivo (con el texto recién leído).
  - Se fija al **reconectar automáticamente** al abrir la app (releyendo el archivo en ese momento,
    no asumiendo que el estado local sigue vigente).
  - Se fija tras cada **escritura exitosa** (con el texto recién escrito).
  - Se usa en `_writeFile()`: antes de escribir, se llama a `checkConflict`; si el usuario elige
    adoptar la versión externa, el módulo la aplica a su propio modelo en memoria (sin pasar por su
    `importJSON`/`importObject` público, para evitar un segundo ciclo de escritura recursivo),
    actualiza localStorage y refresca su tabla, y **no** escribe el archivo en ese ciclo.
- `dblink.js` (vinculación masiva por carpeta) también llama a `markSynced` tras leer cada archivo,
  para que las bases vinculadas por ese camino queden con la misma protección.

**Validación realizada (en navegador, vía Playwright):**
- Se recorrieron los 6 modales (Procesos, Materiales, Partes de costeo, Historial, Clientes, sin
  handle real vinculado) sin errores de consola, confirmando que el flujo normal (sin archivo
  vinculado) no se vio afectado.
- Se simuló un handle de archivo falso en `NFS_DB` (Procesos) vía `page.evaluate`, forzando una
  diferencia entre el contenido "en disco" y la línea base local, y se disparó una mutación real
  (`NFS_DB.add(...)`):
  - Con **Cancelar**: se confirmó que el proceso agregado localmente se descartó y la tabla pasó a
    mostrar el "proceso" simulado del archivo externo (adopción correcta de la versión externa).
  - Con **Aceptar**: se confirmó que el archivo "en disco" (simulado) terminó con el contenido local
    (incluido el proceso agregado localmente) y **sin** el contenido externo, y que se disparó el
    indicador visual "✓ guardado".
- Se limpiaron los datos de prueba (`NFS_DB.reset()`) al finalizar.

**Pendiente / posible siguiente paso:** si en el uso real los choques en Clientes/Historial resultan
frecuentes a pesar de esta guardia (que avisa pero no fusiona cambios), evaluar la migración de esas
dos bases específicamente a un backend con concurrencia real por registro (ver análisis del punto
anterior).

---

## 2026-10-23 11:10 — Carpeta de plantillas y acción "Generar oferta"

**Solicitud:** crear `FILES/PLANTILLAS`, usarla desde la acción de oferta y
renombrar "Borrador oferta" como "Generar oferta".

**Cambios implementados:**
- Se movieron las dos plantillas Word `CA_NNN_26_CLIENTE_AGITADOR.docx` y
  `CA_NNN_26_CLIENTE_AGITADOR_variables.docx` a `FILES/PLANTILLAS/`.
  No se movieron los Excel de referencia ni se modificó el contenido de las plantillas.
- Se renombró la acción del menú y sus avisos de éxito/error. Se conservan la
  función interna y el nombre de descarga existente para no alterar otros comportamientos.
- En Chrome/Edge, la primera ejecución solicita seleccionar `FILES/PLANTILLAS`.
  Se recuerda el handle de esa carpeta mediante el almacenamiento existente
  `NFS_HANDLES` y se pasa como `startIn` al selector de archivos Word.
  El selector se abre antes de cargar la biblioteca del documento para no
  consumir la activación del usuario esperando una descarga.
- En navegadores sin estos selectores se mantiene el selector convencional,
  indicando que debe elegirse la plantilla en `FILES/PLANTILLAS`.
- Se actualizó `Variables_Plantilla_Cotizacion.md` con el nuevo nombre y ubicación.

**Criterio técnico:** el navegador no permite fijar una ruta local arbitraria
en un `<input type="file">`. Por eso se usa una carpeta autorizada por el usuario,
recordada como ubicación inicial, sin afirmar que es una restricción de acceso.

**Validación:** comprobación de archivos movidos y `git diff --check`.
Prueba en navegador con selectores simulados: nombre del menú, carpeta inicial,
reutilización de la carpeta recordada y cancelación. No se automatizó el diálogo
nativo ni se generó una oferta real en esta tanda.

---

## 2026-10-23 11:44 — Porcentajes y precio comercial para la oferta

**Solicitud:** mostrar los margenes como porcentajes, agregar debajo del total
COP una moneda COP/USD y un precio unitario final editable, y habilitar cantidad,
moneda, tasa de cambio, precio unitario y total para Word.

**Decision confirmada por el usuario:** conservar el precio manual al recalcular
hasta pulsar "Usar precio calculado". Cambiar de moneda restablece el precio
calculado, sin convertir el valor manual.

**Cambios:**
- Los margenes de materiales e ingenieria muestran 30 % en lugar de 0,3.
  Las formulas y el Excel siguen usando fracciones internamente. Un indicador
  de formato permite convertir registros antiguos sin convertir dos veces
  los registros nuevos.
- Se agregaron selector de moneda, precio unitario final, boton para recuperar
  el calculo automatico y total comercial (unitario final por cantidad).
  Los campos y el modo manual se incluyen en los registros existentes.
- Se habilitaron `cantidad`, `moneda_oferta`, `tasa_cambio`, `precio_unitario`,
  `precio_total`, `margen_materiales` y `margen_ingenieria` para Word.
  Los precios usan dos decimales; los margenes incluyen el signo %.
- Se validan los datos comerciales antes de generar el documento y se actualizo
  el listado de variables. Los otros factores porcentuales no cambiaron.
- Se conservaron intactos los cambios del usuario a las plantillas Word.

**Validacion:** pruebas en una pestana separada, sin guardar registros ni escribir
bases de datos: migracion de margenes antiguos, recarga sin doble conversion,
calculo conservado, precio automatico COP/USD, precio manual y su restauracion,
boton de restablecimiento, precio cero y total por cantidad. Exportacion Excel
real y lectura posterior del archivo en memoria: ambos margenes conservan 0,3
con formato porcentual y formulas. Generacion de DOCX de prueba con selector y
descarga simulados: las siete variables se reemplazaron en el XML con los valores
esperados. No se probo la plantilla del usuario en Word de escritorio.

---

## 2026-10-23 12:00 — Presentacion de los precios finales de oferta

**Solicitud:** agrupar los precios comerciales en una subseccion, usar verde
para identificarlos como valores para el cliente, cambiar moneda a opciones
radio y reorganizar campos y boton.

**Cambios:** bloque "Precios finales de la oferta", fondo y acentos verdes,
identificador textual "Valores para el cliente", moneda COP/USD a la izquierda,
precio unitario editable con boton debajo y total destacado a la derecha.
Las etiquetas muestran la moneda activa. Los totales internos del presupuesto
quedan agrupados antes del bloque comercial. En anchos reducidos el bloque
se distribuye en una columna.

Se conserva `cst_moneda_oferta` como campo de persistencia para mantener
compatibilidad con registros y variables Word; las opciones radio se sincronizan
al cargar registros y al recalcular. No cambiaron las reglas de precios.

**Validacion:** inspeccion visual en navegador; cambio COP/USD con controles
reales, navegacion por teclado, conservacion de precio manual, restauracion
de registro con moneda y precio, boton de restablecimiento y valores para Word.
Pruebas sin guardar registros ni escribir bases de datos.

---

## 2026-10-23 12:10 — Consideraciones comerciales y variables de oferta

**Solicitud:** igualar las casillas comerciales con las tecnicas, habilitar las
consideraciones comerciales para el cliente en Word y entregar el listado
actualizado de variables.

**Cambios:** ambas listas comerciales usan el mismo ancho, tipografia, espaciado
y foco de las listas tecnicas, con texto de ayuda de consideracion comercial.
Se habilitaron `consideracion_comercial1` a `consideracion_comercial10` y mas
si existen mas lineas, respetando el orden del formulario. Las lineas sin usar
producen texto vacio. Solo se leen las condiciones comerciales para el cliente;
las internas no se incorporan al mapa ni al bloque de respaldo sin marcas.
Se mantuvieron los campos de almacenamiento y la restauracion de registros.
El reemplazo conserva literalmente textos con secuencias como `$&`, ademas
de escapar caracteres XML. Se actualizo la guia de variables, incluidos los
datos de contacto de quien elabora que ya estaban disponibles en codigo.

**Validacion:** pruebas en navegador del ancho de ambas listas, textos de ayuda,
orden, lineas vacias, tres formatos de marcas, escape XML, exclusion de internas,
agregar/eliminar filas, restauracion de registros y mas de diez condiciones.
Sin guardar registros ni escribir bases de datos.

---

## 2026-10-23 13:44 — Informacion comercial especifica y elaborador

**Solicitud:** agregar al final de Costeo una seccion para validez, entrega,
pago, sitio de entrega, empaque y garantia, con valores iniciales de la
plantilla, y habilitar variables del elaborador.

**Cambios:** nueva seccion verde con seis campos editables y etiquetas.
Se leyo `FILES/PLANTILLAS/01_GENERAL.docx` sin modificarlo, tomando sus
condiciones como valores iniciales. Sitio de entrega solo contenia una marca
en la plantilla; se mantuvo el texto inicial existente de la aplicacion.
Se habilitaron `validez_oferta`, `tiempo_entrega`, `forma_pago`, `sitio_entrega`,
`empaque` y `garantia`. Los registros capturan y restauran los seis campos;
los antiguos usan defaults y los nuevos conservan campos vacios intencionales.
El bloque de respaldo sin marcas tambien incluye las condiciones comerciales.

Los datos del elaborador ya tenian variables `elaboro` y `elaboro_*`.
Se agregaron los alias explicitos `elaborador_nombre`, `elaborador_cargo`,
`elaborador_extension`, `elaborador_celular` y `elaborador_correo`, sin
romper las marcas anteriores. Se actualizo la guia de variables.

**Validacion:** navegador: seis defaults, carga de registro antiguo, captura
y restauracion de ediciones y campos vacios, sitio editable, cinco alias,
reemplazo de once marcas y bloque de respaldo. Sin guardar registros ni
escribir bases de datos. La plantilla del usuario se conserva intacta.

---

## 2026-10-23 15:57 — Diagrama general en Word y posiciones del texto

**Solicitud:** habilitar una variable para el grafico de Diagrama general.
Como seguimiento al problema anterior de posiciones, se corrigio tambien
la normalizacion de marcas fragmentadas por Word.

**Cambios:** `diagrama_general` inserta una imagen PNG con elevacion y vista
superior del diagrama actual. Se exige una marca sola en su parrafo y dimensiones
validas. La imagen se incrusta en el DOCX con su relacion y tipo de contenido,
identificadores sin colision y proporcion conservada (maximo 12,7 x 16,51 cm).
Sin marca no se agrega una imagen ni se exige tener diagrama.
La plantilla original no se modifica.

El normalizador anterior trasladaba todo el texto del parrafo al primer nodo,
dejando las tabulaciones detras de los valores. Ahora solo une los fragmentos
de cada marca y no atraviesa tabulaciones, saltos ni dibujos; conserva el
texto y formato circundantes. El XML invalido se notifica explicitamente.

**Validacion:** navegador: marcas divididas, tabulaciones, saltos y formato.
Prueba con `01_GENERAL.docx` leido como archivo sin modificarlo: tres filas
tecnicas conservaron sus marcas despues del tabulador, y se mantuvieron las
cantidades de tabulaciones, saltos, dibujos y propiedades de formato.
Se agrego una marca de imagen solo a la copia en memoria y se genero un PNG
valido; se reconstruyo el ZIP y se verificaron dibujo, relaciones y tipos de
contenido. No se verifico la representacion final en Word de escritorio.

---

## 2026-10-27 11:15 — Nombre de archivo de oferta por cotizacion y cliente

**Solicitud confirmada:** `CA_125_26_CLIENTE_AGITADOR.docx`.

**Cambios:** el nombre usa el numero de cotizacion y el cliente del formulario,
con sufijo fijo `AGITADOR`, sin fecha ni hora adicionales. Se normalizan
mayusculas, tildes y caracteres especiales para obtener un nombre compatible
con Windows, con limite de 80 caracteres por componente. Si falta alguno de
los dos campos se notifica antes de seleccionar plantilla. No se inventan
prefijo ni ano: se toman del numero de cotizacion ingresado.
La plantilla original y los cambios pendientes del usuario se conservan.
Se actualizo la guia de variables con el formato y comportamiento de descarga.

---

## 2026-10-27 11:26 — Seccion 0: informacion general

**Solicitud:** titular el bloque del nombre y TAG del tanque y agitador como
"0. INFORMACION GENERAL" y mostrar encima cliente y elaborador no editables,
sin modificar el ingreso original.

**Cambios:** se agrupo el bloque en una tarjeta con el mismo encabezado que
las secciones posteriores. Se agregaron salidas de texto para cliente y
elaborador, con "Sin seleccionar" cuando estan vacios. Se sincronizan al
escribir, seleccionar desde las bases y recalcular despues de cargar registros.
Los campos de ingreso originales y las variables de oferta no cambiaron.

**Validacion:** navegador: escritura, cambio, valores vacios, actualizacion
al recalcular y encabezado. Se probaron las acciones de seleccionar cliente
y elaborador con perfiles simulados, restaurando las funciones y campos.
No se guardaron registros ni se escribieron bases de datos.

---

## 2026-10-27 11:28 — Datos completos de cliente y elaborador a la vista

**Solicitud:** ampliar la informacion general no editable con los campos
adicionales de cliente y elaborador.

**Cambios:** dos bloques de solo lectura: cliente, contacto, ciudad, telefono,
celular y correo; elaborador, cargo, extension, celular y correo. Se conserva
el ingreso en los controles originales. Los datos se sincronizan al editar,
seleccionar contactos o perfiles desde los modales y cargar registros.
Los campos adicionales vacios muestran un guion.

**Validacion:** once salidas verificadas en navegador: edicion manual,
seleccion desde ambos modales con datos simulados y cambio de perfil.
Se restauraron campos y funciones sin guardar registros ni bases de datos.

---

## 2026-10-27 11:31 — Resumen general compacto en dos filas

**Solicitud:** minimizar el espacio vertical mostrando los datos del cliente
en una fila horizontal y los del elaborador en otra.

**Cambios:** distribucion horizontal compacta por grupo, con etiquetas y valores
en linea. Los campos se ajustan a otra linea si el ancho disponible no alcanza,
sin ocultar datos ni cambiar su sincronizacion.

**Validacion:** navegador a 1400 px con once valores de prueba: cada grupo
ocupa una fila, con 40 px de alto para el resumen completo. Se restauraron
los valores originales.

---

## 2026-10-27 11:34 — Ancho visual de los TAG

**Solicitud:** dimensionar TAG del tanque y TAG del agitador para ocho
caracteres, sin limitar la longitud del dato ingresado.

**Cambios:** ancho visual de ocho caracteres mas relleno y bordes, sin
expansion horizontal de esos dos campos. No se agrega `maxlength` ni se
modifica el contenido o almacenamiento de los TAG.

---

## 2026-10-27 11:37 — Propiedades recomendadas por proceso

**Solicitud:** asociar viscosidad y densidad recomendadas al proceso seleccionado,
como valores iniciales editables. El usuario eligio completar las recomendaciones
en la base de procesos; no se inventaron valores tecnicos.

**Cambios:** columnas editables opcionales de viscosidad (cps) y densidad
(Ton/m3) en Base de datos, incluidas al crear, editar, guardar e importar/exportar
los procesos. Los datos anteriores sin esos campos siguen siendo compatibles.
Al seleccionar proceso se aplican las recomendaciones definidas, sin sobrescribir
ediciones manuales en recalculos posteriores ni al restaurar registros.
Si falta una recomendacion se conserva el valor actual y se informa en pantalla.
Al iniciar la aplicacion se aplican las recomendaciones del proceso inicial.

**Validacion:** navegador con procesos simulados: carga inicial de ambos valores,
conservacion de cambios manuales tras recalcular, compatibilidad sin recomendaciones,
columnas del editor y lectura de valores numericos u opcionales vacios.
Sin guardar ni modificar las bases de datos del usuario durante las pruebas.

---

## 2026-10-27 11:46 — Ventana ampliada de base de procesos

**Solicitud:** ampliar la ventana de la base de datos de descripcion de proceso
para mejorar la usabilidad.

**Cambios:** ventana de procesos de hasta 1280 px de ancho, con 96% del ancho
disponible y 90% de la altura de pantalla. Se reserva espacio para la descripcion
y las recomendaciones, y se permite ajustar los encabezados en varias lineas.
En pantallas pequenas la tabla se desplaza dentro de la ventana.
El pie puede distribuir sus botones en varias filas. Las demas ventanas
conservan sus dimensiones.

---

## 2026-10-27 11:52 — Terminologia de viscosidad y densidad

Se cambio "recomendada" por "tipica" en los encabezados, etiquetas accesibles,
avisos y ayuda de viscosidad y densidad por proceso. Se actualizo la guia.
Sin cambios en logica, datos, unidades ni variables. La intensidad conserva
su denominacion "recomendada".

---

## 2026-10-27 11:58 — Recomendaciones tipicas de seleccion por proceso

**Solicitud:** texto largo asociado al proceso, editable mediante un simbolo
en la base y consultable sin editar mediante "Recomendaciones de seleccion"
en la pantalla principal, sin ampliar la seccion con el texto completo.

**Cambios:** propiedad opcional `recomendaciones` en procesos; columna con boton
para un dialogo amplio de texto multilinea. Desde una fila normal se guarda
solo este dato; desde una fila en edicion o nueva se conserva como borrador
hasta guardar la fila, respetando Cancelar. El boton junto al selector de
proceso abre el mismo dialogo de solo lectura con el proceso actual.
Los procesos antiguos sin texto muestran una indicacion de ausencia.
El campo se conserva en las operaciones existentes de JSON y persistencia.
No se agregan limites artificiales de longitud ni variables de oferta.

**Validacion:** navegador con datos y guardado simulados: consulta no editable,
texto largo con saltos, guardado directo, edicion diferida de fila, cancelacion
y compatibilidad de procesos sin recomendaciones. Sin escribir bases reales.

---

## 2026-10-27 12:03 — Factor de viscosidad para menos de 10 cP

**Solicitud:** usar factor 1 si la viscosidad es menor a 10 cP, sin aplicar
la formula logaritmica.

**Cambio:** se agrega el tramo menor a 10 cP con factor 1. Se conserva el
factor 1,1 desde 10 hasta menos de 20 cP y la formula logaritmica desde 20 cP.

---

## 2026-10-27 12:05 — Ajuste del factor entre 10 y 20 cP

Se cambia el factor a 1,05 para 10 <= viscosidad < 20 cP, por solicitud
del usuario. Se mantiene 1 para menos de 10 cP y la formula logaritmica
desde 20 cP.

---

## 2026-10-27 12:07 — Aviso por viscosidad superior a 2000 cP

Se agrega al pie de la seccion fisicoquimica la nota "Estimado, la curva
original para este calculo tenia como limite 2000 cP" cuando la viscosidad
es estrictamente mayor de 2000 cP. Se oculta al volver a 2000 cP o menos.
El calculo no cambia.

---

## 2026-10-27 12:09 — Texto del aviso de viscosidad

Se actualiza la nota a: "Factor de viscosidad estimado, la curva original
para este cálculo tenía como límite 2000 cP". Sin cambios en el umbral
ni en el calculo.

---

## 2026-10-27 12:20 — Kp convertido a numero de potencia adimensional

**Solicitud:** recalcular Kp para usar coeficientes adimensionales.

**Cambios:** conversion de los 53 coeficientes activos del catalogo, mas la
entrada N.A. que sigue en cero. Se usa Kp = Np con agua de referencia de
1000 kg/m3: Kp_nuevo = Kp_anterior * 2,16e20. La funcion de potencia convierte
rpm a rev/s y mm a m, aplica P = Kp * rho_agua * n^3 * D^5 y devuelve kW.
Las correcciones posteriores por densidad del fluido, viscosidad y otros
factores permanecen intactas. En pantalla se identifica Kp como adimensional
y se presenta con cuatro decimales, manteniendo precision completa en calculos.
Se documenta la referencia y que es una conversion, no una recalibracion fisica.

**Validacion:** comparacion de las 54 entradas contra el catalogo original de
Git. En navegador, 216 comparaciones de potencia para los modelos a diferentes
velocidades, con error relativo maximo aproximado de 7,1e-16; valores
equivalentes dentro de precision numerica. VR2A-055: Kp 1,0181376, con
potencia 0,6099972458 kW a 137 rpm y 550 mm.

---

## 2026-10-29 09:30 — Señal de recomendaciones de selección disponibles

**Solicitud:** destacar la consulta de recomendaciones cuando el proceso
seleccionado tenga contenido.

**Cambios:** el botón "Recomendaciones de selección" se resalta en ámbar y
muestra la etiqueta "! Consultar" si el texto contiene caracteres distintos
de espacios. La señal se actualiza al cambiar de proceso, recalcular,
reconstruir el selector o modificar los datos, incluida la adopción de cambios
externos por conflicto. La consulta conserva su comportamiento de solo lectura.

**Validación:** navegador con recomendaciones vacías, solo espacios y con texto;
guardado, eliminación, cambio de proceso, selección programática y reconstrucción
del selector. Se comprobó la apertura del contenido en modo de solo lectura,
restaurando los datos usados durante la prueba.

---

## 2026-10-29 09:52 — Advertencia condicional por RPM superiores al máximo

**Solicitud:** retirar los campos visibles de RPM de referencia y RPM máxima,
y mostrar una nota de precaución con el formato del aviso de viscosidad
únicamente cuando la velocidad seleccionada supere la referencia multiplicada
por 1,1.

**Cambios:** se sustituyen los campos visibles por valores ocultos, conservados
para registros y ofertas. Bajo la velocidad de rotación se muestra:
"Las rpm seleccionadas superan en más de 10% las rpm de referencia (#Valor)
para esta propela, usar con precaución". El valor corresponde a la propela 1,
con un decimal. La nota reutiliza los estilos del aviso de viscosidad y
desaparece al reducir las RPM o seleccionar una propela sin referencia válida.

**Validación:** navegador por debajo, exactamente en y por encima del máximo;
comprobación del texto, estilo, actualización al recalcular y selección N.A.
Se verificó que los campos anteriores no son visibles y mantienen sus valores.
Comprobación de espacios en los cambios mediante `git diff --check`.

---

## 2026-10-29 09:57 — Actualización del historial y publicación de pendientes

**Solicitud:** actualizar este historial y GitHub. Se confirmó expresamente
incluir todos los cambios funcionales pendientes, documentación y plantillas,
no solo los dos ajustes más recientes.

**Alcance:** código de selección, procesos, clientes, elaboradores, costeo y
ofertas; interfaz y estilos; documentación de variables y este historial;
plantilla `FILES/PLANTILLAS/01_GENERAL.docx` en sustitución de las dos plantillas
anteriores eliminadas del directorio de trabajo.
Se excluyen carpetas temporales, archivos `desktop.ini` y el archivo local
`FILES/registros.json`, que contiene datos operativos de clientes.

---

## 2026-10-29 10:02 — Presentación de cambios para dirección

**Solicitud:** presentar los cambios realizados en el proyecto, tomando este
historial como fuente principal. Se confirmó una presentación PowerPoint
detallada de 20 a 25 diapositivas, dirigida a dirección.

**Entrega:** `Presentacion_Cambios_AG_SELECTOR_2026-10-29.pptx`, en esta carpeta,
con 25 diapositivas editables, formato panorámico y logo del proyecto.
Resume la evolución del 22 al 29 de octubre: costeo, catálogo y Excel;
precios y condiciones comerciales; generación de Word y diagrama;
información general, procesos, recomendaciones, viscosidad, Kp y RPM;
vinculación de bases, concurrencia, validaciones y límites.
Incluye notas del presentador con referencias fechadas a este historial.
Las propuestas de seguimiento se distinguen de los cambios implementados;
no se atribuyen ahorros ni resultados económicos no medidos.
El corte de código presentado corresponde al commit publicado `3ef52f1`.

**Validación:** generación y reapertura del archivo, comprobación de 25
diapositivas y sus notas, límites geométricos y ajuste estimado de textos.
Se abrió el archivo con PowerPoint de escritorio y se renderizaron las 25
diapositivas; revisión visual de la vista general y corrección de un
solapamiento en la diapositiva de RPM. Una segunda apertura verificó que
ningún texto desbordara su cuadro. No se modificó el código de la aplicación.
La presentación y esta entrada quedan locales, sin una nueva publicación.

---

## 2026-10-29 10:32 — Base técnica de propelas, adición, edición y peso por modelo

**Solicitud:** administrar los datos técnicos de las propelas como una base
de datos con módulo de adición y edición. Se confirmó permitir tipos nuevos
y mantener fijo el modelo al editar, porque identifica las selecciones
guardadas. Como ampliación, se solicitó incluir el peso en la base:
editable para modelos existentes y obligatorio para los nuevos.

**Cambios implementados:**
- Nuevo módulo `propellers.js`, accesible en Opciones → Base técnica de
  propelas. Incluye búsqueda por modelo/tipo, alta y edición mediante formulario,
  cancelación sin guardar, validación de duplicados sin distinguir mayúsculas,
  campos obligatorios y números finitos mayores que cero.
- Datos por modelo: `modelo`, `type`, `D` (mm), `rpm` de referencia,
  `Kp` adimensional, `Nq`, `peso` (kg) y `codType` (categoría de codificación).
  Se admite un tipo nuevo como texto; su categoría se elige del catálogo
  de codificación existente, sin asignar silenciosamente otro diseño.
  `N.A.` sigue reservado como opción sin propela y no es editable.
- Se conservan los 53 modelos iniciales y sus coeficientes sin cambios.
  El catálogo incorporado en el código se usa como semilla, mientras los
  cálculos y selectores consultan los datos administrados por la nueva base.
  El peso inicial de cada modelo reproduce la interpolación/extrapolación
  que antes hacía el cálculo del eje. Son valores de continuidad del cálculo,
  no una nueva medición física: deben verificarse con ingeniería.
- El cálculo del eje ahora usa el peso editable del modelo seleccionado,
  en lugar de inferirlo por tipo y diámetro en cada cálculo.
  La edición actualiza resultados hidráulicos, aviso de RPM, cálculo del
  eje y codificación. Se conservan diámetros decimales; si un diámetro no
  tiene equivalencia de código, se muestra un aviso y `?` en vez de conservar
  un diámetro anterior como si fuera válido.
- Los cuatro selectores se reconstruyen con los tipos/modelos de la base,
  conservando el modelo seleccionado cuando existe. Los registros cargados
  resuelven el tipo actual por modelo. Si falta un modelo en la base importada
  o al restaurar un registro, se avisa y se selecciona `N.A.` para revisión.
  Los registros siguen identificando el modelo; sus cálculos usan la base
  técnica vigente, no una copia histórica de sus coeficientes o peso.
- Persistencia local en `nfs_propellers_v1`, importación y exportación
  `propelas.json`, vinculación individual, reconexión y guardado automático.
  El panel central y el indicador global incluyen ahora siete bases.
  La vinculación carga y valida el archivo antes de adoptarlo, sin escribir
  en el archivo previamente vinculado.
- Guardados consecutivos serializados y protección de concurrencia mediante
  el helper existente. Se añadió una opción estricta al helper para esta base:
  no escribir si falta la versión de referencia o falla la lectura previa.
  Las demás bases conservan el comportamiento anterior. Los fallos de
  escritura/permisos se notifican y mantienen la copia local; un JSON local
  inválido se conserva para recuperación, con aviso, catálogo inicial en
  memoria y edición bloqueada hasta importar/vincular datos válidos.

**Archivo inicial:** se generó `FILES/DATABASE/propelas.json` con 53 modelos,
sin sobrescribir archivos existentes. Sigue excluido de Git, como las demás
bases operativas. Para usarlo compartido, vincularlo individualmente o mediante
"Vincular carpeta DATABASE…".

**Formato del JSON:** objeto con `version: 1` y lista `propelas`. Ejemplo:

```json
{
  "version": 1,
  "propelas": [
    {
      "modelo": "VR2A-055",
      "type": "TURBINA",
      "D": 550,
      "rpm": 137,
      "Kp": 1.0181376,
      "Nq": 0.5455,
      "peso": 4.08,
      "codType": "TURBINA"
    }
  ]
}
```

**Validación:** navegador con los 53 pesos iniciales comparados contra el
cálculo anterior; altas, edición y cancelación de formulario; persistencia
tras recarga; cambios de tipo y restauración de registros; caudal, potencia,
peso del eje y aviso de RPM con datos editados. Se comprobaron duplicados,
valores inválidos, modelo fijo, catálogo vacío, tipos nuevos y diámetros
decimales sin equivalencia de código. También se probó el arranque con un
catálogo exclusivamente nuevo y con el modelo inicial cambiado de tipo.
Importación/exportación verificadas con archivos en memoria; vinculación
individual y por carpeta, guardado y ambas decisiones de conflicto con
handles simulados; errores de lectura, escritura, permisos y recuperación
de JSON local inválido. Se restauraron los datos de las pruebas, sin escribir
en archivos operativos existentes. No se automatizaron los diálogos nativos
de selección de archivo/carpeta ni se publicó esta tanda en GitHub.

---

## 2026-10-29 11:02 — Ocultar el parámetro de circulación

**Solicitud:** ocultar la etiqueta "Parámetro de circulación" y las opciones
"Tiempo de Residencia (h)" y "Flujo del Tanque (m³/h)".

**Cambio:** se oculta el bloque completo en la interfaz, conservando sus
controles, valor seleccionado, eventos y persistencia de registros.
No se modifican los cálculos ni se eliminan los datos internos.

**Validación:** recarga en navegador: bloque sin espacio visible, dos opciones
conservadas y selección interna vigente. Recálculo ejecutado correctamente.

---

## 2026-10-29 11:55 — Agitadores estándar y geometría real del eje

**Solicitud:** administrar modelos de agitador terminados en una nueva pestaña,
con configuración técnica, presupuesto por equipo, consideraciones para el
cliente y precio recomendado, sin copiar datos de tanque, fluido o cotización.

**Criterios acordados:**
- El modelo comercial identifica el diseño con eje a longitud máxima y tiene
  un rango mínimo/máximo recomendado. La longitud real se ajusta al tanque,
  automática o manualmente, sin cambiar modelo, cantidades del eje ni precio.
- Se permite trabajar fuera del rango, con advertencia de revisar diseño y
  precio. La potencia instalada permanece fija; si la requerida la supera,
  se advierte sin sustituir el motor del producto.
- Al aplicar se bloquean los datos de diseño. Para modificarlos se utiliza
  **Desvincular estándar**; la longitud real y el precio final siguen editables.
- Precio recomendado por equipo en COP o USD: se inicializa al aplicar, no
  durante los recálculos. Volver a aplicar inicializa deliberadamente el precio.
- Presupuesto normalizado por equipo. Materiales y servicios se escalan con la
  cantidad cotizada, conservando el dimensionamiento presupuestado del eje.
- Se actualizan precios/descripciones de partes desde el catálogo al aplicar.
  Las partes ausentes conservan su precio guardado y generan advertencia;
  las líneas manuales conservan sus datos.
- Se reemplazan las consideraciones técnicas/comerciales para el cliente, pero
  se conservan tanque, fisicoquímicas, cliente, cotización, TAG, cantidad,
  comentarios internos, factores, márgenes y condiciones comerciales generales.
- Catálogo independiente con duplicación y activación/desactivación, sin
  eliminación definitiva. Se mantiene el montaje vertical del selector actual;
  no se implementa un cálculo nuevo para montaje horizontal.

**Implementación:**
- Nueva pestaña **AGITADORES ESTÁNDAR**: guardar configuración actual, editar
  ficha, actualizar configuración desde selección/costeo, duplicar, buscar,
  mostrar inactivos y aplicar. El modelo comercial existente no se renombra.
- `standard_agitators.js`: validación del catálogo, persistencia local,
  importación/exportación JSON, vinculación/reconexión de archivo y control de
  conflictos. Los errores de lectura, escritura y permisos se notifican;
  los cambios locales no se pierden por un fallo de guardado del archivo.
  Vincular un archivo diferente exige confirmar el reemplazo del catálogo
  local; cancelar conserva los datos sin vincular.
- Octava base del panel central: `agitadores_estandar.json`. Se preparó
  `FILES/DATABASE/agitadores_estandar.json` vacío, sin inventar modelos ni precios.
  La carpeta de datos operativos permanece excluida de Git.
- Nota en **Precios finales de la oferta** con modelo, precio recomendado y
  moneda. El precio unitario final inicial es editable; los recálculos y cambios
  de cantidad no revierten una edición manual.
- Los registros guardan una copia de la versión del estándar aplicada, cantidad
  de referencia del presupuesto, configuración constructiva y geometría real.
  Editar/desactivar el catálogo no modifica las cotizaciones ya guardadas.
- Se conserva la separación entre modelo comercial y código técnico. Word
  incorpora `modelo_estandar` y `potencia_instalada`; `longitud_eje` representa
  la longitud real. Se actualizó `FILES/Variables_Plantilla_Cotizacion.md`.

**Geometría para todos los agitadores:**
- Controles junto al diagrama: fondo→propela 1 como %D1, propela 1→2 como %D2,
  propela 2→3 como %D3 y propela 3→4 como %D4. Solo se muestran los controles
  de propelas activas; cero es un porcentaje válido.
- `agitator_geometry.js` centraliza longitud automática/manual, posiciones y
  brazos mecánicos, compartidos por el diagrama y los cálculos del eje.
  La longitud manual inicial toma la automática sin perderla por el orden
  de eventos del selector.
- Los registros antiguos sin geometría nueva usan modo automático, su
  porcentaje al fondo y separaciones de 100% del diámetro de cada propela.
  Esta regla sustituye el espaciamiento anterior basado siempre en D1.
- Se advierte si hay posiciones fuera de la altura del tanque o datos no válidos.
  Se corrigió la lectura de la longitud decimal localizada en el cálculo
  mecánico. Las listas de presupuesto explícitamente vacías ya se conservan
  al restaurar; un JSON de filas inválido se informa expresamente.

**Validación:** pruebas en navegador de alta, edición, cancelación, duplicación,
modelo fijo, búsqueda, inactivación y actualización de configuración. Se
comprobaron fichas inválidas, modelos duplicados, recuperación de almacenamiento
local corrupto y persistencia tras recarga. Se verificaron advertencias ante
cantidad cotizada inválida y rechazo de registros con referencia de cantidad
inválida sin alterar el estándar aplicado. Aplicación con datos de tanque,
fluido, cliente, TAG, márgenes, condiciones e internas conservados; precio
recomendado inicial, edición manual, cambio deliberado al precio calculado y
reaplicación. Verificados motor fijo, aviso de potencia insuficiente, límites
del rango, longitud manual, cuatro posiciones con diámetros diferentes,
porcentajes independientes y cero, brazos mecánicos y código técnico.

Se probaron presupuestos vacíos, escalado de servicios/materiales, restauración
sin doble escalado y recuperación después de recargar la página, incluso con
el modelo posteriormente editado/desactivado en el catálogo. Se verificaron
precios de partes actualizados, precio cero, partes ausentes y bloqueo ante
precio de catálogo inválido, además de las nuevas variables de Word.
Importación/exportación y vinculación por carpeta comprobadas con `File` y
handles en memoria; guardado, cola de escrituras, ambas decisiones de conflicto
y errores de lectura, escritura y permisos verificados sin tocar archivos
operativos. Los diálogos nativos de archivo/carpeta no se automatizaron.

Los modelos temporales de prueba se retiraron y se restauró la selección
previa. Cambios locales, sin publicación en GitHub en esta tanda.

---

## 2026-10-29 17:37 — Actualización del historial y publicación de avances

**Solicitud:** actualizar este historial y publicar los cambios pendientes en
GitHub.

**Alcance de esta entrega:**
- Base técnica editable de propelas, con peso por modelo y persistencia JSON.
- Ocultamiento del bloque de parámetro de circulación, sin eliminar sus datos.
- Módulo de agitadores estándar, presupuesto por equipo, precio recomendado,
  geometría real del eje y restauración de registros descritos arriba.
- Guía de variables de la oferta y presentación PowerPoint de cambios para
  dirección. La presentación conserva su corte original del commit `3ef52f1`;
  no se ha ampliado para incluir los módulos desarrollados posteriormente.
- Se excluyen los datos operativos de `FILES/DATABASE/`, `FILES/registros.json`,
  archivos temporales y cambios de `desktop.ini`.

**Comprobaciones previas:** `git diff --check` sin errores y rama remota
`main` en `3ef52f131ce8433ccbc6634fddcff488dd6e567a`, coincidente con la
base local. Las validaciones funcionales de navegador están documentadas
en las entradas de cada módulo; esta tanda no modifica su comportamiento.
La publicación solicitada tiene como destino `origin/main` del repositorio
`os-c-ar/ag-selector`, sin reescritura del historial.

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
