import { useEffect, useRef } from 'react';

import type { AppPhase } from '../store/useGameStore';
import {
  prototypeAudio,
  type PrototypeAudioMode
} from './prototypeAudio';

function isEmergencyAudioPhase(phase: AppPhase) {
  return phase === 'emergency' || phase === 'minigame' || phase === 'callEmergency';
}

export function usePrototypeAudioBridge(input: {
  audioMode: PrototypeAudioMode;
  phase: AppPhase;
}) {
  const previousPhaseRef = useRef<AppPhase | null>(null);

  useEffect(() => {
    const unlock = () => prototypeAudio.unlock();

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    prototypeAudio.setMode(input.audioMode);
  }, [input.audioMode]);

  useEffect(() => {
    const previousPhase = previousPhaseRef.current;

    if (previousPhase && previousPhase !== input.phase) {
      if (!isEmergencyAudioPhase(previousPhase) && isEmergencyAudioPhase(input.phase)) {
        prototypeAudio.playSfx('emergency');
      }

      if (input.phase === 'callEmergency') {
        prototypeAudio.playSfx('callStart');
      }
    }

    previousPhaseRef.current = input.phase;
  }, [input.phase]);
}
