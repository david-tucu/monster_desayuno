/**
 * Funciones de easing sencillas (sin GSAP).
 * t normalizado en [0, 1].
 */
const Easing = Object.freeze({
  linear(t) {
    return t;
  },

  easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
  },

  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  },

  easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
});

/**
 * Una interpolación individual sobre propiedades de un objeto target.
 */
class Tween {
  /**
   * @param {object} config
   * @param {object} config.target Objeto cuyas propiedades se animan.
   * @param {object} config.to Valores finales { x, y, scale, rotation, alpha, ... }.
   * @param {number} config.duration Duración en segundos.
   * @param {function} [config.easing]
   * @param {number} [config.delay] Retraso en segundos.
   * @param {function} [config.onComplete]
   * @param {function} [config.onUpdate]
   */
  constructor(config) {
    this.target = config.target;
    this.to = config.to;
    this.duration = Math.max(0.0001, config.duration);
    this.easing = config.easing || Easing.easeOutQuad;
    this.delay = config.delay || 0;
    this.onComplete = config.onComplete || null;
    this.onUpdate = config.onUpdate || null;

    /** Valores iniciales capturados al arrancar (tras el delay). */
    this.from = {};
    this.elapsed = 0;
    this.delayElapsed = 0;
    this.started = false;
    this.finished = false;
    this.killed = false;
  }

  /**
   * @param {number} dt Delta time en segundos.
   */
  update(dt) {
    if (this.finished || this.killed) {
      return;
    }

    if (!this.started) {
      this.delayElapsed += dt;
      if (this.delayElapsed < this.delay) {
        return;
      }
      this._captureFrom();
      this.started = true;
    }

    this.elapsed += dt;
    const rawT = Math.min(1, this.elapsed / this.duration);
    const t = this.easing(rawT);

    for (const key of Object.keys(this.to)) {
      const a = this.from[key];
      const b = this.to[key];
      if (typeof a === 'number' && typeof b === 'number') {
        this.target[key] = a + (b - a) * t;
      }
    }

    if (this.onUpdate) {
      this.onUpdate(this.target, t);
    }

    if (rawT >= 1) {
      this.finished = true;
      // Asegura valores finales exactos
      for (const key of Object.keys(this.to)) {
        this.target[key] = this.to[key];
      }
      if (this.onComplete) {
        this.onComplete(this.target);
      }
    }
  }

  kill() {
    this.killed = true;
    this.finished = true;
  }

  _captureFrom() {
    for (const key of Object.keys(this.to)) {
      const value = this.target[key];
      this.from[key] = typeof value === 'number' ? value : 0;
    }
  }
}

/**
 * TweenManager
 * Sistema propio de animaciones: posición, escala, rotación, alpha, etc.
 */
class TweenManager {
  constructor() {
    /** @type {Tween[]} */
    this.tweens = [];
  }

  /**
   * Crea y registra un tween.
   * @param {object} config Misma firma que Tween.
   * @returns {Tween}
   */
  to(config) {
    const tween = new Tween(config);
    this.tweens.push(tween);
    return tween;
  }

  /**
   * Atajo para interpolar varias propiedades de un display-object típico.
   * @param {object} target Debe exponer x, y, scale, rotation, alpha según se anime.
   * @param {object} props
   * @param {number} duration
   * @param {object} [options]
   * @returns {Tween}
   */
  animate(target, props, duration, options = {}) {
    return this.to({
      target,
      to: props,
      duration,
      easing: options.easing || Easing.easeOutQuad,
      delay: options.delay || 0,
      onComplete: options.onComplete || null,
      onUpdate: options.onUpdate || null,
    });
  }

  /**
   * Actualiza todos los tweens activos.
   * @param {number} dt Delta time en segundos.
   */
  update(dt) {
    for (let i = this.tweens.length - 1; i >= 0; i -= 1) {
      const tween = this.tweens[i];
      tween.update(dt);
      if (tween.finished || tween.killed) {
        this.tweens.splice(i, 1);
      }
    }
  }

  /**
   * Cancela tweens que apuntan a un target concreto.
   * @param {object} target
   */
  killTweensOf(target) {
    for (let i = this.tweens.length - 1; i >= 0; i -= 1) {
      if (this.tweens[i].target === target) {
        this.tweens[i].kill();
        this.tweens.splice(i, 1);
      }
    }
  }

  /**
   * Cancela todos los tweens.
   */
  killAll() {
    for (const tween of this.tweens) {
      tween.kill();
    }
    this.tweens.length = 0;
  }

  /**
   * @returns {boolean}
   */
  get hasActiveTweens() {
    return this.tweens.length > 0;
  }
}
