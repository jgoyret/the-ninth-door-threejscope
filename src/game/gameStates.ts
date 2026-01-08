import { useDoorSequence } from "../stores/useDoorSequence";
import { useCanvasManager } from "../stores/useCanvasManager";
import { usePlayerCommands } from "../stores/usePlayerCommands";

// Spawn positions
const SPAWN_INITIAL: [number, number, number] = [2.5, 5, 0];
const SPAWN_AFTER_9TH_DOOR: [number, number, number] = [-12, 1.5, 0];

export type GameStatePreset = "initial" | "after9door";

export function setGameStatePreset(preset: GameStatePreset) {
  const doorSequence = useDoorSequence.getState();
  const canvasManager = useCanvasManager.getState();
  const playerCommands = usePlayerCommands.getState();

  switch (preset) {
    case "initial":
      // Reset everything to initial state
      doorSequence.reset();
      canvasManager.reset();
      playerCommands.teleportTo(SPAWN_INITIAL);
      console.log("🎮 Game state: INITIAL");
      break;

    case "after9door":
      // Open all doors
      doorSequence.reset();
      // Open doors in sequence order: [1, 5, 7, 8, 4, 2, 6, 3, 9]
      const sequence = doorSequence.sequence;
      sequence.forEach((doorNumber) => {
        doorSequence.openDoor(doorNumber);
      });

      // Set canvas to depth mode (post 9th door state)
      canvasManager.setVisibleCanvas("depth");
      canvasManager.setStreamSource("depth");
      // Manually set isPostNinthDoor since we're bypassing the normal flow
      useCanvasManager.setState({ isPostNinthDoor: true });

      // Teleport player in front of MetaAngel
      playerCommands.teleportTo(SPAWN_AFTER_9TH_DOOR);
      console.log("🎮 Game state: AFTER 9TH DOOR");
      break;
  }
}
