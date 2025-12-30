// Prompts para cada puerta del pasillo (índice 0-8)
export const DOOR_PROMPTS = [
  "magical forest, ancient trees, glowing mushrooms, mystical fog",
  "underwater kingdom, coral palace, bioluminescent creatures, deep ocean",
  "floating islands, sky temples, clouds below, eternal sunset",
  "crystal caverns, gemstone walls, prismatic light reflections",
  "volcanic realm, lava rivers, obsidian towers, ember sky",
  "frozen tundra, ice castle, aurora borealis, eternal winter",
  "steampunk city, brass gears, clockwork machines, copper pipes",
  "neon cyberpunk, holographic signs, rain-soaked streets, synthwave",
  "ancient ruins, overgrown temple, forgotten civilization, jungle vines",
] as const;

export type DoorPrompt = (typeof DOOR_PROMPTS)[number];
