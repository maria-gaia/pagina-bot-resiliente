// Prueba automática del sitio ficticio con Playwright (headless).
// NO prueba la autocuración de PAD: verifica que el sitio se comporte como debe en cada escenario
// y que los selectores "frágiles" capturados en el escenario 0 se rompan donde corresponde.
//
// Uso:  cd tests && npm run instalar && npm run probar
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const SITIO = pathToFileURL(path.resolve(aqui, '../site/index.html')).href;
const CAPTURAS = path.join(aqui, 'capturas');
const DESCARGAS = path.join(aqui, 'descargas');
fs.mkdirSync(CAPTURAS, { recursive: true });
fs.mkdirSync(DESCARGAS, { recursive: true });

const SEMILLA = 123;
const DESDE = '01/02/2026';
const HASTA = '10/02/2026';
const CUENTA = '2200-4815-02';
const NOMBRES = ['Base', 'Cambio de IDs', 'Cambio de clases y textos', 'Cambio de layout', 'Cambio combinado', 'Iframe', 'Carga diferida'];

// Selectores "malos" que un bot grabaría en el escenario 0 (se evalúan en el documento principal, como un selector sin iframe).
const FRAGILES = {
  'ID #btnConsultar': `document.querySelector('#btnConsultar')`,
  'Clase form button.btn-primario': `document.querySelector('form button.btn-primario')`,
  'Estructura form>div:nth-child(2)>button:nth-child(1)': `document.querySelector('form > div:nth-child(2) > button:nth-child(1)')`,
  'Texto button="Consultar"': `document.evaluate("//button[normalize-space()='Consultar']", document, null, 9, null).singleNodeValue`
};

// Localizadores resistentes (rol + texto con alternativas): emulan lo que haría un selector "sanado".
const R = {
  usuario: (s) => s.getByLabel(/^(Usuario|Código de usuario)$/),
  clave: (s) => s.getByLabel(/^(Clave|Contraseña)$/),
  ingresar: (s) => s.getByRole('button', { name: /^(Ingresar|Entrar)$/ }),
  menuMov: (s) => s.getByRole('link', { name: /^(Movimientos|Consultar movimientos)$/ }),
  cuenta: (s) => s.getByLabel(/^(Cuenta|Seleccione la cuenta)$/),
  desde: (s) => s.getByLabel(/^(Fecha desde|Desde)$/),
  hasta: (s) => s.getByLabel(/^(Fecha hasta|Hasta)$/),
  consultar: (s) => s.getByRole('button', { name: /^(Consultar|Buscar movimientos)$/ }),
  verDetalle: (s) => s.getByRole('button', { name: /^(Ver detalle|Detalle)$/ }),
  dialogo: (s) => s.getByRole('dialog'),
  ordenante: (d) => d.getByText(/^(Ordenante|Nombre del ordenante)$/).locator('xpath=following-sibling::*[1]'),
  cerrar: (d) => d.getByRole('button', { name: /^(Cerrar|Volver)$/ }).last(),
  descargar: (s) => s.getByRole('button', { name: /^(Descargar CSV|Exportar movimientos)$/ }),
  salir: (s) => s.getByRole('button', { name: /^(Cerrar sesión|Salir)$/ })
};

async function fragiles(page) {
  const out = {};
  for (const [nombre, expr] of Object.entries(FRAGILES)) out[nombre] = await page.evaluate(`!!(${expr})`);
  return out;
}

