/**
 * sketch.js
 * Punto de entrada de p5.js.
 * Solo contiene preload / setup / draw e input; toda la lógica vive en Game.
 */

/** @type {Game} */
let game;

function preload() {
  game = new Game();
  game.preload();
}

function setup() {
  // Desactiva menú contextual en touch/click derecho (pantalla táctil).
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  game.setup();
}

function draw() {
  game.draw();
}

function windowResized() {
  if (game) {
    game.windowResized();
  }
}

// Mouse (desarrollo) + Touch (evento) → mismo pipeline
function mousePressed() {
  game.pointerPressed();
}

function mouseReleased() {
  return game.pointerReleased();
}

function mouseDragged() {
  game.pointerDragged();
}

function mouseOut() {
  // Si el cursor sale del canvas a mitad de un drag, cancelar y volver al origen.
  if (game) {
    game.pointerCancel();
  }
}

function touchStarted() {
  game.pointerPressed();
  return false;
}

function touchEnded() {
  game.pointerReleased();
  return false;
}

function touchMoved() {
  game.pointerDragged();
  return false;
}

/**
 * Atajos de teclado (desarrollo / operador):
 * F / ESC → pantalla completa
 * R → reiniciar todo
 */
function keyPressed() {
  if (game) {
    game.handleKey(key, keyCode);
  }
  // Evita scroll u otros defaults del navegador con algunas teclas.
  return false;
}
