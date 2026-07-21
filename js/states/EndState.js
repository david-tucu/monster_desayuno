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
      w: 520,
      h: 130,
      label: 'VOLVER A INICIO',
      imageKey: 'btn_volver',
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

    push();
    drawingContext.globalAlpha = this.titleProps.alpha;
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(48);
    text(this.message.title, DESIGN_WIDTH / 2, this.titleProps.y);
    pop();

    push();
    drawingContext.globalAlpha = this.subtitleProps.alpha;
    fill(255, 255, 255, 230);
    textAlign(CENTER, CENTER);
    textSize(28);
    text(this.message.subtitle, DESIGN_WIDTH / 2, this.subtitleProps.y, 900);
    pop();

    push();
    drawingContext.globalAlpha = this.subtitleProps.alpha;
    fill(255, 230, 120);
    textAlign(CENTER, CENTER);
    textSize(32);
    text(`Puntaje saludable: ${this.game.healthyTotal}`, DESIGN_WIDTH / 2, 400);
    pop();

    if (this.monster) {
      this.monster.draw();
    }
    if (this.backButton) {
      this.backButton.draw();
    }
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
