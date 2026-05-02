import { describe, expect, test, vi } from 'vitest';
import { render } from '@testing-library/react';
import { App } from './App';
import { useGameStore } from '../store/useGameStore';

// Mock audio bridge to avoid Web Audio API issues in tests
vi.mock('../audio/usePrototypeAudioBridge', () => ({
  usePrototypeAudioBridge: vi.fn()
}));

// Mock GameCanvas to avoid Phaser initialization
vi.mock('../game/GameCanvas', () => ({
  GameCanvas: () => <div data-testid="game-canvas" />
}));

describe('App', () => {
  test('renders BootScreen initially', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.boot-screen')).not.toBeNull();
    expect(container.textContent).toContain('BE FAST OS');
  });

  test('renders MainMenu when route is menu', () => {
    useGameStore.setState({ route: 'menu' });
    const { container } = render(<App />);
    expect(container.querySelector('.menu-screen')).not.toBeNull();
    expect(container.textContent).toContain('Kỷ lục cao nhất');
  });

  test('renders SceneSelection when route is sceneSelection', () => {
    useGameStore.setState({ route: 'sceneSelection' });
    const { container } = render(<App />);
    expect(container.querySelector('.scene-screen')).not.toBeNull();
    expect(container.textContent).toContain('Chọn Màn Chơi');
  });

  test('renders Game UI when route is game', () => {
    useGameStore.setState({ route: 'game', phase: 'freeRoam' });
    const { getByTestId, container } = render(<App />);
    expect(getByTestId('game-canvas')).toBeDefined();
    expect(container.querySelector('.game-hud')).not.toBeNull();
  });
});
