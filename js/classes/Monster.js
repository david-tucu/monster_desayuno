/**
 * Monster
 * Capas PNG recortadas (distinto tamaño cada una) apiladas sobre el body.
 * Estados: IDLE, BLINK, HAPPY, NEUTRAL, FULL, SAD, EATING (con masticación).
 */
class Monster {
  /**
   * @param {Game} game
   * @param {number} x
   * @param {number} y
   */
  constructor(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;

    this.scale = 1;
    this.alpha = 1;
    this.rotation = 0;
    this.visible = true;

    /**
     * Tamaño del body.
     * displaySize = ancho dibujado en px de diseño.
     * Subí este valor si el body se ve chico (ej. 1180, 1250).
     * bodyOffsetY baja/sube el body (positivo = más abajo).
     */
    this.displaySize = DESIGN_WIDTH * 1.12;
    this.bodyOffsetY = 40;

    /**
     * Layout relativo al body.
     * faceOffsetY desplaza ojos/cejas/nariz/boca en píxeles de diseño (negativo = arriba).
     */
    this.layout = {
      faceOffsetY: -100,
      eyebrowsY: -0.11,
      eyebrowsW: 0.85,
      eyesY: -0.11,
      eyesW: 0.55,
      noseY: 0.04,
      noseW: 0.2,
      mouthY: 0.079,
      mouthW: 0.88,
    };

    this.state = MONSTER_STATES.IDLE;

    this._stateTimer = 0;
    this._blinkTimer = this._nextBlinkDelay();
    this._blinkPhase = 0;
    this._blinkPattern = [];
    this._chewFrame = 0;

    this._bodyDrawW = this.displaySize;
    this._bodyDrawH = this.displaySize;

    this._handlers = {
      [MONSTER_STATES.IDLE]: {
        update: (dt) => this._updateIdle(dt),
        mouthKey: 'monster_mouth_idle',
        eyesOpen: true,
      },
      [MONSTER_STATES.BLINK]: {
        update: (dt) => this._updateBlink(dt),
        mouthKey: 'monster_mouth_idle',
        eyesOpen: true,
      },
      [MONSTER_STATES.HAPPY]: {
        update: (dt) => this._updateTimedExpression(dt, 1.2),
        mouthKey: 'monster_mouth_happy',
        eyesOpen: true,
      },
      [MONSTER_STATES.NEUTRAL]: {
        update: (dt) => this._updateTimedExpression(dt, 1.2),
        mouthKey: 'monster_mouth_neutral',
        eyesOpen: true,
      },
      [MONSTER_STATES.FULL]: {
        update: (dt) => this._updateTimedExpression(dt, 1.4),
        mouthKey: 'monster_mouth_full',
        eyesOpen: true,
      },
      [MONSTER_STATES.SAD]: {
        update: (dt) => this._updateTimedExpression(dt, 1.4),
        mouthKey: 'monster_mouth_sad',
        eyesOpen: true,
      },
      [MONSTER_STATES.EATING]: {
        update: (dt) => this._updateEating(dt),
        mouthKey: 'monster_mouth_eat',
        eyesOpen: true,
      },
    };

    this._pendingReaction = null;
    this._onExpressionComplete = null;

    /** 'wait' = boca abierta esperando; 'chew' = masticando tras comer. */
    this._eatingMode = null;

    /** Si true, las expresiones temporizadas no vuelven a IDLE (pantalla final). */
    this._holdExpression = false;

    /** Segundos de movimiento permitidos en expresión hold (null = sin límite). */
    this._holdMotionDuration = null;

    /** Tiempo acumulado en la expresión hold actual. */
    this._holdElapsed = 0;

    /** Congela offsets de motion FX (mantiene boca/expresión). */
    this._motionFrozen = false;

    /** Tiempo global para oscilaciones continuas. */
    this._animTime = 0;

    /**
     * Offsets de animación (no pisan scale/rotation de tweens de entrada).
     * Se aplican solo en draw().
     */
    this._fx = { scale: 1, y: 0, rotation: 0 };

    /**
     * Paleta visual (sincronizada con game.monsterPalette).
     * Ciclo: original → fucsia → naranja → original.
     */
    this.palette = this.game.monsterPalette || MONSTER_PALETTES.ORIGINAL;
  }

