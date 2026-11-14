# Resultados de la prueba automática (Playwright headless)

Fecha: 2026-11-14T00:59:07.662Z
Semilla: 123 · Cuenta 2200-4815-02 · 01/02/2026 a 10/02/2026

## Flujo completo con localizadores resistentes

| Esc. | Nombre | Resultado | Filas | Detalles leídos | CSV | Tiempo (s) | Pasos / error |
|---|---|---|---|---|---|---|---|
| 0 | Base | OK | 6 | 6 | 6 filas | 7.5 | login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |
| 1 | Cambio de IDs | OK | 6 | 6 | 6 filas | 7.2 | login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |
| 2 | Cambio de clases y textos | OK | 6 | 6 | 6 filas | 7.1 | login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |
| 3 | Cambio de layout | OK | 6 | 6 | 6 filas | 7.1 | login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |
| 4 | Cambio combinado | OK | 6 | 6 | 6 filas | 7.1 | login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |
| 5 | Iframe | OK | 6 | 6 | 6 filas | 7.2 | login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |
| 6 | Carga diferida | OK | 6 | 6 | 6 filas | 20.7 | login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |
| 7 | IDs autonumerados | OK | 6 | 6 | 6 filas | 7.2 | login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |
| 8 | IDs duplicados | OK | 6 | 6 | 6 filas | 7.1 | login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |
| 9 | Login en 2 pasos | OK | 6 | 6 | 6 filas | 7.9 | login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |
| 10 | Avisos emergentes | OK | 6 | 6 | 6 filas | 9.6 | banner de cookies aceptado → aviso post-login cerrado → login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |
| 11 | Carga muy lenta | OK | 6 | 6 | 6 filas | 42.5 | login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |
| 12 | Captcha aritmético | OK (falla controlada) | - | - | - | 1.1 | login rechazado por captcha (falla controlada esperada) |
| 13 | Sesión que expira | OK | 6 | 6 | 6 filas | 9.0 | login → cuenta y fechas → consulta (6 filas) → sesión expirada en el detalle 3 → reingreso → detalle x6 → descarga CSV → cierre de sesión |
| 14 | Controles que cambian | OK | 6 | 6 | 6 filas | 7.1 | [fecha=selects, botón=enlace/en-linea] login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |

## Selectores frágiles capturados en el escenario 0 (evaluados en el documento principal)

"oculto" = el selector coincide, pero con un elemento invisible (el bot actuaría sobre el equivocado).

| Esc. | ID #btnConsultar | Clase form button.btn-primario | Estructura form>div:nth-child(2)>button:nth-child(1) | Texto button="Consultar" | #detOrdenante | #btnConsultar visible al abrir la vista |
|---|---|---|---|---|---|---|
| 0 | coincide | coincide | coincide | coincide | coincide | sí |
| 1 | **se rompe** | coincide | coincide | coincide | **se rompe** | no |
| 2 | coincide | **se rompe** | coincide | **se rompe** | coincide | sí |
| 3 | coincide | coincide | **se rompe** | coincide | coincide | sí |
| 4 | **se rompe** | **se rompe** | **se rompe** | **se rompe** | **se rompe** | no |
| 5 | **se rompe** | **se rompe** | **se rompe** | **se rompe** | **se rompe** | no |
| 6 | coincide | coincide | coincide | coincide | coincide | no |
| 7 | **se rompe** | coincide | coincide | coincide | **se rompe** | no |
| 8 | **oculto** | coincide | coincide | **oculto** | **oculto** | no |
| 9 | coincide | coincide | coincide | coincide | coincide | sí |
| 10 | coincide | coincide | coincide | coincide | coincide | sí |
| 11 | coincide | coincide | coincide | coincide | coincide | sí |
| 12 | - | - | - | - | - | - |
| 13 | coincide | coincide | coincide | coincide | coincide | sí |
| 14 | coincide | **se rompe** | coincide | **se rompe** | coincide | sí |

Notas: esc. 7: #usuario → se rompe · esc. 8: #usuario → oculto · esc. 11: formulario de login disponible a los 13.0 s

## Verificaciones adicionales

| Prueba | Resultado | Detalle |
|---|---|---|
| Esc. 14: fecha texto, botón boton (derecha) | OK | 6 filas |
| Esc. 14: fecha iso, botón enlace (arriba) | OK | 6 filas |
| Esc. 14: fecha nativa, botón icono (en-linea) | OK | 6 filas |
| Esc. 14: fecha selects, botón input (derecha) | OK | 6 filas |
| Esc. 14: fecha calendario, botón enlace (en-linea) | OK | 6 filas |
| Esc. 14: dd/mm/aaaa en campo aaaa-mm-dd da error de formato | OK |  |
| Semilla fija repite IDs (esc 1, seed 123) | OK | ux-4l2j1t = ux-4l2j1t |
| Otra semilla cambia IDs (seed 124) | OK | ux-4l2j1t ≠ ux-4v24qs |
| Clave incorrecta muestra error | OK |  |
| Fecha mal formateada muestra error | OK |  |
| Semilla fija repite datos | OK | 01/02/2026 | Transferencia enviada | TRX26000146 |
| Bitácora exportada a CSV | OK | bitacora_20261114_015907.csv (54 eventos) |
| Funciona con localStorage bloqueado | OK |  |
| index.html raíz redirige a site/ con parámetros | OK |  |
| Sin scroll horizontal en móvil (375px) | OK | scrollWidth=375 |

Ordenantes leídos en el escenario 0: Agroindustrias Valle Verde S.A.; Daniela Benítez Mendieta; Comercial Punta Alta; Comercializadora Demo S.A.; Comercializadora Demo S.A.; Valeria Benítez Benítez
