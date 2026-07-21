/**
 * AssetManager
 * Carga y centraliza todas las rutas de assets.
 * Ninguna otra clase debe hardcodear rutas de imágenes/audio/fuentes.
 */
class AssetManager {
  /**
   * @param {p5} p Instancia de p5 (modo global: window / funciones globales).
   */
  constructor() {
    /** @type {Map<string, any>} */
    this.images = new Map();

    /** @type {Map<string, p5.SoundFile>} */
    this.sounds = new Map();

    /** @type {Map<string, p5.Font>} */
    this.fonts = new Map();

    /**
     * Manifiesto único de assets.
     * Agregar aquí cualquier imagen, audio o fuente nueva.
     */
    this.manifest = {
      images: {
        // UI
        logo: 'assets/images/ui/logo.png',
        fondo: 'assets/images/ui/fondo.png',
        btn_jugar: 'assets/images/ui/btn_jugar.png',
        btn_volver: 'assets/images/ui/btn_volver.png',

        // Decoración intro (a definir / ampliar)
        decor_star: 'assets/images/decor/star.png',
        decor_spark: 'assets/images/decor/spark.png',

        // Monstruo por capas (sprites recortados con transparencia)
        monster_body: 'assets/images/monster/body.png',
        monster_eyes_open: 'assets/images/monster/eyes_open.png',
        monster_eyes_closed: 'assets/images/monster/eyes_close.png',
        monster_nose: 'assets/images/monster/nose.png',
        monster_mouth_idle: 'assets/images/monster/mouth_idle.png',
        monster_mouth_eat: 'assets/images/monster/mouth_eat.png',
        monster_mouth_chew_1: 'assets/images/monster/mouth_chewing_1.png',
        monster_mouth_chew_2: 'assets/images/monster/mouth_chewing_2.png',
        monster_mouth_happy: 'assets/images/monster/mouth_happy.png',
        monster_mouth_full: 'assets/images/monster/mouth_full.png',
        // TODO: reemplazar cuando exista mouth_sad.png
        monster_mouth_sad: 'assets/images/monster/mouth_full.png',
        monster_eyebrows_neutral: 'assets/images/monster/eyebrows_neutral.png',
        monster_eyebrows_sad: 'assets/images/monster/eyebrows_sad.png',
        // monster_blush: 'assets/images/monster/blush.png',

        // Alimentos
        food_leche: 'assets/images/food/leche.png',
        food_yogur: 'assets/images/food/yogur.png',
        food_banana: 'assets/images/food/banana.png',
        food_cereal: 'assets/images/food/cereal.png',
        food_jugo: 'assets/images/food/jugo.png',
        food_galletitas: 'assets/images/food/galletitas.png',
        food_golosina: 'assets/images/food/golosina.png',
        food_gaseosa: 'assets/images/food/gaseosa.png',
      },
      sounds: {
        [AUDIO_KEYS.CLIC]: 'assets/audio/clic.mp3',
        [AUDIO_KEYS.COMER_CONTENTO]: 'assets/audio/comer_contento.mp3',
        [AUDIO_KEYS.COMER_DISGUSTO]: 'assets/audio/comer_disgusto.mp3',
        [AUDIO_KEYS.FINAL]: 'assets/audio/final.mp3',
        // [AUDIO_KEYS.BGM]: 'assets/audio/bgm_main.mp3',
      },
      fonts: {
        main: 'assets/fonts/RifficFree-Bold.ttf',
      },
    };

    /** Indica si se usaron placeholders por assets faltantes. */
    this.usedPlaceholders = false;

    /** Claves de imagen cuya carga falló (placeholders en finalize). */
    this._failedImageKeys = new Set();
  }

  /**
   * Carga todos los assets declarados en el manifiesto.
   * Debe llamarse desde preload().
   */
  loadAll() {
    this._loadImages();
    this._loadSounds();
    this._loadFonts();
  }