async function probarEscenario(browser, n) {
  const t0 = Date.now();
  const res = { escenario: n, nombre: NOMBRES[n], pasos: [], ok: false };
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1366, height: 900 }, locale: 'es-EC' });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const paso = (txt) => res.pasos.push(txt);
  const cap = (nombre, full = true) => page.screenshot({ path: path.join(CAPTURAS, `esc${n}_${nombre}.png`), fullPage: full });
  try {
    await page.goto(`${SITIO}?escenario=${n}&seed=${SEMILLA}&panel=0`);
    await R.usuario(page).fill('demo');
    await R.clave(page).fill('Demo2026!');
    await cap('1_login');
    await R.ingresar(page).click();
    await R.menuMov(page).waitFor({ timeout: 10000 });
    paso('login');

    await R.menuMov(page).click();
    const scope = n === 5 ? page.frameLocator('iframe[title="Consulta de movimientos"]') : page;
    res.consultarPresenteAlInstante = await page.evaluate(`!!document.querySelector('#btnConsultar')`);
    await R.cuenta(scope).waitFor({ timeout: 15000 });
    await R.cuenta(scope).selectOption(CUENTA);
    await R.desde(scope).fill(DESDE);
    await R.hasta(scope).fill(HASTA);
    paso('cuenta y fechas');
    res.fragiles = await fragiles(page);

    await R.consultar(scope).click();
    const filas = scope.locator('table tbody tr');
    await filas.first().waitFor({ timeout: 15000 });
    res.filas = await filas.count();
    paso(`consulta (${res.filas} filas)`);
    await cap('2_tabla');

    res.ordenantes = [];
    for (let i = 0; i < res.filas; i++) {
      await R.verDetalle(scope).nth(i).click();
      const dlg = R.dialogo(scope);
      const ord = R.ordenante(dlg);
      await ord.waitFor({ timeout: 10000 });
      res.ordenantes.push((await ord.innerText()).trim());
      if (i === 0) {
        res.detOrdenanteId = await page.evaluate(`!!document.querySelector('#detOrdenante')`);
        await cap('3_detalle', false);
      }
      await R.cerrar(dlg).click();
      await dlg.waitFor({ state: 'detached', timeout: 5000 });
    }
    paso(`detalle x${res.filas}`);

    const btnDesc = R.descargar(scope);
    await btnDesc.waitFor({ timeout: 10000 });
    const [descarga] = await Promise.all([page.waitForEvent('download'), btnDesc.click()]);
    const destino = path.join(DESCARGAS, `esc${n}_${descarga.suggestedFilename()}`);
    await descarga.saveAs(destino);
    const lineas = fs.readFileSync(destino, 'utf8').trim().split(/\r?\n/);
    res.csv = { archivo: descarga.suggestedFilename(), filas: lineas.length - 1 };
    if (res.csv.filas !== res.filas) throw new Error(`CSV con ${res.csv.filas} filas, tabla con ${res.filas}`);
    const csvOrd = lineas.slice(1).map((l) => l.split(';')[7].replace(/^"|"$/g, ''));
    if (csvOrd.join('|') !== res.ordenantes.join('|')) throw new Error('Ordenantes del CSV no coinciden con el detalle');
    paso('descarga CSV');

    await R.salir(page).click();
    await R.usuario(page).waitFor({ timeout: 10000 });
    await page.getByText('Sesión cerrada correctamente.').waitFor();
    paso('cierre de sesión');
    res.ok = errores.length === 0;
  } catch (e) {
    res.error = e.message.split('\n')[0];
    await cap('ERROR').catch(() => {});
  }
  res.errores = errores;
  res.segundos = ((Date.now() - t0) / 1000).toFixed(1);
  await ctx.close();
  return res;
}

async function verificacionesExtra(browser) {
  const v = [];
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const idUsuario = async (url) => { await page.goto(url); return page.getByLabel(/Usuario/).getAttribute('id'); };

  // Semilla: mismos IDs con la misma semilla, distintos con otra.
  const a = await idUsuario(`${SITIO}?escenario=1&seed=123`);
  const b = await idUsuario(`${SITIO}?escenario=1&seed=123`);
  const c = await idUsuario(`${SITIO}?escenario=1&seed=124`);
  v.push({ prueba: 'Semilla fija repite IDs (esc 1, seed 123)', ok: a === b, detalle: `${a} = ${b}` });
  v.push({ prueba: 'Otra semilla cambia IDs (seed 124)', ok: a !== c, detalle: `${a} ≠ ${c}` });

  // Login con clave incorrecta y fecha inválida (escenario 0, sin latencia).
  await page.goto(`${SITIO}?escenario=0&seed=123&latencia=0`);
  await page.fill('#usuario', 'demo'); await page.fill('#clave', 'mala');
  await page.click('#btnIngresar');
  v.push({ prueba: 'Clave incorrecta muestra error', ok: (await page.locator('#msgLogin').innerText()).includes('incorrectos') });
  await page.fill('#usuario', 'demo'); await page.fill('#clave', 'Demo2026!');
  await page.click('#btnIngresar');
  await page.click('#navMovimientos');
  await page.fill('#fechaDesde', '2026-02-01'); await page.fill('#fechaHasta', '10/02/2026');
  await page.click('#btnConsultar');
  v.push({ prueba: 'Fecha mal formateada muestra error', ok: (await page.locator('#msgFiltros').innerText()).includes('dd/mm/aaaa') });
  await page.fill('#fechaDesde', '01/02/2026'); await page.click('#btnConsultar');
  const ref1 = await page.locator('#tablaMovimientos tbody tr').first().innerText();
  await page.goto(`${SITIO}?escenario=0&seed=123&latencia=0`);
  await page.fill('#usuario', 'demo'); await page.fill('#clave', 'Demo2026!'); await page.click('#btnIngresar');
  await page.click('#navMovimientos');
  await page.fill('#fechaDesde', '01/02/2026'); await page.fill('#fechaHasta', '10/02/2026'); await page.click('#btnConsultar');
  const ref2 = await page.locator('#tablaMovimientos tbody tr').first().innerText();
  v.push({ prueba: 'Semilla fija repite datos', ok: ref1 === ref2, detalle: ref1.split('\t').slice(0, 3).join(' | ') });

  // Panel: aviso visible, exportar bitácora.
  v.push({ prueba: 'Aviso "sitio ficticio" visible', ok: await page.getByText('SITIO FICTICIO').isVisible() });
  await page.click('[data-panel="alternar"]'); // el panel arranca colapsado
  await page.screenshot({ path: path.join(CAPTURAS, 'panel_pruebas.png') });
  const [desc] = await Promise.all([page.waitForEvent('download'), page.click('[data-panel="exportar"]')]);
  const dest = path.join(DESCARGAS, desc.suggestedFilename());
  await desc.saveAs(dest);
  const txt = fs.readFileSync(dest, 'utf8');
  v.push({ prueba: 'Bitácora exportada a CSV', ok: txt.replace(/^﻿/, '').startsWith('fecha;escenario;semilla;evento') && txt.includes('Consulta:'), detalle: `${desc.suggestedFilename()} (${txt.trim().split(/\r?\n/).length - 1} eventos)` });

  // Sin localStorage disponible: el sitio debe seguir funcionando.
  const ctx2 = await browser.newContext();
  await ctx2.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('bloqueado'); } }); });
  const p2 = await ctx2.newPage();
  const errs = []; p2.on('pageerror', (e) => errs.push(e.message));
  await p2.goto(`${SITIO}?escenario=0&latencia=0`);
  await p2.fill('#usuario', 'demo'); await p2.fill('#clave', 'Demo2026!'); await p2.click('#btnIngresar');
  v.push({ prueba: 'Funciona con localStorage bloqueado', ok: errs.length === 0 && await p2.locator('#tablaCuentas').isVisible(), detalle: errs.join('; ') });
  await ctx2.close();

  // Raíz redirige a /site conservando parámetros.
  await page.goto(pathToFileURL(path.resolve(aqui, '../index.html')).href + '?escenario=3&seed=9');
  await page.waitForURL(/site\/index\.html\?escenario=3&seed=9/);
  v.push({ prueba: 'index.html raíz redirige a site/ con parámetros', ok: true });

  // Vista móvil (captura).
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(`${SITIO}?escenario=0&latencia=0&panel=0`);
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
  v.push({ prueba: 'Sin scroll horizontal en móvil (375px)', ok: ancho <= 375, detalle: `scrollWidth=${ancho}` });
  await page.screenshot({ path: path.join(CAPTURAS, 'movil_login.png') });
  await ctx.close();
  return v;
}

