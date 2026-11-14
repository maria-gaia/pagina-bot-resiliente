# Banco Demo · Entorno de pruebas para "bot resiliente"

Sitio bancario **ficticio** para la PoC de Gaia Consultores RPA sobre la **autocuración (self-healing) de Power Automate Desktop**. Simula cambios típicos de un portal (IDs, clases, textos, layout, iframe y carga diferida) para comprobar si un bot se recupera solo del error "Elemento no encontrado".

> ⚠️ **Sitio ficticio.** No es un banco real, no usa nombres, logos ni colores de bancos reales y todos los datos son inventados. El aviso "SITIO FICTICIO" queda visible en todas las pantallas.

**Publicado en:** https://maria-gaia.github.io/pagina-bot-resiliente/
Ejemplo de corrida: https://maria-gaia.github.io/pagina-bot-resiliente/site/index.html?escenario=1&seed=123&panel=0

## Estructura

```
index.html                 Redirige a site/ (para GitHub Pages), conserva los parámetros
site/
  index.html               El banco ficticio
  estilos.css
  app.js                   Escenarios, semilla, datos, vistas y bitácora (JS puro)
docs/
  guia-pruebas.md          Flujo del bot, selectores, procedimiento y checklist de administrador
  matriz-resultados.csv    Plantilla de resultados (separador ;)
  flujo-pad-borrador.md    Borrador de acciones de PAD — POR VALIDAR EN PAD
tests/                     Prueba automática con Playwright (solo para desarrollo)
  flujo.mjs, resultados.md, capturas/
```

El sitio **no tiene dependencias ni build**. `tests/` usa Playwright, pero el sitio no lo necesita.

## Cómo abrirlo

- **Doble clic** en `site/index.html` (funciona con `file://`).
- **Servidor local** (recomendado para PAD, evita activar el acceso a URL de archivo en la extensión):
  ```bash
  python3 -m http.server 8080
  ```
  y abrir `http://localhost:8080/site/index.html?escenario=0&seed=123`.

**Credenciales demo:** usuario `demo` · clave `Demo2026!`
**Datos disponibles:** 01/01/2026 a 31/03/2026 (3 cuentas). Fechas en formato dd/mm/aaaa.

## Escenarios y parámetros

| Parámetro | Ejemplo | Efecto |
|---|---|---|
| `escenario` | `?escenario=1` | 0 Base · 1 Cambio de IDs · 2 Clases y textos · 3 Layout · 4 Combinado · 5 Iframe · 6 Carga diferida · 7 IDs autonumerados · 8 IDs duplicados · 9 Login en 2 pasos · 10 Avisos emergentes · 11 Carga muy lenta · 12 Captcha aritmético · 13 Sesión que expira |
| `seed` | `&seed=123` | Repite exactamente datos, IDs generados, latencia y retardos. Sin semilla se genera una al azar y se muestra en el panel. |
| `latencia` | `&latencia=0` | Desactiva la latencia aleatoria (0,15–1,6 s por acción). |
| `panel` | `&panel=0` | Oculta el panel de pruebas (recomendado en las corridas del bot). |
| `escenario=auto` | `?escenario=auto&seed=123` | **El portal cambia solo:** en cada carga se elige al azar uno de los escenarios de cambio (por defecto 1, 2, 3, 4, 5, 7, 8). Se puede acotar con `&pool=1,2,4`. El escenario que tocó se ve en el panel y queda en la bitácora. |

El detalle de cada escenario está en [docs/guia-pruebas.md](docs/guia-pruebas.md#3-el-sitio-de-pruebas).

**Panel de pruebas** (abajo a la derecha, colapsado por defecto): permite cambiar escenario, semilla y latencia, copiar la URL reproducible y ver o **exportar la bitácora a CSV** (`fecha;escenario;semilla;evento`). La bitácora se guarda en `localStorage`. Si el navegador lo bloquea, el sitio sigue funcionando, pero la bitácora solo dura mientras la página esté abierta.

## Publicarlo en GitHub Pages

1. Crear un repositorio y subir esta carpeta completa.
2. *Settings → Pages → Build and deployment → Source: Deploy from a branch* → rama `main`, carpeta **`/ (root)`**.
3. La URL queda `https://<usuario>.github.io/<repo>/`. El `index.html` raíz redirige a `site/` conservando los parámetros, por ejemplo `https://<usuario>.github.io/<repo>/?escenario=4&seed=123`.

No se publica desde `/docs` porque esa carpeta es la documentación. El sitio incluye `noindex` para que no lo indexen los buscadores.

## Publicarlo en Vercel

1. En [vercel.com/new](https://vercel.com/new), **Import Git Repository** → elegir `maria-gaia/pagina-bot-resiliente` (la primera vez, autorizar a Vercel en GitHub).
2. **Framework Preset:** `Other`. **Root Directory:** `./`. Dejar vacíos *Build Command* e *Install Command* y *Output Directory* por defecto: es un sitio estático, sin build.
3. **Deploy.** La URL queda `https://<proyecto>.vercel.app/` y redirige a `site/` conservando los parámetros, por ejemplo `https://<proyecto>.vercel.app/?escenario=7&seed=123`.
4. Cada `git push` a `main` vuelve a publicar automáticamente.

La carpeta `tests/` también se sube, pero no se ejecuta: Vercel solo sirve los archivos.

## Pruebas automáticas (opcional)

```bash
cd tests && npm run instalar
```
```bash
cd tests && npm run probar
```

Recorre el flujo completo (login → cuenta → fechas → consultar → detalle de cada movimiento → CSV → cerrar sesión) en los 14 escenarios con localizadores resistentes (en el 12, captcha, verifica que el login se rechace de forma controlada). También comprueba qué selectores "frágiles" del escenario 0 se rompen en cada escenario. Resultados en `tests/resultados.md` y capturas en `tests/capturas/`.

> Playwright **no** prueba la autocuración de PAD: solo valida que el sitio se comporta como debe. La autocuración se prueba en PAD, desde la consola (ver la guía).
