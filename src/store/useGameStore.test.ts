import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const storePath = resolve(process.cwd(), 'src/store/useGameStore.ts');

describe('useGameStore foundation contract', () => {
  test('starts on a Vietnamese-first loading scene before the player enters the room', async () => {
    expect(existsSync(storePath)).toBe(true);
    if (!existsSync(storePath)) {
      return;
    }

    const { useGameStore } = await import('./useGameStore');
    useGameStore.getState().resetGame();
    const state = useGameStore.getState();

    expect(state.language).toBe('vi');
    expect(state.phase).toBe('loading');
    expect(state.audioMode).toBe('calm');
    expect(state.motherCondition).toBe('normal');
  });

  test('moves through loading, start, and introduction screens before free roam', async () => {
    expect(existsSync(storePath)).toBe(true);
    if (!existsSync(storePath)) {
      return;
    }

    const { useGameStore } = await import('./useGameStore');
    useGameStore.getState().resetGame();
    useGameStore.getState().finishLoading();

    expect(useGameStore.getState().phase).toBe('start');

    useGameStore.getState().openIntroduction();
    expect(useGameStore.getState().phase).toBe('introduction');

    useGameStore.getState().startFreeRoam();
    expect(useGameStore.getState().phase).toBe('freeRoam');
  });

  test('escalates to emergency mode when symptoms trigger', async () => {
    expect(existsSync(storePath)).toBe(true);
    if (!existsSync(storePath)) {
      return;
    }

    const { useGameStore } = await import('./useGameStore');
    useGameStore.getState().resetGame();
    useGameStore.getState().triggerEmergency(1000);
    const state = useGameStore.getState();

    expect(state.phase).toBe('emergency');
    expect(state.motherCondition).toBe('onset');
    expect(state.audioMode).toBe('intense');
    expect(state.overlays.showDangerBorder).toBe(true);
    expect(state.overlays.showMotherPortraitCutIn).toBe(true);
  });

  test('calculates an ending from time, accuracy, and mistakes', async () => {
    expect(existsSync(storePath)).toBe(true);
    if (!existsSync(storePath)) {
      return;
    }

    const { useGameStore } = await import('./useGameStore');
    useGameStore.getState().resetGame();
    useGameStore.getState().triggerEmergency(1000);
    useGameStore.getState().setRemainingTime(150);
    useGameStore.getState().setReportAccuracy(0.95);
    useGameStore.getState().recordMistake();
    useGameStore.getState().finalizeEnding();
    const state = useGameStore.getState();

    expect(state.phase).toBe('ending');
    expect(state.ending).not.toBeNull();
    expect(state.ending?.rating).toBe('good');
    expect(state.ending?.score).toBeGreaterThanOrEqual(60);
  });

  test('derives emergency countdown from the symptom start timestamp', async () => {
    expect(existsSync(storePath)).toBe(true);
    if (!existsSync(storePath)) {
      return;
    }

    const { getEmergencyRemainingSeconds, isEmergencyTimerActive } = await import(
      './useGameStore'
    );

    expect(
      getEmergencyRemainingSeconds({
        startedAt: 1000,
        now: 1000,
        totalSeconds: 180
      })
    ).toBe(180);
    expect(
      getEmergencyRemainingSeconds({
        startedAt: 1000,
        now: 31_000,
        totalSeconds: 180
      })
    ).toBe(150);
    expect(
      getEmergencyRemainingSeconds({
        startedAt: 1000,
        now: 240_000,
        totalSeconds: 180
      })
    ).toBe(0);
    expect(isEmergencyTimerActive('emergency')).toBe(true);
    expect(isEmergencyTimerActive('minigame')).toBe(true);
    expect(isEmergencyTimerActive('callEmergency')).toBe(true);
    expect(isEmergencyTimerActive('loading')).toBe(false);
    expect(isEmergencyTimerActive('start')).toBe(false);
    expect(isEmergencyTimerActive('introduction')).toBe(false);
  });

  test('dismisses symptom cut-in when the player starts the 115 call', async () => {
    expect(existsSync(storePath)).toBe(true);
    if (!existsSync(storePath)) {
      return;
    }

    const { useGameStore } = await import('./useGameStore');
    useGameStore.getState().resetGame();
    useGameStore.getState().triggerEmergency(1000);
    useGameStore.getState().enterCallEmergency();
    const state = useGameStore.getState();

    expect(state.phase).toBe('callEmergency');
    expect(state.overlays.showMotherPortraitCutIn).toBe(false);
    expect(state.dialogue.currentBeat?.id).toBe('call115');
  });

  test('reports one active major UI layer across dialogue, minigame, call, and ending states', async () => {
    expect(existsSync(storePath)).toBe(true);
    if (!existsSync(storePath)) {
      return;
    }

    const { getActiveMajorUiLayer, useGameStore } = await import('./useGameStore');
    useGameStore.getState().resetGame();
    useGameStore.getState().startFreeRoam();

    expect(getActiveMajorUiLayer(useGameStore.getState())).toBe('roomDialogue');

    useGameStore.getState().triggerEmergency(1000);
    useGameStore.getState().startMinigame('face');

    expect(getActiveMajorUiLayer(useGameStore.getState())).toBe('faceMinigame');

    useGameStore.getState().enterCallEmergency();

    expect(getActiveMajorUiLayer(useGameStore.getState())).toBe('call115');

    useGameStore.getState().finalizeEnding();

    expect(getActiveMajorUiLayer(useGameStore.getState())).toBe('ending');
  });

  test('advances mother check dialogue into emergency Face minigame', async () => {
    expect(existsSync(storePath)).toBe(true);
    if (!existsSync(storePath)) {
      return;
    }

    const { useGameStore } = await import('./useGameStore');
    useGameStore.getState().resetGame();
    useGameStore.getState().startFreeRoam();
    useGameStore.getState().openDialogue('checkMother');

    expect(useGameStore.getState().dialogue.currentBeat).toMatchObject({
      id: 'checkMother',
      speaker: 'Bạn'
    });

    useGameStore.getState().advanceDialogue();

    expect(useGameStore.getState().phase).toBe('emergency');
    expect(useGameStore.getState().dialogue.currentBeat).toMatchObject({
      id: 'noticeSymptoms',
      speaker: 'Bạn'
    });

    useGameStore.getState().advanceDialogue();
    const state = useGameStore.getState();

    expect(state.phase).toBe('minigame');
    expect(state.activeMinigame).toBe('face');
    expect(state.overlays.showMotherPortraitCutIn).toBe(true);
    expect(state.dialogue.currentBeat).toBeNull();
  });

  test('Face minigame requires all three symptom cues before completion', async () => {
    expect(existsSync(storePath)).toBe(true);
    if (!existsSync(storePath)) {
      return;
    }

    const { useGameStore } = await import('./useGameStore');
    useGameStore.getState().resetGame();
    useGameStore.getState().triggerEmergency(1000);
    useGameStore.getState().startMinigame('face');

    const accepted = useGameStore.getState().submitFaceHotspotClick({ x: 0.62, y: 0.64 });

    expect(accepted).toBe(true);
    expect(useGameStore.getState().minigames.face.completed).toBe(false);
    expect(useGameStore.getState().phase).toBe('minigame');

    useGameStore.getState().submitFaceHotspotClick({ x: 0.43, y: 0.56 });
    useGameStore.getState().submitFaceHotspotClick({ x: 0.56, y: 0.34 });
    const state = useGameStore.getState();

    expect(state.minigames.face.completed).toBe(true);
    expect(state.informationAccuracy).toBeGreaterThanOrEqual(0.72);
    expect(state.overlays.showMotherPortraitCutIn).toBe(false);
    expect(state.dialogue.currentBeat?.id).toBe('faceComplete');
  });

  test('wrong Face hotspot click records a mistake and keeps the minigame active', async () => {
    expect(existsSync(storePath)).toBe(true);
    if (!existsSync(storePath)) {
      return;
    }

    const { useGameStore } = await import('./useGameStore');
    useGameStore.getState().resetGame();
    useGameStore.getState().triggerEmergency(1000);
    useGameStore.getState().startMinigame('face');

    const accepted = useGameStore.getState().submitFaceHotspotClick({ x: 0.24, y: 0.24 });
    const state = useGameStore.getState();

    expect(accepted).toBe(false);
    expect(state.mistakesMade).toBe(1);
    expect(state.minigames.face.completed).toBe(false);
    expect(state.phase).toBe('minigame');
    expect(state.faceMinigameFeedback).toContain('miệng');
  });

  test('maps major phases to prototype audio modes', async () => {
    expect(existsSync(storePath)).toBe(true);
    if (!existsSync(storePath)) {
      return;
    }

    const { useGameStore } = await import('./useGameStore');
    useGameStore.getState().resetGame();

    expect(useGameStore.getState().audioMode).toBe('calm');

    useGameStore.getState().startFreeRoam();
    expect(useGameStore.getState().audioMode).toBe('calm');

    useGameStore.getState().triggerEmergency(1000);
    expect(useGameStore.getState().audioMode).toBe('intense');

    useGameStore.getState().setReportAccuracy(1);
    useGameStore.getState().finalizeEnding();
    expect(useGameStore.getState().audioMode).toBe('win');

    useGameStore.getState().resetGame();
    useGameStore.getState().triggerEmergency(1000);
    useGameStore.getState().setRemainingTime(0);
    useGameStore.getState().recordMistake(4);
    useGameStore.getState().finalizeEnding();
    expect(useGameStore.getState().audioMode).toBe('lose');
  });
});
