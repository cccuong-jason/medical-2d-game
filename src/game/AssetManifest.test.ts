import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const manifestPath = resolve(process.cwd(), 'src/game/AssetManifest.json');
const requiredDirections = [
  'south',
  'south-east',
  'east',
  'north-east',
  'north',
  'north-west',
  'west',
  'south-west'
] as const;

function resolvePublicAsset(assetPath: string) {
  return resolve(process.cwd(), 'public', assetPath.replace(/^\//, ''));
}

describe('AssetManifest foundation contract', () => {
  test('locks the project to Vietnamese-only player content', () => {
    expect(existsSync(manifestPath)).toBe(true);
    if (!existsSync(manifestPath)) {
      return;
    }

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      meta?: { language?: string };
    };

    expect(manifest.meta?.language).toBe('vi');
  });

  test('defines grid metrics, projection formulas, and dual asset classes', () => {
    expect(existsSync(manifestPath)).toBe(true);
    if (!existsSync(manifestPath)) {
      return;
    }

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      grid?: {
        cartTileWidth?: number;
        cartTileHeight?: number;
        projection?: { isoXFormula?: string; isoYFormula?: string };
      };
      assets?: {
        characters?: Record<string, unknown>;
        portraits?: Record<string, unknown>;
      };
    };

    expect(manifest.grid?.cartTileWidth).toBe(64);
    expect(manifest.grid?.cartTileHeight).toBe(32);
    expect(manifest.grid?.projection?.isoXFormula).toBe('x - y');
    expect(manifest.grid?.projection?.isoYFormula).toBe('(x + y) / 2');
    expect(Object.keys(manifest.assets?.characters ?? {})).toContain('girlA');
    expect(Object.keys(manifest.assets?.portraits ?? {})).toContain(
      'motherFaceDrooping'
    );
  });

  test('uses feet-capsule collision for movable character sprites', () => {
    expect(existsSync(manifestPath)).toBe(true);
    if (!existsSync(manifestPath)) {
      return;
    }

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      assets?: {
        characters?: Record<
          string,
          {
            collision?: {
              shape?: string;
              orientation?: string;
              width?: number;
              height?: number;
            };
          }
        >;
      };
    };

    for (const characterKey of ['girlA', 'mother']) {
      const collision = manifest.assets?.characters?.[characterKey]?.collision;

      expect(collision?.shape).toBe('capsule');
      expect(collision?.orientation).toBe('horizontal');
      expect(collision?.width).toBe(24);
      expect(collision?.height).toBe(12);
    }
  });

  test('points golden-set manifest entries to generated local assets', () => {
    expect(existsSync(manifestPath)).toBe(true);
    if (!existsSync(manifestPath)) {
      return;
    }

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      assets?: {
        characters?: Record<
          string,
          {
            pixelSize?: { width?: number; height?: number };
            rotations?: Record<string, string>;
          }
        >;
        props?: Record<string, { path?: string }>;
        portraits?: Record<string, { path?: string }>;
        tiles?: Record<string, { path?: string }>;
      };
    };

    for (const characterKey of ['girlA', 'mother']) {
      const character = manifest.assets?.characters?.[characterKey];

      expect(character?.pixelSize).toEqual({ width: 92, height: 92 });
      for (const direction of requiredDirections) {
        const rotationPath = character?.rotations?.[direction];

        expect(rotationPath).toBeTypeOf('string');
        expect(existsSync(resolvePublicAsset(rotationPath ?? ''))).toBe(true);
      }
    }

    for (const propKey of [
      'woodSofa',
      'refrigerator',
      'bookcase',
      'phoneCabinet'
    ]) {
      const assetPath = manifest.assets?.props?.[propKey]?.path;

      expect(assetPath).toBeTypeOf('string');
      expect(existsSync(resolvePublicAsset(assetPath ?? ''))).toBe(true);
    }

    for (const portraitKey of ['motherFaceDrooping', 'faceDroopSymptomIcon']) {
      const assetPath = manifest.assets?.portraits?.[portraitKey]?.path;

      expect(assetPath).toBeTypeOf('string');
      expect(existsSync(resolvePublicAsset(assetPath ?? ''))).toBe(true);
    }

    for (const tileKey of ['terracottaFloor', 'warmWall']) {
      const assetPath = manifest.assets?.tiles?.[tileKey]?.path;

      expect(assetPath).toBeTypeOf('string');
      expect(existsSync(resolvePublicAsset(assetPath ?? ''))).toBe(true);
    }
  });
});
