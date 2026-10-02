# Variables disponibles para la plantilla de cotización (.docx)

Para usarlas, escribe en tu plantilla Word cualquiera de estos 3 formatos con el
nombre de la variable (sin espacios):

```
{{nombre_variable}}
${nombre_variable}
[[nombre_variable]]
```

Al generar el borrador con el botón **🧾 Borrador oferta**, cada marca se reemplaza
por el valor actual del formulario.

## Datos generales del encabezado

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
| `nombre_tanque` | Nombre del tanque |
| `tag_tanque` | TAG del tanque |
| `tag_agitador` | TAG del agitador |

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

## 3. Selección de propelas

| Variable | Descripción |
|---|---|
| `rpm` | Velocidad de rotación |
| `rpm_ref` | RPM referencia (propela 1) |
| `rpm_max` | RPM máxima permitida |
| `num_propelas` | Número de propelas requeridas |
| `pct_fondo` | % ubicación propela 1 desde el fondo |
| `propela1_tipo` / `propela1_modelo` | Tipo y modelo propela 1 |
| `propela2_tipo` / `propela2_modelo` | Tipo y modelo propela 2 |
| `propela3_tipo` / `propela3_modelo` | Tipo y modelo propela 3 |
| `propela4_tipo` / `propela4_modelo` | Tipo y modelo propela 4 |
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
| `comentarios` / `observaciones` | Texto de la sección 14 (alias equivalentes) |
| `moneda_oferta` | Moneda de la oferta |
| `sitio_entrega` | Sitio de entrega |

---
Fuente: `_buildOfferPlaceholderMap()` en `offer.js`. Si agregas una variable nueva
en el código, debe añadirse ahí para quedar disponible en la plantilla.
