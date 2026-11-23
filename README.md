# ¡Pequeños gestos, grandes ilusiones!

Cartel digital interactivo (estilo *The Moving Poster*) para la **campaña solidaria de Navidad de la Associació Educativa Itaca (AE Itaca)**, de L'Hospitalet de Llobregat: recaudar donaciones para comprar regalos de Navidad a niños y niñas en riesgo de exclusión social. Fecha clave: **21 de diciembre de 2026**.

![Cartel final](captura.png)

## Concepto

Ítaca es una pequeña isla, y AE Itaca defiende que **las pequeñas acciones producen grandes cambios** ("Construimos oportunidades"). En el cartel, cada donación es un pequeño gesto que se convierte en un regalo y en una ilusión.

El mensaje es **humilde y directo**: no hace falta mucho, **con 10 € se compra un regalo**.

### Dirección de arte: una Navidad de cómic con tres referencias

| Referencia | Qué se ha tomado |
|---|---|
| **Pop-art** (*Pop-Art Factory*) | Contornos marcados, sombras duras, pegatinas giradas, abanico de cartas que se separan |
| **Cartas coleccionables** | Carta con dorso y frente que gira en 3D, balanceo en reposo, texto curvo con `textPath`, "puntos de vida", ataque y coste y brillo |
| **Cómic** | Marco de viñeta, recuadro de narración en la cabecera, bocadillo con el pico apuntando a las cartas, onomatopeyas ("¡Ho, ho, ho!", "¡POP!") y una pegatina de explosión de cómic doble |
| **Guiño vaporwave (sobrio)** | Anochecer con resplandor de atardecer, el barrio con ventanas encendidas, suelo en perspectiva con estrellitas, abetos, copos y regalos dorados muy tenues y una estela de luz suave |

**El protagonista animado: Santa en su trineo** (`assets/img/santa-trineo.svg`), hecho con piezas de construcción.
- **Animaciones propias:** el SVG trae el galope de los renos, el cabeceo, el trineo flotando, la nariz que brilla y los destellos.
- **Filtro cómic:** encima se le aplica un filtro SVG propio (`#filtro-comic`) que le dibuja un contorno oscuro, y una sombra dura.
- **En reposo:** espera a la izquierda.
- **En vuelo:** al entrar con el ratón en el cartel, despega, hace un arco por detrás de los textos, sale por la derecha y vuelve a entrar por la izquierda hasta su sitio. Lo gestiona JS con `element.animate()` sobre una ruta `offset-path`. Al despegar aparece un "¡Ho, ho, ho!".
- **Se ríe:** al pasar el ratón por encima de Santa (o al hacer clic) suena su risa "Ho, ho, ho".

**Primer plano:** colinas nevadas con contorno de cómic y un **marco de acebo**: dos ramitas en las esquinas superiores cuyas hojas se mecen cada una a su ritmo y cuyas bayas laten como lucecitas. La nieve cae y sopla hacia el ratón.

**Zona hero:** el "21" gigante y limpio con "de DICIEMBRE" justo debajo. A la derecha, el título de la campaña en grande y en cuatro líneas, en serif editorial minimalista (crema y oro, colores lisos), al estilo de los carteles solidarios editoriales de 2026. *Pequeños gestos, grandes ilusiones*.

**Las cartas como metáfora:** cada carta es una "Carta regalo" boca abajo. Al girarla se abre el regalo y aparece el deseo de un niño o niña. Su coste es siempre el mismo: **10 €**.

## Cómo ejecutarlo

No hace falta instalar nada ni compilar:

- **Opción 1:** hacer doble clic en `index.html`.
- **Opción 2:** en VS Code, abrir la carpeta, hacer clic derecho en `index.html` y elegir **Open with Live Server**.

Cómo usarlo:

- Mueve el ratón por el cartel. Al pasar por una carta, se da la vuelta. Mueve el ratón encima de la carta girada para inclinarla.
- Al entrar con el ratón en el cartel, **Santa despega** y da una vuelta. Si pasas el ratón por encima de Santa, **se ríe** (con sonido).
- Mientras el ratón está sobre el **cielo**, van apareciendo tandas de 2 o 3 **estrellas fugaces** en sitios al azar.
- La **pegatina "10 € = 1 regalo"** (explosión de cómic doble) flota suavemente sobre el cartel, con una sombra que se aleja y se difumina.
- Al entrar con el ratón en el cartel, un **destello cruza el título** *Pequeños gestos, grandes ilusiones* de lado a lado (una franja de luz sobre el crema y el oro), y unos ✦ titilan a su alrededor.
- **Sobre el sonido:** los navegadores no dejan reproducir audio hasta que el usuario ha hecho clic o pulsado una tecla en la página. La primera vez, haz clic en cualquier sitio (o en Santa) y a partir de ahí sonará al pasar el ratón.
- Pulsa la tecla **F** para activar o desactivar el **estado final** (para la captura). Este estado también se activa solo cuando ya has girado las cuatro cartas.
- El botón discreto **↻** (junto a la última carta) reinicia el cartel en cualquier momento: cierra las cartas, sale del estado final y las **baraja en un orden aleatorio**. Las cartas también se barajan al cargar la página y al salir del estado final con F.

