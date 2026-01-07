import { create } from "zustand";
import { getDoorByNumber } from "../game/doorPrompts";

interface OrbState {
  // El orbe que el jugador está cargando actualmente (null si no tiene ninguno)
  carriedOrb: {
    doorNumber: number;
    color: string;
  } | null;

  // Orbes que ya fueron entregados al collector
  deliveredOrbs: Set<number>;

  // Acciones
  collectOrb: (doorNumber: number) => void;
  deliverOrb: () => number | null; // Retorna el doorNumber del orbe entregado
  hasCarriedOrb: () => boolean;
  isOrbDelivered: (doorNumber: number) => boolean;
  reset: () => void;
}

export const useOrbStore = create<OrbState>((set, get) => ({
  carriedOrb: null,
  deliveredOrbs: new Set(),

  collectOrb: (doorNumber: number) => {
    const doorConfig = getDoorByNumber(doorNumber);
    const color = doorConfig?.palette.secondary ?? "cyan";

    console.log(`🔮 Collected orb from door ${doorNumber} (color: ${color})`);

    set({
      carriedOrb: {
        doorNumber,
        color,
      },
    });
  },

  deliverOrb: () => {
    const { carriedOrb } = get();
    if (!carriedOrb) return null;

    const doorNumber = carriedOrb.doorNumber;

    console.log(`✨ Delivered orb from door ${doorNumber}`);

    set((state) => ({
      carriedOrb: null,
      deliveredOrbs: new Set([...state.deliveredOrbs, doorNumber]),
    }));

    return doorNumber;
  },

  hasCarriedOrb: () => get().carriedOrb !== null,

  isOrbDelivered: (doorNumber: number) => get().deliveredOrbs.has(doorNumber),

  reset: () =>
    set({
      carriedOrb: null,
      deliveredOrbs: new Set(),
    }),
}));
