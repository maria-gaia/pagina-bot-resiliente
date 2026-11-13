# Resultados de la prueba automática (Playwright headless)

Fecha: 2026-11-13T18:58:53.525Z
Semilla: 123 · Cuenta 2200-4815-02 · 01/02/2026 a 10/02/2026

## Flujo completo con localizadores resistentes

| Esc. | Nombre | Resultado | Filas | Detalles leídos | CSV | Tiempo (s) | Pasos / error |
|---|---|---|---|---|---|---|---|
| 0 | Base | OK | 6 | 6 | 6 filas | 7.4 | login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |
| 1 | Cambio de IDs | OK | 6 | 6 | 6 filas | 7.2 | login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |
| 2 | Cambio de clases y textos | OK | 6 | 6 | 6 filas | 7.2 | login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |
| 3 | Cambio de layout | OK | 6 | 6 | 6 filas | 7.1 | login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |
| 4 | Cambio combinado | OK | 6 | 6 | 6 filas | 7.2 | login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |
| 5 | Iframe | OK | 6 | 6 | 6 filas | 7.2 | login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |
| 6 | Carga diferida | OK | 6 | 6 | 6 filas | 20.1 | login → cuenta y fechas → consulta (6 filas) → detalle x6 → descarga CSV → cierre de sesión |

## Selectores frágiles capturados en el escenario 0 (evaluados en el documento principal)

| Esc. | ID #btnConsultar | Clase form button.btn-primario | Estructura form>div:nth-child(2)>button:nth-child(1) | Texto button="Consultar" | #detOrdenante | #btnConsultar al abrir la vista |
|---|---|---|---|---|---|---|
| 0 | coincide | coincide | coincide | coincide | coincide | sí |
| 1 | **se rompe** | coincide | coincide | coincide | **se rompe** | no |
| 2 | coincide | **se rompe** | coincide | **se rompe** | coincide | sí |
| 3 | coincide | coincide | **se rompe** | coincide | coincide | sí |
| 4 | **se rompe** | **se rompe** | **se rompe** | **se rompe** | **se rompe** | no |
| 5 | **se rompe** | **se rompe** | **se rompe** | **se rompe** | **se rompe** | no |
| 6 | coincide | coincide | coincide | coincide | coincide | no |

## Verificaciones adicionales

| Prueba | Resultado | Detalle |
|---|---|---|
| Semilla fija repite IDs (esc 1, seed 123) | OK | ux-4l2j1t = ux-4l2j1t |
| Otra semilla cambia IDs (seed 124) | OK | ux-4l2j1t ≠ ux-4v24qs |
| Clave incorrecta muestra error | OK |  |
| Fecha mal formateada muestra error | OK |  |
| Semilla fija repite datos | OK | 01/02/2026 | Transferencia enviada | TRX26000146 |
| Aviso "sitio ficticio" visible | OK |  |
| Bitácora exportada a CSV | OK | bitacora_20261113_195853.csv (16 eventos) |
| Funciona con localStorage bloqueado | OK |  |
| index.html raíz redirige a site/ con parámetros | OK |  |
| Sin scroll horizontal en móvil (375px) | OK | scrollWidth=375 |

Ordenantes leídos en el escenario 0: Agroindustrias Valle Verde S.A.; Daniela Benítez Mendieta; Comercial Punta Alta; Comercializadora Demo Andina S.A.; Comercializadora Demo Andina S.A.; Valeria Benítez Benítez
