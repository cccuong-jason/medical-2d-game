import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');

describe('global visual style contract', () => {
  test('uses a Vietnamese-safe local font stack instead of the faulty decorative stack', () => {
    expect(css).toContain('@font-face');
    expect(css).toContain('DearPix');
    expect(css).toContain('/assets/font/dearpix-2-01.otf.woff2/dearpix-2-01.otf.woff2');
    expect(css).toContain('system-ui');
    expect(css).toContain('"Segoe UI"');
    expect(css).toContain('"Noto Sans"');
    expect(css).not.toContain('Nunito Sans');
    expect(css).not.toContain('Fraunces');
  });

  test('makes the game space the dominant viewport surface', () => {
    expect(css).toMatch(/\.game-shell\s*{[^}]*min-height:\s*100vh/s);
    expect(css).toMatch(/\.phaser-host\s*{[^}]*min-height:\s*min\(82vh,\s*820px\)/s);
    expect(css).not.toContain('grid-template-columns: minmax(280px, 360px)');
  });

  test('uses a pixel-art HUD style instead of web glass panels', () => {
    expect(css).toContain('image-rendering: pixelated');
    expect(css).toMatch(/\.game-hud,[\s\S]*?\.face-minigame-hud\s*{[^}]*border-radius:\s*0/s);
    expect(css).toContain('4px 4px 0');
    expect(css).not.toContain('backdrop-filter');
  });
});
