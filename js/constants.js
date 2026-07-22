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
  NEUTRAL: 'neutral',
  FULL: 'full',
  SAD: 'sad',
  EATING: 'eating',
});

/** Paletas de color del monstruo (persistentes en Game). */
const MONSTER_PALETTES = Object.freeze({
  ORIGINAL: 'original',
  FUCHSIA: 'fuchsia',
  ORANGE: 'orange',
});

/** Ciclo al tocar la cara en Intro. */
const MONSTER_PALETTE_CYCLE = Object.freeze([
  MONSTER_PALETTES.ORIGINAL,
  MONSTER_PALETTES.FUCHSIA,
  MONSTER_PALETTES.ORANGE,
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
 * Bandas de mensaje final (única fuente; también se muestra en overlay P).
 * Se evalúan en orden; la primera que matchea gana.
 * monsterState: expresión del monstruo en la pantalla final.
 */
const FINAL_RESULT_MESSAGES = [
  {
    rangeLabel: '\u2265 18',
    test: (t) => t >= 18,
    title: '\u00a1Desayuno de campe\u00f3n!',
    subtitle: 'Tu monstruo arranca el d\u00eda con energ\u00eda total.',
    monsterState: MONSTER_STATES.HAPPY,
  },
  {
    rangeLabel: '\u2265 12',
    test: (t) => t >= 12,
    title: '\u00a1Buen desayuno!',
    subtitle: 'Elegiste opciones que suman bienestar.',
    monsterState: MONSTER_STATES.HAPPY,
  },
  {
    rangeLabel: '\u2265 5',
    test: (t) => t >= 5,
    title: 'Desayuno aceptable',
    subtitle: 'Hay margen para elegir un poco mejor.',
    monsterState: MONSTER_STATES.NEUTRAL,
  },
  {
    rangeLabel: '= 0',
    test: (t) => t === 0,
    title: 'Mmmmmmm...',
    subtitle: 'Cambiando algunas opciones \u00a1podr\u00edas lograr un desayuno monstruoso!',
    monsterState: MONSTER_STATES.NEUTRAL,
  },
  {
    rangeLabel: '< 0 o 1\u20134',
    test: () => true,
    title: 'Mmm...',
    subtitle: 'Tu monstruo necesita opciones m\u00e1s saludables.',
    monsterState: MONSTER_STATES.FULL,
  },
];

/**
 * Banda completa según healthyTotal.
 * @param {number} healthyTotal
 * @returns {{ rangeLabel: string, title: string, subtitle: string, monsterState: string }}
 */
function getFinalResultBand(healthyTotal) {
  for (const row of FINAL_RESULT_MESSAGES) {
    if (row.test(healthyTotal)) {
      return row;
    }
  }
  return FINAL_RESULT_MESSAGES[FINAL_RESULT_MESSAGES.length - 1];
}

/**
 * Calcula el mensaje final a partir de healthyTotal.
 * @param {number} healthyTotal
 * @returns {{ title: string, subtitle: string }}
 */
function getFinalResultMessage(healthyTotal) {
  const band = getFinalResultBand(healthyTotal);
  return { title: band.title, subtitle: band.subtitle };
}
