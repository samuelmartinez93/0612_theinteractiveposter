/* ==========================================================================
   ¡PEQUEÑOS GESTOS, GRANDES ILUSIONES! · Cartel interactivo AE Itaca
   --------------------------------------------------------------------------
   JavaScript vanilla (ES6+), sin librerías.
   Secciones:
     1) Selección de elementos
     2) Configuración
     3) Funciones
        3.1 Escalado del cartel
        3.2 Cartas: colocación (abanico / tira)
        3.3 Cartas: abrir, cerrar e inclinar
        3.4 Parallax y tipografía
        3.5 Nieve
        3.6 Botón "Dona"
        3.7 Santa en su trineo
        3.8 Barajar y reiniciar
        3.9 Estrellas fugaces y brillo del título
        3.10 Estado final y teclado
     4) Event listeners
     5) Inicialización
   ========================================================================== */


/* ==========================================================================
   1) SELECCIÓN DE ELEMENTOS
   ========================================================================== */
const cartel = document.querySelector('#poster');
const numeroFecha = document.querySelector('#fecha-numero');
const abanico = document.querySelector('#abanico');
// Array (no NodeList) porque se baraja: el orden de las cartas cambia en cada partida
let cartas = [...document.querySelectorAll('.carta')];
const capasProfundidad = document.querySelectorAll('[data-depth]');
const botonDona = document.querySelector('#cta');
const flechaDona = botonDona.querySelector('.cta__flecha');
const mensajeGracias = document.querySelector('#gracias');
const santa = document.querySelector('#santa');
const botonReiniciar = document.querySelector('#reiniciar');
const hohoho = document.querySelector('#hohoho');
const capaFugaces = document.querySelector('#fugaces');
const lineasTitulo = document.querySelectorAll('.titulo__a, .titulo__b');

// Risa de Santa (se reproduce al pasar el ratón por encima de Santa)
const risaSanta = new Audio('assets/cartoon_music-ho-ho-ho-santa-voice-533204.mp3');
risaSanta.volume = 0.7;
const lienzoNieve = document.querySelector('#nieve');
const pincel = lienzoNieve.getContext('2d');


/* ==========================================================================
   2) CONFIGURACIÓN
   ========================================================================== */
const ANCHO_CARTEL = 848;
const ALTO_CARTEL = 1200;

// Abanico de cartas
const ABANICO_APERTURA = 28;   // grados entre la primera y la última carta
const ABANICO_SEPARACION = 112; // px de separación horizontal entre cartas
const ABANICO_ARCO = 12;       // px que bajan las cartas de los extremos
const EMPUJE_X = 34;           // px que se apartan las vecinas al levantar una carta
const EMPUJE_GIRO = 6;         // grados extra que giran las vecinas
const ESCALA_DESTACADA = 1.14; // tamaño de la carta levantada

// Tira de cómic (colocación de las cartas en el estado final)
const TIRA_SEPARACION = 192;
const TIRA_ESCALA = 0.86;
const TIRA_ALTURA = 22;

// Inclinación 3D de la carta girada (efecto carta holográfica)
const INCLINACION_MAX = 14;    // grados

// Parallax y tipografía
const PARALLAX_MAX = 18;       // px máximos que se desplaza una capa con data-depth="1"
const SUAVIDAD = 0.08;         // factor del lerp: más bajo = movimiento más suave/lento
const SOMBRA_BASE = 14;        // px de la sombra dura del "21" en reposo
const SOMBRA_RANGO = 12;       // px que puede variar la sombra con el ratón
const PESO_MIN = 500;          // grosor del "21" con el ratón a la izquierda
const PESO_MAX = 900;          // grosor del "21" con el ratón a la derecha
const PESO_REPOSO = 800;       // grosor cuando el ratón sale del cartel

// Santa: rutas de vuelo (coordenadas dentro del lienzo de 848 × 1200)
// IDA: sale de su sitio a la izquierda, hace un arco y se va por la derecha
const RUTA_SANTA_IDA = 'M 140 520 C 320 300, 620 300, 1100 420';
// VUELTA: entra por la izquierda y vuelve a su sitio
const RUTA_SANTA_VUELTA = 'M -170 560 C -60 525, 60 516, 140 520';
const DURACION_IDA = 3800;     // ms
const DURACION_VUELTA = 1700;  // ms

