/**
 * PlayState
 * Mecánica principal (vertical 1080x1920): alimentar al monstruo.
 *
 * Layout:
 *   - Monstruo arriba
 *   - 4 alimentos alineados abajo (siempre visibles durante la ronda)
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
  }

  enter() {
    this.game.tweens.killAll();
    this.roundIndex = 0;
    this.roundLocked = false;
    this.activeFood = null;

    this.monster = new Monster(this.game, DESIGN_WIDTH / 2, 820);
    this.monster.alpha = 0;
    this.monster.scale = 0.85;
    this.monster.setState(MONSTER_STATES.IDLE);

    this.game.tweens.animate(this.monster, { alpha: 1, scale: 1 }, 0.5, {
      easing: Easing.easeOutBack,
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

    // Separador visual zona comida
    stroke(255, 255, 255, 80);
    strokeWeight(2);
    line(80, 1380, DESIGN_WIDTH - 80, 1380);
    noStroke();

    for (const food of this.foods) {
      food.draw();
    }

    // El alimento arrastrado se redibuja encima
    if (this.activeFood && this.activeFood.dragging) {
      this.activeFood.draw();
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

    const mouth = this.monster.getMouthPosition();
    const radius = this.monster.getMouthAcceptRadius();
    const dist = Math.hypot(food.x - mouth.x, food.y - mouth.y);

    if (dist <= radius) {
      // Sigue con boca abierta hasta que llega la comida y mastica.
      this._acceptFood(food);
    } else {
      this.monster.stopExpectingFood();
      food.returnToOrigin();
    }
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
        id: def.id,
        name: def.name,
        healthyLevel: def.healthyLevel,
        imageKey: def.imageKey,
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
    textSize(26);
    text(`Ronda ${this.roundIndex + 1}/${NUM_ROUNDS}`, 36, 36);

    textAlign(RIGHT, TOP);
    text(`Puntos: ${this.game.healthyTotal}`, DESIGN_WIDTH - 36, 36);

    // Barra de tiempo
    const barW = 520;
    const barH = 18;
    const barX = DESIGN_WIDTH / 2 - barW / 2;
    const barY = 90;
    const ratio = constrain(this.roundTimeLeft / ROUND_DURATION_SEC, 0, 1);

    noStroke();
    fill(0, 0, 0, 80);
    rect(barX, barY, barW, barH, 9);
    fill(255, 210, 80);
    rect(barX, barY, barW * ratio, barH, 9);
  }
}
