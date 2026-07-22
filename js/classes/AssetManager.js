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
        mesa: 'assets/images/ui/mesa.png',
        fondo_boton: 'assets/images/ui/fondo-boton.png',
        btn_jugar: 'assets/images/ui/fondo-boton.png',
        btn_volver: 'assets/images/ui/fondo-boton.png',

        // Decoración intro
        decor_00: 'assets/images/decor/deco00.png',
        decor_01: 'assets/images/decor/deco01.png',
        decor_02: 'assets/images/decor/deco02.png',
        decor_03: 'assets/images/decor/deco03.png',
        decor_04: 'assets/images/decor/deco04.png',

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
        monster_mouth_neutral: 'assets/images/monster/mouth_neutral.png',
        monster_mouth_full: 'assets/images/monster/mouth_full.png',
        // TODO: reemplazar cuando exista mouth_sad.png
        monster_mouth_sad: 'assets/images/monster/mouth_full.png',
        monster_eyebrows_neutral: 'assets/images/monster/eyebrows_neutral.png',
        monster_eyebrows_sad: 'assets/images/monster/eyebrows_sad.png',
        // monster_blush: 'assets/images/monster/blush.png',
        // Alimentos: se cargan desde FOOD_CATALOG (js/data/FoodCatalog.js)
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
    this._loadFoodCatalogImages();
    this._loadSounds();
    this._loadFonts();
  }

  /**
   * Sustituye solo las imágenes que fallaron al cargar.
   * No tocar el resto: en setup() algunas pueden seguir con width 0 un instante
   * y un replace agresivo deja placeholders permanentes.
   */
  finalize() {
    for (const key of this._failedImageKeys) {
      console.warn(`[AssetManager] Placeholder para: ${key}`);
      this.images.set(key, this._createImagePlaceholder(key));
      this.usedPlaceholders = true;
    }
    this._failedImageKeys.clear();
  }

  /**
   * @param {string} key
   * @returns {p5.Image|p5.Graphics|null}
   */
  getImage(key) {
    const img = this.images.get(key);
    if (!img) {
      return null;
    }
    // No reemplazar aquí: si aún no terminó de cargar, width puede ser 0/1
    // y pisaríamos el asset real con un placeholder permanente.
    return img;
  }

  /**
   * true si la imagen está lista para dibujar.
   * @param {string} key
   * @returns {boolean}
   */
  hasImage(key) {
    const img = this.images.get(key);
    return Boolean(img && img.width && img.width > 1);
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

  /**
   * Clave interna de imagen para un archivo del catálogo de alimentos.
   * @param {string} file Nombre de archivo (ej. "leche.png")
   * @returns {string}
   */
  foodImageKey(file) {
    return `food:${file}`;
  }

  /**
   * Imagen de un alimento del catálogo (por nombre de archivo).
   * @param {string} file
   * @returns {p5.Image|p5.Graphics|null}
   */
  getFoodImage(file) {
    return this.getImage(this.foodImageKey(file));
  }

  // ---------------------------------------------------------------------------
  // Privados
  // ---------------------------------------------------------------------------

  _loadImages() {
    const entries = Object.entries(this.manifest.images);
    for (const [key, path] of entries) {
      this._loadImageEntry(key, path);
    }
  }

  /**
   * Carga cada PNG declarado en FOOD_CATALOG (sin listar archivos acá).
   */
  _loadFoodCatalogImages() {
    if (typeof FOOD_CATALOG === 'undefined' || !FOOD_CATALOG.length) {
      console.warn('[AssetManager] FOOD_CATALOG vacío o no cargado.');
      return;
    }
    const dir =
      typeof FOOD_ASSETS_DIR !== 'undefined' ? FOOD_ASSETS_DIR : 'assets/images/food/';
    for (const item of FOOD_CATALOG) {
      if (!item || !item.file) {
        continue;
      }
      const key = this.foodImageKey(item.file);
      this._loadImageEntry(key, `${dir}${item.file}`);
    }
  }

  /**
   * @param {string} key
   * @param {string} path
   */
  _loadImageEntry(key, path) {
    try {
      const img = loadImage(
        path,
        () => {},
        () => {
          console.warn(
            `[AssetManager] Imagen no encontrada: ${path}. Se usará placeholder.`
          );
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
    const isFood = key.startsWith('food:') || key.startsWith('food_');
    const w = isFood ? 180 : key.startsWith('monster_') ? 400 : 320;
    const h = isFood ? 180 : key.startsWith('monster_') ? 400 : 160;
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