const browser = await chromium.launch({ headless: true });
const resultados = [];
for (let n = 0; n <= 6; n++) {
  const r = await probarEscenario(browser, n);
  resultados.push(r);
  console.log(`Escenario ${n} (${r.nombre}): ${r.ok ? 'OK' : 'FALLA'} en ${r.segundos}s ${r.error ? '→ ' + r.error : ''}`);
}
const extra = await verificacionesExtra(browser);
await browser.close();

const si = (b) => (b ? 'coincide' : '**se rompe**');
let md = `# Resultados de la prueba automática (Playwright headless)\n\nFecha: ${new Date().toISOString()}\nSemilla: ${SEMILLA} · Cuenta ${CUENTA} · ${DESDE} a ${HASTA}\n\n`;
md += `## Flujo completo con localizadores resistentes\n\n| Esc. | Nombre | Resultado | Filas | Detalles leídos | CSV | Tiempo (s) | Pasos / error |\n|---|---|---|---|---|---|---|---|\n`;
for (const r of resultados) md += `| ${r.escenario} | ${r.nombre} | ${r.ok ? 'OK' : 'FALLA'} | ${r.filas ?? '-'} | ${r.ordenantes?.length ?? '-'} | ${r.csv ? r.csv.filas + ' filas' : '-'} | ${r.segundos} | ${r.error ?? r.pasos.join(' → ')} |\n`;
md += `\n## Selectores frágiles capturados en el escenario 0 (evaluados en el documento principal)\n\n| Esc. | ${Object.keys(FRAGILES).join(' | ')} | #detOrdenante | #btnConsultar al abrir la vista |\n|---|${Object.keys(FRAGILES).map(() => '---').join('|')}|---|---|\n`;
for (const r of resultados) md += `| ${r.escenario} | ${r.fragiles ? Object.values(r.fragiles).map(si).join(' | ') : '-'} | ${r.detOrdenanteId === undefined ? '-' : si(r.detOrdenanteId)} | ${r.consultarPresenteAlInstante ? 'sí' : 'no'} |\n`;
md += `\n## Verificaciones adicionales\n\n| Prueba | Resultado | Detalle |\n|---|---|---|\n`;
for (const v of extra) md += `| ${v.prueba} | ${v.ok ? 'OK' : 'FALLA'} | ${v.detalle ?? ''} |\n`;
md += `\nOrdenantes leídos en el escenario 0: ${resultados[0].ordenantes?.join('; ')}\n`;
fs.writeFileSync(path.join(aqui, 'resultados.md'), md);
console.log('\n' + md);
process.exit(resultados.every((r) => r.ok) && extra.every((v) => v.ok) ? 0 : 1);
