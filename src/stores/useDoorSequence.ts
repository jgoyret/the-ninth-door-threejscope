import { create } from "zustand";

interface DoorSequenceState {
  // Secuencia de desbloqueo: números de puertas (1-9) en orden
  sequence: number[];
  // Índice actual en la secuencia (qué puerta toca abrir)
  currentStep: number;
  // Set de puertas que ya fueron abiertas alguna vez (para la secuencia)
  openedDoors: Set<number>;
  // Set de puertas que están físicamente abiertas ahora mismo
  currentlyOpenDoors: Set<number>;

  // Chequea si una puerta está desbloqueada (puede abrirse)
  isDoorUnlocked: (doorNumber: number) => boolean;
  // Chequea si una puerta ya fue abierta alguna vez
  isDoorOpened: (doorNumber: number) => boolean;
  // Chequea si una puerta está físicamente abierta ahora
  isDoorCurrentlyOpen: (doorNumber: number) => boolean;
  // Intenta abrir una puerta, retorna true si se pudo
  openDoor: (doorNumber: number) => boolean;
  // Cierra una puerta
  closeDoor: (doorNumber: number) => void;
  // Obtiene el número de la siguiente puerta a abrir
  getNextDoor: () => number | null;
  // Resetea el juego
  reset: () => void;
  // Configura una nueva secuencia
  setSequence: (sequence: number[]) => void;
}

export const useDoorSequence = create<DoorSequenceState>((set, get) => ({
  // Secuencia default: 1 → 7 → 5 → 3 → 9 → 2 → 8 → 4 → 6
  sequence: [1, 5, 7, 8, 4, 2, 6, 3, 9],
  currentStep: 0,
  openedDoors: new Set(),
  currentlyOpenDoors: new Set(),

  isDoorUnlocked: (doorNumber) => {
    const { sequence, currentStep } = get();
    return sequence[currentStep] === doorNumber;
  },

  isDoorOpened: (doorNumber) => {
    return get().openedDoors.has(doorNumber);
  },

  isDoorCurrentlyOpen: (doorNumber) => {
    return get().currentlyOpenDoors.has(doorNumber);
  },

  openDoor: (doorNumber) => {
    const { sequence, currentStep, openedDoors, currentlyOpenDoors } = get();

    if (sequence[currentStep] !== doorNumber) {
      return false;
    }

    const newOpenedDoors = new Set(openedDoors);
    newOpenedDoors.add(doorNumber);

    const newCurrentlyOpenDoors = new Set(currentlyOpenDoors);
    newCurrentlyOpenDoors.add(doorNumber);

    set({
      openedDoors: newOpenedDoors,
      currentlyOpenDoors: newCurrentlyOpenDoors,
      currentStep: currentStep + 1,
    });

    return true;
  },

  closeDoor: (doorNumber) => {
    const { currentlyOpenDoors } = get();
    const newCurrentlyOpenDoors = new Set(currentlyOpenDoors);
    newCurrentlyOpenDoors.delete(doorNumber);
    set({ currentlyOpenDoors: newCurrentlyOpenDoors });
  },

  getNextDoor: () => {
    const { sequence, currentStep } = get();
    return sequence[currentStep] ?? null;
  },

  reset: () => {
    set({
      currentStep: 0,
      openedDoors: new Set(),
      currentlyOpenDoors: new Set(),
    });
  },

  setSequence: (sequence) => {
    set({
      sequence,
      currentStep: 0,
      openedDoors: new Set(),
      currentlyOpenDoors: new Set(),
    });
  },
}));