  /**
   * Sustituye imágenes fallidas por placeholders.
   * Llamar desde setup() (createGraphics ya está disponible de forma fiable).
   */
  finalize() {
    for (const key of this._failedImageKeys) {
      this.images.set(key, this._createImagePlaceholder(key));
      this.usedPlaceholders = true;
    }
    this._failedImageKeys.clear();

    // Seguridad: imágenes que quedaron vacías / rotas
    for (const [key, img] of this.images.entries()) {
      if (!img || !img.width || img.width <= 1) {
        this.images.set(key, this._createImagePlaceholder(key));
        this.usedPlaceholders = true;
      }
    }
  }

  /**
   * @param {string} key
   * @returns {p5.Image|null}
   */
  getImage(key) {
    let img = this.images.get(key);
    // Si falta o no cargó, genera placeholder bajo demanda (cubre fallos async).
    if (!img || !img.width || img.width <= 1) {
      img = this._createImagePlaceholder(key);
      this.images.set(key, img);
      this.usedPlaceholders = true;
    }
    return img;
  }

  /**
   * @param {string} key
   * @returns {p5.SoundFile|null}
   */
  getSound(key) {
    return this.sounds.get(key) || null;
  }

  /**
   * @param {string} key
   * @returns {p5.Font|null}
   */
  getFont(key) {
    return this.fonts.get(key) || null;
  }

  // ---------------------------------------------------------------------------
  // Privados
  // ---------------------------------------------------------------------------

  _loadImages() {
    const entries = Object.entries(this.manifest.images);
    for (const [key, path] of entries) {
      try {
        const img = loadImage(
          path,
          () => {},
          () => {
            console.warn(`[AssetManager] Imagen no encontrada: ${path}. Se usará placeholder.`);
            this._failedImageKeys.add(key);
            this.usedPlaceholders = true;
          }
        );
        this.images.set(key, img);
      } catch (err) {
        console.warn(`[AssetManager] Error cargando imagen ${key}:`, err);
        this._failedImageKeys.add(key);
        this.usedPlaceholders = true;
      }
    }
  }

  _loadSounds() {
    const entries = Object.entries(this.manifest.sounds);
    for (const [key, path] of entries) {
      try {
        const sound = loadSound(
          path,
          () => {},
          (err) => {
            console.warn(`[AssetManager] Audio no encontrado: ${path}.`, err);
            this.sounds.set(key, null);
            this.usedPlaceholders = true;
          }
        );
        this.sounds.set(key, sound);
      } catch (err) {
        console.warn(`[AssetManager] Error cargando audio ${key}:`, err);
        this.sounds.set(key, null);
        this.usedPlaceholders = true;
      }
    }
  }

  _loadFonts() {
    const entries = Object.entries(this.manifest.fonts);
    for (const [key, path] of entries) {
      try {
        const font = loadFont(
          path,
          () => {},
          () => {
            console.warn(`[AssetManager] Fuente no encontrada: ${path}.`);
            this.fonts.set(key, null);
            this.usedPlaceholders = true;
          }
        );
        this.fonts.set(key, font);
      } catch (err) {
        console.warn(`[AssetManager] Error cargando fuente ${key}:`, err);
        this.fonts.set(key, null);
        this.usedPlaceholders = true;
      }
    }
  }

  /**
   * Genera un placeholder gráfico identificable por clave.
   * Permite desarrollar y probar la arquitectura sin todos los PNG finales.
   * @param {string} key
   * @returns {p5.Image}
   */
  _createImagePlaceholder(key) {
    const w = key.startsWith('food_') ? 180 : key.startsWith('monster_') ? 400 : 320;
    const h = key.startsWith('food_') ? 180 : key.startsWith('monster_') ? 400 : 160;
    const g = createGraphics(w, h);
    g.pixelDensity(1);
    g.background(60, 60, 70);
    g.noStroke();
    g.fill(100, 180, 220);
    g.rect(8, 8, w - 16, h - 16, 16);
    g.fill(255);
    g.textAlign(CENTER, CENTER);
    g.textSize(Math.min(22, w / 8));
    g.text(key, w / 2, h / 2);
    return g;
  }
}