// Estrellas fugaces
const LIMITE_CIELO = 520;      // px: por encima de esta altura el ratón está "en el cielo"

// Nieve
const TOTAL_COPOS = 90;
const VIENTO_MAX = 1.6;        // px por fotograma que empuja el viento del ratón

// Preferencia del sistema: si pide menos movimiento, desactivamos parallax y nieve
const consultaMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
let movimientoReducido = consultaMovimiento.matches;

// Estado de la animación (valores "objetivo" y valores "actuales" para el lerp)
const objetivo = { x: 0, y: 0, peso: PESO_REPOSO };
const actual = { x: 0, y: 0, peso: PESO_REPOSO };
let animando = false;

// Cartas que el usuario ya ha girado al menos una vez
const cartasDescubiertas = new Set();
let estadoFinal = false;

// ¿Está Santa volando ahora mismo?
let santaVolando = false;

// Estrellas fugaces: ¿está el ratón en el cielo? y temporizador de la siguiente tanda
let ratonEnCielo = false;
let temporizadorFugaces = null;

// Copos de nieve
let copos = [];
let viento = 0;
let nieveEnMarcha = false;


/* ==========================================================================
   3) FUNCIONES
   ========================================================================== */

/* ---------- 3.1 Escalado del cartel ---------- */

/**
 * Escala el cartel para que quepa en la ventana sin deformarse.
 * Nunca lo amplía por encima de su tamaño real (escala máxima 1).
 * Modifica: custom property --escala → transform: scale()
 */
function escalarCartel() {
  const escala = Math.min(
    window.innerWidth / ANCHO_CARTEL,
    window.innerHeight / ALTO_CARTEL,
    1
  );
  cartel.style.setProperty('--escala', escala.toFixed(4));
}

/**
 * Interpolación lineal: acerca "a" hacia "b" un porcentaje "t".
 * Es lo que hace que el movimiento sea fluido y no a saltos.
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}


/* ---------- 3.2 Cartas: colocación (abanico / tira) ---------- */

/**
 * Aplica a una carta su posición: la posición base (abanico o tira)
 * más el desplazamiento de la interacción.
 * Modifica: transform (mediante --x, --y, --giro y --carta-escala).
 */
function colocarCarta(carta, { dx = 0, dy = 0, dgiro = 0, escala = 1 } = {}) {
  const base = carta.dataset;
  carta.style.setProperty('--x', `${Number(base.x) + dx}px`);
  carta.style.setProperty('--y', `${Number(base.y) + dy}px`);
  carta.style.setProperty('--giro', `${Number(base.giro) + dgiro}deg`);
  carta.style.setProperty('--carta-escala', escala);
}

/**
 * Devuelve una carta a su posición base, sin desplazamientos.
 */
function soltarCarta(carta, indice) {
  colocarCarta(carta, { escala: Number(carta.dataset.escala) });
  carta.style.zIndex = indice + 1;
}

/**
 * Coloca las cartas en abanico. La posición base de cada una se guarda
 * en data-x, data-y y data-giro.
 */
function prepararAbanico() {
  const total = cartas.length;

  cartas.forEach((carta, i) => {
    // offset: posición respecto al centro (-1.5, -0.5, 0.5, 1.5)
    const offset = i - (total - 1) / 2;

    carta.dataset.x = offset * ABANICO_SEPARACION;
    carta.dataset.y = Math.abs(offset) * ABANICO_ARCO;
    carta.dataset.giro = offset * (ABANICO_APERTURA / (total - 1));
    carta.dataset.escala = 1;
    soltarCarta(carta, i);
  });
}

/**
 * Coloca las cartas en fila, como una tira de cómic (estado final).
 */