## Estructura

```
/index.html      → estructura del cartel (lienzo de 848 × 1200 px)
/style.css       → estilos, variables y transiciones (sin :hover)
/main.js         → interacciones (JS vanilla, organizado en 5 secciones)
/README.md
/assets/img/     → logos (AE Itaca, colaboradores y Planeta FP) y el SVG de Santa en su trineo
```

## Eventos utilizados

| Evento | Elemento | Propiedades que se modifican | Función |
|---|---|---|---|
| `mouseenter` | Cada `.carta` | `transform` (giro 3D de la carta; la carta sube, crece y se endereza; las vecinas se apartan; la tapa sube con `translateY`; el deseo sale de la caja), `fill` (color del regalo), `opacity` (deseo y onomatopeya) | `abrirCarta(carta)`, `destacarCarta(carta)`, `colocarCarta()` y `aplicarGiro()` |
| `mouseleave` | Cada `.carta` | Restablece `transform`, `fill` y `opacity` | `cerrarCarta(carta)` y `soltarCarta()` |
| `mousemove` | Cada `.carta` girada | `transform` (`rotateX` / `rotateY` hacia el ratón) y `background-position` del brillo holográfico | `inclinarCarta(evento, carta)` |
| `mousemove` | `.poster` | `translate` de cada capa con `data-depth` (variables `--px` y `--py`), sombra dura del "21", `fontVariationSettings` del "21", viento de la nieve y estrellas fugaces cuando el ratón está en el cielo (`transform` y `opacity` con `element.animate()`) | `moverParallax(evento)`, `actualizarTipografia(x)`, `animar()`, `animarNieve()`, `comprobarCielo()` y `lanzarEstrellasFugaces()` |
| `mouseleave` | `.poster` | Vuelve todo a reposo | `reposarParallax()` |
| `mouseenter` / `mouseleave` | Botón "Dona" | `backgroundColor`, `transform`, `boxShadow` y `opacity` de la flecha | `resaltarDona()` y `restaurarDona()` |
| `mouseenter` | `.poster` | Vuelo de Santa: `offset-distance` (posición sobre la ruta) y `rotate` | `volarSanta()` |
| `mouseenter` | `.poster` | Destello del título: `background-position` de la franja de luz | `brillarTitulo()` |
| `mouseenter` / `click` | Santa (`#santa`) | Reproduce la risa (`Audio.play()`) y muestra el "¡Ho, ho, ho!" (`opacity`, `transform`) | `reirSanta()` y `decirHoHoHo()` |
| `click` | Botón ↻ (`#reiniciar`) | Cierra las cartas, las **baraja** (Fisher-Yates), las renumera y vuelve al abanico | `reiniciarCartel()` y `barajarCartas()` |
| `resize` | `window` | `transform: scale()` mediante la variable `--escala` | `escalarCartel()` |
| `keydown` | `document` | Estado final: el abanico pasa a tira, las cartas quedan giradas, aparece el recuadro "¡Gracias!" (bajo "DICIEMBRE", sin mover nada), Santa se queda en su sitio y el cartel queda a escala 1 | `gestionarTeclado(evento)`, `activarEstadoFinal()` y `desactivarEstadoFinal()` |
| `change` | `matchMedia('(prefers-reduced-motion: reduce)')` | Activa o desactiva el parallax, la inclinación y la nieve | `actualizarPreferenciaMovimiento(evento)` |

Todas las interacciones se registran con `addEventListener`. CSS solo aporta las `transition` que suavizan los cambios y **no se usa `:hover`**. Las referencias originales usan `:hover`, `sibling-index()` y Sass; aquí todo eso se ha rehecho en JavaScript y CSS normal.

## Las interacciones y qué aportan al mensaje

1. **Girar la carta y abrir el regalo (`mouseenter`).** La carta se levanta del abanico, crece y se da la vuelta en 3D. En el frente, la tapa del regalo sube, el regalo cambia de color, el deseo sale de la caja y aparece una onomatopeya ("¡POP!", "¡ZAS!"…). *Aporta:* un gesto pequeño del usuario descubre algo concreto (un libro, un balón…), igual que una donación pequeña se convierte en la ilusión de un niño o una niña.
2. **Volver a dejarla boca abajo (`mouseleave`).** La carta vuelve al abanico con un rebote suave. *Aporta:* invita a descubrir las cuatro cartas; al girarlas todas, el cartel da las gracias.
3. **Parallax, sombra, tipografía viva y nieve (`mousemove`).** Las estrellas, la ciudad, la rejilla, las colinas nevadas, la pegatina "10 € = 1 regalo" y las cartas se mueven a distintas profundidades (`data-depth`). La sombra dura del "21" se alarga en sentido contrario al ratón y su grosor cambia con la posición X. La nieve sopla hacia donde está el ratón. Todo se interpola con *lerp* en bucles de `requestAnimationFrame`. *Aporta:* el cartel reacciona al usuario y la fecha, que es el dato clave, llama la atención.
4. **Extra: inclinación holográfica (`mousemove` en la carta).** La carta girada se inclina hacia el ratón y su brillo dorado se desplaza, como una carta coleccionable de verdad.
5. **Extra: CTA "Dona" (`mouseenter` / `mouseleave`).** La pegatina "salta" hacia el usuario: pasa a crema, crece su sombra dura y aparece una flecha.

