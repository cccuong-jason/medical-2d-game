import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useGameStore } from '../store/useGameStore';
import { App } from './App';

vi.mock('../game/GameCanvas', () => ({
  GameCanvas: () => <div data-testid="game-canvas" />
}));

describe('App unified gameplay shell layout', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    useGameStore.getState().resetGame();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  test('renders one unified game shell without sidebar dashboard structure', () => {
    act(() => {
      root.render(<App />);
    });

    expect(container.querySelector('.game-shell')).not.toBeNull();
    expect(container.querySelector('.game-space')).not.toBeNull();
    expect(container.querySelector('.app-layout')).toBeNull();
    expect(container.querySelector('.player-sidebar')).toBeNull();
    expect(container.querySelector('.game-column')).toBeNull();
    expect(container.querySelector('.grid')).toBeNull();
    expect(container.textContent).not.toContain('Trạng thái hiện tại');
    expect(container.textContent).not.toContain('Vòng chơi hiện có');
    expect(container.textContent).not.toContain('Khối tài sản nền tảng');
    expect(container.querySelector('.game-actions')).toBeNull();
  });

  test('keeps loading screen and HUD inside the game shell', () => {
    act(() => {
      root.render(<App />);
    });

    const gameShell = container.querySelector('.game-shell');

    expect(gameShell?.querySelector('.game-hud')).not.toBeNull();
    expect(gameShell?.querySelector('[data-ui-layer="loading"]')).not.toBeNull();
    expect(gameShell?.textContent).toContain('Đang nạp');
  });

  test('renders game start and introduction screens as in-game panels', () => {
    act(() => {
      root.render(<App />);
    });

    act(() => {
      useGameStore.getState().finishLoading();
    });

    expect(container.querySelector('[data-ui-layer="start"]')).not.toBeNull();
    expect(container.textContent).toContain('Bắt đầu');

    act(() => {
      useGameStore.getState().openIntroduction();
    });

    expect(container.querySelector('[data-ui-layer="introduction"]')).not.toBeNull();
    expect(container.textContent).toContain('Giới thiệu');
  });

  test('uses one in-game call panel instead of overlapping call and dialogue boxes', () => {
    useGameStore.getState().triggerEmergency(1000);
    useGameStore.getState().enterCallEmergency();

    act(() => {
      root.render(<App />);
    });

    expect(container.querySelectorAll('[data-ui-layer]').length).toBe(1);
    expect(container.querySelector('[data-ui-layer="call115"]')).not.toBeNull();
    expect(
      container.querySelector('.game-shell')?.querySelector('[data-ui-layer="call115"]')
    ).not.toBeNull();
    expect(container.textContent).toContain('Cuộc gọi 115');
    expect(container.textContent).toContain('thời điểm bắt đầu bất thường');
  });
});
