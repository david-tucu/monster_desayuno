/**
 * Button
 * Botón táctil reutilizable (JUGAR, VOLVER A INICIO, etc.).
 * Soporta imagen opcional o dibujo geométrico de respaldo.
 */
class Button {
  /**
   * @param {object} config
   * @param {Game} config.game
   * @param {number} config.x
   * @param {number} config.y
   * @param {number} [config.w]
   * @param {number} [config.h]
   * @param {string} config.label
   * @param {string} [config.imageKey]
   * @param {function} [config.onPress]
   */
  constructor(config) {
    this.game = config.game;
    this.x = config.x;
    this.y = config.y;
    this.w = config.w || 360;
    this.h = config.h || 110;
    this.label = config.label || '';
    this.imageKey = config.imageKey || null;
    this.onPress = config.onPress || null;

    // Propiedades animables por TweenManager
    this.scale = 1;
    this.alpha = 1;
    this.rotation = 0;
    this.visible = true;
    this.enabled = true;

    this._pressed = false;
  }

  /**
   * @param {number} px Coordenada lógica X
   * @param {number} py Coordenada lógica Y
   * @returns {boolean}
   */
  contains(px, py) {
    const halfW = (this.w * this.scale) / 2;
    const halfH = (this.h * this.scale) / 2;
    return (
      px >= this.x - halfW &&
      px <= this.x + halfW &&
      py >= this.y - halfH &&
      py <= this.y + halfH
    );
  }

  /**
   * @param {number} px
   * @param {number} py
   * @returns {boolean} true si el botón consumió el evento
   */
  pointerPressed(px, py) {
    if (!this.visible || !this.enabled) {
      return false;
    }
    if (!this.contains(px, py)) {
      return false;
    }
    this._pressed = true;
    this.game.tweens.killTweensOf(this);
    this.game.tweens.animate(this, { scale: 0.94 }, 0.08, {
      easing: Easing.easeOutQuad,
    });
    return true;
  }

  /**
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  pointerReleased(px, py) {
    if (!this._pressed) {
      return false;
    }
    this._pressed = false;
    this.game.tweens.killTweensOf(this);
    this.game.tweens.animate(this, { scale: 1 }, 0.15, {
      easing: Easing.easeOutBack,
    });

    if (this.visible && this.enabled && this.contains(px, py) && this.onPress) {
      this.onPress(this);
      return true;
    }
    return false;
  }

  draw() {
    if (!this.visible || this.alpha <= 0.01) {
      return;
    }

    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    scale(this.scale);
    drawingContext.globalAlpha = this.alpha;

    const img = this.imageKey ? this.game.assets.getImage(this.imageKey) : null;
    if (img && img.width) {
      imageMode(CENTER);
      image(img, 0, 0, this.w, this.h);
    } else {
      // Respaldo visual sin asset
      rectMode(CENTER);
      noStroke();
      fill(46, 168, 120);
      rect(0, 0, this.w, this.h, 24);
      fill(255);
      textAlign(CENTER, CENTER);
      const font = this.game.assets.getFont('main');
      if (font) {
        textFont(font);
      }
      textSize(36);
      text(this.label, 0, 2);
    }

    // Si hay imagen pero también label, se puede superponer texto:
    if (img && img.width && this.label) {
      fill(255);
      textAlign(CENTER, CENTER);
      const font = this.game.assets.getFont('main');
      if (font) {
        textFont(font);
      }
      textSize(34);
      text(this.label, 0, 2);
    }

    pop();
  }
}
