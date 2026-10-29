# Variables disponibles para la plantilla de cotización (.docx)

Para usarlas, escribe en tu plantilla Word cualquiera de estos 3 formatos con el
nombre de la variable (sin espacios):

```
{{nombre_variable}}
${nombre_variable}
[[nombre_variable]]
```

Al generar el documento con el botón **🧾 Generar oferta**, cada marca se reemplaza
por el valor actual del formulario.

Las plantillas Word se encuentran en `PLANTILLAS/` (dentro de `FILES`).
En Chrome/Edge se solicita seleccionar esa carpeta la primera vez y se recuerda
como ubicación inicial del selector de plantillas. El navegador permite navegar
a otra carpeta; no se trata de una restricción de acceso. En otros navegadores,
seleccione manualmente la plantilla en `FILES/PLANTILLAS`.

## Datos generales del encabezado

El archivo generado se nombra con **cotización + cliente + AGITADOR**:
por ejemplo, cotización `CA_125_26` y cliente `CLIENTE` producen
`CA_125_26_CLIENTE_AGITADOR.docx`. Ambos campos son necesarios.
Se usan mayúsculas, se eliminan tildes y se reemplazan espacios y caracteres
especiales por guiones bajos; cada componente se limita a 80 caracteres.
No se agrega fecha ni hora ni se modifica el nombre de la plantilla original.
El prefijo y el año deben estar incluidos en el número de cotización si se desean
en el nombre. Si se descarga otra oferta con el mismo nombre, el navegador
gestionará la repetición según su configuración de descargas.

| Variable | Descripción |
|---|---|
| `fecha` | Fecha de la cotización |
| `cliente` | Nombre del cliente |
| `contacto_cliente` | Nombre de contacto |
| `ciudad_cliente` | Ciudad |
| `telefono_cliente` | Teléfono |
| `celular_cliente` | Celular |
| `correo_cliente` | Correo electrónico |
| `cotizacion` | No. de cotización / pedido |
| `elaboro` | Nombre de quien elaboró |
| `elaboro_cargo` | Cargo de quien elaboró |
| `elaboro_extension` | Extensión de quien elaboró |
| `elaboro_celular` | Celular de quien elaboró |
| `elaboro_correo` | Correo de quien elaboró |
| `elaborador_nombre` | Nombre del elaborador; equivalente a `elaboro` |
| `elaborador_cargo` | Cargo; equivalente a `elaboro_cargo` |
| `elaborador_extension` | Extensión; equivalente a `elaboro_extension` |
| `elaborador_celular` | Celular; equivalente a `elaboro_celular` |
| `elaborador_correo` | Correo; equivalente a `elaboro_correo` |
| `nombre_tanque` | Nombre del tanque |
| `tag_tanque` | TAG del tanque |
| `tag_agitador` | TAG del agitador |

## Diagrama general como imagen

Escriba **`{{diagrama_general}}`** en un párrafo propio, sin otro texto ni imágenes
en ese párrafo. También se admiten `${diagrama_general}` y `[[diagrama_general]]`.
El párrafo puede centrarse desde Word; se conserva su formato de párrafo.
Se recomienda situarlo fuera de tablas y cuadros de texto estrechos.

La marca se sustituye por una imagen PNG incrustada con **ambas vistas** de la
sección Diagrama general: elevación y vista superior, una debajo de la otra.
Se obtiene del diagrama actual de la aplicación al generar la oferta, sin
necesitar captura manual ni archivos externos. Requiere dimensiones válidas.
No se necesita agregar esta marca si la oferta no debe llevar el diagrama.

La imagen conserva su proporción, con un máximo de 12,7 cm de ancho y 16,51 cm
de alto. Puede redimensionarse en Word después de generar el documento.
Si se repite la marca en distintos párrafos, se inserta en cada uno.
La plantilla original no se modifica.

Las variables divididas internamente por Word se reúnen únicamente dentro de
la propia marca: se conservan el texto circundante, las tabulaciones, los saltos
y sus posiciones. Esto corrige el desplazamiento de datos hacia antes de las
tabulaciones que producía el normalizador anterior.

## 1. Características del tanque

| Variable | Descripción |
|---|---|
| `tipo_tanque` | CIRCULAR o RECTANGULAR |
| `diametro` | Diámetro (tanque circular) |
| `ancho` | Ancho (tanque rectangular) |
| `longitud` | Longitud (tanque rectangular) |
| `diametro_equiv` | Diámetro equivalente calculado |
| `altura_util` | Altura útil |
| `altura_total` | Altura total |
| `area_superficial` | Área superficial calculada |
| `volumen_util` | Volumen útil calculado |
| `bafles` | SI / NO lleva bafles |
| `param_circulacion` | Parámetro de circulación seleccionado |

## 2. Características del fluido

| Variable | Descripción |
|---|---|
| `proceso` | Descripción del proceso |
| `intensidad_recomendada` | Intensidad recomendada según proceso |
| `viscosidad` | Viscosidad (cps) |
| `factor_viscosidad` | Factor por viscosidad calculado |
| `densidad` | Densidad (Ton/m³) |

