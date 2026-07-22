/**
 * ConfigOverlay
 * Vista a pantalla completa (tecla P) con tablas de configuración:
 * alimentos (imagen / label / healthyLevel) y mensajes finales.
 */
class ConfigOverlay {
  /**
   * @param {Game} game
   */
  constructor(game) {
    this.game = game;
    this.visible = false;
    this.scrollY = 0;
    this._contentHeight = DESIGN_HEIGHT;
  }

  toggle() {
    this.visible = !this.visible;
    if (!this.visible) {
      this.scrollY = 0;
    }
  }

  /**
   * @param {string} k
   * @param {number} code
   * @returns {boolean} true si consumió la tecla
   */
  handleKey(k, code) {
    if (!this.visible) {
      return false;
    }
    if (code === UP_ARROW) {
      this.scrollBy(-80);
      return true;
    }
    if (code === DOWN_ARROW) {
      this.scrollBy(80);
      return true;
    }
    if (k === 'PageUp') {
      this.scrollBy(-400);
      return true;
    }
    if (k === 'PageDown') {
      this.scrollBy(400);
      return true;
    }
    return true; // bloquea otros atajos mientras está abierta
  }

  /**
   * @param {number} deltaY píxeles de rueda (positivo = bajar)
   */
  handleWheel(deltaY) {
    if (!this.visible) {
      return;
    }
    this.scrollBy(deltaY);
  }

  /**
   * @param {number} dy
   */
  scrollBy(dy) {
    const maxScroll = Math.max(0, this._contentHeight - DESIGN_HEIGHT);
    this.scrollY = Math.max(0, Math.min(maxScroll, this.scrollY + dy));
  }

  draw() {
    if (!this.visible) {
      return;
    }

    const font = this.game.assets.getFont('main');
    if (font) {
      textFont(font);
    }

    // Fondo opaco a pantalla completa (coords de diseño).
    noStroke();
    fill(18, 20, 28);
    rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    push();
    translate(0, -this.scrollY);

    let y = 48;

    // Título
    fill(255, 230, 120);
    textAlign(CENTER, TOP);
    textSize(42);
    text('CONFIGURACION', DESIGN_WIDTH / 2, y);
    y += 52;

    fill(200, 200, 210);
    textSize(22);
    text('Tecla P para cerrar', DESIGN_WIDTH / 2, y);
    y += 56;

    y = this._drawFoodTable(y);
    y += 48;
    y = this._drawMessagesTable(y);
    y += 80;

    this._contentHeight = y;
    pop();

    // Fade superior / inferior si hay scroll
    this._drawScrollFades();
  }

  /**
   * @param {number} startY
   * @returns {number} y final
   */
  _drawFoodTable(startY) {
    let y = startY;
    const pad = 40;
    const colImg = pad;
    const colLabel = pad + 100;
    const colLevel = DESIGN_WIDTH - pad - 20;
    const rowH = 64;

    fill(255);
    textAlign(LEFT, TOP);
    textSize(30);
    text('Alimentos', pad, y);
    y += 44;

    // Header
    fill(60, 65, 80);
    rect(pad, y, DESIGN_WIDTH - pad * 2, 40, 8);
    fill(255, 230, 120);
    textSize(20);
    textAlign(LEFT, CENTER);
    text('Imagen', colImg + 8, y + 20);
    text('Label', colLabel, y + 20);
    textAlign(RIGHT, CENTER);
    text('healthyLevel', colLevel, y + 20);
    y += 48;

    const catalog =
      typeof FOOD_CATALOG !== 'undefined' ? FOOD_CATALOG : [];

    for (let i = 0; i < catalog.length; i += 1) {
      const item = catalog[i];
      const rowY = y;

      // Alternar fondo de fila
      if (i % 2 === 0) {
        fill(32, 36, 48);
      } else {
        fill(26, 28, 38);
      }
      rect(pad, rowY, DESIGN_WIDTH - pad * 2, rowH, 4);

      // Imagen
      const img = this.game.assets.getFoodImage(item.file);
      imageMode(CENTER);
      if (img && img.width > 1) {
        const s = 48;
        image(img, colImg + 36, rowY + rowH / 2, s, s);
      } else {
        fill(80);
        circle(colImg + 36, rowY + rowH / 2, 40);
      }

      // Label + file
      fill(245);
      textAlign(LEFT, CENTER);
      textSize(22);
      text(item.label, colLabel, rowY + rowH / 2 - 8);
      fill(150, 155, 170);
      textSize(14);
      text(item.file, colLabel, rowY + rowH / 2 + 14);

      // healthyLevel
      const lvl = item.healthyLevel;
      if (lvl > 0) {
        fill(120, 220, 140);
      } else if (lvl === 0) {
        fill(255, 210, 90);
      } else {
        fill(255, 120, 120);
      }
      textAlign(RIGHT, CENTER);
      textSize(28);
      text(String(lvl), colLevel, rowY + rowH / 2);

      y += rowH + 4;
    }

    fill(160);
    textAlign(LEFT, TOP);
    textSize(16);
    text(`${catalog.length} alimentos`, pad, y + 8);
    return y + 28;
  }

  /**
   * @param {number} startY
   * @returns {number} y final
   */
  _drawMessagesTable(startY) {
    let y = startY;
    const pad = 40;

    fill(255);
    textAlign(LEFT, TOP);
    textSize(30);
    text('Mensajes finales', pad, y);
    y += 44;

    fill(60, 65, 80);
    rect(pad, y, DESIGN_WIDTH - pad * 2, 40, 8);
    fill(255, 230, 120);
    textSize(18);
    textAlign(LEFT, CENTER);
    text('Rango', pad + 12, y + 20);
    text('T\u00edtulo', pad + 160, y + 20);
    text('Subt\u00edtulo', pad + 420, y + 20);
    y += 48;

    const rows =
      typeof FINAL_RESULT_MESSAGES !== 'undefined'
        ? FINAL_RESULT_MESSAGES
        : [];

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const rowH = 100;
      if (i % 2 === 0) {
        fill(32, 36, 48);
      } else {
        fill(26, 28, 38);
      }
      rect(pad, y, DESIGN_WIDTH - pad * 2, rowH, 4);

      fill(255, 230, 120);
      textAlign(LEFT, TOP);
      textSize(22);
      text(row.rangeLabel, pad + 12, y + 16);

      fill(255);
      textSize(20);
      text(row.title, pad + 160, y + 16, 240, 70);

      fill(200, 200, 210);
      textSize(16);
      text(row.subtitle, pad + 420, y + 16, DESIGN_WIDTH - pad * 2 - 440, 70);

      y += rowH + 6;
    }

    return y;
  }

  _drawScrollFades() {
    const maxScroll = Math.max(0, this._contentHeight - DESIGN_HEIGHT);
    noStroke();
    if (this.scrollY > 2) {
      for (let i = 0; i < 40; i += 1) {
        fill(18, 20, 28, 220 - i * 5);
        rect(0, i, DESIGN_WIDTH, 1);
      }
    }
    if (this.scrollY < maxScroll - 2) {
      for (let i = 0; i < 40; i += 1) {
        fill(18, 20, 28, 220 - i * 5);
        rect(0, DESIGN_HEIGHT - 1 - i, DESIGN_WIDTH, 1);
      }
    }
  }
}
