/*
 * Banco Demo Andino — sitio FICTICIO para pruebas de bots RPA (autocuración de Power Automate Desktop).
 * JavaScript puro, sin dependencias ni build. Funciona con file:// y en GitHub Pages.
 *
 * Parámetros de URL:
 *   ?escenario=0..6   Escenario de cambio del portal (ver ESCENARIOS).
 *   ?seed=123         Semilla fija: mismos datos, mismos IDs, misma latencia y mismos retardos.
 *   ?latencia=0       Desactiva la latencia aleatoria.
 *   ?panel=0          Oculta el panel de pruebas.
 */
(function () {
  'use strict';

  // =====================================================================
  // 1. Almacenamiento seguro (todo acceso a localStorage va en try/catch)
  // =====================================================================
  function lsGet(clave, porDefecto) {
    try {
      var v = window.localStorage.getItem(clave);
      return v === null ? porDefecto : JSON.parse(v);
    } catch (e) { return porDefecto; }
  }
  function lsSet(clave, valor) {
    try { window.localStorage.setItem(clave, JSON.stringify(valor)); return true; } catch (e) { return false; }
  }
  function lsDel(clave) {
    try { window.localStorage.removeItem(clave); } catch (e) { /* sin almacenamiento */ }
  }

  // =====================================================================
  // 2. Escenarios y parámetros
  // =====================================================================
  var ESCENARIOS = [
    { nombre: 'Base', desc: 'Portal estable. Aquí se capturan los elementos del bot.' },
    { nombre: 'Cambio de IDs', desc: 'Todos los id y name cambian por valores generados (tipo framework). Textos, clases y layout iguales.', ids: true },
    { nombre: 'Cambio de clases y textos', desc: 'Clases CSS ofuscadas y textos de botones/etiquetas reescritos. IDs y layout iguales.', clases: true, textos: true },
    { nombre: 'Cambio de layout', desc: 'Menú lateral, contenedores extra, filtros reordenados, columnas movidas y botón de descarga en otro lugar.', layout: true },
    { nombre: 'Cambio combinado', desc: 'IDs + clases + textos + layout a la vez (rediseño completo).', ids: true, clases: true, textos: true, layout: true },
    { nombre: 'Iframe', desc: 'La consulta de movimientos y el detalle se cargan dentro de un iframe.', iframe: true },
    { nombre: 'Carga diferida', desc: 'Formulario, tabla, botón de descarga y detalle aparecen 1–6 s después (no existen en el DOM mientras tanto).', diferido: true }
  ];

  var params;
  try { params = new URLSearchParams(window.location.search); } catch (e) { params = { get: function () { return null; } }; }

  var escenario = parseInt(params.get('escenario'), 10);
  if (isNaN(escenario) || !ESCENARIOS[escenario]) escenario = 0;
  var cfg = ESCENARIOS[escenario];

  var semillaTxt = params.get('seed') || params.get('semilla') || '';
  var semillaFija = /^\d{1,9}$/.test(semillaTxt);
  var semilla = semillaFija ? parseInt(semillaTxt, 10) : 100000 + Math.floor(Math.random() * 900000);
  var latenciaOn = params.get('latencia') !== '0';
  var panelOn = params.get('panel') !== '0';

  // =====================================================================
  // 3. Aleatoriedad reproducible
  // =====================================================================
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(txt) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  // Flujos independientes: así la latencia no altera los datos ni viceversa.
  var rngDatos = mulberry32(semilla);
  var rngLat = mulberry32(semilla ^ 0x2545F491);
  var rngDif = mulberry32(semilla ^ 0x5BD1E995);
  function entre(rng, min, max) { return Math.round(min + rng() * (max - min)); }
  function elegir(rng, lista) { return lista[Math.floor(rng() * lista.length)]; }

  // =====================================================================
  // 4. Transformaciones por escenario: IDs, clases y textos
  // =====================================================================
  function idDe(base) {
    if (!cfg.ids) return base;
    return 'ux-' + hash(base + ':' + semilla).toString(36);
  }

  var MAPA_CLASES = {
    'encabezado': 'Hdr_bar__q81Lm', 'menu': 'Nav_list__z3Pd0', 'contenido': 'Main_wrap__k2Hs9',
    'tarjeta': 'Card_root__p0Wt4', 'campo': 'Fld_group__m4Ty7', 'fila-filtros': 'Flt_row__w9Ae1',
    'fila-acciones': 'Act_row__c5Rb8', 'btn': 'Btn_root__a7Kq2', 'btn-primario': 'Btn_solid__f2Lx8',
    'btn-secundario': 'Btn_ghost__r6Yd1', 'btn-detalle': 'Row_cta__n8Uv3', 'mensaje': 'Msg_box__t1Gv5',
    'mensaje-error': 'Msg_err__h7Qc2', 'mensaje-info': 'Msg_info__b3Zn6', 'tabla': 'Tbl_grid__v2Rk7',
    'modal': 'Dlg_panel__y4Jm8'
  };
  function cl(clases) {
    if (!cfg.clases) return clases;
    return clases.split(/\s+/).map(function (c) { return MAPA_CLASES[c] || c; }).join(' ');
  }

  // [texto base, texto alternativo (escenarios 2 y 4)]
  var TEXTOS = {
    tituloLogin: ['Banca en línea', 'Acceso a su banca'],
    lblUsuario: ['Usuario', 'Código de usuario'],
    lblClave: ['Clave', 'Contraseña'],
    ingresar: ['Ingresar', 'Entrar'],
    menuCuentas: ['Mis cuentas', 'Cuentas'],
    menuMov: ['Movimientos', 'Consultar movimientos'],
    salir: ['Cerrar sesión', 'Salir'],
    tituloCuentas: ['Mis cuentas', 'Resumen de productos'],
    verMov: ['Ver movimientos', 'Ir a movimientos'],
    tituloMov: ['Movimientos', 'Consulta de movimientos'],
    lblCuenta: ['Cuenta', 'Seleccione la cuenta'],
    lblDesde: ['Fecha desde', 'Desde'],
    lblHasta: ['Fecha hasta', 'Hasta'],
    consultar: ['Consultar', 'Buscar movimientos'],
    limpiar: ['Limpiar', 'Borrar filtros'],
    verDetalle: ['Ver detalle', 'Detalle'],
    descargar: ['Descargar CSV', 'Exportar movimientos'],
    tituloDetalle: ['Detalle del movimiento', 'Información de la transacción'],
    cerrar: ['Cerrar', 'Volver'],
    lblOrdenante: ['Ordenante', 'Nombre del ordenante'],
    colFecha: ['Fecha', 'Fecha valor'],
    colDesc: ['Descripción', 'Concepto'],
    colRef: ['Referencia', 'N.º de operación'],
    colMonto: ['Monto', 'Importe'],
    colSaldo: ['Saldo', 'Saldo contable'],
    colAccion: ['Acción', 'Opciones']
  };
  function t(clave) { var v = TEXTOS[clave]; return cfg.textos ? v[1] : v[0]; }

  // =====================================================================
  // 5. Utilidades de DOM
  // =====================================================================
  function h(tag, props, hijos) {
    var el = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'id' || k === 'name') el.setAttribute(k, idDe(v));
        else if (k === 'for') el.setAttribute('for', idDe(v));
        else if (k === 'class') el.className = cl(v);
        else if (k === 'text') el.textContent = v;
        else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    agregar(el, hijos);
    return el;
  }
  function agregar(el, hijos) {
    if (hijos === null || hijos === undefined || hijos === false) return;
    if (!Array.isArray(hijos)) hijos = [hijos];
    hijos.forEach(function (hijo) {
      if (hijo === null || hijo === undefined || hijo === false) return;
      el.appendChild(typeof hijo === 'string' || typeof hijo === 'number' ? document.createTextNode(String(hijo)) : hijo);
    });
  }
  function vaciar(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function latencia(min, max) { return latenciaOn ? esperar(entre(rngLat, min, max)) : Promise.resolve(); }

  var capaCarga = null;
  function mostrarCarga(texto) {
    ocultarCarga();
    capaCarga = h('div', { class: 'cargando-capa', role: 'status', 'aria-live': 'polite' },
      h('div', { class: 'cargando-caja' }, [h('span', { class: 'giro' }), texto || 'Procesando…']));
    document.body.appendChild(capaCarga);
  }
  function ocultarCarga() { if (capaCarga) { capaCarga.remove(); capaCarga = null; } }

  // Carga diferida (escenario 6): el elemento NO existe en el DOM hasta que pasa el retardo.
  function diferir(contenedor, texto, min, max, construir) {
    if (!cfg.diferido) { agregar(contenedor, construir()); return; }
    var ms = entre(rngDif, min, max);
    var marcador = h('div', { class: 'marcador-diferido', role: 'status' }, [h('span', { class: 'giro' }), texto]);
    contenedor.appendChild(marcador);
    setTimeout(function () {
      if (!marcador.isConnected) return;
      var nuevo = construir();
      marcador.replaceWith(nuevo);
      registrar('Carga diferida: "' + texto + '" visible tras ' + ms + ' ms');
    }, ms);
  }

  // =====================================================================
  // 6. Formatos
  // =====================================================================
  function dos(n) { return (n < 10 ? '0' : '') + n; }
  function fmtFecha(f) { return dos(f.d) + '/' + dos(f.m) + '/' + f.y; }
  function claveFecha(f) { return f.y * 10000 + f.m * 100 + f.d; }
  function fmtNum(n) {
    var p = Math.abs(n).toFixed(2).split('.');
    return (n < 0 ? '-' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + p[1];
  }
  function fmtMonto(n) { return (n > 0 ? '+' : '') + fmtNum(n); }
  function numCsv(n) { return n.toFixed(2).replace('.', ','); }
  function ahoraTxt() {
    var d = new Date();
    return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate()) + ' ' +
      dos(d.getHours()) + ':' + dos(d.getMinutes()) + ':' + dos(d.getSeconds()) + '.' + String(d.getMilliseconds()).padStart(3, '0');
  }
  function parsearFecha(txt) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((txt || '').trim());
    if (!m) return null;
    var f = { d: +m[1], m: +m[2], y: +m[3] };
    var prueba = new Date(Date.UTC(f.y, f.m - 1, f.d));
    if (prueba.getUTCFullYear() !== f.y || prueba.getUTCMonth() !== f.m - 1 || prueba.getUTCDate() !== f.d) return null;
    return f;
  }
  function diasEntre(a, b) {
    return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
  }
  function celdaCsv(v) {
    var s = String(v === null || v === undefined ? '' : v);
    return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function aCsv(filas) { return filas.map(function (f) { return f.map(celdaCsv).join(';'); }).join('\r\n') + '\r\n'; }
  function descargarArchivo(nombre, texto) {
    var blob = new Blob(['﻿' + texto], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = nombre; a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }

  // =====================================================================
  // 7. Bitácora (evidencia exportable)
  // =====================================================================
  var CLAVE_BITACORA = 'bancoDemoAndino.bitacora.v1';
  var MAX_BITACORA = 3000;
  var bitacora = lsGet(CLAVE_BITACORA, []);
  if (!Array.isArray(bitacora)) bitacora = [];

  function registrar(evento) {
    bitacora.push({ fecha: ahoraTxt(), escenario: escenario, semilla: semilla, evento: evento });
    if (bitacora.length > MAX_BITACORA) bitacora.splice(0, bitacora.length - MAX_BITACORA);
    lsSet(CLAVE_BITACORA, bitacora);
    pintarBitacora();
  }
  function exportarBitacora() {
    var filas = [['fecha', 'escenario', 'semilla', 'evento']];
    bitacora.forEach(function (e) {
      filas.push([e.fecha, e.escenario + ' - ' + (ESCENARIOS[e.escenario] ? ESCENARIOS[e.escenario].nombre : '?'), e.semilla, e.evento]);
    });
    var d = new Date();
    var nombre = 'bitacora_' + d.getFullYear() + dos(d.getMonth() + 1) + dos(d.getDate()) + '_' + dos(d.getHours()) + dos(d.getMinutes()) + dos(d.getSeconds()) + '.csv';
    descargarArchivo(nombre, aCsv(filas));
  }

  // =====================================================================
  // 8. Datos ficticios (dependen solo de la semilla)
  // =====================================================================
  var TITULAR = 'Comercializadora Demo Andina S.A.';
  var CUENTAS = [
    { num: '2200-4815-01', tipo: 'Cuenta corriente', alias: 'Operativa', moneda: 'USD' },
    { num: '2200-4815-02', tipo: 'Cuenta de ahorros', alias: 'Recaudación', moneda: 'USD' },
    { num: '2200-7731-09', tipo: 'Cuenta corriente', alias: 'Pagos a proveedores', moneda: 'USD' }
  ];
  var NOMBRES = ['María', 'José', 'Lucía', 'Andrés', 'Carmen', 'Diego', 'Valeria', 'Jorge', 'Paola', 'Héctor', 'Daniela', 'Raúl'];
  var APELLIDOS = ['Andrade', 'Benítez', 'Cevallos', 'Duarte', 'Espinoza', 'Fajardo', 'Guzmán', 'Herrera', 'Iturralde', 'Jaramillo', 'Loor', 'Mendieta'];
  var EMPRESAS = ['Distribuidora El Ceibo S.A.', 'Ferretería Los Pinos Cía. Ltda.', 'Agroindustrias Valle Verde S.A.', 'Comercial Punta Alta', 'Servicios Técnicos Cóndor', 'Importadora Mirador S.A.', 'Panificadora La Espiga', 'Transportes Sierra Norte'];
  var ENTIDADES = ['Banco Demo Andino', 'Entidad Demo Austral', 'Cooperativa Ficticia del Valle', 'Banco Ejemplo Sur', 'Mutualista Demo Central'];
  var DESC_CRED = ['Transferencia recibida', 'Depósito en efectivo', 'Cobro de cliente', 'Transferencia interbancaria recibida'];
  var DESC_DEB = ['Pago a proveedor', 'Transferencia enviada', 'Débito automático servicios', 'Comisión por mantenimiento', 'Pago de nómina'];
  var PERIODO = { desde: { y: 2026, m: 1, d: 1 }, hasta: { y: 2026, m: 3, d: 31 } };

  function generarDatos() {
    var datos = {};
    var contador = 0;
    CUENTAS.forEach(function (c) {
      var saldo = entre(rngDatos, 15000, 60000) + entre(rngDatos, 0, 99) / 100;
      c.saldoInicial = saldo;
      var lista = [];
      var dia = new Date(Date.UTC(PERIODO.desde.y, PERIODO.desde.m - 1, PERIODO.desde.d));
      var fin = Date.UTC(PERIODO.hasta.y, PERIODO.hasta.m - 1, PERIODO.hasta.d);
      while (dia.getTime() <= fin) {
        var r = rngDatos();
        var n = r < 0.5 ? 0 : r < 0.82 ? 1 : r < 0.96 ? 2 : 3;
        var horas = [];
        for (var i = 0; i < n; i++) horas.push(entre(rngDatos, 8 * 60, 18 * 60 + 59));
        horas.sort(function (a, b) { return a - b; });
        for (var j = 0; j < n; j++) {
          contador++;
          var credito = rngDatos() < 0.58;
          var monto = credito ? entre(rngDatos, 5000, 800000) / 100 : -entre(rngDatos, 1000, 400000) / 100;
          saldo = Math.round((saldo + monto) * 100) / 100;
          var esPersona = rngDatos() < 0.45;
          var contraparte = esPersona ? elegir(rngDatos, NOMBRES) + ' ' + elegir(rngDatos, APELLIDOS) + ' ' + elegir(rngDatos, APELLIDOS) : elegir(rngDatos, EMPRESAS);
          var desc = credito ? elegir(rngDatos, DESC_CRED) : elegir(rngDatos, DESC_DEB);
          var factura = '001-002-' + String(entre(rngDatos, 1, 99999)).padStart(9, '0');
          lista.push({
            fecha: { y: dia.getUTCFullYear(), m: dia.getUTCMonth() + 1, d: dia.getUTCDate() },
            hora: dos(Math.floor(horas[j] / 60)) + ':' + dos(horas[j] % 60),
            referencia: 'TRX' + String(26000000 + contador * 7 + entre(rngDatos, 0, 6)),
            descripcion: desc,
            tipo: credito ? 'Crédito' : 'Débito',
            monto: monto,
            saldo: saldo,
            ordenante: credito ? contraparte : TITULAR,
            identificacion: credito ? 'FIC-' + String(entre(rngDatos, 1000000, 9999999)) : 'FIC-0000001',
            entidad: credito ? elegir(rngDatos, ENTIDADES) : 'Banco Demo Andino',
            cuentaOrigen: credito ? '****' + String(entre(rngDatos, 1000, 9999)) : '****' + c.num.slice(-4),
            beneficiario: credito ? TITULAR : contraparte,
            concepto: credito ? 'Pago factura ' + factura : (desc === 'Comisión por mantenimiento' ? 'Cargo mensual' : 'Liquidación ' + factura)
          });
        }
        dia.setUTCDate(dia.getUTCDate() + 1);
      }
      c.saldo = saldo;
      datos[c.num] = lista;
    });
    return datos;
  }
  var DATOS = generarDatos();

  // =====================================================================
  // 9. Estado de la aplicación
  // =====================================================================
  var USUARIO_DEMO = 'demo';
  var CLAVE_DEMO = 'Demo2026!';
  var estado = {
    usuario: null,
    vista: 'login',
    cuenta: CUENTAS[0].num,
    desde: '',
    hasta: '',
    resultados: null,
    mensajeLogin: null
  };
  var raiz = document.getElementById('raiz');

  function ir(vista) {
    estado.vista = vista;
    registrar('Navegación: ' + vista);
    render();
  }

  // =====================================================================
  // 10. Vistas
  // =====================================================================
  function logo(conTexto) {
    var svg = '<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#a47a3b"/><path d="M4 25 L12 12 L17 19 L21 14 L28 25 Z" fill="#fff" opacity=".92"/></svg>';
    var el = h('div', { class: 'logo' });
    el.innerHTML = svg;
    if (conTexto !== false) agregar(el, h('div', null, ['Banco Demo Andino', h('small', { text: 'ENTORNO FICTICIO DE PRUEBAS' })]));
    return el;
  }

  function render() {
    vaciar(raiz);
    document.title = 'Banco Demo Andino · ' + (estado.vista === 'login' ? 'Ingreso' : estado.vista === 'cuentas' ? 'Mis cuentas' : 'Movimientos') + ' (ficticio)';
    if (!estado.usuario || estado.vista === 'login') { raiz.appendChild(vistaLogin()); return; }
    var principal = h('main', { class: 'contenido', id: 'contenidoPrincipal' });
    if (estado.vista === 'cuentas') agregar(principal, vistaCuentas());
    else agregar(principal, vistaMovimientos());
    raiz.appendChild(envoltura(principal));
  }

  function enlaceMenu(idBase, texto, vista) {
    return h('a', {
      id: idBase, href: '#', 'aria-current': estado.vista === vista ? 'page' : null,
      onclick: function (e) { e.preventDefault(); ir(vista); }
    }, texto);
  }
  function botonSalir() {
    return h('button', { id: 'btnSalir', type: 'button', onclick: cerrarSesion }, t('salir'));
  }

  function envoltura(principal) {
    if (cfg.layout) {
      return h('div', { class: 'con-lateral' }, [
        h('nav', { class: 'lateral', 'aria-label': 'Menú principal' }, [
          logo(),
          enlaceMenu('navMovimientos', t('menuMov'), 'movimientos'),
          enlaceMenu('navCuentas', t('menuCuentas'), 'cuentas'),
          h('div', { class: 'empuje' }),
          h('div', { style: 'font-size:12px;opacity:.7;padding:4px 10px' }, 'Usuario: ' + estado.usuario),
          botonSalir()
        ]),
        principal
      ]);
    }
    return h('div', null, [
      h('header', { class: 'encabezado' }, [
        logo(),
        h('nav', { class: 'menu', 'aria-label': 'Menú principal' }, [
          enlaceMenu('navCuentas', t('menuCuentas'), 'cuentas'),
          enlaceMenu('navMovimientos', t('menuMov'), 'movimientos'),
          botonSalir()
        ])
      ]),
      principal
    ]);
  }

  // ----- Login -----
  function vistaLogin() {
    var msg = estado.mensajeLogin
      ? h('div', { class: 'mensaje ' + (estado.mensajeLogin.tipo === 'error' ? 'mensaje-error' : 'mensaje-info'), id: 'msgLogin', role: 'alert' }, estado.mensajeLogin.texto)
      : null;
    var inpUsuario = h('input', { id: 'usuario', name: 'usuario', type: 'text', autocomplete: 'off', spellcheck: 'false' });
    var inpClave = h('input', { id: 'clave', name: 'clave', type: 'password', autocomplete: 'off' });
    var btn = h('button', { id: 'btnIngresar', type: 'submit', class: 'btn btn-primario btn-ancho' }, t('ingresar'));
    var campos = [
      h('div', { class: 'campo' }, [h('label', { for: 'usuario' }, t('lblUsuario')), inpUsuario]),
      h('div', { class: 'campo' }, [h('label', { for: 'clave' }, t('lblClave')), inpClave])
    ];
    var ayuda = h('p', { class: 'ayuda' }, ['Credenciales de demostración: usuario ', h('code', { text: USUARIO_DEMO }), ' · clave ', h('code', { text: CLAVE_DEMO })]);

    var form;
    if (cfg.layout) {
      form = h('form', { id: 'formLogin', novalidate: true }, [
        h('fieldset', { style: 'border:0;padding:0;margin:0' }, [
          h('legend', { class: 'sub', style: 'padding:0' }, 'Ingrese sus datos de acceso'),
          h('div', null, campos)
        ]),
        h('p', { style: 'margin:0 0 12px;font-size:13px' }, h('a', { href: '#', onclick: function (e) { e.preventDefault(); registrar('Clic en "¿Olvidó su clave?" (sin acción)'); } }, '¿Olvidó su clave?')),
        h('div', null, btn)
      ]);
    } else {
      form = h('form', { id: 'formLogin', novalidate: true }, campos.concat([btn]));
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      intentarLogin(inpUsuario.value, inpClave.value, btn);
    });

    if (cfg.layout) {
      return h('div', { class: 'login-envoltura' },
        h('div', { class: 'tarjeta login-dos' }, [
          h('div', { class: 'login-info' }, [
            logo(),
            h('p', null, 'Portal de pruebas para automatización. Todos los datos son ficticios.'),
            h('ul', null, [h('li', null, 'Consulta de movimientos'), h('li', null, 'Detalle de ordenante'), h('li', null, 'Descarga en CSV')])
          ]),
          h('div', { class: 'login-form-lado' }, [h('h1', null, t('tituloLogin')), msg, form, ayuda])
        ]));
    }
    return h('div', { class: 'login-envoltura' },
      h('div', { class: 'tarjeta login-caja' }, [logo(), h('h1', { style: 'text-align:center' }, t('tituloLogin')), msg, form, ayuda]));
  }

  function intentarLogin(usuario, clave, btn) {
    btn.disabled = true;
    mostrarCarga('Validando credenciales…');
    latencia(400, 1600).then(function () {
      ocultarCarga();
      btn.disabled = false;
      usuario = (usuario || '').trim();
      if (!usuario || !clave) {
        estado.mensajeLogin = { tipo: 'error', texto: 'Ingrese usuario y clave.' };
        registrar('Login fallido: campos vacíos');
        render();
        return;
      }
      if (usuario !== USUARIO_DEMO || clave !== CLAVE_DEMO) {
        estado.mensajeLogin = { tipo: 'error', texto: 'Usuario o clave incorrectos.' };
        registrar('Login fallido: credenciales incorrectas (usuario "' + usuario + '")');
        render();
        return;
      }
      estado.usuario = usuario;
      estado.mensajeLogin = null;
      registrar('Login correcto: ' + usuario);
      ir('cuentas');
    });
  }

  function cerrarSesion() {
    registrar('Cierre de sesión: ' + estado.usuario);
    estado.usuario = null;
    estado.resultados = null;
    estado.desde = ''; estado.hasta = '';
    estado.mensajeLogin = { tipo: 'info', texto: 'Sesión cerrada correctamente.' };
    estado.vista = 'login';
    render();
  }

  // ----- Mis cuentas -----
  function vistaCuentas() {
    var tarjeta = h('section', { class: 'tarjeta' });
    diferir(tarjeta, 'Cargando cuentas…', 1200, 3000, function () {
      var filas = CUENTAS.map(function (c, i) {
        return h('tr', null, [
          h('td', { class: 'ref' }, c.num),
          h('td', null, c.tipo),
          h('td', null, c.alias),
          h('td', null, c.moneda),
          h('td', { class: 'num' }, fmtNum(c.saldo)),
          h('td', null, h('a', {
            id: 'lnkMov-' + (i + 1), href: '#',
            onclick: function (e) { e.preventDefault(); estado.cuenta = c.num; estado.resultados = null; registrar('Cuenta elegida desde Mis cuentas: ' + c.num); ir('movimientos'); }
          }, t('verMov')))
        ]);
      });
      return h('div', { class: 'tabla-envoltura' }, h('table', { id: 'tablaCuentas', class: 'tabla' }, [
        h('thead', null, h('tr', null, ['Número', 'Tipo', 'Alias', 'Moneda', 'Saldo disponible', ''].map(function (x, i) { return h('th', { class: i === 4 ? 'num' : null }, x); }))),
        h('tbody', null, filas)
      ]));
    });
    return [h('h1', null, t('tituloCuentas')), h('p', { class: 'sub' }, 'Titular: ' + TITULAR), tarjeta];
  }

  // ----- Movimientos -----
  function vistaMovimientos() {
    var contenido = construirMovimientos();
    if (!cfg.iframe) return contenido;

    // Escenario 5: la misma vista, pero dentro de un iframe (about:blank, mismo origen; funciona con file://).
    var marco = h('iframe', { id: 'marcoMovimientos', name: 'marcoMovimientos', class: 'marco-mov', title: 'Consulta de movimientos', style: 'height:700px' });
    var cont = h('div', null, [
      h('p', { class: 'sub', style: 'margin:0 0 10px' }, 'Módulo de consultas (contenido incrustado).'),
      marco
    ]);
    setTimeout(function () {
      var d = marco.contentDocument;
      if (!d) { registrar('ERROR: no se pudo acceder al iframe'); return; }
      var css = new URL('estilos.css', window.location.href).href;
      d.open();
      d.write('<!doctype html><html lang="es"><head><meta charset="utf-8"><link rel="stylesheet" href="' + css + '"></head><body class="dentro-iframe"><main class="contenido"></main></body></html>');
      d.close();
      var main = d.querySelector('main');
      agregar(main, contenido);
      registrar('Iframe de movimientos cargado');
    }, 0);
    return cont;
  }

  function construirMovimientos() {
    var zonaMsg = h('div', { id: 'msgFiltros', 'aria-live': 'polite' });
    var zonaRes = h('section', { id: 'zonaResultados', class: 'tarjeta', 'aria-live': 'polite' });
    var refs = {}; // referencias a controles (sin depender del DOM)

    function construirFormulario() {
      var sel = h('select', { id: 'selCuenta', name: 'cuenta' }, CUENTAS.map(function (c) {
        var o = h('option', { value: c.num }, c.num + ' · ' + c.tipo + ' · ' + c.alias);
        if (c.num === estado.cuenta) o.selected = true;
        return o;
      }));
      var desde = h('input', { id: 'fechaDesde', name: 'fechaDesde', type: 'text', placeholder: 'dd/mm/aaaa', maxlength: '10', autocomplete: 'off', inputmode: 'numeric' });
      var hasta = h('input', { id: 'fechaHasta', name: 'fechaHasta', type: 'text', placeholder: 'dd/mm/aaaa', maxlength: '10', autocomplete: 'off', inputmode: 'numeric' });
      desde.value = estado.desde; hasta.value = estado.hasta;
      var btnConsultar = h('button', { id: 'btnConsultar', type: 'submit', class: 'btn btn-primario' }, t('consultar'));
      var btnLimpiar = h('button', {
        id: 'btnLimpiar', type: 'button', class: 'btn btn-secundario',
        onclick: function () { desde.value = ''; hasta.value = ''; estado.desde = ''; estado.hasta = ''; estado.resultados = null; vaciar(zonaMsg); pintarResultados(); registrar('Filtros limpiados'); }
      }, t('limpiar'));
      refs.sel = sel; refs.desde = desde; refs.hasta = hasta;

      var cCuenta = h('div', { class: 'campo' }, [h('label', { for: 'selCuenta' }, t('lblCuenta')), sel]);
      var cDesde = h('div', { class: 'campo' }, [h('label', { for: 'fechaDesde' }, t('lblDesde')), desde]);
      var cHasta = h('div', { class: 'campo' }, [h('label', { for: 'fechaHasta' }, t('lblHasta')), hasta]);

      var form;
      if (cfg.layout) {
        // Layout alternativo: contenedor extra, fechas antes que la cuenta y descarga junto a Consultar.
        refs.btnDescargarForm = h('button', { id: 'btnDescargarCsv', type: 'button', class: 'btn btn-secundario', disabled: true, onclick: descargarCsv }, t('descargar'));
        form = h('form', { id: 'formFiltros', novalidate: true },
          h('div', { class: 'bloque-filtros' }, [
            h('div', { class: 'fila-filtros', style: 'grid-template-columns:1fr 1fr 2fr' }, [cDesde, cHasta, cCuenta]),
            h('div', { class: 'fila-acciones' }, [h('span', null, btnConsultar), refs.btnDescargarForm, btnLimpiar])
          ]));
      } else {
        form = h('form', { id: 'formFiltros', novalidate: true }, [
          h('div', { class: 'fila-filtros' }, [cCuenta, cDesde, cHasta]),
          h('div', { class: 'fila-acciones' }, [btnConsultar, btnLimpiar])
        ]);
      }
      form.addEventListener('submit', function (e) { e.preventDefault(); consultar(btnConsultar); });
      return form;
    }

    function consultar(btn) {
      vaciar(zonaMsg);
      estado.cuenta = refs.sel.value;
      estado.desde = refs.desde.value.trim();
      estado.hasta = refs.hasta.value.trim();
      var fd = parsearFecha(estado.desde), fh = parsearFecha(estado.hasta);
      var error = null;
      if (!estado.desde || !estado.hasta) error = 'Ingrese la fecha desde y la fecha hasta.';
      else if (!fd || !fh) error = 'Formato de fecha inválido. Use dd/mm/aaaa.';
      else if (claveFecha(fd) > claveFecha(fh)) error = 'La fecha desde no puede ser mayor que la fecha hasta.';
      else if (diasEntre(fd, fh) > 366) error = 'El rango máximo de consulta es de 366 días.';
      if (error) {
        agregar(zonaMsg, h('div', { class: 'mensaje mensaje-error', role: 'alert' }, error));
        registrar('Consulta rechazada: ' + error + ' (desde "' + estado.desde + '", hasta "' + estado.hasta + '")');
        return;
      }
      btn.disabled = true;
      var fin = function () {
        btn.disabled = false;
        var filas = DATOS[estado.cuenta].filter(function (m) { var k = claveFecha(m.fecha); return k >= claveFecha(fd) && k <= claveFecha(fh); });
        estado.resultados = { cuenta: estado.cuenta, desde: fmtFecha(fd), hasta: fmtFecha(fh), filas: filas };
        registrar('Consulta: cuenta ' + estado.cuenta + ', ' + fmtFecha(fd) + ' a ' + fmtFecha(fh) + ' → ' + filas.length + ' movimientos');
        pintarResultados();
      };
      if (cfg.diferido) {
        // En carga diferida no hay capa de "procesando": la tabla simplemente aparece después.
        vaciar(zonaRes);
        var ms = entre(rngDif, 2000, 5000);
        agregar(zonaRes, h('div', { class: 'marcador-diferido', role: 'status' }, [h('span', { class: 'giro' }), 'Consultando movimientos…']));
        setTimeout(function () { registrar('Carga diferida: resultados tras ' + ms + ' ms'); fin(); }, ms);
      } else {
        mostrarCarga('Consultando movimientos…');
        latencia(300, 1500).then(function () { ocultarCarga(); fin(); });
      }
    }

    function pintarResultados() {
      vaciar(zonaRes);
      var r = estado.resultados;
      if (refs.btnDescargarForm) refs.btnDescargarForm.disabled = !(r && r.filas.length);
      if (!r) {
        agregar(zonaRes, h('p', { class: 'sub', style: 'margin:0' }, 'Seleccione una cuenta y un rango de fechas (los datos de prueba van del 01/01/2026 al 31/03/2026).'));
        return;
      }
      var resumen = h('span', null, r.filas.length + ' movimiento(s) · cuenta ' + r.cuenta + ' · del ' + r.desde + ' al ' + r.hasta);
      if (!r.filas.length) {
        agregar(zonaRes, h('div', { class: 'mensaje mensaje-info', id: 'msgSinResultados' }, 'No hay movimientos para el período seleccionado.'));
        return;
      }
      var cabecera = h('div', { class: 'resumen-tabla' }, resumen);
      if (!cfg.layout) {
        diferir(cabecera, 'Preparando descarga…', 1000, 2500, function () {
          return h('button', { id: 'btnDescargarCsv', type: 'button', class: 'btn btn-secundario', onclick: descargarCsv }, t('descargar'));
        });
      }

      var cols = cfg.layout
        ? ['accion', 'ref', 'fecha', 'desc', 'monto', 'saldo']
        : ['fecha', 'desc', 'ref', 'monto', 'saldo', 'accion'];
      var titulos = { fecha: t('colFecha'), desc: t('colDesc'), ref: t('colRef'), monto: t('colMonto'), saldo: t('colSaldo'), accion: t('colAccion') };
      var thead = h('thead', null, h('tr', null, cols.map(function (c) { return h('th', { class: c === 'monto' || c === 'saldo' ? 'num' : null, scope: 'col' }, titulos[c]); })));
      var tbody = h('tbody', null, r.filas.map(function (m, i) {
        var celdas = {
          fecha: h('td', null, fmtFecha(m.fecha)),
          desc: h('td', null, m.descripcion),
          ref: h('td', { class: 'ref' }, m.referencia),
          monto: h('td', { class: 'num ' + (m.monto > 0 ? 'credito' : 'debito') }, fmtMonto(m.monto)),
          saldo: h('td', { class: 'num' }, fmtNum(m.saldo)),
          accion: h('td', null, h('button', { id: 'btnDetalle-' + (i + 1), type: 'button', class: 'btn-detalle', onclick: function () { abrirDetalle(m, i + 1); } }, t('verDetalle')))
        };
        return h('tr', null, cols.map(function (c) { return celdas[c]; }));
      }));
      var tabla = h('div', { class: 'tabla-envoltura' }, h('table', { id: 'tablaMovimientos', class: 'tabla' }, [thead, tbody]));
      if (cfg.layout) agregar(zonaRes, [tabla, h('div', { class: 'resumen-tabla', style: 'margin-top:12px' }, resumen)]);
      else agregar(zonaRes, [cabecera, tabla]);
    }

    function descargarCsv() {
      var r = estado.resultados;
      if (!r || !r.filas.length) return;
      var filas = [['fecha', 'hora', 'referencia', 'descripcion', 'tipo', 'monto', 'saldo', 'ordenante', 'identificacion_ordenante', 'entidad_origen', 'cuenta_origen', 'beneficiario', 'concepto']];
      r.filas.forEach(function (m) {
        filas.push([fmtFecha(m.fecha), m.hora, m.referencia, m.descripcion, m.tipo, numCsv(m.monto), numCsv(m.saldo), m.ordenante, m.identificacion, m.entidad, m.cuentaOrigen, m.beneficiario, m.concepto]);
      });
      var nombre = 'movimientos_' + r.cuenta + '_' + r.desde.replace(/\//g, '') + '_' + r.hasta.replace(/\//g, '') + '.csv';
      descargarArchivo(nombre, aCsv(filas));
      registrar('Descarga CSV: ' + nombre + ' (' + r.filas.length + ' filas)');
    }

    // ----- Pop-up de detalle -----
    var modalAbierto = null;
    function abrirDetalle(m, n) {
      cerrarDetalle(true);
      var docDestino = zonaRes.ownerDocument; // el documento del iframe en el escenario 5
      var abrir = function () {
        var cuerpo = h('div', { class: 'modal-cuerpo', id: 'cuerpoDetalle' });
        var pie = h('div', { class: 'modal-pie' });
        var dialogo = h('div', { class: 'modal' }, [
          h('div', { class: 'modal-cabecera' }, [
            h('h2', { id: 'tituloDetalle' }, t('tituloDetalle')),
            h('button', { type: 'button', class: 'modal-x', 'aria-label': 'Cerrar', onclick: function () { cerrarDetalle(); } }, '×')
          ]),
          cuerpo, pie
        ]);
        var fondo = h('div', { id: 'modalDetalle', class: 'modal-fondo', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': idDe('tituloDetalle') }, dialogo);
        fondo.addEventListener('click', function (e) { if (e.target === fondo) cerrarDetalle(); });
        docDestino.body.appendChild(fondo);
        modalAbierto = { fondo: fondo, ref: m.referencia, doc: docDestino };
        docDestino.addEventListener('keydown', teclaEsc);

        diferir(cuerpo, 'Cargando detalle…', 800, 2500, function () {
          var campos = [
            ['Fecha', 'detFecha', fmtFecha(m.fecha) + ' ' + m.hora],
            ['Referencia', 'detReferencia', m.referencia],
            ['Descripción', 'detDescripcion', m.descripcion],
            ['Tipo', 'detTipo', m.tipo],
            ['Monto', 'detMonto', fmtMonto(m.monto)],
            [t('lblOrdenante'), 'detOrdenante', m.ordenante],
            ['Identificación', 'detIdentificacion', m.identificacion],
            ['Entidad de origen', 'detEntidad', m.entidad],
            ['Cuenta de origen', 'detCuentaOrigen', m.cuentaOrigen],
            ['Beneficiario', 'detBeneficiario', m.beneficiario],
            ['Concepto', 'detConcepto', m.concepto]
          ];
          var btnCerrar = h('button', { id: 'btnCerrarDetalle', type: 'button', class: 'btn ' + (cfg.layout ? 'btn-secundario' : 'btn-primario'), onclick: function () { cerrarDetalle(); } }, t('cerrar'));
          if (cfg.layout) {
            agregar(pie, [btnCerrar, h('button', { type: 'button', class: 'btn btn-primario', onclick: function () { registrar('Clic en "Imprimir comprobante" (sin acción)'); } }, 'Imprimir comprobante')]);
            return h('dl', { class: 'lista-detalle' }, campos.map(function (c) {
              return h('div', null, [h('dt', null, c[0]), h('dd', null, h('span', { id: c[1] }, c[2]))]);
            }));
          }
          agregar(pie, btnCerrar);
          return h('table', { class: 'tabla-detalle' }, h('tbody', null, campos.map(function (c) {
            return h('tr', null, [h('th', { scope: 'row' }, c[0]), h('td', null, h('span', { id: c[1] }, c[2]))]);
          })));
        });
        registrar('Detalle abierto: fila ' + n + ', ' + m.referencia + ' (ordenante: ' + m.ordenante + ')');
      };
      if (cfg.diferido) { abrir(); return; }
      mostrarCarga('Cargando detalle…');
      latencia(150, 700).then(function () { ocultarCarga(); abrir(); });
    }
    function teclaEsc(e) { if (e.key === 'Escape') cerrarDetalle(); }
    function cerrarDetalle(silencioso) {
      if (!modalAbierto) return;
      modalAbierto.fondo.remove();
      modalAbierto.doc.removeEventListener('keydown', teclaEsc);
      if (!silencioso) registrar('Detalle cerrado: ' + modalAbierto.ref);
      modalAbierto = null;
    }

    // Armar la vista
    var tarjetaFiltros = h('section', { class: 'tarjeta' });
    diferir(tarjetaFiltros, 'Cargando formulario de consulta…', 1500, 3500, construirFormulario);
    agregar(tarjetaFiltros, zonaMsg);
    pintarResultados();
    return [h('h1', null, t('tituloMov')), h('p', { class: 'sub' }, 'Consulte los movimientos por cuenta y rango de fechas.'), tarjetaFiltros, zonaRes];
  }

  // =====================================================================
  // 11. Panel de pruebas (atributos data-panel estables en todos los escenarios)
  // =====================================================================
  function p(nombre) { return document.querySelector('[data-panel="' + nombre + '"]'); }
  var listaBitacora = p('bitacora');

  function pintarBitacora() {
    if (!listaBitacora) return;
    vaciar(listaBitacora);
    bitacora.slice(-60).reverse().forEach(function (e) {
      agregar(listaBitacora, h('li', null, [h('time', null, e.fecha.slice(11, 19)), '[E' + e.escenario + '] ' + e.evento]));
    });
    var c = p('contador');
    if (c) c.textContent = bitacora.length + ' eventos';
  }

  function urlCon(esc, sem, lat) {
    var u = new URL(window.location.href);
    u.search = '';
    u.searchParams.set('escenario', esc);
    if (sem) u.searchParams.set('seed', sem);
    if (!lat) u.searchParams.set('latencia', '0');
    if (!panelOn) u.searchParams.set('panel', '0');
    return u.toString();
  }

  function iniciarPanel() {
    var contenedor = p('contenedor');
    if (!contenedor) return;
    if (!panelOn) { contenedor.style.display = 'none'; return; }

    var sel = p('escenario'), inpSem = p('semilla'), chkLat = p('latencia'), desc = p('descripcion');
    ESCENARIOS.forEach(function (e, i) {
      var o = document.createElement('option');
      o.value = String(i); o.textContent = i + ' · ' + e.nombre;
      if (i === escenario) o.selected = true;
      sel.appendChild(o);
    });
    var mostrarDesc = function () { desc.textContent = ESCENARIOS[+sel.value].desc; };
    sel.addEventListener('change', mostrarDesc); mostrarDesc();
    inpSem.value = semillaFija ? String(semilla) : '';
    chkLat.checked = latenciaOn;
    p('estado').textContent = 'Escenario ' + escenario + ' · semilla ' + semilla + (semillaFija ? ' (fija)' : ' (aleatoria)') + ' · latencia ' + (latenciaOn ? 'sí' : 'no');

    p('aplicar').addEventListener('click', function () {
      var s = inpSem.value.trim();
      if (s && !/^\d{1,9}$/.test(s)) { window.alert('La semilla debe ser un número entero (hasta 9 dígitos).'); return; }
      registrar('Panel: aplicar escenario ' + sel.value + (s ? ', semilla ' + s : ', semilla aleatoria') + ', latencia ' + (chkLat.checked ? 'sí' : 'no'));
      window.location.href = urlCon(sel.value, s, chkLat.checked);
    });
    p('copiar').addEventListener('click', function () {
      var url = urlCon(escenario, String(semilla), latenciaOn);
      var ok = function () { registrar('Panel: URL reproducible copiada'); };
      try {
        if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(url).then(ok, function () { window.prompt('Copie la URL:', url); }); return; }
      } catch (e) { /* sin portapapeles */ }
      window.prompt('Copie la URL:', url);
    });
    p('exportar').addEventListener('click', function () { registrar('Panel: bitácora exportada'); exportarBitacora(); });
    p('limpiar').addEventListener('click', function () {
      if (!window.confirm('¿Borrar toda la bitácora guardada en este navegador?')) return;
      bitacora = []; lsDel(CLAVE_BITACORA); registrar('Bitácora limpiada');
    });

    var CLAVE_PANEL = 'bancoDemoAndino.panelColapsado';
    var alternar = p('alternar');
    var aplicarColapso = function (col) { contenedor.classList.toggle('colapsado', col); alternar.setAttribute('aria-expanded', String(!col)); };
    aplicarColapso(!!lsGet(CLAVE_PANEL, true)); // colapsado por defecto para no tapar la tabla
    alternar.addEventListener('click', function () {
      var col = !contenedor.classList.contains('colapsado');
      aplicarColapso(col); lsSet(CLAVE_PANEL, col);
    });
  }

  // Acceso de solo lectura para pruebas automáticas y depuración.
  window.bancoDemo = {
    escenario: escenario,
    semilla: semilla,
    semillaFija: semillaFija,
    latencia: latenciaOn,
    bitacora: function () { return bitacora.slice(); },
    exportarBitacora: exportarBitacora
  };

  // =====================================================================
  // 12. Arranque
  // =====================================================================
  iniciarPanel();
  registrar('Página cargada: escenario ' + escenario + ' (' + cfg.nombre + '), semilla ' + semilla + (semillaFija ? ' fija' : ' aleatoria') + ', latencia ' + (latenciaOn ? 'sí' : 'no'));
  render();
})();
