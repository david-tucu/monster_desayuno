/**
 * FoodCatalog
 * Única fuente de verdad de los alimentos del juego.
 *
 * Para agregar un alimento:
 *   1. Copiá el PNG en assets/images/food/
 *   2. Agregá UNA entrada aquí (file + label + healthyLevel)
 *
 * No hardcodear alimentos ni healthyLevel en otro archivo.
 */

/** Carpeta de PNGs (relativa a index.html). */
const FOOD_ASSETS_DIR = 'assets/images/food/';

/**
 * Escala healthyLevel (mensaje educativo del juego):
 *   5  = excelente desayuno
 *   4  = muy saludable
 *   3  = saludable
 *   2  = aceptable / saludable pero poco típico de desayuno
 *   1  = poco recomendable
 *   0  = neutro / indulgencia ocasional
 *  -1  = claramente poco saludable
 *
 * Ordenado alfabéticamente por label.
 */
const FOOD_CATALOG = [
  { file: 'agua.png', label: 'Agua', healthyLevel: 5 },
  { file: 'almendras.png', label: 'Almendras', healthyLevel: 4 },
  { file: 'arroz.png', label: 'Arroz', healthyLevel: 2 },
  { file: 'banana.png', label: 'Banana', healthyLevel: 5 },
  { file: 'verenjena.png', label: 'Berenjena', healthyLevel: 2 },
  { file: 'bife_de_carne.png', label: 'Bife de carne', healthyLevel: 1 },
  { file: 'brocoli.png', label: 'Brócoli', healthyLevel: 2 },
  { file: 'caramelos.png', label: 'Caramelos', healthyLevel: -1 },
  { file: 'cereal.png', label: 'Cereal', healthyLevel: 4 },
  { file: 'dulce_de_leche(dubai).png', label: 'Dulce de Leche', healthyLevel: 3 },
  { file: 'donas.png', label: 'Donas', healthyLevel: 0 },
  { file: 'frutilla.png', label: 'Frutilla', healthyLevel: 5 },
  { file: 'galletitas_de_chocolate.png', label: 'Galletitas de chocolate', healthyLevel: 1 },
  { file: 'gaseosa.png', label: 'Gaseosa', healthyLevel: -1 },
  { file: 'hamburguesa.png', label: 'Hamburguesa', healthyLevel: -1 },
  { file: 'huevos.png', label: 'Huevos', healthyLevel: 4 },
  { file: 'jugo_artificial.png', label: 'Jugo artificial', healthyLevel: 1 },
  { file: 'leche.png', label: 'Leche', healthyLevel: 5 },
  { file: 'leche_clasica.png', label: 'Leche clásica', healthyLevel: 5 },
  { file: 'leche_clasica(sachet).png', label: 'Leche clásica sachet', healthyLevel: 5 },
  { file: 'leche_liviana.png', label: 'Leche liviana', healthyLevel: 5 },
  { file: 'leche_zero_lactosa.png', label: 'Leche zero lactosa', healthyLevel: 5 },
  { file: 'manteca.png', label: 'Manteca', healthyLevel: 1 },
  { file: 'manzana.png', label: 'Manzana', healthyLevel: 5 },
  { file: 'nueces.png', label: 'Nueces', healthyLevel: 4 },
  { file: 'palta.png', label: 'Palta', healthyLevel: 4 },
  { file: 'pan.png', label: 'Pan', healthyLevel: 2 },
  { file: 'pan_integral.png', label: 'Pan integral', healthyLevel: 4 },
  { file: 'pancho.png', label: 'Pancho', healthyLevel: -1 },
  { file: 'papas_fritas.png', label: 'Papas fritas', healthyLevel: -1 },
  { file: 'pastas.png', label: 'Pastas', healthyLevel: 2 },
  { file: 'pescado.png', label: 'Pescado', healthyLevel: 2 },
  { file: 'pollo.png', label: 'Pollo', healthyLevel: 2 },
  { file: 'queso.png', label: 'Queso', healthyLevel: 3 },
  { file: 'queso_crema.png', label: 'Queso crema', healthyLevel: 2 },
  { file: 'queso_pategras.png', label: 'Queso pategrás', healthyLevel: 3 },
  { file: 'salchicha.png', label: 'Salchicha', healthyLevel: -1 },
  { file: 'sandia.png', label: 'Sandía', healthyLevel: 5 },
  { file: 'semillas.png', label: 'Semillas', healthyLevel: 4 },
  { file: 'uva.png', label: 'Uva', healthyLevel: 5 },
  { file: 'yogur.png', label: 'Yogur', healthyLevel: 5 },
  { file: 'yogur_con_cereales.png', label: 'Yogur con cereales', healthyLevel: 4 },
  { file: 'yogurisimo.png', label: 'Yogurísimo', healthyLevel: 3 },
  { file: 'zanahoria.png', label: 'Zanahoria', healthyLevel: 4 },
];
