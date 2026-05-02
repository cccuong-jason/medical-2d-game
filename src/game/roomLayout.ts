import { assetManifest } from './assetManifest';
import type { AppPhase } from '../store/useGameStore';

export type Direction = keyof typeof assetManifest.assets.characters.girlA.rotations;
export type CharacterAssetKey = keyof typeof assetManifest.assets.characters;
export type PropAssetKey = keyof typeof assetManifest.assets.props;
export type TileAssetKey = keyof typeof assetManifest.assets.tiles;

export type IsoMetrics = {
  tileWidth: number;
  tileHeight: number;
  originX: number;
  originY: number;
};

export type TilePosition = {
  tileX: number;
  tileY: number;
};

export type IsoPosition = {
  x: number;
  y: number;
};

export type RoomCharacter = TilePosition & {
  id: 'player' | 'mother';
  assetKey: CharacterAssetKey;
  direction: Direction;
  scale: number;
};

export type RoomProp = TilePosition & {
  id: string;
  assetKey: PropAssetKey;
  depthOffset: number;
  blocksMovement: boolean;
  scale: number;
};

export type RoomInteraction = {
  id: 'checkMother' | 'callEmergency';
  targetId: RoomCharacter['id'] | RoomProp['id'];
  label: string;
  marker: {
    activeLabel: 'E';
    emergency: boolean;
    effect: 'bob' | 'blink';
    idleLabel: string;
    idleRadiusPx: number;
    offsetY: number;
    symbol: '?' | '!' | 'E';
    targetHighlight: 'pixelPointer' | 'urgentPointer';
  };
  availableIn: AppPhase[];
  nextPhase: AppPhase;
  radiusPx: number;
};

export type RoomInteractionMarker = {
  id: RoomInteraction['id'];
  interaction: RoomInteraction;
  label: string;
  position: IsoPosition;
  state: 'idle' | 'active' | 'emergency';
  effect: RoomInteraction['marker']['effect'];
  symbol: RoomInteraction['marker']['symbol'];
  targetHighlight: RoomInteraction['marker']['targetHighlight'];
};

export const ROOM_METRICS: IsoMetrics = {
  tileWidth: assetManifest.grid.cartTileWidth,
  tileHeight: assetManifest.grid.cartTileHeight,
  originX: 448,
  originY: 150
};

export const ROOM_LAYOUT = {
  bounds: {
    minTileX: 0,
    minTileY: 0,
    maxTileX: 15,
    maxTileY: 11
  },
  floor: {
    assetKey: 'terracottaFloor' satisfies TileAssetKey,
    widthTiles: 16,
    depthTiles: 12,
    scale: 1.18
  },
  walls: {
    assetKey: 'warmWall' satisfies TileAssetKey,
    backTileY: -0.82,
    heightPx: 164
  },
  characters: [
    {
      id: 'player',
      assetKey: 'girlA',
      tileX: 8.5,
      tileY: 9.5,
      direction: 'north-east',
      scale: 1.38
    },
    {
      id: 'mother',
      assetKey: 'mother',
      tileX: 6.5,
      tileY: 5.5,
      direction: 'south-west',
      scale: 1.38
    }
  ],
  props: [
    {
      id: 'sofa',
      assetKey: 'woodSofa',
      tileX: 5.0,
      tileY: 4.0,
      depthOffset: 4,
      blocksMovement: true,
      scale: 0.98
    },
    {
      id: 'fridge',
      assetKey: 'refrigerator',
      tileX: 14.5,
      tileY: 1.5,
      depthOffset: 6,
      blocksMovement: true,
      scale: 0.96
    },
    {
      id: 'bookshelf',
      assetKey: 'bookcase',
      tileX: 2.0,
      tileY: 1.5,
      depthOffset: 4,
      blocksMovement: true,
      scale: 0.94
    },
    {
      id: 'bookshelf2',
      assetKey: 'bookcase',
      tileX: 2.0,
      tileY: 5.0,
      depthOffset: 4,
      blocksMovement: true,
      scale: 0.94
    },
    {
      id: 'phoneCabinet',
      assetKey: 'phoneCabinet',
      tileX: 12.0,
      tileY: 9.0,
      depthOffset: 2,
      blocksMovement: true,
      scale: 0.68
    },
    {
      id: 'sofa2',
      assetKey: 'woodSofa',
      tileX: 10.0,
      tileY: 4.0,
      depthOffset: 4,
      blocksMovement: true,
      scale: 0.98
    }
  ]
} as const;

export const ROOM_INTERACTIONS: RoomInteraction[] = [
  {
    id: 'checkMother',
    targetId: 'mother',
    label: 'Nhấn E để hỏi thăm mẹ',
    marker: {
      activeLabel: 'E',
      emergency: false,
      effect: 'bob',
      idleLabel: 'Hỏi thăm mẹ',
      idleRadiusPx: 132,
      offsetY: 122,
      symbol: '?',
      targetHighlight: 'pixelPointer'
    },
    availableIn: ['freeRoam'],
    nextPhase: 'emergency',
    radiusPx: 76
  },
  {
    id: 'callEmergency',
    targetId: 'phoneCabinet',
    label: 'Nhấn E để gọi 115',
    marker: {
      activeLabel: 'E',
      emergency: true,
      effect: 'blink',
      idleLabel: 'Gọi 115',
      idleRadiusPx: 144,
      offsetY: 110,
      symbol: '!',
      targetHighlight: 'urgentPointer'
    },
    availableIn: ['emergency', 'minigame'],
    nextPhase: 'callEmergency',
    radiusPx: 82
  }
];

