/**
 * AudioManager
 * Encapsula reproducción de efectos y (futuro) música de fondo.
 * Evita código repetido de play/stop en los estados.
 */
class AudioManager {
  /**
   * @param {AssetManager} assetManager
   */
  constructor(assetManager) {
    this.assets = assetManager;

    /** Volumen global de efectos (0–1). */
    this.sfxVolume = 1;

    /** Volumen de música de fondo (0–1). Preparado para ampliación. */
    this.bgmVolume = 0.5;

    /** Clave del BGM actual, si hubiera. */
    this._currentBgmKey = null;

    /** El AudioContext del navegador requiere interacción previa. */
    this._unlocked = false;
  }

  /**
   * Intenta desbloquear el AudioContext tras el primer toque.
   * Llamar desde el primer pointer/touch del usuario.
   */
  unlock() {
    if (this._unlocked) {
      return;
    }
    try {
      if (typeof userStartAudio === 'function') {
        userStartAudio();
      }
      this._unlocked = true;
    } catch (err) {
      console.warn('[AudioManager] No se pudo desbloquear audio:', err);
    }
  }

  /**
   * Reproduce un efecto de sonido por clave.
   * @param {string} key Clave definida en AUDIO_KEYS / AssetManager.
   * @param {{ volume?: number, rate?: number }} [options]
   */
  play(key, options = {}) {
    const sound = this.assets.getSound(key);
    if (!sound) {
      console.warn(`[AudioManager] Sonido no disponible: ${key}`);
      return;
    }

    const volume = options.volume !== undefined ? options.volume : this.sfxVolume;
    const rate = options.rate !== undefined ? options.rate : 1;

    try {
      // Reinicia si ya estaba sonando (clics rápidos, etc.)
      if (sound.isPlaying()) {
        sound.stop();
      }
      sound.setVolume(volume);
      sound.rate(rate);
      sound.play();
    } catch (err) {
      console.warn(`[AudioManager] Error al reproducir ${key}:`, err);
    }
  }

  /**
   * Detiene un efecto concreto.
   * @param {string} key
   */
  stop(key) {
    const sound = this.assets.getSound(key);
    if (sound && sound.isPlaying()) {
      sound.stop();
    }
  }

  /**
   * Detiene todos los efectos conocidos del manifiesto.
   */
  stopAllSfx() {
    for (const key of Object.keys(this.assets.manifest.sounds)) {
      this.stop(key);
    }
  }

  /**
   * Reproduce música de fondo en loop (preparado para uso futuro).
   * @param {string} key
   * @param {{ volume?: number }} [options]
   */
  playBgm(key, options = {}) {
    if (this._currentBgmKey && this._currentBgmKey !== key) {
      this.stopBgm();
    }

    const sound = this.assets.getSound(key);
    if (!sound) {
      console.warn(`[AudioManager] BGM no disponible: ${key}`);
      return;
    }

    const volume = options.volume !== undefined ? options.volume : this.bgmVolume;
    try {
      sound.setVolume(volume);
      sound.setLoop(true);
      if (!sound.isPlaying()) {
        sound.play();
      }
      this._currentBgmKey = key;
    } catch (err) {
      console.warn(`[AudioManager] Error al reproducir BGM ${key}:`, err);
    }
  }

  /**
   * Detiene la música de fondo actual.
   */
  stopBgm() {
    if (!this._currentBgmKey) {
      return;
    }
    this.stop(this._currentBgmKey);
    this._currentBgmKey = null;
  }
}