function prepararTira() {
  const total = cartas.length;

  cartas.forEach((carta, i) => {
    const offset = i - (total - 1) / 2;

    carta.dataset.x = offset * TIRA_SEPARACION;
    carta.dataset.y = TIRA_ALTURA;
    carta.dataset.giro = i % 2 === 0 ? -2 : 2;
    carta.dataset.escala = TIRA_ESCALA;
    soltarCarta(carta, i);
  });
}

/**
 * Levanta la carta activa (escala + rotación ligera) y aparta las demás,
 * como en el modo abanico del Pop-Art Factory.
 */
function destacarCarta(activa) {
  const indiceActiva = [...cartas].indexOf(activa);

  cartas.forEach((carta, i) => {
    if (i === indiceActiva) {
      colocarCarta(carta, {
        dy: -Number(carta.dataset.y) - 40,     // sube por encima del abanico
        dgiro: -Number(carta.dataset.giro) - 2, // queda casi recta
        escala: ESCALA_DESTACADA
      });
      carta.style.zIndex = 100;
    } else {
      const lado = i < indiceActiva ? -1 : 1;
      colocarCarta(carta, { dx: lado * EMPUJE_X, dgiro: lado * EMPUJE_GIRO });
    }
  });
}


/* ---------- 3.3 Cartas: abrir, cerrar e inclinar ---------- */

/**
 * Aplica el giro 3D del interior de la carta: el volteo (0° dorso / 180° frente)
 * más la inclinación que sigue al ratón.
 * Modifica: transform (mediante --rot-y y --inclinar-x).
 */
function aplicarGiro(carta) {
  const volteo = Number(carta.dataset.volteo || 0);
  const inclinarX = Number(carta.dataset.inclinarX || 0);
  const inclinarY = Number(carta.dataset.inclinarY || 0);

  carta.style.setProperty('--rot-y', `${volteo + inclinarY}deg`);
  carta.style.setProperty('--inclinar-x', `${inclinarX}deg`);
}

/**
 * MOUSEENTER · Gira la carta y abre el regalo.
 * Modifica: transform (volteo 3D, tapa con translateY, deseo que sube),
 * fill (color del regalo) y opacity (deseo y onomatopeya).
 */
function abrirCarta(carta) {
  const onomatopeya = carta.querySelector('.carta__ono');

  carta.classList.add('esta-abierta');

  // transform: la carta se da la vuelta (dorso → frente)
  carta.dataset.volteo = 180;
  aplicarGiro(carta);

  // transform: la tapa del regalo sube con translateY y se inclina
  carta.style.setProperty('--tapa-y', '-22px');
  carta.style.setProperty('--tapa-giro', '-12deg');

  // transform + opacity: el deseo sale de la caja
  carta.style.setProperty('--icono-y', '0px');
  carta.style.setProperty('--icono-opacidad', '1');

  // fill: el regalo cambia de color
  carta.style.setProperty('--regalo-color-actual', carta.dataset.colorAbierto);

  // opacity + transform: ¡POP! aparece la onomatopeya
  onomatopeya.style.opacity = '1';
  onomatopeya.style.transform = 'rotate(-10deg) scale(1)';

  // En el abanico, la carta se levanta y las vecinas se apartan
  if (!estadoFinal) {
    destacarCarta(carta);
  }

  cartasDescubiertas.add(carta);
  comprobarTodasAbiertas();
}

/**
 * MOUSELEAVE · Vuelve a poner la carta boca abajo y recoloca el abanico.
 * Al quitar las variables, CSS vuelve a los valores por defecto con transición.
 */
function cerrarCarta(carta) {
  // En el estado final las cartas se quedan giradas para la captura
  if (estadoFinal) return;

  const onomatopeya = carta.querySelector('.carta__ono');

  carta.classList.remove('esta-abierta');

  carta.dataset.volteo = 0;
  carta.dataset.inclinarX = 0;
  carta.dataset.inclinarY = 0;
  aplicarGiro(carta);

  ['--tapa-y', '--tapa-giro', '--icono-y', '--icono-opacidad',
    '--regalo-color-actual', '--brillo-x', '--brillo-y']
    .forEach((propiedad) => carta.style.removeProperty(propiedad));

  onomatopeya.style.opacity = '';
  onomatopeya.style.transform = '';

  cartas.forEach((c, i) => soltarCarta(c, i));
}

