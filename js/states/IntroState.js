/**
 * IntroState
 * Pantalla de inicio (vertical 1080x1920):
 * logo, monstruo, decoración animada y botón JUGAR.
 * Todos los elementos entran con animaciones suaves.
 * Al pulsar JUGAR: sonido clic → animación de salida → transición a PLAY.
 */
class IntroState extends BaseState {
  constructor(game) {
    super(game);

    /**
     * Logo — AJUSTAR AQUÍ (estos valores sí se usan al entrar).
     * restY / restScale = posición y tamaño finales en pantalla.
     * width = ancho de dibujo en px (la altura respeta el PNG).
     */
    this.logoRestX = DESIGN_WIDTH / 2;
    this.logoRestY = 140;
    this.logoRestScale = 0.75;
    this.logoWidth = 900;

    this.logo = {
      x: this.logoRestX,
      y: this.logoRestY,
      scale: this.logoRestScale,
      alpha: 0,
      rotation: 0,
      visible: true,
    };

    this.decorItems = [];
    this.monster = null;
    this.playButton = null;

    /** Evita doble tap mientras salimos. */
    this._exiting = false;

    /**
     * Mesa tapa inferior (misma imagen que en Play).
     * offsetY: positivo = más abajo, negativo = más arriba.
     */
    this.mesaCoverOffsetY = 290;
    this.mesaCoverWidth = 1200;

    /** Claves de decoración disponibles (deco00–deco04). */
    this.decorKeys = [
      'decor_00',
      'decor_01',
      'decor_02',
      'decor_03',
      'decor_04',
    ];
  }

  enter() {
    this._exiting = false;
    this.game.tweens.killAll();

    // Monstruo centrado en la mitad superior/media
    this.monster = new Monster(this.game, DESIGN_WIDTH / 2, 900);
    this.monster.alpha = 0;
    this.monster.scale = 0.85;
    this.monster.setState(MONSTER_STATES.IDLE);

    // 4 decos en posiciones fijas, imágenes al azar sin repetir
    const slots = [
      { x: 80, y: 140, scale: 1.9 },
      { x: 970, y: 220, scale: 1.3 },
      { x: 120, y: 1290, scale: 2.2 },
      { x: 960, y: 1260, scale: 1.88 },
    ];
    const keys = this._pickUniqueDecorKeys(slots.length);
    this.decorItems = slots.map((slot, i) =>
      this._makeDecor(slot.x, slot.y, slot.scale, keys[i])
    );

    // Arranque de animación → termina en logoRest*
    this.logo.x = this.logoRestX;
    this.logo.alpha = 0;
    this.logo.y = this.logoRestY - 40;
    this.logo.scale = this.logoRestScale * 0.9;

    this.playButton = new Button({
      game: this.game,
      x: DESIGN_WIDTH / 2,
      y: 1680,
      w: 520,
      h: 345,
      label: 'JUGAR',
      imageKey: 'fondo_boton',
      onPress: () => this._onPlayPressed(),
    });
    this.playButton.alpha = 0;
    this.playButton.y = 1780;
    this.playButton.enabled = false;

    this._playEnterAnimations();
  }

  update(dt) {
    if (this.monster) {
      this.monster.update(dt);
    }
  }

  draw() {
    this._drawBackground();

    for (const decor of this.decorItems) {
      this._drawDecor(decor);
    }

    // Logo
    push();
    translate(this.logo.x, this.logo.y);
    scale(this.logo.scale);
    drawingContext.globalAlpha = this.logo.alpha;
    const logoImg = this.game.assets.getImage('logo');
    imageMode(CENTER);
    if (logoImg && logoImg.width > 1) {
      // Proporción nativa del PNG (evita deformar).
      const logoW = this.logoWidth;
      const logoH = logoW * (logoImg.height / logoImg.width);
      image(logoImg, 0, 0, logoW, logoH);
    } else {
      const font = this.game.assets.getFont('main');
      if (font) {
        textFont(font);
      }
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(40);
      text('El desayuno no se', 0, -28);
      textSize(46);
      text('toma vacaciones', 0, 32);
    }
    pop();

    if (this.monster) {
      this.monster.draw();
    }

    // Mesa tapa (misma que Play). Ajustá mesaCoverOffsetY en el constructor.
    this.game.drawMesa({ offsetY: this.mesaCoverOffsetY, w: this.mesaCoverWidth });

    // Botón siempre al frente.
    if (this.playButton) {
      this.playButton.draw();
    }
  }

  exit() {
    this.playButton = null;
    this.monster = null;
    this.decorItems = [];
  }

  pointerPressed(x, y) {
    if (this._exiting || !this.playButton) {
      return;
    }
    this.playButton.pointerPressed(x, y);
  }

