/**
 * Food
 * Alimento arrastrable. Usa healthyLevel (entero), nunca booleanos healthy/unhealthy.
 * Datos nutricionales: solo desde FOOD_CATALOG (js/data/FoodCatalog.js).
 */
class Food {
  /**
   * @param {object} config
   * @param {Game} config.game
   * @param {string} config.file Nombre de archivo en assets/images/food/
   * @param {string} config.label
   * @param {number} config.healthyLevel
   * @param {number} config.x
   * @param {number} config.y
   */
  constructor(config) {
    this.game = config.game;
    this.file = config.file;
    this.label = config.label;

    /** Nivel nutricional entero (puede ser negativo). */
    this.healthyLevel = config.healthyLevel;

    /** Posición actual (animable / arrastrable). */
    this.x = config.x;
    this.y = config.y;

    /** Posición de origen para volver si se suelta lejos de la boca. */
    this.originPosition = { x: config.x, y: config.y };

    this.dragging = false;
    this.accepted = false;

    // Propiedades animables
    this.scale = 1;
    this.alpha = 1;
    this.rotation = 0;
    this.visible = true;

    /** Tamaño visual: un cuarto del ancho de diseño (4 comidas en fila). */
    this.size = DESIGN_WIDTH / 4;

    /** Offset del dedo respecto al centro al iniciar drag. */
    this._grabOffsetX = 0;
    this._grabOffsetY = 0;
  }

  /**
   * Restablece posición de origen (p. ej. al iniciar una ronda).
   * @param {number} x
   * @param {number} y
   */
  setOrigin(x, y) {
    this.originPosition.x = x;
    this.originPosition.y = y;
    this.x = x;
    this.y = y;
  }

  /**
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  contains(px, py) {
    const half = (this.size * this.scale) / 2;
    return (
      px >= this.x - half &&
      px <= this.x + half &&
      py >= this.y - half &&
      py <= this.y + half
    );
  }

  /**
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  pointerPressed(px, py) {
    if (!this.visible || this.accepted || this.dragging) {
      return false;
    }
    if (!this.contains(px, py)) {
      return false;
    }
    this.dragging = true;
    this._grabOffsetX = this.x - px;
    this._grabOffsetY = this.y - py;
    this.game.tweens.killTweensOf(this);
    this.game.tweens.animate(this, { scale: 1.08 }, 0.12, {
      easing: Easing.easeOutQuad,
    });
    return true;
  }

  /**
   * @param {number} px
   * @param {number} py
   */
  pointerDragged(px, py) {
    if (!this.dragging) {
      return;
    }
    this.x = px + this._grabOffsetX;
    this.y = py + this._grabOffsetY;
  }

  /**
   * Finaliza el arrastre. La lógica de “cerca de la boca” la decide PlayState.
   * @returns {boolean} true si estaba siendo arrastrado
   */
  pointerReleased() {
    if (!this.dragging) {
      return false;
    }
    this.dragging = false;
    return true;
  }

  /**
   * Vuelve suavemente a la posición de origen.
   * @param {function} [onComplete]
   */
  returnToOrigin(onComplete) {
    this.game.tweens.killTweensOf(this);
    this.game.tweens.animate(
      this,
      {
        x: this.originPosition.x,
        y: this.originPosition.y,
        scale: 1,
        rotation: 0,
      },
      0.35,
      {
        easing: Easing.easeOutBack,
        onComplete: onComplete || null,
      }
    );
  }

  /**
   * Vuela hacia un punto (boca del monstruo) y luego se marca aceptado.
   * @param {number} targetX
   * @param {number} targetY
   * @param {function} [onComplete]
   */
  flyToMouth(targetX, targetY, onComplete) {
    this.accepted = true;
    this.dragging = false;
    this.game.tweens.killTweensOf(this);
    this.game.tweens.animate(
      this,
      {
        x: targetX,
        y: targetY,
        scale: 0.35,
        alpha: 0,
      },
      0.4,
      {
        easing: Easing.easeInOutQuad,
        onComplete: () => {
          this.visible = false;
          if (onComplete) {
            onComplete(this);
          }
        },
      }
    );
  }

  /**
   * Desaparece suavemente (alimentos no elegidos al cerrar ronda).
   * @param {function} [onComplete]
   */
  fadeOut(onComplete) {
    this.game.tweens.killTweensOf(this);
    this.game.tweens.animate(this, { alpha: 0, scale: 0.7 }, 0.3, {
      easing: Easing.easeInOutQuad,
      onComplete: () => {
        this.visible = false;
        if (onComplete) {
          onComplete(this);
        }
      },
    });
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

    const img = this.game.assets.getFoodImage(this.file);
    imageMode(CENTER);
    if (img && img.width) {
      image(img, 0, 0, this.size, this.size);
    } else {
      noStroke();
      fill(240, 200, 90);
      circle(0, 0, this.size);
      fill(40);
      textAlign(CENTER, CENTER);
      textSize(18);
      text(this.label, 0, 0);
    }

    pop();
  }

  /**
   * Label fijo en el slot de origen (no sigue el drag).
   * Caja centrada, mayúsculas, blanco con sombra; ancho ≤ columna.
   */
  drawLabel() {
    if (!this.visible || this.accepted || this.alpha <= 0.01) {
      return;
    }

    const maxW = this.size * 0.9;
    const cx = this.originPosition.x;
    const anchorY = this.originPosition.y + this.size * 0.42;

    push();
    drawingContext.globalAlpha = this.alpha;
    noTint();
    blendMode(BLEND);

    const font = this.game.assets.getFont('main');
    if (font) {
      textFont(font);
    }

    let size = 22;
    textSize(size);
    const raw = String(this.label || '').toUpperCase();
    while (size > 14 && textWidth(raw) > maxW - 16) {
      size -= 1;
      textSize(size);
    }

    const lines = this._wrapLabelLines(raw, maxW - 16);
    const lineH = size * 1.2;
    const padX = 14;
    const padY = 10;
    let contentW = 0;
    for (const line of lines) {
      contentW = Math.max(contentW, textWidth(line));
    }
    const boxW = Math.min(maxW, contentW + padX * 2);
    const boxH = lines.length * lineH + padY * 2;
    const boxY = anchorY + boxH / 2;

    rectMode(CENTER);
    noStroke();
    fill(0, 0, 0, 140);
    rect(cx, boxY, boxW, boxH, 12);

    textAlign(CENTER, CENTER);
    for (let i = 0; i < lines.length; i += 1) {
      const ly = boxY - ((lines.length - 1) * lineH) / 2 + i * lineH;
      fill(0, 0, 0, 200);
      text(lines[i], cx + 2, ly + 3);
      fill(255);
      text(lines[i], cx, ly);
    }

    drawingContext.globalAlpha = 1;
    pop();
  }

  /**
   * Parte el label en hasta 2 líneas sin pasarse de maxW.
   * @param {string} raw
   * @param {number} maxW
   * @returns {string[]}
   */
  _wrapLabelLines(raw, maxW) {
    if (textWidth(raw) <= maxW) {
      return [raw];
    }
    const words = raw.split(/\s+/);
    if (words.length === 1) {
      return [raw];
    }
    let best = null;
    for (let i = 1; i < words.length; i += 1) {
      const a = words.slice(0, i).join(' ');
      const b = words.slice(i).join(' ');
      if (textWidth(a) <= maxW && textWidth(b) <= maxW) {
        best = [a, b];
      }
    }
    if (best) {
      return best;
    }
    // Fallback: mitad de palabras
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  }
}