/**
 * MOUSEMOVE sobre una carta girada · La inclina en 3D hacia el ratón y
 * mueve el brillo holográfico, como una carta coleccionable de verdad.
 * Modifica: transform (rotateX / rotateY) y background-position del brillo.
 */
function inclinarCarta(evento, carta) {
  if (!carta.classList.contains('esta-abierta') || estadoFinal) return;

  const rect = carta.getBoundingClientRect();
  const relX = (evento.clientX - rect.left) / rect.width;   // 0 … 1
  const relY = (evento.clientY - rect.top) / rect.height;   // 0 … 1
  const maximo = movimientoReducido ? 0 : INCLINACION_MAX;

  carta.dataset.inclinarY = ((relX - 0.5) * 2 * maximo).toFixed(1);
  carta.dataset.inclinarX = ((0.5 - relY) * 2 * maximo).toFixed(1);
  aplicarGiro(carta);

  carta.style.setProperty('--brillo-x', `${(relX * 100).toFixed(0)}%`);
  carta.style.setProperty('--brillo-y', `${(relY * 100).toFixed(0)}%`);
}


/* ---------- 3.4 Parallax y tipografía ---------- */

/**
 * MOUSEMOVE · Calcula hacia dónde deben moverse las capas, la sombra,
 * el peso del "21" y el viento de la nieve. Solo guarda los valores
 * objetivo; el movimiento real lo hace animar().
 */
function moverParallax(evento) {
  // getBoundingClientRect ya tiene en cuenta el scale(): funciona a cualquier escala
  const rect = cartel.getBoundingClientRect();
  const relX = (evento.clientX - rect.left) / rect.width;   // 0 (izq.) → 1 (der.)
  const relY = (evento.clientY - rect.top) / rect.height;   // 0 (arriba) → 1 (abajo)

  // Estrellas fugaces: solo mientras el ratón está sobre el cielo
  comprobarCielo(relY * ALTO_CARTEL < LIMITE_CIELO);

  if (estadoFinal) return;

  // Coordenadas centradas: -1 … 1 (0 = centro del cartel)
  objetivo.x = (relX - 0.5) * 2;
  objetivo.y = (relY - 0.5) * 2;

  actualizarTipografia(relX);
  iniciarAnimacion();
}

/**
 * Convierte la posición X del ratón (0 … 1) en un grosor de fuente.
 */
function actualizarTipografia(x) {
  const xLimitada = Math.min(Math.max(x, 0), 1);
  objetivo.peso = PESO_MIN + (PESO_MAX - PESO_MIN) * xLimitada;
}

/**
 * MOUSELEAVE del cartel · Todo vuelve suavemente a reposo.
 */
function reposarParallax() {
  comprobarCielo(false);
  objetivo.x = 0;
  objetivo.y = 0;
  objetivo.peso = PESO_REPOSO;
  iniciarAnimacion();
}

/**
 * Arranca el bucle de requestAnimationFrame solo si no está ya en marcha.
 */
function iniciarAnimacion() {
  if (!animando) {
    animando = true;
    requestAnimationFrame(animar);
  }
}

/**
 * Bucle de animación (≈60 veces por segundo).
 * Acerca los valores actuales a los objetivo con lerp y los aplica.
 * Modifica: --px / --py (translate de cada capa), la sombra dura del "21"
 * (--sombra-x / --sombra-y) y su fontVariationSettings.
 */
