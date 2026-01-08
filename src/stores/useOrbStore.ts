import { create } from "zustand";
import { getDoorByNumber } from "../game/doorPrompts";

type AbsorptionState = "idle" | "absorbing" | "ready";

interface OrbState {
  // El orbe que el jugador está cargando actualmente (null si no tiene ninguno)
  carriedOrb: {
    doorNumber: number;
    color: string;
  } | null;

  // Orbes que ya fueron entregados al collector
  deliveredOrbs: Set<number>;

  // Estados de absorción del orbe
  absorbingOrb: { doorNumber: number; color: string } | null;
  absorptionProgress: number; // 0-1
  absorptionState: AbsorptionState;

  // Acciones
  collectOrb: (doorNumber: number) => void;
  deliverOrb: () => { doorNumber: number; color: string } | null;
  hasCarriedOrb: () => boolean;
  isOrbDelivered: (doorNumber: number) => boolean;
  startAbsorption: (doorNumber: number, color: string) => void;
  updateAbsorptionProgress: (progress: number) => void;
  completeAbsorption: () => void;
  reset: () => void;
}

export const useOrbStore = create<OrbState>((set, get) => ({
  carriedOrb: null,
  deliveredOrbs: new Set(),
  absorbingOrb: null,
  absorptionProgress: 0,
  absorptionState: "idle",

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

    const { doorNumber, color } = carriedOrb;

    console.log(`✨ Delivered orb from door ${doorNumber}`);

    // Solo limpiar carriedOrb - deliveredOrbs se actualiza en completeAbsorption
    set({ carriedOrb: null });

    return { doorNumber, color };
  },

  hasCarriedOrb: () => get().carriedOrb !== null,

  isOrbDelivered: (doorNumber: number) => get().deliveredOrbs.has(doorNumber),

  startAbsorption: (doorNumber: number, color: string) => {
    console.log(`🌀 Starting absorption of orb from door ${doorNumber}`);
    set({
      absorbingOrb: { doorNumber, color },
      absorptionProgress: 0,
      absorptionState: "absorbing",
    });
  },

  updateAbsorptionProgress: (progress: number) => {
    const clamped = Math.min(1, Math.max(0, progress));
    set({ absorptionProgress: clamped });

    // Transición automática a ready cuando llega a 1
    if (clamped >= 1) {
      set({ absorptionState: "ready" });
    }
  },

  completeAbsorption: () => {
    const { absorbingOrb, deliveredOrbs } = get();
    if (!absorbingOrb) return;

    console.log(`✅ Absorption complete for door ${absorbingOrb.doorNumber}`);

    // Agregar a orbes entregados
    const newDeliveredOrbs = new Set(deliveredOrbs);
    newDeliveredOrbs.add(absorbingOrb.doorNumber);

    set({
      absorbingOrb: null,
      absorptionProgress: 0,
      absorptionState: "idle",
      deliveredOrbs: newDeliveredOrbs,
    });
  },

  reset: () =>
    set({
      carriedOrb: null,
      deliveredOrbs: new Set(),
      absorbingOrb: null,
      absorptionProgress: 0,
      absorptionState: "idle",
    }),
}));
