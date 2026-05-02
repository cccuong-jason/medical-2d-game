import { describe, expect, test } from 'vitest';

import {
  ROOM_INTERACTIONS,
  ROOM_LAYOUT,
  ROOM_METRICS,
  depthForIsoPosition,
  directionFromVector,
  getRoomInteractionMarkers,
  nearestRoomInteraction,
  projectIso,
  roomScreenBounds
} from './roomLayout';

describe('room layout contract', () => {
  test('projects Cartesian tiles into a 2:1 isometric room plane', () => {
    const zeroOrigin = {
      ...ROOM_METRICS,
      originX: 0,
      originY: 0
    };

    expect(projectIso({ tileX: 0, tileY: 0 }, zeroOrigin)).toEqual({ x: 0, y: 0 });
    expect(projectIso({ tileX: 1, tileY: 0 }, zeroOrigin)).toEqual({ x: 32, y: 16 });
    expect(projectIso({ tileX: 0, tileY: 1 }, zeroOrigin)).toEqual({ x: -32, y: 16 });
    expect(projectIso({ tileX: 2, tileY: 2 }, zeroOrigin)).toEqual({ x: 0, y: 64 });
  });

  test('uses feet depth so lower objects render in front', () => {
    const backTile = projectIso({ tileX: 1, tileY: 1 });
    const frontTile = projectIso({ tileX: 5, tileY: 4 });

    expect(depthForIsoPosition(backTile)).toBeLessThan(depthForIsoPosition(frontTile));
    expect(depthForIsoPosition(frontTile, 10)).toBe(depthForIsoPosition(frontTile) + 10);
  });

  test('maps movement vectors to eight manifest rotation directions', () => {
    expect(directionFromVector(0, 0)).toBeNull();
    expect(directionFromVector(1, 0)).toBe('east');
    expect(directionFromVector(-1, 0)).toBe('west');
    expect(directionFromVector(0, 1)).toBe('south');
    expect(directionFromVector(0, -1)).toBe('north');
    expect(directionFromVector(1, 1)).toBe('south-east');
    expect(directionFromVector(-1, -1)).toBe('north-west');
  });

  test('places the first playable room from accepted manifest assets', () => {
    expect(ROOM_LAYOUT.characters.map((character) => character.assetKey)).toEqual([
      'girlA',
      'mother'
    ]);
    expect(ROOM_LAYOUT.props.map((prop) => prop.assetKey)).toEqual(
      expect.arrayContaining(['woodSofa', 'refrigerator', 'bookcase', 'phoneCabinet'])
    );
    expect(ROOM_LAYOUT.floor.assetKey).toBe('terracottaFloor');
    expect(ROOM_LAYOUT.walls.assetKey).toBe('warmWall');
  });

  test('sizes the room composition large enough for the playable stage', () => {
    const bounds = roomScreenBounds();

    expect(bounds.width).toBeGreaterThanOrEqual(560);
    expect(bounds.height).toBeGreaterThanOrEqual(300);
    expect(bounds.centerX).toBeGreaterThan(420);
    expect(bounds.centerX).toBeLessThan(540);
  });

  test('scales characters up so symptom acting is readable against furniture', () => {
    for (const character of ROOM_LAYOUT.characters) {
      expect(character.scale).toBeGreaterThanOrEqual(1.25);
    }

    const largestPropScale = Math.max(...ROOM_LAYOUT.props.map((prop) => prop.scale));
    const smallestCharacterScale = Math.min(
      ...ROOM_LAYOUT.characters.map((character) => character.scale)
    );

    expect(smallestCharacterScale).toBeGreaterThan(largestPropScale);
  });

  test('defines Vietnamese-first interaction zones for the prototype loop', () => {
    expect(ROOM_INTERACTIONS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'checkMother',
          marker: expect.objectContaining({
            activeLabel: 'E',
            effect: 'bob',
            idleLabel: 'Hỏi thăm mẹ',
            offsetY: expect.any(Number),
            symbol: '?',
            targetHighlight: 'pixelPointer'
          }),
          nextPhase: 'emergency'
        }),
        expect.objectContaining({
          id: 'callEmergency',
          marker: expect.objectContaining({
            activeLabel: 'E',
            emergency: true,
            effect: 'blink',
            idleLabel: 'Gọi 115',
            symbol: '!'
          }),
          nextPhase: 'callEmergency'
        })
      ])
    );
  });

  test('returns idle and active in-world markers based on proximity and phase', () => {
    const motherTile = ROOM_LAYOUT.characters.find(
      (character) => character.id === 'mother'
    );
    const phoneTile = ROOM_LAYOUT.props.find((prop) => prop.id === 'phoneCabinet');

    expect(motherTile).toBeDefined();
    expect(phoneTile).toBeDefined();

    if (!motherTile || !phoneTile) {
      return;
    }

    const motherPosition = projectIso(motherTile);
    const motherIdlePosition = {
      x: motherPosition.x + 94,
      y: motherPosition.y
    };

    expect(getRoomInteractionMarkers(motherIdlePosition, 'freeRoam')).toEqual([
      expect.objectContaining({
        effect: 'bob',
        id: 'checkMother',
        label: 'Hỏi thăm mẹ',
        symbol: '?',
        state: 'idle',
        targetHighlight: 'pixelPointer'
      })
    ]);
    expect(getRoomInteractionMarkers(motherPosition, 'freeRoam')).toEqual([
      expect.objectContaining({
        effect: 'bob',
        id: 'checkMother',
        label: 'E',
        symbol: 'E',
        state: 'active',
        targetHighlight: 'pixelPointer'
      })
    ]);
    expect(getRoomInteractionMarkers(motherPosition, 'freeRoam')[0].position.y).toBeLessThan(
      motherPosition.y - 110
    );
    expect(getRoomInteractionMarkers(projectIso(phoneTile), 'emergency')).toEqual([
      expect.objectContaining({
        effect: 'blink',
        id: 'callEmergency',
        label: 'E',
        symbol: 'E',
        state: 'emergency',
        targetHighlight: 'urgentPointer'
      })
    ]);
    expect(getRoomInteractionMarkers(projectIso(phoneTile), 'emergency')[0].position.y).toBeLessThan(
      projectIso(phoneTile).y - 98
    );
    expect(
      getRoomInteractionMarkers(projectIso(phoneTile), 'freeRoam').some(
        (marker) => marker.id === 'callEmergency'
      )
    ).toBe(false);
  });

  test('finds only the nearest interaction available in the current game phase', () => {
    const motherTile = ROOM_LAYOUT.characters.find(
      (character) => character.id === 'mother'
    );
    const phoneTile = ROOM_LAYOUT.props.find((prop) => prop.id === 'phoneCabinet');

    expect(motherTile).toBeDefined();
    expect(phoneTile).toBeDefined();

    if (!motherTile || !phoneTile) {
      return;
    }

    expect(nearestRoomInteraction(projectIso(motherTile), 'freeRoam')?.id).toBe(
      'checkMother'
    );
    expect(nearestRoomInteraction(projectIso(motherTile), 'emergency')).toBeNull();
    expect(nearestRoomInteraction(projectIso(phoneTile), 'emergency')?.id).toBe(
      'callEmergency'
    );
  });

  test('places feedback-revised furniture with readable gaps and scale', () => {
    const sofa = ROOM_LAYOUT.props.find((prop) => prop.id === 'sofa');
    const bookshelf = ROOM_LAYOUT.props.find((prop) => prop.id === 'bookshelf');
    const fridge = ROOM_LAYOUT.props.find((prop) => prop.id === 'fridge');
    const phoneCabinet = ROOM_LAYOUT.props.find((prop) => prop.id === 'phoneCabinet');

    expect(sofa).toBeDefined();
    expect(bookshelf).toBeDefined();
    expect(fridge).toBeDefined();
    expect(phoneCabinet).toBeDefined();

    if (!sofa || !bookshelf || !fridge || !phoneCabinet) {
      return;
    }

    const sofaBookshelfTileGap = Math.hypot(
      sofa.tileX - bookshelf.tileX,
      sofa.tileY - bookshelf.tileY
    );

    expect(sofa.tileX).toBeGreaterThan(bookshelf.tileX);
    expect(sofaBookshelfTileGap).toBeGreaterThanOrEqual(1.35);
    expect(sofaBookshelfTileGap).toBeLessThanOrEqual(2.05);
    expect(fridge.tileX).toBeGreaterThanOrEqual(ROOM_LAYOUT.floor.widthTiles - 1.8);
    expect(fridge.tileY).toBeLessThanOrEqual(1);
    expect(phoneCabinet.scale).toBeLessThanOrEqual(0.72);
    expect(nearestRoomInteraction(projectIso(phoneCabinet), 'emergency')?.id).toBe(
      'callEmergency'
    );
  });
});