function animar() {
  // Con movimiento reducido saltamos directamente al valor final (sin inercia)
  const t = movimientoReducido ? 1 : SUAVIDAD;

  actual.x = lerp(actual.x, objetivo.x, t);
  actual.y = lerp(actual.y, objetivo.y, t);
  actual.peso = lerp(actual.peso, objetivo.peso, t);

  // Parallax: cada capa se mueve según su data-depth (sentido contrario al ratón)
  const intensidad = movimientoReducido ? 0 : PARALLAX_MAX;
  capasProfundidad.forEach((capa) => {
    const profundidad = parseFloat(capa.dataset.depth);
    capa.style.setProperty('--px', `${(-actual.x * profundidad * intensidad).toFixed(2)}px`);
    capa.style.setProperty('--py', `${(-actual.y * profundidad * intensidad).toFixed(2)}px`);
  });

  // Sombra dura del "21": se alarga en dirección contraria al ratón,
  // como si el cursor fuera un foco de luz
  const rangoSombra = movimientoReducido ? 0 : SOMBRA_RANGO;
  numeroFecha.style.setProperty('--sombra-x', `${(SOMBRA_BASE - actual.x * rangoSombra).toFixed(1)}px`);
  numeroFecha.style.setProperty('--sombra-y', `${(SOMBRA_BASE - actual.y * rangoSombra).toFixed(1)}px`);

  // fontVariationSettings: el "21" engorda o adelgaza según la X del ratón
  numeroFecha.style.fontVariationSettings = `"wght" ${actual.peso.toFixed(0)}`;

  // ¿Hemos llegado (casi) al objetivo? Entonces paramos el bucle para no gastar CPU
  const quieto =
    Math.abs(actual.x - objetivo.x) < 0.001 &&
    Math.abs(actual.y - objetivo.y) < 0.001 &&
    Math.abs(actual.peso - objetivo.peso) < 0.5;

  if (quieto) {
    animando = false;
  } else {
    requestAnimationFrame(animar);
  }
}


/* ---------- 3.5 Nieve ---------- */

/**
 * Crea los copos con posición, tamaño y velocidad aleatorios.
 */
function crearCopos() {
  copos = Array.from({ length: TOTAL_COPOS }, () => ({
    x: Math.random() * ANCHO_CARTEL,
    y: Math.random() * ALTO_CARTEL,
    radio: 1.5 + Math.random() * 3,
    velocidad: 0.4 + Math.random() * 1.1,
    fase: Math.random() * Math.PI * 2,
    dorado: Math.random() < 0.2          // 1 de cada 5 copos es un destello dorado
  }));
}

/**
 * Dibuja todos los copos en el canvas: crema y algunos dorados.
 */
function dibujarNieve() {
  pincel.clearRect(0, 0, ANCHO_CARTEL, ALTO_CARTEL);

  copos.forEach((copo) => {
    pincel.fillStyle = copo.dorado ? 'rgba(244, 197, 92, 0.9)' : 'rgba(255, 248, 236, 0.85)';
    pincel.beginPath();
    pincel.arc(copo.x, copo.y, copo.radio, 0, Math.PI * 2);
    pincel.fill();
  });
}

/**
 * Bucle de la nieve: los copos caen y el viento depende de la X del ratón
 * (el valor suavizado actual.x que calcula el parallax).
 */
function animarNieve(tiempo) {
  if (movimientoReducido) {
    dibujarNieve();   // nieve quieta
    nieveEnMarcha = false;
    return;
  }

  nieveEnMarcha = true;

  viento = lerp(viento, actual.x * VIENTO_MAX, 0.05);

  copos.forEach((copo) => {
    copo.y += copo.velocidad;
    copo.x += viento + Math.sin(tiempo / 900 + copo.fase) * 0.35;

    // Al salir por abajo o por los lados, el copo vuelve a entrar por el otro extremo
    if (copo.y > ALTO_CARTEL + 5) copo.y = -5;
    if (copo.x > ANCHO_CARTEL + 5) copo.x = -5;
    if (copo.x < -5) copo.x = ANCHO_CARTEL + 5;
  });

  dibujarNieve();
  requestAnimationFrame(animarNieve);
}


/* ---------- 3.6 Botón "Dona" ---------- */

/**
 * MOUSEENTER en la CTA · La pegatina "salta" hacia el usuario:
 * cambia el fondo a crema, crece la sombra dura y aparece la flecha.
 * Modifica: backgroundColor, transform, boxShadow y opacity.
 */