export function projectIso(
  position: TilePosition,
  metrics: IsoMetrics = ROOM_METRICS
): IsoPosition {
  return {
    x: metrics.originX + (position.tileX - position.tileY) * (metrics.tileWidth / 2),
    y: metrics.originY + (position.tileX + position.tileY) * (metrics.tileHeight / 2)
  };
}

export function depthForIsoPosition(position: IsoPosition, depthOffset = 0) {
  return position.y + depthOffset;
}

export function roomScreenBounds(metrics: IsoMetrics = ROOM_METRICS) {
  const corners = [
    projectIso({ tileX: 0, tileY: 0 }, metrics),
    projectIso({ tileX: ROOM_LAYOUT.floor.widthTiles, tileY: 0 }, metrics),
    projectIso({ tileX: 0, tileY: ROOM_LAYOUT.floor.depthTiles }, metrics),
    projectIso(
      {
        tileX: ROOM_LAYOUT.floor.widthTiles,
        tileY: ROOM_LAYOUT.floor.depthTiles
      },
      metrics
    )
  ];
  const minX = Math.min(...corners.map((corner) => corner.x));
  const maxX = Math.max(...corners.map((corner) => corner.x));
  const minY = Math.min(...corners.map((corner) => corner.y));
  const maxY = Math.max(...corners.map((corner) => corner.y));

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
}

export function directionFromVector(dx: number, dy: number): Direction | null {
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
    return null;
  }

  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  if (angle >= -22.5 && angle < 22.5) {
    return 'east';
  }

  if (angle >= 22.5 && angle < 67.5) {
    return 'south-east';
  }

  if (angle >= 67.5 && angle < 112.5) {
    return 'south';
  }

  if (angle >= 112.5 && angle < 157.5) {
    return 'south-west';
  }

  if (angle >= 157.5 || angle < -157.5) {
    return 'west';
  }

  if (angle >= -157.5 && angle < -112.5) {
    return 'north-west';
  }

  if (angle >= -112.5 && angle < -67.5) {
    return 'north';
  }

  return 'north-east';
}

export function findRoomTarget(targetId: RoomInteraction['targetId']) {
  return (
    ROOM_LAYOUT.characters.find((character) => character.id === targetId) ??
    ROOM_LAYOUT.props.find((prop) => prop.id === targetId)
  );
}

export function nearestRoomInteraction(
  position: IsoPosition,
  phase: AppPhase
): RoomInteraction | null {
  let nearest: {
    interaction: RoomInteraction;
    distance: number;
  } | null = null;

  for (const interaction of ROOM_INTERACTIONS) {
    if (!interaction.availableIn.includes(phase)) {
      continue;
    }

    const target = findRoomTarget(interaction.targetId);
    if (!target) {
      continue;
    }

    const targetPosition = projectIso(target);
    const distance = Math.hypot(targetPosition.x - position.x, targetPosition.y - position.y);

    if (distance <= interaction.radiusPx && (!nearest || distance < nearest.distance)) {
      nearest = {
        interaction,
        distance
      };
    }
  }

  return nearest?.interaction ?? null;
}

export function getRoomInteractionMarkers(
  position: IsoPosition,
  phase: AppPhase
): RoomInteractionMarker[] {
  const markers: Array<RoomInteractionMarker & { distance: number }> = [];

  for (const interaction of ROOM_INTERACTIONS) {
    if (!interaction.availableIn.includes(phase)) {
      continue;
    }

    const target = findRoomTarget(interaction.targetId);
    if (!target) {
      continue;
    }

    const targetPosition = projectIso(target);
    const distance = Math.hypot(targetPosition.x - position.x, targetPosition.y - position.y);

    if (distance > interaction.marker.idleRadiusPx) {
      continue;
    }

    const inActiveRange = distance <= interaction.radiusPx;
    const state = inActiveRange
      ? interaction.marker.emergency
        ? 'emergency'
        : 'active'
      : 'idle';

    markers.push({
      id: interaction.id,
      interaction,
      label: inActiveRange ? interaction.marker.activeLabel : interaction.marker.idleLabel,
      position: {
        x: targetPosition.x,
        y: targetPosition.y - interaction.marker.offsetY
      },
      state,
      effect: interaction.marker.effect,
      symbol: inActiveRange ? interaction.marker.activeLabel : interaction.marker.symbol,
      targetHighlight: interaction.marker.targetHighlight,
      distance
    });
  }

  return markers
    .sort((left, right) => left.distance - right.distance)
    .map(({ distance: _distance, ...marker }) => marker);
}
