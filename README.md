# Pequeños gestos, grandes ilusiones

Cartel digital interactivo (estilo *The Moving Poster*) para la **campaña solidaria de Navidad de la Associació Educativa Itaca (AE Itaca)**, de L'Hospitalet de Llobregat: recaudar donaciones para comprar regalos de Navidad a niños y niñas en riesgo de exclusión social. Fecha clave: **21 de diciembre de 2026**.

![Cartel final](captura.png)

## Concepto

Ítaca es una pequeña isla, y AE Itaca defiende que **las pequeñas acciones producen grandes cambios** ("Construimos oportunidades"). En el cartel, cada donación es un pequeño gesto que se convierte en un regalo y en una ilusión. Los regalos y las estrellas, hechos con formas geométricas sencillas, **cobran vida cuando el usuario interactúa**: su gesto (mover el ratón o pasar por encima de un regalo) es lo que abre los regalos y descubre los deseos. Detrás de los regalos hay un gran círculo suave, que representa la "isla".

## Cómo ejecutarlo

No hace falta instalar nada ni compilar:

- **Opción 1:** hacer doble clic en `index.html`.
- **Opción 2:** en VS Code, abrir la carpeta, hacer clic derecho en `index.html` y elegir **Open with Live Server**.

Cómo usarlo:

- Mueve el ratón por el cartel y pasa por encima de los regalos.
- Pulsa la tecla **F** para activar o desactivar el **estado final** (para la captura). Este estado también se activa solo cuando ya has abierto los cuatro regalos.

## Estructura

```
/index.html      → estructura del cartel (lienzo de 848 × 1200 px)
/style.css       → estilos, variables y transiciones (sin :hover)
/main.js         → interacciones (JS vanilla, organizado en 5 secciones)
/README.md
/assets/img/     → logos de AE Itaca y de las entidades colaboradoras
```

## Eventos utilizados

| Evento | Elemento | Propiedades que se modifican | Función |
|---|---|---|---|
| `mouseenter` | Cada `.regalo` | `transform` (escala, giro y `translateY` de la tapa), `fill` (color), `opacity` (deseo y destello) | `abrirRegalo(regalo)` |
| `mouseleave` | Cada `.regalo` | Restablece `transform`, `fill` y `opacity` | `cerrarRegalo(regalo)` |
| `mousemove` | `.poster` | `translate` de cada capa con `data-depth` (variables `--px` y `--py`), `fontVariationSettings` del "21" | `moverParallax(evento)`, `actualizarTipografia(x)` y `animar()` |
| `mouseleave` | `.poster` | Vuelve las capas y el peso del "21" a reposo | `reposarParallax()` |
| `mouseenter` / `mouseleave` | Botón "Dona" | `backgroundColor`, `opacity` y `transform` de la flecha | `resaltarDona()` y `restaurarDona()` |
| `resize` | `window` | `transform: scale()` mediante la variable `--escala` | `escalarCartel()` |
| `keydown` | `document` | Activa el estado final: regalos abiertos, `opacity` del mensaje y escala 1 | `gestionarTeclado(evento)`, `activarEstadoFinal()` y `desactivarEstadoFinal()` |
| `change` | `matchMedia('(prefers-reduced-motion: reduce)')` | Activa o desactiva el parallax | `actualizarPreferenciaMovimiento(evento)` |

Todas las interacciones se registran con `addEventListener`. CSS solo aporta las `transition` que suavizan los cambios y **no se usa `:hover`**.

## Las interacciones y qué aportan al mensaje

1. **Abrir un regalo (`mouseenter`).** El regalo crece, gira un poco y cambia de color. La tapa sube, sale un destello dorado y aparece una etiqueta con un deseo ("Un libro", "Un balón", "Colores", "Un puzle"). *Aporta:* un pequeño gesto del usuario tiene una respuesta inmediata y visible, igual que una pequeña donación se convierte en la ilusión concreta de un niño o una niña.
2. **Cerrar el regalo (`mouseleave`).** El regalo vuelve suavemente a su estado inicial. *Aporta:* el regalo solo se abre mientras el gesto continúa, lo que invita a recorrer y descubrir los cuatro. Al abrirlos todos, el cartel da las gracias.
3. **Parallax y tipografía viva (`mousemove`).** Las estrellas, la isla, la fecha y los regalos se desplazan con distinta profundidad según el atributo `data-depth`. Además, el "21" cambia de grosor según la posición horizontal del ratón. El movimiento se interpola con *lerp* dentro de un bucle de `requestAnimationFrame` para que sea fluido. *Aporta:* el cartel "respira" con el usuario y la fecha, que es el dato más importante, reacciona y llama la atención.
4. **Extra: CTA "Dona" (`mouseenter` / `mouseleave`).** El botón pasa de negro a verde abeto y aparece una flecha, que refuerza la llamada a la acción.

**Accesibilidad:** si el sistema tiene activada la opción *reducir movimiento* (`prefers-reduced-motion`), el parallax se desactiva y las transiciones son casi instantáneas.

## Paleta

| Variable | Color | Uso |
|---|---|---|
| `--papel` | `#F0EEE9` | Fondo blanco roto cálido |
| `--tinta` | `#141414` | Texto casi negro |
| `--coral` | `#E5482F` | Acento principal: fecha, impacto y regalos |
| `--abeto` | `#1F4D3A` | Acento secundario: regalos abiertos, CTA activa y sello |
| `--oro` | `#C9A55C` | Solo para destellos |
| `--arena` | `#E5E1D8` | Círculo de la "isla" |

## Tipografías (Google Fonts)

- **Fraunces** (variable, ejes `wght` y `opsz`): el "21" gigante, "de diciembre", el impacto y el mensaje final.
- **Inter Tight**: los textos de lectura (mínimo 16 px dentro del lienzo).

## Hacer la captura

1. Abre el cartel en Chrome y pulsa **F**.
2. Abre las DevTools (F12), selecciona el elemento `<main class="poster">` en el panel *Elements*, pulsa **Ctrl + Shift + P** y escribe **"Capture node screenshot"**. Obtendrás una imagen exacta de 848 × 1200 px.
3. Guárdala como `captura.png` en la raíz del proyecto.

## Créditos

- Campaña ficticia con fines educativos, en colaboración con la **Associació Educativa Itaca (AE Itaca)**: [aeitaca.org](https://aeitaca.org). Carrer del Montseny, 22 · 08903 L'Hospitalet de Llobregat · 934 036 997 · info@aeitaca.org.
- Los logos de AE Itaca, la Generalitat de Catalunya (Departament de Drets Socials), el Ajuntament de L'Hospitalet y la Diputació de Barcelona **pertenecen a sus respectivas entidades** y se usan solo con fines académicos.
- Ilustraciones (regalos, estrellas y textura de grano): SVG propios.
- Tipografías: Fraunces e Inter Tight, de Google Fonts (SIL Open Font License).