function resaltarDona() {
  botonDona.style.backgroundColor = 'var(--papel)';
  botonDona.style.transform = 'translate(-4px, -4px) rotate(-2deg)';
  botonDona.style.boxShadow = '12px 12px 0 var(--baya)';
  flechaDona.style.opacity = '1';
  flechaDona.style.transform = 'translateX(0)';
}

/**
 * MOUSELEAVE en la CTA · Vuelve a su estado inicial.
 */
function restaurarDona() {
  botonDona.style.backgroundColor = '';
  botonDona.style.transform = '';
  botonDona.style.boxShadow = '';
  flechaDona.style.opacity = '';
  flechaDona.style.transform = '';
}


/* ---------- 3.7 Santa en su trineo ---------- */

/**
 * Coloca a Santa en su sitio de reposo: el inicio de la ruta de ida.
 */
function prepararSanta() {
  santa.style.offsetPath = `path("${RUTA_SANTA_IDA}")`;
}

/**
 * MOUSEENTER en el cartel · Santa despega: vuela en arco, sale por la derecha
 * y vuelve a aparecer por la izquierda hasta su sitio.
 * Modifica: offset-distance (posición sobre la ruta) y rotate (inclinación).
 */
function volarSanta() {
  if (santaVolando || estadoFinal || movimientoReducido) return;
  santaVolando = true;
  decirHoHoHo();

  // Tramo 1: arco de ida (se inclina al subir y al bajar)
  const ida = santa.animate([
    { offsetDistance: '0%', rotate: '0deg' },
    { offsetDistance: '25%', rotate: '-14deg' },
    { offsetDistance: '60%', rotate: '4deg' },
    { offsetDistance: '100%', rotate: '14deg' }
  ], { duration: DURACION_IDA, easing: 'ease-in-out', fill: 'forwards' });

  ida.finished
    .then(() => {
      // Tramo 2: cambiamos de ruta y entra por la izquierda.
      // Se hace todo seguido para que no se vea ningún salto.
      santa.style.offsetPath = `path("${RUTA_SANTA_VUELTA}")`;
      const vuelta = santa.animate([
        { offsetDistance: '0%', rotate: '-6deg' },
        { offsetDistance: '100%', rotate: '0deg' }
      ], { duration: DURACION_VUELTA, easing: 'ease-out', fill: 'forwards' });
      ida.cancel();
      return vuelta.finished.then(() => {
        prepararSanta();   // de nuevo en su sitio de reposo
        vuelta.cancel();
      });
    })
    .catch(() => {
      // La animación se canceló (por ejemplo, al pulsar F): no es un error
    })
    .finally(() => {
      santaVolando = false;
    });
}

/**
 * Muestra un momento la onomatopeya "¡Ho, ho, ho!".
 * Modifica: opacity y transform.
 */
function decirHoHoHo() {
  hohoho.style.opacity = '1';
  hohoho.style.transform = 'rotate(-8deg) scale(1)';
  setTimeout(() => {
    hohoho.style.opacity = '';
    hohoho.style.transform = '';
  }, 1400);
}

/**
 * MOUSEENTER / CLICK sobre Santa · Se ríe: suena el "Ho, ho, ho".
 * Los navegadores no dejan sonar audio hasta que el usuario ha hecho clic
 * o pulsado una tecla en la página; si aún no lo ha hecho, se ignora sin error.
 */
function reirSanta() {
  decirHoHoHo();
  risaSanta.currentTime = 0;
  risaSanta.play().catch(() => {
    // Sonido bloqueado por el navegador hasta la primera interacción: no pasa nada
  });
}

/**
 * Detiene el vuelo de Santa y lo deja en su sitio (para el estado final).
 */
function detenerSanta() {
  santa.getAnimations().forEach((animacion) => animacion.cancel());
  prepararSanta();
}


/* ---------- 3.8 Barajar y reiniciar ---------- */

/**
 * Baraja las cartas (algoritmo de Fisher-Yates): cada partida tienen
 * un orden aleatorio distinto. Se reordenan en el HTML, se renumeran
 * los deseos y se vuelven a colocar en abanico (se deslizan a su sitio).
 */
