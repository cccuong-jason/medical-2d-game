import { describe, expect, test } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

describe('useGameStore', async () => {
  const storePath = resolve(__dirname, './useGameStore.ts');

  test('initializes with boot route and zero highscore', async () => {
    expect(existsSync(storePath)).toBe(true);
    if (!existsSync(storePath)) {
      return;
    }

    const { useGameStore } = await import('./useGameStore');
    const state = useGameStore.getState();

    expect(state.route).toBe('boot');
    expect(state.bestScore).toBeTypeOf('number');
    expect(state.playerName).toBeTypeOf('string');
    expect(state.phase).toBe('loading');
  });

  test('navigates between routes', async () => {
    const { useGameStore } = await import('./useGameStore');
    useGameStore.getState().navigate('menu');
    expect(useGameStore.getState().route).toBe('menu');

    useGameStore.getState().navigate('sceneSelection');
    expect(useGameStore.getState().route).toBe('sceneSelection');
  });

  test('sets player name and persists to localStorage', async () => {
    const { useGameStore } = await import('./useGameStore');
    useGameStore.getState().setPlayerName('Test Player');
    expect(useGameStore.getState().playerName).toBe('Test Player');
    expect(localStorage.getItem('beFastPlayerName')).toBe('Test Player');
  });

  test('escalates to emergency mode when symptoms trigger', async () => {
    const { useGameStore } = await import('./useGameStore');
    useGameStore.getState().resetGame();
    useGameStore.getState().triggerEmergency(1000);
    const state = useGameStore.getState();

    expect(state.phase).toBe('emergency');
    expect(state.motherCondition).toBe('onset');
    expect(state.audioMode).toBe('intense');
  });

  test('calculates an ending and tracks new best score', async () => {
    const { useGameStore } = await import('./useGameStore');
    useGameStore.getState().resetGame();
    useGameStore.getState().setPlayerName('Champion');
    
    // Set a known high score first
    localStorage.setItem('beFastBestScore', '50');
    
    // Re-initialize to pick up the score
    useGameStore.getState().resetGame();
    
    useGameStore.getState().triggerEmergency(Date.now());
    useGameStore.getState().setRemainingTime(170); // High score
    useGameStore.getState().setReportAccuracy(1.0);
    useGameStore.getState().finalizeEnding();
    
    const state = useGameStore.getState();
    expect(state.ending?.isNewBest).toBe(true);
    expect(state.bestScore).toBe(state.ending?.score);
    expect(localStorage.getItem('beFastBestScore')).toBe(state.bestScore.toString());
  });

  test('derives emergency countdown correctly', async () => {
    const { getEmergencyRemainingSeconds, isEmergencyTimerActive } = await import(
      './useGameStore'
    );

    expect(
      getEmergencyRemainingSeconds({
        startedAt: 1000,
        now: 11000,
        totalSeconds: 180
      })
    ).toBe(170);
    expect(isEmergencyTimerActive('emergency')).toBe(true);
    expect(isEmergencyTimerActive('loading')).toBe(false);
  });
});
