import { describe, expect, test } from 'vitest';

import { BACKGROUND_MUSIC_PATH, getAudioModeForPhase } from './prototypeAudio';

describe('prototype audio assets', () => {
  test('uses the downloaded background music asset for the music bed', () => {
    expect(BACKGROUND_MUSIC_PATH).toBe('/assets/audio/background_music.mp3');
  });

  test('keeps start and introduction screens in calm music mode', () => {
    expect(getAudioModeForPhase({ phase: 'loading' })).toBe('calm');
    expect(getAudioModeForPhase({ phase: 'start' })).toBe('calm');
    expect(getAudioModeForPhase({ phase: 'introduction' })).toBe('calm');
  });
});