Viscosidad y densidad pueden tener valores típicos por proceso, configurables
en **Base de datos**. Se aplican al seleccionar el proceso y siguen siendo
editables. Las variables de oferta usan los valores finales del formulario,
no necesariamente los típicos. Si un proceso no tiene un valor típico,
se conserva el valor actual y se muestra un aviso en la sección 1.

Cada proceso también puede guardar un texto largo de **Recomendaciones típicas**.
En Base de datos, el botón de la columna correspondiente abre un editor amplio.
Si se está creando o editando una fila, acepte el texto y después guarde la fila;
si se abre desde una fila sin editar, **Guardar recomendaciones** guarda solo
ese texto. Cerrar sin guardar descarta lo escrito en el editor.
En la sección 1, **Recomendaciones de selección** abre el texto del proceso
actual en modo de solo lectura. Se admiten varias líneas sin un límite artificial
de caracteres; el editor se desplaza para textos largos.
El dato se almacena como `recomendaciones` en cada proceso del JSON.
No se añade automáticamente a la oferta ni se crea una variable de Word.

## 3. Selección de propelas

El catálogo usa ahora **Kp adimensional**, equivalente al número de potencia Np,
con referencia de agua a 1000 kg/m³:

```text
Kp = P_W / (rho_agua * n_rps^3 * D_m^5)
Kp_adimensional = Kp_anterior * 2.16e20
P_agua_kW = Kp * 1000 * (rpm/60)^3 * (D_mm/1000)^5 / 1000
```

La conversión conserva las potencias del catálogo anterior; no constituye una
nueva validación experimental de sus coeficientes. La densidad del fluido,
el factor de viscosidad y los demás factores se siguen aplicando después,
como antes, sin duplicar la corrección por densidad.
Ejemplo: VR2A-055 pasa de `4.7136e-21` a `1.0181376`.
Los campos de ingreso de velocidad y diámetro siguen usando rpm y mm.
Este cambio no agrega una variable Kp a la plantilla Word.

| Variable | Descripción |
|---|---|
| `rpm` | Velocidad de rotación |
| `rpm_ref` | RPM referencia (propela 1) |
| `rpm_max` | RPM máxima permitida |
| `num_propelas` | Número de propelas requeridas |
| `pct_fondo` | % ubicación propela 1 desde el fondo |
| `propela1_tipo` / `propela1_modelo` / `propela1_diametro` | Tipo, modelo y diámetro propela 1 |
| `propela2_tipo` / `propela2_modelo` / `propela2_diametro` | Tipo, modelo y diámetro propela 2 |
| `propela3_tipo` / `propela3_modelo` / `propela3_diametro` | Tipo, modelo y diámetro propela 3 |
| `propela4_tipo` / `propela4_modelo` / `propela4_diametro` | Tipo, modelo y diámetro propela 4 |
| `caudal1` ... `caudal4` | Caudal acumulado con 1 a 4 propelas |
| `vueltas` | Renovaciones por hora |
| `pot_agua1` ... `pot_agua4` | Potencia absorbida en agua por propela |
| `pot_agua_total` | Potencia total absorbida en agua |

## 4. Resultados finales

| Variable | Descripción |
|---|---|
| `longitud_eje` | Longitud máxima del eje |
| `nivel_agitacion` | Nivel de agitación obtenido |
| `estado_agitacion` | Estado respecto al rango recomendado |
| `potencia_requerida` | Potencia requerida (kW) |
| `motor_cercano` | Motor estándar más cercano (kW) |
| `agitador` / `agitador_seleccionado` | Código del agitador seleccionado |
| `motoreductor` / `motoreductor_seleccionado` | Motoreductor especificado |

## Codificación del agitador

| Variable | Descripción |
|---|---|
| `codigo_agitador` | Código final generado |
| `cod_tipo1` / `cod_num1` / `cod_diam1` | Tipo, cantidad y diámetro propela 1 |
| `cod_tipo2` / `cod_num2` / `cod_diam2` | Tipo, cantidad y diámetro propela 2 |
| `cod_velocidad` | Manejo de velocidad |
| `cod_motor` | Elemento motriz |
| `cod_linterna` | Con / sin linterna |
| `cod_sello` | Con / sin sello mecánico |
| `cod_material` | Material |
| `cod_adicional` | Acabado / adicional |

## Comentarios y datos comerciales

| Variable | Descripción |
|---|---|
| `comentarios` / `observaciones` | Texto completo de la sección 14 (todas las líneas unidas) |
| `consideracion1`, `consideracion2`, ... `consideracion10` | Cada línea individual de "CONSIDERACIONES TÉCNICAS PARTICULARES", en el orden en que aparecen (vacía si no se usó esa línea) |
| `consideracion_comercial1`, `consideracion_comercial2`, ... `consideracion_comercial10` | Cada línea de "CONSIDERACIONES COMERCIALES PARTICULARES - PARA EL CLIENTE EN OFERTA", en orden (vacía si no se usó) |
| `moneda_oferta` | Moneda seleccionada en Costeo: `COP` o `USD` |
| `sitio_entrega` | Sitio de entrega editable en la información comercial de Costeo |