function barajarCartas() {
  for (let i = cartas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
  }

  cartas.forEach((carta, i) => {
    abanico.append(carta);
    carta.querySelector('.carta__leyenda').textContent = `Deseo n.º ${i + 1}`;
  });

  prepararAbanico();
}

/**
 * CLICK en el botón "Barajar cartas" · Vuelve a empezar: cierra las cartas,
 * sale del estado final si hace falta y las baraja en un orden aleatorio.
 */
function reiniciarCartel() {
  if (estadoFinal) {
    desactivarEstadoFinal();   // ya cierra y baraja las cartas
    return;
  }

  cartas.forEach((carta) => cerrarCarta(carta));
  cartasDescubiertas.clear();
  barajarCartas();
}


/* ---------- 3.9 Estrellas fugaces y brillo del título ---------- */

/**
 * MOUSEENTER en el cartel · Un destello cruza el título de lado a lado,
 * como el reflejo de la luz sobre un papel metalizado.
 * Modifica: background-position del degradado (con element.animate()).
 */
function brillarTitulo() {
  if (movimientoReducido) return;

  lineasTitulo.forEach((linea, i) => {
    linea.animate([
      { backgroundPosition: '100% 0' },
      { backgroundPosition: '0% 0' }
    ], { duration: 1300, delay: i * 180, easing: 'ease-in-out' });
  });
}


/**
 * Activa o desactiva las estrellas fugaces según si el ratón está en el cielo.
 */
function comprobarCielo(estaEnCielo) {
  if (estaEnCielo && !ratonEnCielo) {
    ratonEnCielo = true;
    lanzarEstrellasFugaces();
  } else if (!estaEnCielo && ratonEnCielo) {
    ratonEnCielo = false;
    clearTimeout(temporizadorFugaces);
  }
}

/**
 * Lanza una tanda de 2 o 3 estrellas fugaces en sitios al azar del cielo
 * y programa la siguiente tanda mientras el ratón siga en el cielo.
 */
function lanzarEstrellasFugaces() {
  if (!ratonEnCielo || movimientoReducido) return;

  const cantidad = 2 + Math.floor(Math.random() * 2);   // 2 o 3
  for (let i = 0; i < cantidad; i++) {
    crearEstrellaFugaz();
  }

  temporizadorFugaces = setTimeout(lanzarEstrellasFugaces, 1700 + Math.random() * 900);
}

/**
 * Crea una estrella fugaz, la anima (entra, cruza y sale) y la borra al terminar.
 * Modifica: transform (rotate + translateX + scaleX) y opacity.
 */
function crearEstrellaFugaz() {
  const estrella = document.createElement('span');
  estrella.className = 'estrella-fugaz';
  estrella.style.left = `${40 + Math.random() * 640}px`;
  estrella.style.top = `${70 + Math.random() * 300}px`;
  capaFugaces.append(estrella);

  // Cae hacia la derecha o hacia la izquierda, con un ángulo al azar
  const angulo = Math.random() < 0.5 ? 20 + Math.random() * 20 : 140 + Math.random() * 20;
  const giro = `rotate(${angulo.toFixed(0)}deg)`;

  const animacion = estrella.animate([
    { transform: `${giro} translateX(0) scaleX(0.2)`, opacity: 0 },
    { transform: `${giro} translateX(70px) scaleX(1)`, opacity: 1, offset: 0.3 },
    { transform: `${giro} translateX(230px) scaleX(0.4)`, opacity: 0 }
  ], {
    duration: 900 + Math.random() * 500,
    delay: Math.random() * 600,
    easing: 'ease-out',
    fill: 'backwards'
  });

  animacion.finished
    .catch(() => {})
    .finally(() => estrella.remove());
}

/* ---------- 3.10 Estado final y teclado ---------- */

/**
 * Si el usuario ya ha girado todas las cartas, activamos el estado final.
 */
function comprobarTodasAbiertas() {
  if (!estadoFinal && cartasDescubiertas.size === cartas.length) {
    activarEstadoFinal();
  }
}

