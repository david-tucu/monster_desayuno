/**
 * Constantes globales del juego.
 * Único lugar para valores de configuración fácilmente modificables.
 */

/** Resolución de diseño (coordenadas lógicas del juego). Formato vertical. */
const DESIGN_WIDTH = 1080;
const DESIGN_HEIGHT = 1920;

/** Cantidad de rondas por partida. Fácilmente modificable. */
const NUM_ROUNDS = 5;

/** Duración de cada ronda en segundos. */
const ROUND_DURATION_SEC = 20;

/** Identificadores de estados de la máquina de estados. */
const STATES = Object.freeze({
  INTRO: 'intro',
  PLAY: 'play',
  END: 'end',
});

/** Estados internos del monstruo. */
const MONSTER_STATES = Object.freeze({
  IDLE: 'idle',
  BLINK: 'blink',
  HAPPY: 'happy',
  FULL: 'full',
  SAD: 'sad',
  EATING: 'eating',
});

/**
 * Catálogo de alimentos.
 * healthyLevel es un entero (puede ser negativo, cero o positivo).
 * No se usan booleanos healthy/unhealthy.
 */
const FOOD_CATALOG = Object.freeze([
  { id: 'leche', name: 'Leche', healthyLevel: 2, imageKey: 'food_leche' },
  { id: 'yogur', name: 'Yogur', healthyLevel: 2, imageKey: 'food_yogur' },
  { id: 'banana', name: 'Banana', healthyLevel: 2, imageKey: 'food_banana' },
  { id: 'cereal', name: 'Cereal', healthyLevel: 1, imageKey: 'food_cereal' },
  { id: 'jugo', name: 'Jugo', healthyLevel: 0, imageKey: 'food_jugo' },
  { id: 'galletitas', name: 'Galletitas', healthyLevel: -1, imageKey: 'food_galletitas' },
  { id: 'golosina', name: 'Golosina', healthyLevel: -2, imageKey: 'food_golosina' },
  { id: 'gaseosa', name: 'Gaseosa', healthyLevel: -3, imageKey: 'food_gaseosa' },
]);

/** Claves de audio centralizadas (coinciden con AssetManager). */
const AUDIO_KEYS = Object.freeze({
  CLIC: 'sfx_clic',
  COMER_CONTENTO: 'sfx_comer_contento',
  COMER_DISGUSTO: 'sfx_comer_disgusto',
  FINAL: 'sfx_final',
  // Preparado para música de fondo:
  // BGM: 'bgm_main',
});

/**
 * Calcula el mensaje final a partir de healthyTotal.
 * Función independiente: no usa cantidad de aciertos.
 *
 * @param {number} healthyTotal
 * @returns {{ title: string, subtitle: string }}
 */
function getFinalResultMessage(healthyTotal) {
  if (healthyTotal >= 8) {
    return {
      title: '¡Desayuno de campeón!',
      subtitle: 'Tu monstruo arranca el día con energía total.',
    };
  }
  if (healthyTotal >= 4) {
    return {
      title: '¡Buen desayuno!',
      subtitle: 'Elegiste opciones que suman bienestar.',
    };
  }
  if (healthyTotal >= 1) {
    return {
      title: 'Desayuno aceptable',
      subtitle: 'Hay margen para elegir un poco mejor.',
    };
  }
  if (healthyTotal === 0) {
    return {
      title: 'Mmmmmmm...',
      subtitle: 'Cambiando algunas opciones ¡podrías lograr un desayuno monstruoso!',
    };
  }
  return {
    title: 'Mmm...',
    subtitle: 'Tu monstruo necesita opciones más saludables.',
  };
}
