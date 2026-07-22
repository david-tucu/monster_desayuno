/**
 * Game
 * Orquestador principal. Posee managers, puntaje y el viewport 1080x1920.
 * sketch.js solo delega aquí.
 */
class Game {
  constructor() {
    this.assets = new AssetManager();
    this.audio = new AudioManager(this.assets);
    this.tweens = new TweenManager();
    this.stateManager = new StateManager(this);
    this.configOverlay = new ConfigOverlay(this);

    /** Suma acumulada de healthyLevel de los alimentos consumidos. */
    this.healthyTotal = 0;

    /**
     * Color del monstruo (original / fucsia / naranja).
     * Persiste entre Intro → Play → End y al volver a inicio.
     */
    this.monsterPalette = MONSTER_PALETTES.ORIGINAL;

    /** Escala y offsets para mapear pantalla real ↔ coordenadas de diseño. */
    this.viewScale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    this._lastMillis = 0;
    this._ready = false;
  }

  /**
   * Carga de assets. Llamar desde preload().
   */
  preload() {
    this.assets.loadAll();
  }

  /**
   * Inicialización tras preload. Llamar desde setup().
   */
  setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('game-root');

    // Placeholders de imágenes faltantes (createGraphics fiable aquí).
    this.assets.finalize();

    // En evento: abrir el navegador en modo kiosk/fullscreen (sin teclado).
    this._computeViewport();

    this.stateManager.register(STATES.INTRO, new IntroState(this));
    this.stateManager.register(STATES.PLAY, new PlayState(this));
    this.stateManager.register(STATES.END, new EndState(this));

    this._lastMillis = millis();
    this._ready = true;

    this.stateManager.start(STATES.INTRO);