  /**
   * Avanza al siguiente color del ciclo y lo guarda en Game.
   */
  togglePalette() {
    const cycle = MONSTER_PALETTE_CYCLE;
    const idx = cycle.indexOf(this.palette);
    const next = cycle[(idx < 0 ? 0 : idx + 1) % cycle.length];
    this.palette = next;
    this.game.monsterPalette = next;
  }

  /**
   * Hit-test de la zona de cara (ojos / nariz / boca).
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  containsFace(px, py) {
    const scaleMul = this.scale * this._fx.scale;
    const cx = this.x;
    const cy =
      this.y +
      this.bodyOffsetY +
      this._fx.y +
      this.layout.faceOffsetY * scaleMul +
      this._bodyDrawH * 0.02 * scaleMul;
    const rx = this._bodyDrawW * 0.42 * scaleMul;
    const ry = this._bodyDrawH * 0.4 * scaleMul;
    if (rx <= 0 || ry <= 0) {
      return false;
    }
    const dx = (px - cx) / rx;
    const dy = (py - cy) / ry;
    return dx * dx + dy * dy <= 1;
  }

  /**
   * Punto de la boca (drop target) en coordenadas de diseño.
   * @returns {{ x: number, y: number }}
   */
  getMouthPosition() {
    const scaleMul = this.scale * this._fx.scale;
    return {
      x: this.x,
      y:
        this.y +
        this.bodyOffsetY +
        this._fx.y +
        (this._bodyDrawH * this.layout.mouthY + this.layout.faceOffsetY) *
          scaleMul,
    };
  }

  /**
   * @returns {number}
   */
  getMouthAcceptRadius() {
    return this._bodyDrawW * 0.22 * this.scale * this._fx.scale;
  }

  /**
   * @param {string} nextState
   * @param {{ hold?: boolean, motionDuration?: number|null }} [options]
   *   hold: mantener expresión (no volver a IDLE)
   *   motionDuration: en hold, segundos de movimiento antes de congelar (ej. HAPPY)
   */
  setState(nextState, options = {}) {
    if (!this._handlers[nextState]) {
      console.warn(`[Monster] Estado desconocido: ${nextState}`);
      return;
    }
    this.state = nextState;
    this._stateTimer = 0;
    this._chewFrame = 0;
    this._holdExpression = Boolean(options.hold);
    this._holdElapsed = 0;
    this._motionFrozen = false;
    this._holdMotionDuration =
      options.motionDuration !== undefined ? options.motionDuration : null;

    if (nextState === MONSTER_STATES.IDLE) {
      this._blinkTimer = this._nextBlinkDelay();
    }
  }

  /**
   * Boca abierta esperando comida (mientras el jugador arrastra).
   * Se mantiene hasta stopExpectingFood() o reactToFood().
   */
  expectFood() {
    this._pendingReaction = null;
    this._onExpressionComplete = null;
    this._eatingMode = 'wait';
    this.setState(MONSTER_STATES.EATING);
  }

  /**
   * Cierra la boca si estaba esperando (soltó lejos / canceló drag).
   */
  stopExpectingFood() {
    if (this.state === MONSTER_STATES.EATING && this._eatingMode === 'wait') {
      this._eatingMode = null;
      this.setState(MONSTER_STATES.IDLE);
    }
  }

  /**
   * EATING masticación → HAPPY (≥3), NEUTRAL (1–2) o FULL (≤0).
   * @param {number} healthyLevel
   * @param {function} [onComplete]
   */
  reactToFood(healthyLevel, onComplete) {
    this._onExpressionComplete = onComplete || null;
    if (healthyLevel >= 3) {
      this._pendingReaction = MONSTER_STATES.HAPPY;
    } else if (healthyLevel >= 1) {
      this._pendingReaction = MONSTER_STATES.NEUTRAL;
    } else {
      this._pendingReaction = MONSTER_STATES.FULL;
    }
    this._eatingMode = 'chew';
    this.setState(MONSTER_STATES.EATING);
  }