**Accesibilidad:**
- Con *reducir movimiento* (`prefers-reduced-motion`) se desactivan el parallax, la inclinación, la nieve, el balanceo, el parpadeo de las luces y estrellas, la estela, el suelo animado, el flotar de la pegatina, el acebo, las animaciones del SVG de Santa y su vuelo (se queda quieto en su sitio).
- Los textos de lectura tienen 16 px o más. Los títulos grandes llevan contorno negro o sombra dura para leerse bien sobre cualquier fondo.

## Paleta

| Variable | Color | Uso |
|---|---|---|
| `--noche` / `--noche-media` | `#102A40` / `#1E4A5E` | Cielo de anochecer |
| `--atardecer` | `#EFB27E` | Resplandor cálido del horizonte |
| `--barrio` / `--luz` | `#183A4A` / `#FFD27A` | Edificios, ventanas encendidas, formas del suelo y estela |
| `--hoja` / `--hoja-sombra` | `#46A673` / `#2F8058` | Regalos y pegatina |
| `--oro` / `--oro-oscuro` | `#F4C55C` / `#C99A2E` | "21", CTA, recuadros de narración, marcos |
| `--baya` | `#E2504C` | Acento: sombra del "21", bolas, regalos y coste |
| `--papel` / `--nieve-sombra` | `#FFF8EC` / `#DDEDE4` | Nieve, brillos del acebo, "Diciembre", título, bocadillo, frente de las cartas y branding |
| `--tinta` | `#15291F` | Contornos y texto |

## Tipografías (Google Fonts)

- **Big Shoulders Display** (variable, eje `wght`): el "21", "DICIEMBRE", los titulares, las pegatinas y la CTA.
- **Fraunces** (redonda e itálica): el título *Pequeños gestos,* (redonda, crema) *grandes ilusiones.* (itálica, oro), el "de" y la frase del bocadillo. Una sola familia en colores lisos y sin contorno: minimalista y legible, también impreso.
- **Luckiest Guy**: el texto curvo del dorso y los nombres de las cartas.
- **Mountains of Christmas** (negrita): tipografía navideña para el "= 1 regalo" de la pegatina. El "10" va en Luckiest Guy.
- **Archivo**: los textos de lectura.

## Hacer la captura

1. Abre el cartel en Chrome y pulsa **F**.
2. Abre las DevTools (F12), selecciona el elemento `<main class="poster">` en el panel *Elements*, pulsa **Ctrl + Shift + P** y escribe **"Capture node screenshot"**. Obtendrás una imagen exacta de 848 × 1200 px.
3. Guárdala como `captura.png` en la raíz del proyecto.

## Créditos

- Campaña ficticia con fines educativos, en colaboración con la **Associació Educativa Itaca (AE Itaca)**: [aeitaca.org](https://aeitaca.org). Carrer del Montseny, 22 · 08903 L'Hospitalet de Llobregat · 934 036 997 · info@aeitaca.org.
- Cartel realizado por alumnado de **Planeta FP**. Su logo aparece en la franja de branding.
- Los logos de AE Itaca, la Generalitat de Catalunya (Departament de Drets Socials), el Ajuntament de L'Hospitalet, la Diputació de Barcelona y Planeta FP **pertenecen a sus respectivas entidades** y se usan solo con fines académicos.
- Santa en su trineo (`santa-trineo.svg`): ilustración SVG de estilo piezas de construcción aportada por el autor del cartel.
- Inspiración visual: los pens *Pop-Art Factory* (ol-ivier) y la carta coleccionable de carvacodes (CodePen), y la estética de los cómics clásicos. No se ha copiado ninguna de sus imágenes, GIF ni audio.
- Ilustraciones (regalos, acebo, colinas, barrio, cartas, pegatina y tramas) y el filtro cómic: SVG, CSS y canvas propios.
- Sonido: "Ho ho ho Santa voice" (`assets/cartoon_music-ho-ho-ho-santa-voice-533204.mp3`), de *cartoon_music*. Comprueba su licencia en el sitio de donde se descargó (por el nombre, probablemente Pixabay).
- Tipografías: Big Shoulders Display, Fraunces, Mountains of Christmas, Luckiest Guy y Archivo, de Google Fonts (SIL Open Font License).
