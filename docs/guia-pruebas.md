# Guía de pruebas · PoC "bot resiliente" con autocuración de Power Automate Desktop

> **Sitio ficticio.** "Banco Demo" no es un banco real. Todos los datos son inventados y se generan a partir de una semilla.
> Referencia oficial: [Autocuración (versión preliminar) – Microsoft Learn](https://learn.microsoft.com/es-es/power-automate/desktop-flows/self-healing). La función está **en versión preliminar** y puede cambiar.

## 1. Objetivo

Demostrar que un flujo de escritorio de Power Automate Desktop (PAD) que falla con **"Elemento no encontrado"** cuando el portal cambia (IDs, clases, textos, layout) puede **recuperarse solo** con la autocuración. Además, documentar con evidencia (matriz de resultados + bitácora + capturas) qué cambios recupera y cuáles no.

## 2. Requisitos

### 2.1 Checklist de administrador (Microsoft 365 / Power Platform)

Según la documentación oficial (revisada el 13/11/2026, página con fecha 28/10/2026), **todas** estas opciones deben estar activas:

- [ ] **Tipo de cuenta:** cuenta **premium de organización** (la autocuración no tiene costo adicional, pero puede estar sujeta a límites de servicio).
- [ ] **Nube/región:** **no** está disponible en nubes gubernamentales (GCC, GCC High, DoD) ni soberanas. Confirmar la región del entorno.
- [ ] **Centro de administración de Microsoft 365** → *Configuración de Copilot* → **Proveedores de IA que funcionan como subprocesadores de Microsoft** → activar **Anthropic**.
  - Viene activado por defecto en la mayoría de los clientes de la nube comercial, **excepto UE/EFTA y Reino Unido**. Revisarlo si el tenant está en esas regiones.
- [ ] **Centro de administración de Power Platform** → *Copilot > Configuración* → sección Power Platform → **Modelos externos** → habilitar **Anthropic** a nivel de entorno o grupo de entornos.
- [ ] **Centro de administración de Power Platform** → *Administrar > Entornos* → (entorno) → tarjeta **Características de IA generativa** → *Editar* → marcar **Mover datos entre regiones**.
  - Esta casilla no aparece ni hace falta en regiones de EE. UU.
- [ ] **Centro de administración de Power Platform** → *Copilot > Configuración* → sección Power Automate → **Copilot en Power Automate** → **Activado**.
- [ ] Revisión del área de **seguridad/cumplimiento del banco**: durante la autocuración, PAD envía al servicio de IA una captura del elemento, el título de la ventana y **la imagen completa del escritorio**. En un portal bancario real esto puede incluir datos sensibles, así que conviene acordarlo antes de usar la función fuera de esta PoC.

### 2.2 Equipo donde corre el bot

- [ ] **Power Automate para escritorio 2.66 o posterior.**
- [ ] Equipo registrado en el entorno (máquina o grupo de máquinas) para ejecutarlo **desde la consola o desde la nube**.
- [ ] Navegador con la extensión de Power Automate (Edge o Chrome).
- [ ] Si se abre el sitio como archivo local (`file://`): activar **"Permitir el acceso a URL de archivo"** en la configuración de la extensión. **Recomendado:** usar la URL de GitHub Pages o un servidor local (ver README) para evitar este paso.
- [ ] Resolución y escala de pantalla fijas durante todas las corridas (la autocuración usa capturas).
- [ ] Opcional: activar la [configuración del Registro](https://learn.microsoft.com/es-es/power-automate/desktop-flows/governance#configure-power-automate-for-desktop-to-prevent-cleanup-of-flow-run-action-details) que conserva los detalles de las acciones en registros locales, donde aparece la propiedad `repairWithAIInfo`.

> **Importante:** la autocuración **solo actúa en ejecuciones de consola y nube** (asistidas y desatendidas). **No tiene efecto en el diseñador.** Las pruebas con autocuración deben lanzarse desde la consola de PAD o desde el portal.

## 3. El sitio de pruebas

| Parámetro | Valores | Uso |
|---|---|---|
| `escenario` | 0–13 | Tipo de cambio del portal (tabla siguiente). |
| `seed` | entero, p. ej. `123` | Fija datos, IDs generados, latencia y retardos. **Usar siempre `seed=123` en la PoC.** |
| `latencia` | `0` | Desactiva la latencia aleatoria (útil al capturar elementos). |
| `panel` | `0` | Oculta el panel de pruebas (recomendado durante las corridas del bot). |
| `escenario=auto` | `auto` (+ `pool=1,2,4` opcional) | En **cada carga** elige al azar un escenario de cambio. Útil para una demo "en vivo" de un portal que cambia sin avisar. Para la matriz usar escenarios fijos y, en modo auto, sacar de la bitácora qué escenario tocó en cada corrida (evento "Modo auto: escenario elegido…"). |

| Esc. | Nombre | Qué cambia respecto al escenario 0 |
|---|---|---|
| 0 | Base | Nada. Aquí se **capturan** los elementos. |
| 1 | Cambio de IDs | Todos los `id` y `name` pasan a valores generados (`ux-4l2j1t`). Textos, clases y layout iguales. |
| 2 | Cambio de clases y textos | Clases ofuscadas (`Btn_solid__f2Lx8`) y textos reescritos ("Consultar" → "Buscar movimientos", "Cerrar" → "Volver", etc.). IDs iguales. |
| 3 | Cambio de layout | Menú lateral, contenedores extra, fechas antes que la cuenta, columnas reordenadas, botón de descarga junto a Consultar y detalle en otra estructura (`dl`). |
| 4 | Combinado | 1 + 2 + 3 a la vez. |
| 5 | Iframe | La consulta de movimientos y el pop-up de detalle están **dentro de un iframe**. |
| 6 | Carga diferida | Tabla de cuentas, formulario, resultados, botón de descarga y detalle **no existen en el DOM** hasta 1–6 s después. |

**Escenarios 7–13: patrones observados en portales de banca empresas reales** (revisión solo de sus páginas públicas de login, 13/11/2026). Son recreaciones **genéricas**, sin nombres, logos, colores ni diseño de ningún banco.

| Esc. | Nombre | Qué hace | Patrón real que imita |
|---|---|---|---|
| 7 | IDs autonumerados | IDs `cmp-0`, `cmp-1`… asignados en orden de dibujo; el desfase cambia en cada vista. | Frameworks que numeran componentes (`mat-input-0`, `_oj25\|input`, `dijit_form_Button_0`). |
| 8 | IDs duplicados | Copias **ocultas** de usuario, clave, Ingresar, filtros, Consultar y Ordenante con el **mismo id**, ubicadas antes que las reales. | Plantillas ocultas que repiten `id="username"`, `id="password"`, `id="tokenInput"`. |
| 9 | Login en 2 pasos | Usuario → **Continuar** (un `span` con rol de botón) → clave → Ingresar. | Login por pasos; botones que no son `<button>`. |
| 10 | Avisos emergentes | Banner de cookies que tapa la página 0,8–2 s después de cargar y aviso modal tras el login. | Banners de cookies o avisos sobre el formulario. |
| 11 | Carga muy lenta | El formulario de login aparece a los 10–15 s y cada consulta tarda 6–10 s. | Portales que tardan entre 7 y 14 s en mostrar el primer campo. |
| 12 | Captcha aritmético | Operación dibujada en un canvas, que cambia en cada intento (no depende de la semilla). | Captcha de suma en imagen en el login. |
| 13 | Sesión que expira | La sesión expira **una vez**, al abrir el detalle n.º 2–4 (fijo por semilla), y vuelve al login. | Expiración de sesión a mitad de un proceso largo. |

Credenciales demo: usuario **`demo`**, clave **`Demo2026!`**.
Datos disponibles: **01/01/2026 al 31/03/2026**. Rango sugerido para la PoC: cuenta **2200-4815-02**, del **01/02/2026** al **10/02/2026** (6 movimientos con `seed=123`).

## 4. Flujo del bot (paso a paso)

1. Abrir el navegador en `…/site/index.html?escenario=N&seed=123&panel=0`.
2. **Login:** rellenar *Usuario* y *Clave* y hacer clic en *Ingresar*.
3. Esperar a que cargue *Mis cuentas*.
4. Clic en el menú **Movimientos**.
5. **Cuenta:** seleccionar `2200-4815-02` en la lista *Cuenta*.
6. **Fechas:** rellenar *Fecha desde* = `01/02/2026` y *Fecha hasta* = `10/02/2026` (formato dd/mm/aaaa).
7. Clic en **Consultar** y esperar la tabla.
8. **Detalle de cada movimiento:** para cada fila `i` (1..N):
   1. Clic en **Ver detalle** de la fila `i`.
   2. Leer el texto de **Ordenante** (y opcionalmente referencia y monto).
   3. Clic en **Cerrar**.
9. Clic en **Descargar CSV** y guardar `movimientos_2200-4815-02_01022026_10022026.csv`.
10. Clic en **Cerrar sesión** y verificar el mensaje "Sesión cerrada correctamente".
11. Cerrar el navegador.

Formato del CSV descargado: separador `;`, UTF-8 con BOM, decimales con coma. Columnas: `fecha; hora; referencia; descripcion; tipo; monto; saldo; ordenante; identificacion_ordenante; entidad_origen; cuenta_origen; beneficiario; concepto`.

## 5. Elementos a capturar en el escenario 0 y selector "malo"

Capturar con `?escenario=0&seed=123&latencia=0&panel=0`. Después, en el **Repositorio de elementos de la IU**, **editar** cada selector para dejarlo intencionalmente frágil.

| # | Elemento | Acción PAD | Selector "malo" (solo ID) | Se rompe en |
|---|---|---|---|---|
| 1 | Campo Usuario | Rellenar campo de texto | `input[Id="usuario"]` | 1, 4 |
| 2 | Campo Clave | Rellenar campo de texto | `input[Id="clave"]` | 1, 4 |
| 3 | Botón Ingresar | Hacer clic en el botón | `button[Id="btnIngresar"]` | 1, 4 |
| 4 | Menú Movimientos | Hacer clic en el vínculo | `a[Id="navMovimientos"]` | 1, 4 |
| 5 | Lista Cuenta | Establecer valor de lista desplegable | `select[Id="selCuenta"]` | 1, 4, 5, 6* |
| 6 | Fecha desde | Rellenar campo de texto | `input[Id="fechaDesde"]` | 1, 4, 5, 6* |
| 7 | Fecha hasta | Rellenar campo de texto | `input[Id="fechaHasta"]` | 1, 4, 5, 6* |
| 8 | Botón Consultar | Hacer clic en el botón | `button[Id="btnConsultar"]` | 1, 4, 5, 6* |
| 9 | Botón Ver detalle (fila i) | Hacer clic en el botón | `button[Id="btnDetalle-%i%"]` | 1, 4, 5, 6* |
| 10 | Texto Ordenante | Obtener detalles del elemento (texto) | `span[Id="detOrdenante"]` | 1, 4, 5, 6* |
| 11 | Botón Cerrar detalle | Hacer clic en el botón | `button[Id="btnCerrarDetalle"]` | 1, 4, 5, 6* |
| 12 | Botón Descargar CSV | Hacer clic en el botón | `button[Id="btnDescargarCsv"]` | 1, 4, 5, 6* |
| 13 | Botón Cerrar sesión | Hacer clic en el botón | `button[Id="btnSalir"]` | 1, 4 |

\* En el escenario 6 el selector es correcto, pero el elemento **todavía no existe**. Falla solo si la acción no espera lo suficiente.

**Cómo dejarlo "malo":** en el editor de selectores de PAD, desmarcar todos los atributos salvo `Id` y quitar los elementos padre de la ruta (dejar solo el elemento final). La sintaxis exacta de la tabla está **por validar en PAD**, porque el editor puede mostrar la ruta como `html > body > … > button[Id="btnConsultar"]`.

**Variante "ampliada" (opcional, para forzar fallas en 2 y 3):** un selector solo por ID **resiste** los cambios de clases, textos y layout (escenarios 2 y 3), y eso también es un hallazgo válido. Para que esos escenarios también fallen sin autocuración, capturar un segundo juego de elementos (sufijo `_ampliado`) con **Id + Class + Text + ruta completa de padres con posición** (`:eq(n)`). Así se rompe cualquier cambio. Registrar en la matriz cuál variante se usó.

Evidencia de Playwright con selectores CSS equivalentes (`tests/resultados.md`):

| Esc. | Por ID | Por clase | Por estructura/posición | Por texto | `#detOrdenante` |
|---|---|---|---|---|---|
| 0 | coincide | coincide | coincide | coincide | coincide |
| 1 | **se rompe** | coincide | coincide | coincide | **se rompe** |
| 2 | coincide | **se rompe** | coincide | **se rompe** | coincide |
| 3 | coincide | coincide | **se rompe** | coincide | coincide |
| 4 | **se rompe** | **se rompe** | **se rompe** | **se rompe** | **se rompe** |
| 5 | **se rompe**ᵃ | **se rompe**ᵃ | **se rompe**ᵃ | **se rompe**ᵃ | **se rompe**ᵃ |
| 6 | coincide (tarde)ᵇ | coincide (tarde)ᵇ | coincide (tarde)ᵇ | coincide (tarde)ᵇ | coincide (tarde)ᵇ |

ᵃ El elemento está dentro de un iframe: un selector capturado sin el iframe como padre no lo encuentra.
ᵇ Al abrir la vista el elemento no existe; aparece entre 1,5 y 3,5 s después.

## 6. Procedimiento de ejecución

### 6.1 Preparación (una sola vez)
1. Crear el flujo en PAD siguiendo el [borrador de acciones](flujo-pad-borrador.md).
2. Capturar los elementos en el escenario 0 y dejarlos "malos" (sección 5).
3. Parametrizar la URL con una variable de entrada `NumEscenario` para no editar el flujo en cada corrida: `…/site/index.html?escenario=%NumEscenario%&seed=123&panel=0`.
4. Probar en el diseñador con `NumEscenario = 0` hasta que termine sin errores. Guardar el flujo.

### 6.2 Corrida A – sin autocuración
1. Verificar que **ninguna** acción tenga la autocuración activa.
2. Desde la **consola de PAD** (o el portal), ejecutar el flujo con `NumEscenario` = 1, 2, 3, 4 (y opcionalmente 5 y 6).
3. Registrar por escenario: acción donde falló, mensaje ("Elemento no encontrado"), tiempo total y una captura del error.

### 6.3 Corrida B – con autocuración
1. En el diseñador, para cada acción de la tabla de la sección 5: abrir la acción → **Control de errores** → activar **Recuperación automática (versión preliminar)**. El icono de la acción cambia para indicar que está habilitada. Si el indicador de disponibilidad no aparece al pasar el puntero, esa acción no es compatible: anotarlo.
2. No configurar reintentos largos. El orden de evaluación es **Directiva de reintentos → Autorreparación → Establecer variable / Ejecutar subflujo → Continuar / Generar error**, así que los reintentos se consumen antes que la autocuración.
3. Guardar y ejecutar **desde la consola o la nube** (no desde el diseñador) los mismos escenarios.
4. Comparar el CSV descargado con el del escenario 0: con la misma semilla, el contenido debe ser **idéntico**.

### 6.4 Dónde ver el resultado de la recuperación
- **Portal de Power Automate** → *Mis flujos* → *Flujos de escritorio* → (flujo) → **ejecución** concreta. En la página de la ejecución aparece un **resumen de la actividad de autocuración** con el detalle de **hasta 3 intentos correctos**. Hoy **no** se muestra a nivel de cada acción.
- **Registros locales** (si se activó la clave del Registro): propiedad **`repairWithAIInfo`** en el registro de la acción. Indica si hubo intento de reparación, si funcionó y **el selector generado por IA** usado en tiempo de ejecución. Copiarlo a la columna `selector_generado_por_ia` de la matriz.
- **Bitácora del sitio:** en el panel de pruebas, **Exportar bitácora CSV**. Registra cada login, consulta, detalle abierto/cerrado, descarga y cierre de sesión con hora en milisegundos, escenario y semilla. Sirve para demostrar qué hizo realmente el bot en el portal.
  - La bitácora se guarda en el `localStorage` del navegador y se comparte entre corridas. Usar **Limpiar** antes de cada serie de pruebas.
  - Si se ocultó el panel (`panel=0`), abrir la misma URL sin ese parámetro para exportar.

### 6.5 Qué observar (hipótesis a validar)
- **Escenario 1 (IDs):** el caso ideal de la autocuración (elemento visualmente igual, selector distinto).
- **Escenario 2 (textos):** cuidado con *Cerrar → Volver*: la IA podría elegir la **×** del pop-up. En ambos casos el pop-up se cierra, pero hay que anotar qué eligió.
- **Escenario 3 (layout):** en el detalle, *Ordenante* pasa de una tabla a una lista `dl`. Verificar que el valor leído sea el ordenante y no la etiqueta ni otro campo.
- **Escenario 4:** el más exigente; esperar varias reparaciones por corrida. El resumen del portal solo detalla 3, así que el resto se ve en `repairWithAIInfo`.
- **Escenario 5 (iframe):** validar si la reparación encuentra elementos dentro del iframe. Si no, el remedio clásico es capturar con el iframe como padre.
- **Escenario 6 (diferido):** la autocuración **no es la herramienta adecuada** para elementos que todavía no existen. Debe resolverse con *Esperar a que la página web contenga el elemento* o con la directiva de reintentos. Riesgo: la IA podría "reparar" hacia otro elemento visible. Anotarlo si ocurre.
- **Escenario 7 (autonumerados):** igual que el 1 para un selector por ID, pero además la numeración **se desplaza** entre vistas. Ver si la reparación se repite en cada corrida.
- **Escenario 8 (duplicados):** el selector por ID **no falla**: encuentra la copia oculta. Sin autocuración, PAD puede escribir en el campo oculto o leer un ordenante vacío **sin dar error**. La autocuración solo se activa ante "Elemento no encontrado", así que aquí probablemente **no actúe**. Es el caso que más justifica las validaciones de negocio.
- **Escenario 9 (2 pasos):** es un cambio de **flujo**, no de selector. La autocuración no inventa el clic en *Continuar*: el flujo debe contemplarlo (p. ej. "si existe Continuar, hacer clic").
- **Escenario 10 (avisos):** el aviso aparece mientras el bot escribe. Puede no producir "Elemento no encontrado" (el elemento existe, solo está tapado). Se resuelve con una rutina "si aparece el aviso, aceptar".
- **Escenario 11 (lento):** se resuelve con esperas de 20–30 s. Con esperas cortas, la autocuración se activaría sobre un elemento que todavía no existe.
- **Escenario 12 (captcha):** **fuera del alcance** del RPA y de la autocuración. El resultado esperado es una **falla controlada** (mensaje "El resultado de la operación es incorrecto"), que se registra y notifica. Para un banco con captcha, la vía es negociar un canal (API, archivo, usuario sin captcha).
- **Escenario 13 (sesión):** el bot debe detectar el mensaje de sesión expirada, reingresar y **retomar desde la fila pendiente**. No es un caso para la autocuración, sino para el manejo de excepciones del flujo.
- **Precisión:** Microsoft advierte que la IA puede identificar ocasionalmente un elemento no previsto. Por eso hay que verificar siempre el CSV y los ordenantes leídos contra el escenario 0.
- La reparación se aplica **en tiempo de ejecución**. Hay que confirmar si PAD actualiza el selector guardado; si no lo hace, se reparará en cada corrida y conviene actualizar el repositorio de elementos con el selector de `repairWithAIInfo`.

## 7. Registro de resultados

Llenar [`matriz-resultados.csv`](matriz-resultados.csv) (separador `;`, se abre directo en Excel en español). La columna `esperado_sin_autocuracion_selector_ID` ya trae lo que debería pasar con el selector "malo" por ID, según la prueba automática.

Para cada corrida, guardar en una carpeta `evidencia/AAAAMMDD_escN_{sin|con}/`:
- captura del error o del resumen de autocuración,
- CSV descargado,
- bitácora exportada,
- extracto de `repairWithAIInfo` (si aplica).

## 8. Aplicación a Promesa (siguientes pasos)

- Repetir el método con el bot real (descarga de movimientos y confirmación de pagos). Las acciones equivalentes son: login, selección de cuenta, fechas, consulta, detalle con ordenante, descarga y logout.
- Activar la autocuración **solo** en acciones de un elemento (clic, rellenar, seleccionar, leer). La extracción de tablas y las acciones de ventana no están cubiertas.
- Mantener validaciones de negocio después de cada paso crítico (p. ej. que el CSV tenga las columnas esperadas y que el ordenante no esté vacío), para detectar una reparación hacia el elemento equivocado.