    console.info(
      '[Game] Listo. Diseño',
      DESIGN_WIDTH,
      'x',
      DESIGN_HEIGHT,
      '| Rondas:',
      NUM_ROUNDS
    );
    if (this.assets.usedPlaceholders) {
      console.info(
        '[Game] Algunos assets faltan: se usan placeholders. Reemplazalos en /assets.'
      );
    }
  }

  /**
   * Frame principal.
   */
  draw() {
    if (!this._ready) {
      return;
    }

    const now = millis();
    let dt = (now - this._lastMillis) / 1000;
    this._lastMillis = now;
    // Clamp para evitar saltos al cambiar de pestaña
    dt = Math.min(dt, 0.05);

    this.tweens.update(dt);
    if (!this.configOverlay.visible) {
      this.stateManager.update(dt);
    }

    // Fondo letterbox
    background(15, 15, 18);

    push();
    translate(this.offsetX, this.offsetY);
    scale(this.viewScale);

    // Clip al área de diseño
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    drawingContext.clip();

    this.stateManager.draw();

    if (this.configOverlay) {
      this.configOverlay.draw();
    }

    drawingContext.restore();
    pop();
  }

  /**
   * Recalcula escala letterbox/pillarbox al redimensionar.
   */
  windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    this._computeViewport();
  }

  /**
   * Reinicia variables de una partida nueva.
   */
  resetRun() {
    this.healthyTotal = 0;
  }

  /**
   * Alterna pantalla completa (teclas F / ESC).
   */
  toggleFullscreen() {
    const goingFull = !fullscreen();
    fullscreen(goingFull);
    // Recalcular viewport tras el cambio (también dispara windowResized).
    setTimeout(() => {
      if (this._ready) {
        this.windowResized();
      }
    }, 50);
  }

  /**
   * Reinicia todo el juego: tweens, audio, puntaje y vuelve a INTRO (tecla R).
   */
  restart() {
    this.pointerCancel();
    this.tweens.killAll();
    this.audio.stopAllSfx();
    this.audio.stopBgm();
    this.resetRun();
    this.stateManager.forceStart(STATES.INTRO);
    console.info('[Game] Reinicio completo');
  }

  /**
   * Salta directo a la pantalla final con un healthyTotal dado (atajos de test).
   * @param {number} score
   */
  jumpToEndWithScore(score) {
    this.pointerCancel();
    this.tweens.killAll();
    this.audio.stopAllSfx();
    this.healthyTotal = score;
    this.stateManager.forceStart(STATES.END);
    console.info('[Game] Test END con healthyTotal =', score);
  }

  /**
   * Atajos de teclado (desarrollo / operador).
   * @param {string} k
   * @param {number} code
   */
  handleKey(k, code) {
    if (!this._ready) {
      return;
    }

    if (k === 'p' || k === 'P') {
      this.configOverlay.toggle();
      return;
    }

    if (this.configOverlay.visible) {
      this.configOverlay.handleKey(k, code);
      return;
    }

    if (k === 'f' || k === 'F') {
      this.toggleFullscreen();
      return;
    }
    if (code === ESCAPE) {
      this.toggleFullscreen();
      return;
    }
    if (k === 'r' || k === 'R') {
      this.restart();
      return;
    }

    // 1–5: saltar a END con cada rango de mensaje final
    // 1 negativo | 2 cero | 3 aceptable | 4 bueno | 5 campeón
    const testScores = {
      '1': -3,
      '2': 0,
      '3': 6,
      '4': 14,
      '5': 20,
    };
    if (testScores[k] !== undefined) {
      this.jumpToEndWithScore(testScores[k]);
    }
  }

  /**
   * Scroll del overlay de configuración.
   * @param {number} delta
   */
  handleWheel(delta) {
    if (this.configOverlay && this.configOverlay.visible) {
      this.configOverlay.handleWheel(delta);
    }
  }

  /**
   * Fondo compartido por todos los estados (Intro / Play / End).
   * Asset: assets/images/ui/fondo.png
   */
  drawBackground() {
    const fondo = this.assets.getImage('fondo');
    imageMode(CORNER);
    if (fondo && fondo.width > 1) {
      image(fondo, 0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      return;
    }
    // Fallback si aún no está el PNG
    background(255, 220, 180);
  }

  /**
   * Dibuja la mesa (assets/images/ui/mesa.png) a ancho completo.
   * Usada en Play, Intro y End.
   *
   * @param {{ x?: number, y?: number, w?: number, h?: number, alpha?: number, offsetY?: number }} [options]
   *   Si no pasás y: se alinea al borde inferior + offsetY.
   */
  drawMesa(options = {}) {
    const img = this.assets.getImage('mesa');
    const w = options.w !== undefined ? options.w : DESIGN_WIDTH;
    let h = options.h;
    if (h === undefined) {
      h = img && img.width > 1 ? w * (img.height / img.width) : 420;
    }
    const x = options.x !== undefined ? options.x : DESIGN_WIDTH / 2;
    const offsetY = options.offsetY !== undefined ? options.offsetY : 0;
    const y =
      options.y !== undefined ? options.y : DESIGN_HEIGHT - h / 2 + offsetY;
    const alpha = options.alpha !== undefined ? options.alpha : 1;

    if (alpha <= 0.01) {
      return { x, y, w, h };
    }

    push();
    drawingContext.globalAlpha = alpha;
    noTint();
    blendMode(BLEND);
    imageMode(CENTER);
    if (img && img.width > 1) {
      image(img, x, y, w, h);
    } else {
      // Fallback visible si el asset no cargó
      noStroke();
      fill(230, 170, 50);
      rectMode(CENTER);
      rect(x, y, w, h * 0.7, 40);
      console.warn('[Game] mesa.png no disponible — fallback');
    }
    drawingContext.globalAlpha = 1;
    pop();

    return { x, y, w, h };
  }

  /**
   * Atajo: mesa tapa inferior (Intro / End).
   * @param {{ offsetY?: number }} [options]
   */
  drawBaseCover(options = {}) {
    this.drawMesa({ offsetY: options.offsetY || 0 });
  }

  // ---------------------------------------------------------------------------
  // Input: touch y mouse comparten el mismo pipeline en coordenadas de diseño
  // ---------------------------------------------------------------------------

  pointerPressed() {
    this.audio.unlock();
    if (this.configOverlay && this.configOverlay.visible) {
      return;
    }
    const pos = this._pointerToDesign({ clamp: false });
    if (!pos) {
      return;
    }
    this.stateManager.pointerPressed(pos.x, pos.y);
  }

  pointerReleased() {
    if (this.configOverlay && this.configOverlay.visible) {
      return false;
    }
    // Siempre procesar el release (también fuera del área / letterbox).
    const pos = this._pointerToDesign({ clamp: true });
    this.stateManager.pointerReleased(pos.x, pos.y);
    return false;
  }

  pointerDragged() {
    if (this.configOverlay && this.configOverlay.visible) {
      return;
    }
    // Seguir el dedo/mouse aunque salga del rectángulo de diseño.
    const pos = this._pointerToDesign({ clamp: true });
    this.stateManager.pointerDragged(pos.x, pos.y);
  }

  /**
   * Cancela un arrastre en curso (mouse sale del canvas / pierde foco).
   */
  pointerCancel() {
    if (typeof this.stateManager.pointerCancel === 'function') {
      this.stateManager.pointerCancel();
    }
  }

  // ---------------------------------------------------------------------------

  _computeViewport() {
    const scaleX = width / DESIGN_WIDTH;
    const scaleY = height / DESIGN_HEIGHT;
    this.viewScale = Math.min(scaleX, scaleY);
    this.offsetX = (width - DESIGN_WIDTH * this.viewScale) / 2;
    this.offsetY = (height - DESIGN_HEIGHT * this.viewScale) / 2;
  }

  /**
   * Convierte mouse/touch de pantalla a coordenadas lógicas 1080x1920.
   * @param {{ clamp?: boolean }} [options]
   * @returns {{ x: number, y: number }|null}
   */
  _pointerToDesign(options = {}) {
    const clamp = options.clamp === true;
    const x = (mouseX - this.offsetX) / this.viewScale;
    const y = (mouseY - this.offsetY) / this.viewScale;

    if (clamp) {
      return {
        x: constrain(x, 0, DESIGN_WIDTH),
        y: constrain(y, 0, DESIGN_HEIGHT),
      };
    }

    if (x < 0 || y < 0 || x > DESIGN_WIDTH || y > DESIGN_HEIGHT) {
      return null;
    }
    return { x, y };
  }
}