  /**
   * @param {function} [onComplete]
   */
  showSad(onComplete) {
    this._onExpressionComplete = onComplete || null;
    this._pendingReaction = null;
    this.setState(MONSTER_STATES.SAD);
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    this._animTime += dt;

    if (
      this._holdExpression &&
      this._holdMotionDuration != null &&
      !this._motionFrozen
    ) {
      this._holdElapsed += dt;
      if (this._holdElapsed >= this._holdMotionDuration) {
        this._motionFrozen = true;
        this._fx.scale = 1;
        this._fx.y = 0;
        this._fx.rotation = 0;
      }
    }

    const handler = this._handlers[this.state];
    if (handler && handler.update) {
      handler.update(dt);
    }
    this._updateMotionFx();
  }

  draw() {
    if (!this.visible || this.alpha <= 0.01) {
      return;
    }

    push();
    translate(this.x, this.y + this.bodyOffsetY + this._fx.y);
    rotate(this.rotation + this._fx.rotation);
    scale(this.scale * this._fx.scale);
    drawingContext.globalAlpha = this.alpha;
    imageMode(CENTER);
    this._applyPaletteFilter();

    this._drawBody();
    this._drawEyes();
    this._drawEyebrows();
    this._drawNose();
    this._drawMouth();

    drawingContext.filter = 'none';
    drawingContext.globalAlpha = 1;
    pop();
  }

  /**
   * Filtros CSS: viraje de verdes del PNG según paleta.
   */
  _applyPaletteFilter() {
    if (this.palette === MONSTER_PALETTES.FUCHSIA) {
      // Verde (~120°) → magenta/fucsia (~275°).
      drawingContext.filter = 'hue-rotate(155deg) saturate(1.35)';
    } else if (this.palette === MONSTER_PALETTES.ORANGE) {
      // Verde (~120°) → naranja (~25°).
      drawingContext.filter = 'hue-rotate(-95deg) saturate(1.4)';
    } else {
      drawingContext.filter = 'none';
    }
  }

  // ---------------------------------------------------------------------------
  // Updates
  // ---------------------------------------------------------------------------

  /**
   * Calcula oscilaciones visuales según estado.
   * - Idle: pulso sutil de escala
   * - Happy: bounce vertical + escala
   * - Full/error: rotación sutil
   */
  _updateMotionFx() {
    if (this._motionFrozen) {
      this._fx.scale = 1;
      this._fx.y = 0;
      this._fx.rotation = 0;
      return;
    }

    // Neutral (y disgusto sostenido en final): sin bounce ni meneo.
    if (
      this.state === MONSTER_STATES.NEUTRAL ||
      (this.state === MONSTER_STATES.FULL && this._holdExpression)
    ) {
      this._fx.scale = 1;
      this._fx.y = 0;
      this._fx.rotation = 0;
      return;
    }

    const pulse = 1 + Math.sin(this._animTime * 2.0) * 0.008;
    let scaleFx = pulse;
    let yFx = 0;
    let rotFx = 0;

    if (this.state === MONSTER_STATES.HAPPY) {
      // Bounce alegre: sube/baja y late un poco más
      const bounce = Math.sin(this._stateTimer * 11);
      yFx = bounce * -22;
      scaleFx = 1 + Math.abs(bounce) * 0.07;
    } else if (
      this.state === MONSTER_STATES.FULL ||
      this.state === MONSTER_STATES.SAD
    ) {
      // Error / disgusto / triste: meneo de rotación sutil
      rotFx = Math.sin(this._stateTimer * 14) * 0.06;
      scaleFx = pulse;
    } else if (
      this.state === MONSTER_STATES.EATING &&
      this._eatingMode === 'chew'
    ) {
      rotFx = Math.sin(this._stateTimer * 16) * 0.03;
      scaleFx = pulse;
    }

    this._fx.scale = scaleFx;
    this._fx.y = yFx;
    this._fx.rotation = rotFx;
  }

  _updateIdle(dt) {
    this._blinkTimer -= dt;
    if (this._blinkTimer <= 0) {
      this._startBlink();
    }
  }

  _startBlink() {
    const longPattern = Math.random() < 0.35;
    this._blinkPattern = longPattern
      ? [true, false, true, false, true]
      : [true, false, true];
    this._blinkPhase = 0;
    this.setState(MONSTER_STATES.BLINK);
  }

