// Door configuration for the oniric hallway
// Order follows vortex math: 1 → 2 → 4 → 8 → 7 → 5 → 3 → 6 → 9
// Concepts based on Jungian archetypes and the individuation journey

export interface DoorConfig {
  number: number;
  archetype: string;
  concept: string;
  image_url: string;
  prompt: string;
  palette: {
    primary: string;
    secondary: string;
  };
  description: string;
}

export const doors: Record<string, DoorConfig> = {
  one: {
    number: 1,
    archetype: "La Persona",
    concept: "La máscara que usamos",
    image_url: "/images/doors/1.webp",
    prompt:
      "endless corridor lined with floating masks made of glass, polished reflective surfaces, each mask showing a different emotion, theatrical liminal space, dream logic. Colors black and white.",
    palette: {
      primary: "#1a1a2e",
      secondary: "#eaeaea",
    },
    description:
      "Un rostro con máscara que se empieza a despegar, inicio del viaje interior",
  },
  two: {
    number: 2,
    archetype: "La Sombra",
    concept: "El otro yo, lo reprimido",
    image_url: "/images/doors/2.webp",
    prompt:
      "dark distorted hallway, shadows moving independently, dark silhouette at the end mirroring your movements, uncanny architecture, psychological horror atmosphere",
    palette: {
      primary: "#0d0d0d",
      secondary: "#4a0e4e",
    },
    description: "Figura idéntica pero distorsionada/oscura, el espejo oscuro",
  },
  four: {
    number: 4,
    archetype: "Las 4 Funciones",
    concept: "Pensamiento, Sentimiento, Sensación, Intuición",
    image_url: "/images/doors/4.webp",
    prompt:
      "corridor splitting into four paths, each with different element - fire water earth air, quaternary geometry, alchemical symbols on walls, crossroads of the mind",
    palette: {
      primary: "#2d3436",
      secondary: "#e17055",
    },
    description: "Cuatro símbolos/puertas en cruz, las funciones psíquicas",
  },
  eight: {
    number: 8,
    archetype: "Inconsciente Colectivo",
    concept: "El océano infinito de símbolos compartidos",
    image_url: "/images/doors/8.webp",
    prompt:
      "infinite spiral corridor with ancient symbols floating, hieroglyphs mandalas and archetypes emerging from walls, collective memory space, ancestral dream",
    palette: {
      primary: "#1e3799",
      secondary: "#f39c12",
    },
    description:
      "Espiral infinita con símbolos ancestrales de todas las culturas",
  },
  seven: {
    number: 7,
    archetype: "El Viejo Sabio",
    concept: "La guía interior, la intuición profunda",
    image_url: "/images/doors/7.webp",
    prompt:
      "misty ethereal hallway, soft glowing light at the end, translucent wise figure waiting, library of infinite knowledge fading into fog, sacred geometry",
    palette: {
      primary: "#4a266a",
      secondary: "#e8e8e8",
    },
    description:
      "Figura etérea luminosa con ojos cerrados, sabiduría ancestral",
  },
  five: {
    number: 5,
    archetype: "El Self",
    concept: "El centro, la integración",
    image_url: "/images/doors/5.webp",
    prompt:
      "perfectly symmetrical mandala corridor, all paths converging to center, golden ratio architecture, integration of light and shadow, wholeness achieved",
    palette: {
      primary: "#b8860b",
      secondary: "#ffffff",
    },
    description: "Mandala con figura humana al centro, la totalidad del ser",
  },
  three: {
    number: 3,
    archetype: "Anima",
    concept: "Lo femenino, la luz, creación",
    image_url: "/images/doors/3.webp",
    prompt:
      "organic flowing corridor, bioluminescent walls like living tissue, water reflections, feminine curves, birth canal of light, nurturing space",
    palette: {
      primary: "#ffffff",
      secondary: "#ff6b9d",
    },
    description:
      "Pasillo orgánico y fluido, luz nurturante, lo femenino creador",
  },
  six: {
    number: 6,
    archetype: "Animus",
    concept: "Lo masculino, la sombra, disolución",
    image_url: "/images/doors/6.webp",
    prompt:
      "angular fragmented hallway, sharp geometric shards, structured darkness, masculine architecture, crystalline black mirrors, powerful dissolution",
    palette: {
      primary: "#0a0a0a",
      secondary: "#3498db",
    },
    description:
      "Pasillo angular y fragmentado, estructura en disolución, lo masculino",
  },
  nine: {
    number: 9,
    archetype: "Individuación",
    concept: "La singularidad, transcendencia",
    image_url: "", // No image, direct transition to metaangel
    prompt: "", // No prompt, this is the final transcendence
    palette: {
      primary: "#ffffff",
      secondary: "#000000",
    },
    description: "La individuación completa - transición directa al metaangel",
  },
};

// Vortex math order for door opening sequence
export const VORTEX_ORDER = [1, 2, 4, 8, 7, 5, 3, 6, 9] as const;

// Helper to get door by number
export function getDoorByNumber(num: number): DoorConfig | undefined {
  const key = numberToKey(num);
  return key ? doors[key] : undefined;
}

// Helper to get door in sequence
export function getDoorInSequence(index: number): DoorConfig | undefined {
  const num = VORTEX_ORDER[index];
  return num ? getDoorByNumber(num) : undefined;
}

// Convert number to key
function numberToKey(num: number): string | undefined {
  const map: Record<number, string> = {
    1: "one",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
    6: "six",
    7: "seven",
    8: "eight",
    9: "nine",
  };
  return map[num];
}

// Legacy export for compatibility
export const DOOR_PROMPTS = VORTEX_ORDER.map(
  (num) => getDoorByNumber(num)?.prompt ?? ""
);

export type DoorPrompt = (typeof DOOR_PROMPTS)[number];
