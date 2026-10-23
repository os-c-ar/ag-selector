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