  _updateBlink(dt) {
    this._stateTimer += dt;
    if (this._stateTimer >= 0.07) {
      this._stateTimer = 0;
      this._blinkPhase += 1;
      if (this._blinkPhase >= this._blinkPattern.length) {
        this.setState(MONSTER_STATES.IDLE);
      }
    }
  }

  _updateTimedExpression(dt, duration) {
    this._stateTimer += dt;
    if (this._stateTimer >= duration) {
      if (this._holdExpression) {
        // Pantalla final: reinicia el ciclo (p. ej. bounce HAPPY) sin ir a IDLE.
        this._stateTimer = 0;
        return;
      }
      const cb = this._onExpressionComplete;
      this._onExpressionComplete = null;
      this.setState(MONSTER_STATES.IDLE);
      if (cb) {
        cb();
      }
    }
  }

  _updateEating(dt) {
    // Esperando comida: boca abierta fija, sin avanzar de estado.
    if (this._eatingMode === 'wait') {
      return;
    }

    this._stateTimer += dt;
    this._chewFrame = Math.floor(this._stateTimer / 0.12);

    // 0–0.22s boca abierta, luego masticar hasta ~0.95s
    if (this._stateTimer >= 0.95) {
      this._eatingMode = null;
      const next = this._pendingReaction || MONSTER_STATES.IDLE;
      this._pendingReaction = null;
      this.setState(next);
    }
  }

  _nextBlinkDelay() {
    return 3 + Math.random() * 2;
  }

  // ---------------------------------------------------------------------------
  // Dibujo por capas (preserva aspect ratio de cada PNG recortado)
  // ---------------------------------------------------------------------------

  _drawBody() {
    const img = this.game.assets.getImage('monster_body');
    if (!img || !img.width) {
      return;
    }
    this._bodyDrawW = this.displaySize;
    this._bodyDrawH = this.displaySize * (img.height / img.width);
    image(img, 0, 0, this._bodyDrawW, this._bodyDrawH);
  }

  /**
   * Dibuja un sprite recortado con ancho máximo y offset relativo al body.
   * @param {string} key
   * @param {number} widthFraction fracción de bodyW
   * @param {number} yFraction offset Y como fracción de bodyH
   */
  _drawFacePart(key, widthFraction, yFraction) {
    const img = this.game.assets.getImage(key);
    if (!img || !img.width) {
      return;
    }
    const w = this._bodyDrawW * widthFraction;
    const h = w * (img.height / img.width);
    const y = this._bodyDrawH * yFraction + this.layout.faceOffsetY;
    image(img, 0, y, w, h);
  }

  _drawEyes() {
    let eyesOpen = true;
    if (this.state === MONSTER_STATES.BLINK) {
      eyesOpen = Boolean(this._blinkPattern[this._blinkPhase]);
    } else {
      const handler = this._handlers[this.state];
      eyesOpen = handler ? handler.eyesOpen : true;
    }
    const key = eyesOpen ? 'monster_eyes_open' : 'monster_eyes_closed';
    this._drawFacePart(key, this.layout.eyesW, this.layout.eyesY);
  }

  _drawEyebrows() {
    // Triste o disgustado (FULL) → cejas sad; resto → neutral
    const sadBrows =
      this.state === MONSTER_STATES.SAD || this.state === MONSTER_STATES.FULL;
    const key = sadBrows
      ? 'monster_eyebrows_sad'
      : 'monster_eyebrows_neutral';
    this._drawFacePart(key, this.layout.eyebrowsW, this.layout.eyebrowsY);
  }

  _drawNose() {
    this._drawFacePart('monster_nose', this.layout.noseW, this.layout.noseY);
  }

  _drawMouth() {
    let key = 'monster_mouth_idle';

    if (this.state === MONSTER_STATES.EATING) {
      if (this._eatingMode === 'wait') {
        key = 'monster_mouth_eat';
      } else if (this._stateTimer < 0.22) {
        key = 'monster_mouth_eat';
      } else {
        key =
          this._chewFrame % 2 === 0
            ? 'monster_mouth_chew_1'
            : 'monster_mouth_chew_2';
      }
    } else {
      const handler = this._handlers[this.state];
      key = handler ? handler.mouthKey : key;
    }

    this._drawFacePart(key, this.layout.mouthW, this.layout.mouthY);
  }
}
