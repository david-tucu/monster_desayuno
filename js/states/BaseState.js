/**
 * BaseState
 * Contrato común de todos los estados de la máquina.
 * Cada estado implementa: enter / update / draw / exit.
 */
class BaseState {
  /**
   * @param {Game} game
   */
  constructor(game) {
    this.game = game;
  }

  /** Se llama al entrar al estado (tras el punto medio de la transición). */
  enter() {}

  /**
   * Lógica por frame.
   * @param {number} dt Delta time en segundos.
   */
  update(dt) {}

  /** Render del estado en coordenadas de diseño 1080x1920. */
  draw() {}

  /** Se llama al salir del estado (punto medio de la transición). */
  exit() {}

  /** Input opcional (coordenadas lógicas). */
  pointerPressed(x, y) {}
  pointerReleased(x, y) {}
  pointerDragged(x, y) {}
}
