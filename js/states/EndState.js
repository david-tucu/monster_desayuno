/**
 * EndState
 * Pantalla final (vertical 1080x1920) tras NUM_ROUNDS.
 * Muestra mensaje según healthyTotal, monstruo y botón VOLVER A INICIO.
 */
class EndState extends BaseState {
  constructor(game) {
    super(game);

    this.monster = null;
    this.backButton = null;
    this.message = { title: '', subtitle: '' };
    this.titleProps = { alpha: 0, y: 200, scale: 1 };
    this.subtitleProps = { alpha: 0, y: 300 };
    this._leaving = false;

    /**
     * Mesa tapa inferior (misma imagen que en Play / Intro).
     * offsetY: positivo = más abajo; width: ancho de dibujo.
     */
    this.mesaCoverOffsetY = 290;
    this.mesaCoverWidth = 1200;
  }

  enter() {
    this._leaving = false;
    this.game.tweens.killAll();

    this.message = getFinalResultMessage(this.game.healthyTotal);

    this.monster = new Monster(this.game, DESIGN_WIDTH / 2, 980);
    this.monster.alpha = 0;
    this.monster.scale = 0.85;

    if (this.game.healthyTotal > 0) {
      this.monster.setState(MONSTER_STATES.HAPPY);
    } else if (this.game.healthyTotal < 0) {
      this.monster.setState(MONSTER_STATES.SAD);
    } else {
      this.monster.setState(MONSTER_STATES.IDLE);
    }

    this.titleProps.alpha = 0;
    this.titleProps.y = 150;
    this.subtitleProps.alpha = 0;
    this.subtitleProps.y = 270;

    this.backButton = new Button({
      game: this.game,
      x: DESIGN_WIDTH / 2,
      y: 1680,
      w: 560,
      h: 372,
      label: 'VOLVER A INICIO',
      imageKey: 'fondo_boton',
      onPress: () => this._onBackPressed(),
    });
    this.backButton.alpha = 0;
    this.backButton.y = 1780;
    this.backButton.enabled = false;

    this.game.audio.play(AUDIO_KEYS.FINAL);
    this._playEnterAnimations();
  }

  update(dt) {
    if (this.monster) {
      this.monster.update(dt);
    }
  }

  draw() {
    this._drawBackground();

    const font = this.game.assets.getFont('main');
    if (font) {
      textFont(font);
    }

    // Título
    this._drawTextWithShadow({
      text: this.message.title,
      x: DESIGN_WIDTH / 2,
      y: this.titleProps.y,
      size: 64,
      fill: [255, 255, 255],
      alpha: this.titleProps.alpha,
    });

    // Subtítulo centrado (caja de texto centrada en pantalla)
    this._drawTextWithShadow({
      text: this.message.subtitle,
      x: DESIGN_WIDTH / 2,
      y: this.subtitleProps.y,
      size: 34,
      fill: [255, 255, 255],
      alpha: this.subtitleProps.alpha,
      maxWidth: 920,
    });

    // Puntaje
    this._drawTextWithShadow({
      text: `Puntaje saludable: ${this.game.healthyTotal}`,
      x: DESIGN_WIDTH / 2,
      y: 400,
      size: 38,
      fill: [255, 230, 120],
      alpha: this.subtitleProps.alpha,
    });

    if (this.monster) {
      this.monster.draw();
    }

    // Mesa tapa (ajustá mesaCoverOffsetY / mesaCoverWidth en el constructor).
    this.game.drawMesa({
      offsetY: this.mesaCoverOffsetY,
      w: this.mesaCoverWidth,
    });

    if (this.backButton) {
      this.backButton.draw();
    }
  }

  /**
   * Texto centrado con sombra suave.
   * @param {object} opts
   */
  _drawTextWithShadow(opts) {
    const alpha = opts.alpha !== undefined ? opts.alpha : 1;
    if (alpha <= 0.01) {
      return;
    }

    const x = opts.x;
    const y = opts.y;
    const size = opts.size || 32;
    const [r, g, b] = opts.fill || [255, 255, 255];
    const maxWidth = opts.maxWidth || 0;
    const shadow = opts.shadow || { x: 3, y: 4, color: [0, 0, 0], alpha: 0.45 };

    push();
    textSize(size);

    if (maxWidth > 0) {
      // Caja centrada en x para que el wrap quede al centro de la pantalla
      const boxX = x - maxWidth / 2;
      const boxY = y;

      textAlign(CENTER, TOP);

      drawingContext.globalAlpha = alpha * shadow.alpha;
      fill(shadow.color[0], shadow.color[1], shadow.color[2]);
      text(opts.text, boxX + shadow.x, boxY + shadow.y, maxWidth);

      drawingContext.globalAlpha = alpha;
      fill(r, g, b);
      text(opts.text, boxX, boxY, maxWidth);
    } else {
      textAlign(CENTER, CENTER);

      drawingContext.globalAlpha = alpha * shadow.alpha;
      fill(shadow.color[0], shadow.color[1], shadow.color[2]);
      text(opts.text, x + shadow.x, y + shadow.y);

      drawingContext.globalAlpha = alpha;
      fill(r, g, b);
      text(opts.text, x, y);
    }

    drawingContext.globalAlpha = 1;
    pop();
  }

  exit() {
    this.monster = null;
    this.backButton = null;
  }

  pointerPressed(x, y) {
    if (this._leaving || !this.backButton) {
      return;
    }
    this.backButton.pointerPressed(x, y);
  }

  pointerReleased(x, y) {
    if (this._leaving || !this.backButton) {
      return;
    }
    this.backButton.pointerReleased(x, y);
  }

  // ---------------------------------------------------------------------------

  _playEnterAnimations() {
    const tw = this.game.tweens;

    tw.animate(this.titleProps, { alpha: 1, y: 200 }, 0.5, {
      easing: Easing.easeOutBack,
    });

    tw.animate(this.subtitleProps, { alpha: 1, y: 300 }, 0.45, {
      easing: Easing.easeOutQuad,
      delay: 0.12,
    });

    tw.animate(this.monster, { alpha: 1, scale: 1 }, 0.55, {
      easing: Easing.easeOutBack,
      delay: 0.1,
    });

    tw.animate(this.backButton, { alpha: 1, y: 1680 }, 0.45, {
      easing: Easing.easeOutBack,
      delay: 0.3,
      onComplete: () => {
        this.backButton.enabled = true;
      },
    });
  }

  _onBackPressed() {
    if (this._leaving) {
      return;
    }
    this._leaving = true;
    this.backButton.enabled = false;

    this.game.audio.play(AUDIO_KEYS.CLIC);

    const tw = this.game.tweens;
    let pending = 4;
    const done = () => {
      pending -= 1;
      if (pending <= 0) {
        this.game.stateManager.changeTo(STATES.INTRO);
      }
    };

    tw.animate(this.titleProps, { alpha: 0, y: 150 }, 0.3, {
      easing: Easing.easeInOutQuad,
      onComplete: done,
    });
    tw.animate(this.subtitleProps, { alpha: 0 }, 0.3, {
      easing: Easing.easeInOutQuad,
      onComplete: done,
    });
    tw.animate(this.monster, { alpha: 0, scale: 0.85 }, 0.35, {
      easing: Easing.easeInOutQuad,
      onComplete: done,
    });
    tw.animate(this.backButton, { alpha: 0, y: 1780 }, 0.3, {
      easing: Easing.easeInOutQuad,
      onComplete: done,
    });
  }

  _drawBackground() {
    this.game.drawBackground();
  }
}
