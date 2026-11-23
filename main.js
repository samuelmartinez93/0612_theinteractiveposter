/* ==========================================================================
   PEQUEÑOS GESTOS, GRANDES ILUSIONES · Cartel interactivo AE Itaca
   --------------------------------------------------------------------------
   JavaScript vanilla (ES6+), sin librerías.
   Secciones:
     1) Selección de elementos
     2) Configuración
     3) Funciones
     4) Event listeners
     5) Inicialización
   ========================================================================== */


/* ==========================================================================
   1) SELECCIÓN DE ELEMENTOS
   ========================================================================== */
const cartel = document.querySelector('#poster');
const numeroFecha = document.querySelector('#fecha-numero');
const regalos = document.querySelectorAll('.regalo');
const capasProfundidad = document.querySelectorAll('[data-depth]');
const botonDona = document.querySelector('#cta');
const flechaDona = botonDona.querySelector('.cta__flecha');
const mensajeGracias = document.querySelector('#gracias');


/* ==========================================================================
   2) CONFIGURACIÓN
   ========================================================================== */
const ANCHO_CARTEL = 848;
const ALTO_CARTEL = 1200;

const PARALLAX_MAX = 22;   // px máximos que se desplaza una capa con data-depth="1"
const SUAVIDAD = 0.08;     // factor del lerp: más bajo = movimiento más suave/lento

const PESO_MIN = 200;      // grosor del "21" con el ratón a la izquierda
const PESO_MAX = 900;      // grosor del "21" con el ratón a la derecha
const PESO_REPOSO = 500;   // grosor cuando el ratón sale del cartel

// Preferencia del sistema: si pide menos movimiento, desactivamos el parallax
const consultaMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
let movimientoReducido = consultaMovimiento.matches;

// Estado de la animación (valores "objetivo" y valores "actuales" para el lerp)
const objetivo = { x: 0, y: 0, peso: PESO_REPOSO };
const actual = { x: 0, y: 0, peso: PESO_REPOSO };
let animando = false;

// Regalos que el usuario ya ha abierto al menos una vez
const regalosDescubiertos = new Set();
let estadoFinal = false;


/* ==========================================================================
   3) FUNCIONES
   ========================================================================== */

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

/**
 * MOUSEENTER · Abre un regalo.
 * Modifica: transform (escala, giro, tapa), fill (color), opacity (deseo y destello).
 */
function abrirRegalo(regalo) {
  const deseo = regalo.querySelector('.regalo__deseo');

  regalo.classList.add('esta-abierto');

  // transform: el regalo crece y gira un poco; la tapa sube con translateY
  regalo.style.setProperty('--regalo-escala', '1.08');
  regalo.style.setProperty('--regalo-giro', '-5deg');
  regalo.style.setProperty('--tapa-y', '-24px');
  regalo.style.setProperty('--tapa-giro', '-6deg');

  // fill: cambia el color de relleno de la caja y la tapa
  regalo.style.setProperty('--regalo-color-actual', regalo.dataset.colorAbierto);

  // opacity + transform: aparece el destello dorado que sale de la caja
  regalo.style.setProperty('--destello-opacidad', '1');
  regalo.style.setProperty('--destello-y', '-8px');
  regalo.style.setProperty('--destello-escala', '1');

  // opacity: aparece la etiqueta con el deseo
  deseo.style.opacity = '1';

  // Llevamos la cuenta de los regalos descubiertos
  regalosDescubiertos.add(regalo);
  comprobarTodosAbiertos();
}

/**
 * MOUSELEAVE · Cierra un regalo y lo devuelve a su estado inicial.
 * Al quitar las variables, CSS vuelve a los valores por defecto con transición.
 */
function cerrarRegalo(regalo) {
  // En el estado final los regalos se quedan abiertos para la captura
  if (estadoFinal) return;

  const deseo = regalo.querySelector('.regalo__deseo');

  regalo.classList.remove('esta-abierto');

  [
    '--regalo-escala',
    '--regalo-giro',
    '--tapa-y',
    '--tapa-giro',
    '--regalo-color-actual',
    '--destello-opacidad',
    '--destello-y',
    '--destello-escala'
  ].forEach((propiedad) => regalo.style.removeProperty(propiedad));

  deseo.style.opacity = '0';
}

/**
 * MOUSEMOVE · Calcula hacia dónde deben moverse las capas y el peso del "21".
 * Solo guarda los valores objetivo; el movimiento real lo hace animar().
 */
function moverParallax(evento) {
  if (estadoFinal) return;

  // getBoundingClientRect ya tiene en cuenta el scale(): funciona a cualquier escala
  const rect = cartel.getBoundingClientRect();
  const relX = (evento.clientX - rect.left) / rect.width;   // 0 (izq.) → 1 (der.)
  const relY = (evento.clientY - rect.top) / rect.height;   // 0 (arriba) → 1 (abajo)

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
 * Modifica: --px / --py (translate de cada capa) y fontVariationSettings del "21".
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

  // fontVariationSettings: el "21" engorda o adelgaza según la X del ratón
  numeroFecha.style.fontVariationSettings = `"wght" ${actual.peso.toFixed(0)}, "opsz" 144`;

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

/**
 * MOUSEENTER en la CTA · Cambia el fondo a verde abeto y muestra la flecha.
 * Modifica: backgroundColor, opacity y transform.
 */
function resaltarDona() {
  botonDona.style.backgroundColor = 'var(--abeto)';
  flechaDona.style.opacity = '1';
  flechaDona.style.transform = 'translateX(0)';
}

/**
 * MOUSELEAVE en la CTA · Vuelve a su estado inicial.
 */
function restaurarDona() {
  botonDona.style.backgroundColor = '';
  flechaDona.style.opacity = '';
  flechaDona.style.transform = '';
}

/**
 * Si el usuario ya ha descubierto todos los regalos, activamos el estado final.
 */
function comprobarTodosAbiertos() {
  if (!estadoFinal && regalosDescubiertos.size === regalos.length) {
    activarEstadoFinal();
  }
}

/**
 * ESTADO FINAL (para la captura): todos los regalos abiertos, deseos visibles,
 * mensaje de agradecimiento y cartel centrado a escala 1.
 */
function activarEstadoFinal() {
  estadoFinal = true;
  document.body.classList.add('es-final');

  regalos.forEach((regalo) => abrirRegalo(regalo));

  // Parallax a cero: composición centrada y limpia
  reposarParallax();

  // opacity + transform: aparece el mensaje de agradecimiento
  mensajeGracias.style.opacity = '1';
  mensajeGracias.style.transform = 'translateY(0)';
}

/**
 * Sale del estado final y deja el cartel como al principio.
 */
function desactivarEstadoFinal() {
  estadoFinal = false;
  document.body.classList.remove('es-final');

  regalos.forEach((regalo) => cerrarRegalo(regalo));
  regalosDescubiertos.clear();

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
}


/* ==========================================================================
   4) EVENT LISTENERS
   ========================================================================== */

// Interacciones 1 y 2: abrir y cerrar cada regalo
regalos.forEach((regalo) => {
  regalo.addEventListener('mouseenter', () => abrirRegalo(regalo));
  regalo.addEventListener('mouseleave', () => cerrarRegalo(regalo));
});

// Interacción 3: parallax + tipografía variable
cartel.addEventListener('mousemove', moverParallax);
cartel.addEventListener('mouseleave', reposarParallax);

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
escalarCartel();
