/**
 * PlayState
 * Mecánica principal (vertical 1080x1920): alimentar al monstruo.
 *
 * Layout:
 *   - Monstruo arriba
 *   - Mesa + 4 alimentos alineados abajo (siempre visibles durante la ronda)
 *
 * Cada ronda: exactamente 4 alimentos, 1 elección, 20 segundos.
 */
class PlayState extends BaseState {
  constructor(game) {
    super(game);

    this.monster = null;
    /** @type {Food[]} */
    this.foods = [];
    /** @type {Food|null} */
    this.activeFood = null;

    this.roundIndex = 0;
    this.roundTimeLeft = ROUND_DURATION_SEC;
    this.roundLocked = false;

    /** Posiciones fijas de la fila de alimentos (ancho 1080). */
    this.foodSlots = [
      { x: 135, y: 1680 },
      { x: 405, y: 1680 },
      { x: 675, y: 1680 },
      { x: 945, y: 1680 },
    ];

    /**
     * Mesa (mismos valores que Intro / End).
     * offsetY: positivo = más abajo; width: ancho de dibujo.
     */
    this.mesaCoverOffsetY = 90;
    this.mesaCoverWidth = 1200;

    /**
     * Mesa de la zona de comidas (animable).
     * y = centro vertical; al entrar sube desde más abajo.
     */
    this.mesa = {
      x: DESIGN_WIDTH / 2,
      y: DESIGN_HEIGHT + 200,
      w: 1200,
      h: 420,
      alpha: 1,
      restY: 0,
    };
  }

  enter() {
    this.game.tweens.killAll();
    this.roundIndex = 0;
    this.roundLocked = false;
    this.activeFood = null;

    this._setupMesa();

    this.monster = new Monster(this.game, DESIGN_WIDTH / 2, 820);
    this.monster.alpha = 0;
    this.monster.scale = 0.85;
    this.monster.setState(MONSTER_STATES.IDLE);

    this.game.tweens.animate(this.monster, { alpha: 1, scale: 1 }, 0.5, {
      easing: Easing.easeOutBack,
    });

    // Mesa entra desde abajo hacia su posición de reposo.
    this.game.tweens.animate(this.mesa, { y: this.mesa.restY }, 0.55, {
      easing: Easing.easeOutQuad,
    });

    this._startRound();
  }

  update(dt) {
    if (this.monster) {
      this.monster.update(dt);
    }

    if (this.roundLocked) {
      return;
    }

    this.roundTimeLeft -= dt;
    if (this.roundTimeLeft <= 0) {
      this.roundTimeLeft = 0;
      this._onRoundTimeout();
    }
  }

  draw() {
    this._drawBackground();
    this._drawHud();

    if (this.monster) {
      this.monster.draw();
    }

    // Mesa por encima del monstruo; comidas encima de la mesa.
    this._drawMesa();

    for (const food of this.foods) {
      food.draw();
    }

    // El alimento arrastrado se redibuja encima
    if (this.activeFood && this.activeFood.dragging) {
      this.activeFood.draw();
    }

    // Labels fijos en el slot (no siguen el drag).
    for (const food of this.foods) {
      food.drawLabel();
    }
  }

  exit() {
    this.foods = [];
    this.activeFood = null;
    this.monster = null;
  }

  pointerPressed(x, y) {
    if (this.roundLocked) {
      return;
    }
    for (let i = this.foods.length - 1; i >= 0; i -= 1) {
      const food = this.foods[i];
      if (food.pointerPressed(x, y)) {
        this.activeFood = food;
        this.monster.expectFood();
        return;
      }
    }
  }

  pointerDragged(x, y) {
    if (this.activeFood) {
      this.activeFood.pointerDragged(x, y);
    }
  }

  pointerReleased(x, y) {
    if (!this.activeFood) {
      return;
    }
    const food = this.activeFood;
    const wasDragging = food.pointerReleased();
    this.activeFood = null;

    if (!wasDragging || this.roundLocked || food.accepted) {
      return;
    }

    // Al soltar tras arrastrar: siempre come (vuela a la boca).
    this._acceptFood(food);
  }

  /**
   * Si el pointer se pierde (sale del canvas / cancelación), vuelve al origen.
   */
  pointerCancel() {
    if (!this.activeFood || this.roundLocked || this.activeFood.accepted) {
      this.activeFood = null;
      return;
    }
    const food = this.activeFood;
    food.pointerReleased();
    this.activeFood = null;
    this.monster.stopExpectingFood();
    food.returnToOrigin();
  }

