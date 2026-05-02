import { describe, expect, test } from 'vitest';

import { FACE_HOTSPOTS, scoreFaceHotspotClick } from './faceHotspots';

describe('face hotspot scoring', () => {
  test('defines the three Face cues used by the fullscreen minigame', () => {
    expect(FACE_HOTSPOTS.map((hotspot) => hotspot.id)).toEqual([
      'mouthDroop',
      'cheekAsymmetry',
      'eyeAsymmetry'
    ]);
  });

  test('accepts clicks on the drooping mouth target', () => {
    const result = scoreFaceHotspotClick({ x: 0.62, y: 0.64 });

    expect(result.correct).toBe(true);
    expect(result.hotspotId).toBe('mouthDroop');
    expect(FACE_HOTSPOTS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'mouthDroop',
          label: 'Miệng bị xệ một bên'
        })
      ])
    );
  });

  test('accepts clicks on the uneven cheek target', () => {
    const result = scoreFaceHotspotClick({ x: 0.43, y: 0.56 });

    expect(result.correct).toBe(true);
    expect(result.hotspotId).toBe('cheekAsymmetry');
  });

  test('accepts clicks on the eye asymmetry target', () => {
    const result = scoreFaceHotspotClick({ x: 0.56, y: 0.34 });

    expect(result.correct).toBe(true);
    expect(result.hotspotId).toBe('eyeAsymmetry');
  });

  test('rejects unrelated face areas with Vietnamese corrective feedback', () => {
    const result = scoreFaceHotspotClick({ x: 0.28, y: 0.28 });

    expect(result.correct).toBe(false);
    expect(result.hotspotId).toBeNull();
    expect(result.feedback).toContain('miệng');
  });
});