/**
 * ESTADO FINAL (para la captura): las cartas pasan de abanico a tira,
 * todas giradas con su deseo, cinta de agradecimiento y escala 1.
 */
function activarEstadoFinal() {
  estadoFinal = true;
  document.body.classList.add('es-final');

  cartas.forEach((carta) => {
    abrirCarta(carta);
    carta.dataset.inclinarX = 0;
    carta.dataset.inclinarY = 0;
    aplicarGiro(carta);
  });
  prepararTira();
  detenerSanta();

  // Parallax a cero: composición centrada y limpia
  reposarParallax();


  // opacity + transform: aparece el recuadro "¡Gracias…!"
  mensajeGracias.style.opacity = '1';
  mensajeGracias.style.transform = 'rotate(-3deg) scale(1)';
}

/**
 * Sale del estado final y deja el cartel como al principio.
 */
function desactivarEstadoFinal() {
  estadoFinal = false;
  document.body.classList.remove('es-final');

  cartas.forEach((carta) => cerrarCarta(carta));
  cartasDescubiertas.clear();
  barajarCartas();

  mensajeGracias.style.opacity = '';
  mensajeGracias.style.transform = '';

  escalarCartel();
}

/**
 * KEYDOWN · La tecla F activa/desactiva el estado final.
 */
function gestionarTeclado(evento) {
  // Ignoramos atajos (Ctrl+F, Cmd+F…) y la repetición al mantener pulsada la tecla
  if (evento.ctrlKey || evento.metaKey || evento.altKey || evento.repeat) return;

  if (evento.key.toLowerCase() === 'f') {
    if (estadoFinal) {
      desactivarEstadoFinal();
    } else {
      activarEstadoFinal();
    }
  }
}

/**
 * Se ejecuta si el usuario cambia la preferencia de movimiento con la página abierta.
 */
function actualizarPreferenciaMovimiento(evento) {
  movimientoReducido = evento.matches;
  iniciarAnimacion();
  if (!nieveEnMarcha) requestAnimationFrame(animarNieve);
}


/* ==========================================================================
   4) EVENT LISTENERS
   ========================================================================== */

// Interacciones 1 y 2: girar/abrir y cerrar cada carta. Extra: inclinarla
cartas.forEach((carta) => {
  carta.addEventListener('mouseenter', () => abrirCarta(carta));
  carta.addEventListener('mouseleave', () => cerrarCarta(carta));
  carta.addEventListener('mousemove', (evento) => inclinarCarta(evento, carta));
});

// Interacción 3: parallax + sombra + tipografía variable + viento de la nieve
cartel.addEventListener('mousemove', moverParallax);
cartel.addEventListener('mouseleave', reposarParallax);

// Interacción extra: al entrar en el cartel, Santa despega
cartel.addEventListener('mouseenter', volarSanta);

// Interacción extra: al entrar en el cartel, el título brilla de lado a lado
cartel.addEventListener('mouseenter', brillarTitulo);

// Santa se ríe (sonido) al pasar el ratón por encima o al hacer clic
santa.addEventListener('mouseenter', reirSanta);
santa.addEventListener('click', reirSanta);

// Botón "Barajar cartas": reiniciar el cartel con un orden aleatorio
botonReiniciar.addEventListener('click', reiniciarCartel);

// Interacción extra: botón "Dona"
botonDona.addEventListener('mouseenter', resaltarDona);
botonDona.addEventListener('mouseleave', restaurarDona);

// Escalado del cartel al cambiar el tamaño de la ventana
window.addEventListener('resize', escalarCartel);

// Estado final con la tecla F
document.addEventListener('keydown', gestionarTeclado);

// Cambios en la preferencia de movimiento reducido
consultaMovimiento.addEventListener('change', actualizarPreferenciaMovimiento);


/* ==========================================================================
   5) INICIALIZACIÓN
   ========================================================================== */
barajarCartas();     // orden aleatorio desde el principio (incluye prepararAbanico)
prepararSanta();
escalarCartel();
crearCopos();
requestAnimationFrame(animarNieve);
