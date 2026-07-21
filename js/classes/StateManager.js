/**
 * StateManager
 * Máquina de estados con transiciones animadas (overlay de fundido).
 *
 * Flujo:
 *   INTRO → (transición) → PLAY → (transición) → END → (transición) → INTRO
 *
 * No oculta elementos: cada estado anima su propia entrada/salida;
 * el fundido cubre el cambio limpio entre pantallas.
 */
class StateManager {
  /**
   * @param {Game} game
   */
  constructor(game) {
    this.game = game;

    /** @type {Map<string, BaseState>} */
    this.states = new Map();

    /** @type {BaseState|null} */
    this.current = null;

    /** @type {string|null} */
    this.currentId = null;

    /** Fases de transición entre estados. */
    this.phase = 'idle'; // idle | fadeOut | fadeIn
    this.transitionAlpha = 0;
    this.transitionDuration = 0.45;
    this._transitionElapsed = 0;
    this._pendingStateId = null;
    this._onTransitionMidpoint = null;
  }

  /**
   * Registra un estado.
   * @param {string} id
   * @param {BaseState} state
   */
  register(id, state) {
    this.states.set(id, state);
  }

  /**
   * Arranca la máquina en un estado sin transición (arranque del juego).
   * @param {string} id
   */
  start(id) {
    const state = this.states.get(id);
    if (!state) {
      console.error(`[StateManager] Estado desconocido: ${id}`);
      return;
    }
    this.current = state;
    this.currentId = id;
    this.phase = 'idle';
    this.transitionAlpha = 0;
    this.current.enter();
  }

  /**
   * Solicita cambio de estado con transición animada.
   * El estado actual debe haber terminado (o no necesitar) su animación de salida.
   *
   * @param {string} nextId
   * @param {{ duration?: number, onMidpoint?: function }} [options]
   */
  changeTo(nextId, options = {}) {
    if (!this.states.has(nextId)) {
      console.error(`[StateManager] Estado desconocido: ${nextId}`);
      return;
    }
    if (this.phase !== 'idle') {
      console.warn('[StateManager] Ya hay una transición en curso.');
      return;
    }

    this._pendingStateId = nextId;
    this.transitionDuration = options.duration || 0.45;
    this._onTransitionMidpoint = options.onMidpoint || null;
    this._transitionElapsed = 0;
    this.phase = 'fadeOut';
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    if (this.phase === 'idle') {
      if (this.current) {
        this.current.update(dt);
      }
      return;
    }

    this._transitionElapsed += dt;
    const t = Math.min(1, this._transitionElapsed / this.transitionDuration);

    if (this.phase === 'fadeOut') {
      this.transitionAlpha = Easing.easeInOutQuad(t);
      // Durante el fade-out el estado actual puede seguir dibujándose;
      // opcionalmente actualizarlo permite animaciones de salida concurrentes.
      if (this.current) {
        this.current.update(dt);
      }

      if (t >= 1) {
        this._swapState();
        this.phase = 'fadeIn';
        this._transitionElapsed = 0;
      }
      return;
    }

    if (this.phase === 'fadeIn') {
      this.transitionAlpha = 1 - Easing.easeInOutQuad(t);
      if (this.current) {
        this.current.update(dt);
      }
      if (t >= 1) {
        this.transitionAlpha = 0;
        this.phase = 'idle';
        this._pendingStateId = null;
      }
    }
  }

  /**
   * Dibuja el estado actual y el overlay de transición.
   */
  draw() {
    if (this.current) {
      this.current.draw();
    }
    this._drawTransitionOverlay();
  }

  /**
   * Reenvía input táctil/mouse al estado activo (si no hay transición bloqueante).
   * Durante fadeOut/fadeIn se bloquea input para evitar dobles acciones.
   */
  pointerPressed(x, y) {
    if (this.phase !== 'idle' || !this.current) {
      return;
    }
    if (typeof this.current.pointerPressed === 'function') {
      this.current.pointerPressed(x, y);
    }
  }

  pointerReleased(x, y) {
    if (!this.current) {
      return;
    }
    if (typeof this.current.pointerReleased === 'function') {
      this.current.pointerReleased(x, y);
    }
  }

  pointerDragged(x, y) {
    if (this.phase !== 'idle' || !this.current) {
      return;
    }
    if (typeof this.current.pointerDragged === 'function') {
      this.current.pointerDragged(x, y);
    }
  }

  /**
   * Cancela interacción en curso (p. ej. drag interrumpido al salir del canvas).
   */
  pointerCancel() {
    if (!this.current) {
      return;
    }
    if (typeof this.current.pointerCancel === 'function') {
      this.current.pointerCancel();
    }
  }

  /**
   * @returns {boolean}
   */
  get isTransitioning() {
    return this.phase !== 'idle';
  }

  // ---------------------------------------------------------------------------

  _swapState() {
    if (this.current) {
      this.current.exit();
    }

    if (this._onTransitionMidpoint) {
      this._onTransitionMidpoint();
      this._onTransitionMidpoint = null;
    }

    const next = this.states.get(this._pendingStateId);
    this.current = next;
    this.currentId = this._pendingStateId;
    this.current.enter();
  }

  _drawTransitionOverlay() {
    if (this.transitionAlpha <= 0.001) {
      return;
    }
    push();
    noStroke();
    fill(10, 10, 14, this.transitionAlpha * 255);
    rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    pop();
  }
}