  // ---------------------------------------------------------------------------

  _setupMesa() {
    const img = this.game.assets.getImage('mesa');
    this.mesa.w = this.mesaCoverWidth;
    if (img && img.width > 1) {
      this.mesa.h = this.mesa.w * (img.height / img.width);
    } else {
      this.mesa.h = 420;
    }

    // Misma fórmula que Intro/End: borde inferior + offsetY.
    this.mesa.restY =
      DESIGN_HEIGHT - this.mesa.h / 2 + this.mesaCoverOffsetY;
    // Arranca un poco más abajo para la animación de entrada.
    this.mesa.y = this.mesa.restY + 120;
    this.mesa.alpha = 1;
  }

  _drawMesa() {
    if (!this.mesa || this.mesa.alpha <= 0.01) {
      return;
    }
    this.game.drawMesa({
      x: this.mesa.x,
      y: this.mesa.y,
      w: this.mesa.w,
      h: this.mesa.h,
      alpha: this.mesa.alpha,
    });
  }

  _startRound() {
    this.roundLocked = false;
    this.roundTimeLeft = ROUND_DURATION_SEC;
    this.activeFood = null;
    this.foods = [];

    const selection = this._pickRoundFoods();
    selection.forEach((def, i) => {
      const slot = this.foodSlots[i];
      const food = new Food({
        game: this.game,
        file: def.file,
        label: def.label,
        healthyLevel: def.healthyLevel,
        x: slot.x,
        y: slot.y + 80,
      });
      food.setOrigin(slot.x, slot.y);
      food.alpha = 0;
      food.scale = 0.6;
      this.foods.push(food);

      this.game.tweens.animate(food, { alpha: 1, y: slot.y, scale: 1 }, 0.4, {
        easing: Easing.easeOutBack,
        delay: 0.05 * i,
      });
    });
  }

  /**
   * Elige 4 alimentos distintos del catálogo.
   * @returns {object[]}
   */
  _pickRoundFoods() {
    const pool = FOOD_CATALOG.slice();
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    return pool.slice(0, 4);
  }

  _acceptFood(food) {
    this.roundLocked = true;
    const mouth = this.monster.getMouthPosition();

    for (const other of this.foods) {
      if (other !== food) {
        other.fadeOut();
      }
    }

    food.flyToMouth(mouth.x, mouth.y, () => {
      this.game.healthyTotal += food.healthyLevel;

      if (food.healthyLevel > 0) {
        this.game.audio.play(AUDIO_KEYS.COMER_CONTENTO);
      } else {
        this.game.audio.play(AUDIO_KEYS.COMER_DISGUSTO);
      }

      this.monster.reactToFood(food.healthyLevel, () => {
        this._advanceAfterRound();
      });
    });
  }

  _onRoundTimeout() {
    if (this.roundLocked) {
      return;
    }
    this.roundLocked = true;

    for (const food of this.foods) {
      food.fadeOut();
    }

    this.monster.showSad(() => {
      this._advanceAfterRound();
    });
  }

  _advanceAfterRound() {
    this.roundIndex += 1;
    if (this.roundIndex >= NUM_ROUNDS) {
      this.game.stateManager.changeTo(STATES.END);
      return;
    }
    this._startRound();
  }

  _drawBackground() {
    this.game.drawBackground();
  }

  _drawHud() {
    const font = this.game.assets.getFont('main');
    if (font) {
      textFont(font);
    }
    fill(255);
    textAlign(LEFT, TOP);
    textSize(32);
    text(`RONDA ${this.roundIndex + 1}/${NUM_ROUNDS}`, 36, 34);

    textAlign(RIGHT, TOP);
    text(`PUNTOS: ${this.game.healthyTotal}`, DESIGN_WIDTH - 36, 34);

    // Barra de tiempo
    const barW = 520;
    const barH = 18;
    const barX = DESIGN_WIDTH / 2 - barW / 2;
    const barY = 42;
    const ratio = constrain(this.roundTimeLeft / ROUND_DURATION_SEC, 0, 1);

    noStroke();
    fill(0, 0, 0, 80);
    rect(barX, barY, barW, barH, 9);
    fill(255, 210, 80);
    rect(barX, barY, barW * ratio, barH, 9);
  }
}
