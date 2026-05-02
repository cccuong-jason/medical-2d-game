import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const sceneSource = readFileSync(
  resolve(process.cwd(), 'src/game/scenes/RoomScene.ts'),
  'utf8'
);

describe('RoomScene presentation contract', () => {
  test('does not draw the emergency border in world space', () => {
    expect(sceneSource).not.toContain('strokeRoundedRect');
  });

  test('keeps the pixel interaction marker compact', () => {
    expect(sceneSource).toContain("fontSize: marker.state === 'idle' ? '12px' : '16px'");
    expect(sceneSource).not.toContain("'28px'");
  });
});