  pointerReleased(x, y) {
    if (this._exiting || !this.playButton) {
      return;
    }
    this.playButton.pointerReleased(x, y);
  }

  // ---------------------------------------------------------------------------

  /**
   * Elige N claves de decoración al azar sin repetir.
   * @param {number} count
   * @returns {string[]}
   */
  _pickUniqueDecorKeys(count) {
    const pool = this.decorKeys.slice();
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    return pool.slice(0, Math.min(count, pool.length));
  }

  _makeDecor(x, y, scale, imageKey) {
    return {
      x,
      y,
      scale,
      alpha: 0,
      rotation: 0,
      imageKey,
      floatPhase: Math.random() * Math.PI * 2,
      baseY: y,
    };
  }

  _playEnterAnimations() {
    const tw = this.game.tweens;

    tw.animate(
      this.logo,
      { alpha: 1, y: this.logoRestY, scale: this.logoRestScale },
      0.55,
      {
        easing: Easing.easeOutBack,
        delay: 0.05,
      }
    );

    tw.animate(this.monster, { alpha: 1, scale: 1 }, 0.6, {
      easing: Easing.easeOutBack,
      delay: 0.15,
    });

    this.decorItems.forEach((decor, i) => {
      tw.animate(decor, { alpha: 1 }, 0.45, {
        easing: Easing.easeOutQuad,
        delay: 0.2 + i * 0.08,
      });
    });

    tw.animate(this.playButton, { alpha: 1, y: 1680 }, 0.5, {
      easing: Easing.easeOutBack,
      delay: 0.35,
      onComplete: () => {
        this.playButton.enabled = true;
      },
    });
  }

  _onPlayPressed() {
    if (this._exiting) {
      return;
    }
    this._exiting = true;
    this.playButton.enabled = false;

    this.game.audio.unlock();
    this.game.audio.play(AUDIO_KEYS.CLIC);

    this._playExitAnimations(() => {
      this.game.resetRun();
      this.game.stateManager.changeTo(STATES.PLAY);
    });
  }

  _playExitAnimations(onComplete) {
    const tw = this.game.tweens;
    let pending = 3 + this.decorItems.length;
    const done = () => {
      pending -= 1;
      if (pending <= 0 && onComplete) {
        onComplete();
      }
    };

    tw.animate(
      this.logo,
      { alpha: 0, y: this.logoRestY - 50, scale: this.logoRestScale * 0.9 },
      0.35,
      {
        easing: Easing.easeInOutQuad,
        onComplete: done,
      }
    );

    tw.animate(this.monster, { alpha: 0, scale: 0.85 }, 0.35, {
      easing: Easing.easeInOutQuad,
      delay: 0.05,
      onComplete: done,
    });

    tw.animate(this.playButton, { alpha: 0, y: 1780 }, 0.3, {
      easing: Easing.easeInOutQuad,
      onComplete: done,
    });

    this.decorItems.forEach((decor, i) => {
      tw.animate(decor, { alpha: 0, scale: decor.scale * 0.6 }, 0.28, {
        easing: Easing.easeInOutQuad,
        delay: i * 0.04,
        onComplete: done,
      });
    });
  }

  _drawBackground() {
    this.game.drawBackground();
  }

  _drawDecor(decor) {
    if (decor.alpha <= 0.01) {
      return;
    }
    const bob = Math.sin(millis() * 0.002 + decor.floatPhase) * 10;
    push();
    translate(decor.x, decor.baseY + bob);
    rotate(decor.rotation + Math.sin(millis() * 0.001 + decor.floatPhase) * 0.15);
    scale(decor.scale);
    drawingContext.globalAlpha = decor.alpha;
    const img = this.game.assets.getImage(decor.imageKey);
    imageMode(CENTER);
    if (img && img.width > 1) {
      const size = 170;
      const h = size * (img.height / img.width);
      image(img, 0, 0, size, h);
    } else {
      noStroke();
      fill(255, 220, 100);
      star(0, 0, 18, 42, 5);
    }
    drawingContext.globalAlpha = 1;
    pop();
  }
}

/**
 * Dibuja una estrella simple (decoración fallback).
 */
function star(x, y, radius1, radius2, npoints) {
  const angle = TWO_PI / npoints;
  const halfAngle = angle / 2;
  beginShape();
  for (let a = -HALF_PI; a < TWO_PI - HALF_PI; a += angle) {
    vertex(x + cos(a) * radius2, y + sin(a) * radius2);
    vertex(x + cos(a + halfAngle) * radius1, y + sin(a + halfAngle) * radius1);
  }
  endShape(CLOSE);
}
