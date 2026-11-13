# Borrador del flujo de PAD — ⚠️ POR VALIDAR EN PAD

> **POR VALIDAR EN PAD.** Este es un borrador en texto, **no** es código exportado de Power Automate Desktop.
> Los nombres de las acciones están en español según la interfaz de PAD, pero pueden variar según la versión. Los selectores y parámetros hay que revisarlos en el diseñador. **No pegar tal cual.**

Nombre sugerido del flujo: `PoC_BotResiliente_BancoDemo`

## Variables de entrada
| Variable | Tipo | Valor por defecto |
|---|---|---|
| `NumEscenario` | Número | `0` |
| `UrlBase` | Texto | `https://maria-gaia.github.io/pagina-bot-resiliente/site/index.html` |
| `Cuenta` | Texto | `2200-4815-02` |
| `FechaDesde` | Texto | `01/02/2026` |
| `FechaHasta` | Texto | `10/02/2026` |
| `CarpetaDescarga` | Texto | `C:\PoC\descargas` |

Las credenciales demo (`demo` / `Demo2026!`) son ficticias. En el bot real de Promesa irían en variables **sensibles** o en un almacén de credenciales, nunca en texto plano.

## Acciones

```
# --- POR VALIDAR EN PAD ---
1.  Iniciar nuevo Microsoft Edge
      Modo de inicio: Iniciar nueva instancia
      URL inicial: %UrlBase%?escenario=%NumEscenario%&seed=123&panel=0
      Estado de la ventana: Maximizada
      → %Navegador%

# Login
2.  Rellenar campo de texto en la página web      Elemento: Usuario       Texto: demo          [Autocuración: ON en corrida B]
3.  Rellenar campo de texto en la página web      Elemento: Clave         Texto: Demo2026!     [Autocuración: ON]
4.  Presionar botón en la página web              Elemento: Ingresar                            [Autocuración: ON]

# Navegar a Movimientos
5.  Esperar a que la página web contenga el elemento   Elemento: Menú Movimientos   Tiempo de espera: 20 s
6.  Hacer clic en el vínculo de la página web     Elemento: Menú Movimientos                    [Autocuración: ON]

# Filtros (en el escenario 6 el formulario aparece tarde; en el 5, dentro de un iframe)
7.  Esperar a que la página web contenga el elemento   Elemento: Lista Cuenta   Tiempo de espera: 20 s
8.  Establecer valor de la lista desplegable en la página web
      Elemento: Lista Cuenta   Operación: Seleccionar opciones por nombre   Opción: %Cuenta% (o texto que la contenga)   [Autocuración: ON]
9.  Rellenar campo de texto en la página web      Elemento: Fecha desde   Texto: %FechaDesde%  [Autocuración: ON]
10. Rellenar campo de texto en la página web      Elemento: Fecha hasta   Texto: %FechaHasta%  [Autocuración: ON]
11. Presionar botón en la página web              Elemento: Consultar                           [Autocuración: ON]

# Resultados
12. Esperar a que la página web contenga el elemento   Elemento: Tabla movimientos   Tiempo de espera: 30 s
13. Extraer datos de la página web                Tabla de movimientos → %TablaMov%
      (Acción de varios elementos: la autocuración probablemente NO aplica. Validar.)
14. Establecer variable   %Ordenantes% = lista vacía

# Detalle de cada movimiento
15. Bucle   Desde 1 hasta %TablaMov.RowsCount%  incremento 1 → %i%
16.   Presionar botón en la página web            Elemento: Ver detalle (selector con %i%)      [Autocuración: ON]
17.   Esperar a que la página web contenga el elemento   Elemento: Texto Ordenante   Tiempo de espera: 15 s
18.   Obtener detalles del elemento de la página web
        Elemento: Texto Ordenante   Atributo: Own Text → %Ordenante%                       [Autocuración: ON, si está disponible]
19.   Agregar elemento a la lista   %Ordenante% → %Ordenantes%
20.   Presionar botón en la página web            Elemento: Cerrar detalle                      [Autocuración: ON]
21. Fin (bucle)

# Descarga
22. Esperar a que la página web contenga el elemento   Elemento: Descargar CSV   Tiempo de espera: 15 s
23. Presionar botón en la página web              Elemento: Descargar CSV                       [Autocuración: ON]
      (Si Edge pide confirmación de descarga, configurar descargas automáticas en el perfil de prueba
       o usar "Esperar archivo" en %CarpetaDescarga%.)
24. Esperar archivo   %CarpetaDescarga%\movimientos_*.csv   (Estado: creado)   Tiempo de espera: 30 s

# Cierre
25. Presionar botón en la página web              Elemento: Cerrar sesión                       [Autocuración: ON]
26. Esperar a que la página web contenga el texto      "Sesión cerrada correctamente."   Tiempo de espera: 15 s
27. Cerrar explorador web   %Navegador%

# Validaciones de negocio (detectan una "reparación" hacia el elemento equivocado)
28. Si %Ordenantes.Count% <> %TablaMov.RowsCount% → Producir error "Cantidad de ordenantes inesperada"
29. Si algún %Ordenante% está vacío → Producir error "Ordenante vacío"
30. Leer archivo CSV → verificar encabezado: fecha;hora;referencia;...;ordenante;...
```

## Notas para validar en PAD
- [ ] ¿Qué acciones muestran el **indicador de disponibilidad** de autocuración? (pasar el puntero sobre cada una en el área de trabajo).
- [ ] ¿*Obtener detalles del elemento de la página web* es compatible con la autocuración?
- [ ] Selector dinámico del botón *Ver detalle* con `%i%`: confirmar la sintaxis en el editor de selectores.
- [ ] Escenario 5 (iframe): ¿la reparación encuentra el elemento dentro del iframe sin capturarlo con el iframe como padre?
- [ ] Escenario 6: ¿alcanza con *Esperar a que la página web contenga el elemento*? En ese caso la autocuración no debería activarse.
- [ ] En las corridas **sin** autocuración, las acciones *Esperar…* también usan selectores "malos" y fallarán. Es lo esperado: anotar en qué acción falló primero.