Ejemplo: `{{consideracion_comercial1}}` para la primera condición comercial.
Escriba cada marca en su propio párrafo de Word. Las marcas vacías se sustituyen
por texto vacío, pero no eliminan el párrafo de la plantilla.
Se reservan al menos diez marcas técnicas y diez comerciales; si agrega más
líneas en la aplicación, puede usar `consideracion11`, `consideracion_comercial11`,
etc., hasta el número de líneas existentes.
Las consideraciones técnicas y comerciales **internas no se exponen** como
variables de oferta. Si la plantilla no contiene ninguna marca reconocida,
el bloque de datos de respaldo también incluye las condiciones comerciales
para el cliente.

## Valores comerciales del módulo de Costeo

### Información comercial específica

Al final de Costeo se encuentra la sección verde **Información comercial
específica - Para el cliente en oferta**, con los siguientes campos editables:

| Variable | Valor inicial |
|---|---|
| `validez_oferta` | 30 Días. |
| `tiempo_entrega` | Diez (10) semanas después de la orden de compra, anticipo y aprobación de planos. |
| `forma_pago` | 50% con la orden de compra; 50% contra pruebas en planta de NovatecFS y previo al despacho. Otra: a convenir. |
| `sitio_entrega` | En sus instalaciones en territorio nacional |
| `empaque` | Doméstico – madera. |
| `garantia` | Doce (12) meses contra daños que puedan presentarse por defectos de fabricación tanto de materiales como de mano de obra. |

Los valores iniciales se tomaron de `PLANTILLAS/01_GENERAL.docx`. Como la plantilla
solo contiene `${sitio_entrega}` en ese punto, se conserva para ese campo el texto
que ya utilizaba la aplicación. Son valores iniciales de la aplicación: no se
vuelve a leer la plantilla para cambiarlos automáticamente.

Los seis campos se guardan con cada registro. Al cargar un registro antiguo sin
estos campos se usan los valores iniciales; un campo guardado vacío se conserva
vacío. En Word, reemplace los textos fijos de las condiciones por sus marcas,
por ejemplo `{{validez_oferta}}`, para que reflejen las ediciones del formulario.
La plantilla no se modifica automáticamente.

### Precios y márgenes

| Variable | Descripción |
|---|---|
| `cantidad` | Cantidad de equipos indicada en Costeo |
| `moneda_oferta` | `COP` o `USD`, según el selector de moneda |
| `tasa_cambio` | Pesos colombianos por dólar (COP/USD) |
| `precio_unitario` | Precio unitario final editable, en la moneda seleccionada |
| `precio_total` | Precio unitario final multiplicado por la cantidad |
| `margen_materiales` | Margen de materiales como porcentaje, por ejemplo `30%` |
| `margen_ingenieria` | Margen de ingeniería como porcentaje, por ejemplo `30%` |

Ejemplo de bloque para Word:

```text
Cantidad: {{cantidad}}
Moneda: {{moneda_oferta}}
Tasa de cambio (COP/USD): {{tasa_cambio}}
Precio unitario: {{precio_unitario}} {{moneda_oferta}}
Precio total: {{precio_total}} {{moneda_oferta}}
```

Los precios se presentan con dos decimales y formato colombiano (por ejemplo,
`1.234.567,89`), sin símbolo monetario: agregue `{{moneda_oferta}}` donde corresponda.
El precio unitario calculado se redondea a dos decimales antes de calcular el total
de la oferta, para que ambos valores sean consistentes.

Los precios comerciales se agrupan en la subsección verde **Precios finales de
la oferta**, identificada como **Valores para el cliente**. La moneda se elige
con los botones de opción COP/USD; las etiquetas de ambos precios muestran la
moneda activa. Los totales calculados del presupuesto permanecen fuera de ese bloque.

El precio inicial proviene del unitario calculado en Costeo. Una edición manual
se conserva aunque cambien los costos, la cantidad o la tasa de cambio. Para volver
al cálculo automático, pulse **Usar precio calculado**. Cambiar de moneda también
restablece el precio calculado en la moneda elegida; no convierte el precio manual.
La moneda, el precio manual y su modo se guardan al guardar el registro.

Los márgenes de materiales e ingeniería se ingresan como `30` para representar
`30%`; los registros anteriores se convierten desde el formato decimal al cargarlos.
Los demás factores del presupuesto no cambian de formato en esta actualización.
La exportación Excel conserva sus fórmulas y porcentajes de margen.

**Uso interno:** las variables de margen están habilitadas, pero solo se incluirán
en la oferta si se escriben expresamente en la plantilla. No agregarlas a una
oferta comercial si no deben revelarse al cliente.

La generación exige cantidad y tasa de cambio mayores que cero, márgenes válidos
y un precio unitario final no negativo.

---
Fuente: `_buildOfferPlaceholderMap()` en `offer.js`. Si agregas una variable nueva
en el código, debe añadirse ahí para quedar disponible en la plantilla.
