import Phaser from 'phaser';

import { prototypeAudio } from '../../audio/prototypeAudio';
import { useGameStore, type AppPhase, type MotherCondition } from '../../store/useGameStore';
import { assetManifest } from '../assetManifest';
import {
  ROOM_INTERACTIONS,
  ROOM_LAYOUT,
  depthForIsoPosition,
  directionFromVector,
  getRoomInteractionMarkers,
  projectIso,
  roomScreenBounds,
  type CharacterAssetKey,
  type Direction,
  type IsoPosition,
  type PropAssetKey,
  type RoomInteraction,
  type RoomInteractionMarker,
  type RoomProp,
  type TilePosition
} from '../roomLayout';

type GameState = ReturnType<typeof useGameStore.getState>;

const MOVABLE_PHASES: AppPhase[] = [
  'freeRoam',
  'emergency',
  'callEmergency'
];
const PLAYER_SPEED_TILES_PER_SECOND = 1.75;
const PLAYER_COLLISION_RADIUS = 14;
const ROOM_CAMERA_ZOOM = 0.95;
const ROOM_CAMERA_CENTER_Y = 280;

// Forced V6 Key naming to break ALL caching
function getCharacterTextureKey(characterKey: CharacterAssetKey, direction: Direction) {
  return `v6_char_${characterKey}_${direction}`;
}

function getPropTextureKey(propKey: PropAssetKey) {
  return `v6_prop_${propKey}`;
}

function getTileTextureKey(tileKey: keyof typeof assetManifest.assets.tiles) {
  return `v6_tile_${tileKey}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// Definitively resolve paths for Vite/Phaser in a public folder context
const resolveAssetUrl = (rawPath: string) => {
  let p = rawPath;
  if (p.startsWith('/')) {
    p = p.slice(1);
  }
  // Add unique version to bust any browser/proxy cache
  return `${p}?v=6_${Date.now()}`;
};

export class RoomScene extends Phaser.Scene {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW?: Phaser.Input.Keyboard.Key;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyS?: Phaser.Input.Keyboard.Key;
  private keyD?: Phaser.Input.Keyboard.Key;
  private keyE?: Phaser.Input.Keyboard.Key;
  private player?: Phaser.GameObjects.Image;
  private mother?: Phaser.GameObjects.Image;
  private propImages = new Map<RoomProp['id'], Phaser.GameObjects.Image>();
  private interactionMarkerPointers = new Map<RoomInteraction['id'], Phaser.GameObjects.Graphics>();
  private interactionMarkerTexts = new Map<RoomInteraction['id'], Phaser.GameObjects.Text>();
  private dangerOverlay?: Phaser.GameObjects.Rectangle;
  private unsubscribeStore?: () => void;
  private lastFootstepAt = 0;
  private playerTile: TilePosition = {
    tileX: ROOM_LAYOUT.characters[0].tileX,
    tileY: ROOM_LAYOUT.characters[0].tileY
  };
  private playerDirection: Direction = ROOM_LAYOUT.characters[0].direction;
  private currentPhase: AppPhase = useGameStore.getState().phase;
  private currentMotherCondition: MotherCondition = useGameStore.getState().motherCondition;

  constructor() {
    super('RoomScene');
  }

  preload() {
    console.warn('[RoomScene] %cRE-INITIALIZING ASSET LOADER V6', 'color: yellow; font-weight: bold');

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error(`[RoomScene] FAILED TO LOAD: ${file.key} from URL: ${file.url}`);
    });

    // 1. Characters
    const charMap = assetManifest.assets.characters;
    (Object.keys(charMap) as CharacterAssetKey[]).forEach((ck) => {
      const charData = charMap[ck];
      (Object.keys(charData.rotations) as Direction[]).forEach((dir) => {
        const key = getCharacterTextureKey(ck, dir);
        const url = resolveAssetUrl(charData.rotations[dir]);
        this.load.image(key, url);
      });
    });

    // 2. Props
    const propMap = assetManifest.assets.props;
    (Object.keys(propMap) as PropAssetKey[]).forEach((pk) => {
      const propData = propMap[pk];
      if (propData && propData.path) {
        const key = getPropTextureKey(pk);
        const url = resolveAssetUrl(propData.path);
        this.load.image(key, url);
      }
    });

    // 3. Tiles
    const tileMap = assetManifest.assets.tiles;
    (Object.keys(tileMap) as Array<keyof typeof tileMap>).forEach((tk) => {
      const tileData = tileMap[tk];
      if (tileData && tileData.path) {
        const key = getTileTextureKey(tk);
        const url = resolveAssetUrl(tileData.path);
        this.load.image(key, url);
      }
    });
  }

  create() {
    console.warn('[RoomScene] %cSCENE CREATE V6 READY', 'color: green; font-weight: bold');
    this.cameras.main.setBackgroundColor('#201817');
    
    this.createRoomShell();
    this.createFloor();
    this.createProps();
    this.createCharacters();
    this.createSceneHud();
    this.configureCamera();
    this.configureInput();
    
    this.syncFromStore(useGameStore.getState());
    this.unsubscribeStore = useGameStore.subscribe((state) => {
      this.syncFromStore(state);
    });
    
    this.events.once('shutdown', () => this.disposeStoreSubscription());
    this.events.once('destroy', () => this.disposeStoreSubscription());
  }

  update(time: number, delta: number) {
    this.updatePlayerMovement(time, delta);
    this.updateInteractionMarkers();
  }

  private createRoomShell() {
    const graphics = this.add.graphics();
    const corner = projectIso({ tileX: 0, tileY: 0 });
    const right = projectIso({ tileX: ROOM_LAYOUT.floor.widthTiles, tileY: 0 });
    const left = projectIso({ tileX: 0, tileY: ROOM_LAYOUT.floor.depthTiles });
    const wallHeight = ROOM_LAYOUT.walls.heightPx;

    graphics.fillStyle(0xf6d0a2, 1);
    graphics.beginPath();
    graphics.moveTo(corner.x, corner.y);
    graphics.lineTo(right.x, right.y);
    graphics.lineTo(right.x, right.y - wallHeight);
    graphics.lineTo(corner.x, corner.y - wallHeight);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(0xe9bb8b, 1);
    graphics.beginPath();
    graphics.moveTo(corner.x, corner.y);
    graphics.lineTo(left.x, left.y);
    graphics.lineTo(left.x, left.y - wallHeight);
    graphics.lineTo(corner.x, corner.y - wallHeight);
    graphics.closePath();
    graphics.fillPath();

    graphics.lineStyle(7, 0x7b4a32, 1);
    graphics.lineBetween(corner.x, corner.y, right.x, right.y);
    graphics.lineBetween(corner.x, corner.y, left.x, left.y);
    graphics.lineStyle(2, 0xb47451, 0.55);
    graphics.lineBetween(corner.x, corner.y - wallHeight, right.x, right.y - wallHeight);
    graphics.lineBetween(corner.x, corner.y - wallHeight, left.x, left.y - wallHeight);
    graphics.lineStyle(2, 0x8d5638, 0.42);
    graphics.lineBetween(
      corner.x,
      corner.y - Math.round(wallHeight * 0.36),
      right.x,
      right.y - Math.round(wallHeight * 0.36)
    );
    graphics.lineBetween(
      corner.x,
      corner.y - Math.round(wallHeight * 0.36),
      left.x,
      left.y - Math.round(wallHeight * 0.36)
    );
    graphics.setDepth(0);
  }

  private createFloor() {
    for (let tileX = 0; tileX < ROOM_LAYOUT.floor.widthTiles; tileX += 1) {
      for (let tileY = 0; tileY < ROOM_LAYOUT.floor.depthTiles; tileY += 1) {
        const position = projectIso({ tileX, tileY });
        const texKey = getTileTextureKey(ROOM_LAYOUT.floor.assetKey);
        this.add
          .image(position.x, position.y, texKey)
          .setOrigin(0.5, 0.5)
          .setScale(ROOM_LAYOUT.floor.scale)
          .setDepth(depthForIsoPosition(position, -20));
      }
    }
  }

  private createProps() {
    for (const prop of ROOM_LAYOUT.props) {
      const manifestProp = assetManifest.assets.props[prop.assetKey];
      const position = projectIso(prop);
      const texKey = getPropTextureKey(prop.assetKey);

      const propImage = this.add
        .image(position.x, position.y, texKey)
        .setOrigin(manifestProp.anchor.x, manifestProp.anchor.y)
        .setScale(prop.scale)
        .setDepth(depthForIsoPosition(position, prop.depthOffset));

      this.propImages.set(prop.id, propImage);
    }
  }

  private createCharacters() {
    const playerLayout = ROOM_LAYOUT.characters.find((character) => character.id === 'player');
    const motherLayout = ROOM_LAYOUT.characters.find((character) => character.id === 'mother');

    if (!playerLayout || !motherLayout) {
      return;
    }

    const playerManifest = assetManifest.assets.characters[playerLayout.assetKey];
    const motherManifest = assetManifest.assets.characters[motherLayout.assetKey];
    const playerPosition = projectIso(playerLayout);
    const motherPosition = projectIso(motherLayout);

    this.playerTile = {
      tileX: playerLayout.tileX,
      tileY: playerLayout.tileY
    };

    this.player = this.add
      .image(
        playerPosition.x,
        playerPosition.y,
        getCharacterTextureKey(playerLayout.assetKey, playerLayout.direction)
      )
      .setOrigin(playerManifest.anchor.x, playerManifest.anchor.y)
      .setScale(playerLayout.scale)
      .setDepth(depthForIsoPosition(playerPosition));

    this.mother = this.add
      .image(
        motherPosition.x,
        motherPosition.y,
        getCharacterTextureKey(motherLayout.assetKey, motherLayout.direction)
      )
      .setOrigin(motherManifest.anchor.x, motherManifest.anchor.y)
      .setScale(motherLayout.scale)
      .setDepth(depthForIsoPosition(motherPosition));
  }

  private createSceneHud() {
    for (const interaction of ROOM_INTERACTIONS) {
      const markerPointer = this.add.graphics().setDepth(9999).setVisible(false);
      const markerText = this.add
        .text(0, 0, '', {
          align: 'center',
          backgroundColor: 'rgba(28, 20, 18, 0.92)',
          color: '#fff4d7',
          fontFamily: 'DearPix, system-ui, Segoe UI, Noto Sans, Arial, sans-serif',
          fontSize: '14px',
          fontStyle: '700',
          padding: {
            x: 5,
            y: 2
          }
        })
        .setOrigin(0.5, 1)
        .setDepth(10000)
        .setVisible(false);

      this.interactionMarkerPointers.set(interaction.id, markerPointer);
      this.interactionMarkerTexts.set(interaction.id, markerText);
    }

    this.dangerOverlay = this.add
      .rectangle(480, 280, 960, 560, 0x24364b, 0.18)
      .setDepth(9000)
      .setVisible(false);
  }

  private configureInput() {
    if (!this.input.keyboard) {
      return;
    }

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  private configureCamera() {
    const bounds = roomScreenBounds();
    this.cameras.main.setZoom(ROOM_CAMERA_ZOOM);
    this.cameras.main.centerOn(bounds.centerX, ROOM_CAMERA_CENTER_Y);
  }

  private updatePlayerMovement(time: number, delta: number) {
    if (!this.player || !MOVABLE_PHASES.includes(this.currentPhase)) {
      return;
    }

    const inputX = Number(this.isKeyDown(this.cursors?.right, this.keyD)) -
      Number(this.isKeyDown(this.cursors?.left, this.keyA));
    const inputY = Number(this.isKeyDown(this.cursors?.down, this.keyS)) -
      Number(this.isKeyDown(this.cursors?.up, this.keyW));

    if (inputX === 0 && inputY === 0) {
      return;
    }

    const magnitude = Math.hypot(inputX, inputY);
    const normalizedX = inputX / magnitude;
    const normalizedY = inputY / magnitude;
    const nextDirection = directionFromVector(normalizedX, normalizedY);

    if (nextDirection && nextDirection !== this.playerDirection) {
      this.playerDirection = nextDirection;
      this.player.setTexture(getCharacterTextureKey('girlA', nextDirection));
    }

    const step = PLAYER_SPEED_TILES_PER_SECOND * (delta / 1000);
    const nextTile = {
      tileX: clamp(
        this.playerTile.tileX + (normalizedX + normalizedY) * step,
        ROOM_LAYOUT.bounds.minTileX + 0.2,
        ROOM_LAYOUT.bounds.maxTileX - 0.2
      ),
      tileY: clamp(
        this.playerTile.tileY + (normalizedY - normalizedX) * step,
        ROOM_LAYOUT.bounds.minTileY + 0.2,
        ROOM_LAYOUT.bounds.maxTileY - 0.2
      )
    };

    if (this.isBlocked(nextTile.tileX, nextTile.tileY)) {
      return;
    }

    const nextPosition = projectIso(nextTile);
    this.playerTile = nextTile;
    this.player.setPosition(nextPosition.x, nextPosition.y);
    this.player.setDepth(depthForIsoPosition(nextPosition));

    if (time - this.lastFootstepAt >= 280) {
      prototypeAudio.playSfx('footstep');
      this.lastFootstepAt = time;
    }
  }

  private updateInteractionMarkers() {
    if (!this.player) {
      return;
    }

    const playerPosition = {
      x: this.player.x,
      y: this.player.y
    };
    const markers = getRoomInteractionMarkers(playerPosition, this.currentPhase);

    for (const markerText of this.interactionMarkerTexts.values()) {
      markerText.setVisible(false);
    }
    for (const markerPointer of this.interactionMarkerPointers.values()) {
      markerPointer.clear().setVisible(false);
    }
    this.resetTargetImageEffects();

    for (const marker of markers) {
      this.presentInteractionMarker(marker);
    }

    const activeMarker = markers.find((marker) => marker.state !== 'idle');

    if (activeMarker && this.keyE && Phaser.Input.Keyboard.JustDown(this.keyE)) {
      prototypeAudio.playSfx('interaction');

      if (activeMarker.id === 'checkMother') {
        useGameStore.getState().openDialogue('checkMother');
      }

      if (activeMarker.id === 'callEmergency') {
        useGameStore.getState().enterCallEmergency();
      }
    }
  }

  private presentInteractionMarker(marker: RoomInteractionMarker) {
    const markerText = this.interactionMarkerTexts.get(marker.id);
    const markerPointer = this.interactionMarkerPointers.get(marker.id);
    if (!markerText || !markerPointer) {
      return;
    }

    const emergency = marker.state === 'emergency';
    const active = marker.state !== 'idle';
    const effectPhase = marker.effect === 'blink' ? this.time.now / 120 : this.time.now / 280;
    const pulse = (Math.sin(effectPhase) + 1) / 2;
    const bobOffset = marker.effect === 'bob' ? pulse * 4 : pulse * 1.5;
    const markerColor = emergency ? 0xff5140 : active ? 0xffd166 : 0xfff0a8;
    const markerAlpha = marker.effect === 'blink' ? 0.48 + pulse * 0.5 : 1;
    const markerX = marker.position.x;
    const markerY = marker.position.y - bobOffset;

    markerPointer
      .clear()
      .fillStyle(markerColor, markerAlpha)
      .fillTriangle(markerX - 5, markerY + 2, markerX + 5, markerY + 2, markerX, markerY + 11)
      .lineStyle(1, 0x2a1713, markerAlpha)
      .strokeTriangle(markerX - 5, markerY + 2, markerX + 5, markerY + 2, markerX, markerY + 11)
      .setVisible(true);

    markerText
      .setText(marker.symbol)
      .setPosition(markerX, markerY)
      .setAlpha(markerAlpha)
      .setStyle({
        align: 'center',
        backgroundColor: emergency ? 'rgba(119, 28, 22, 0.94)' : 'rgba(31, 22, 18, 0.94)',
        color: emergency ? '#ffe9d8' : '#fff4d7',
        fontFamily: 'DearPix, system-ui, Segoe UI, Noto Sans, Arial, sans-serif',
        fontSize: marker.state === 'idle' ? '12px' : '16px',
        fontStyle: '700',
        padding: {
          x: marker.state === 'idle' ? 4 : 5,
          y: marker.state === 'idle' ? 1 : 2
        }
      })
      .setVisible(true);

    this.applyTargetImageEffect(marker, pulse);
  }

  private applyTargetImageEffect(marker: RoomInteractionMarker, pulse: number) {
    const tint = marker.targetHighlight === 'urgentPointer' ? 0xffb5a9 : 0xfff0c6;
    const alpha = marker.state === 'idle' ? 0.12 : 0.24 + pulse * 0.18;

    if (marker.interaction.targetId === 'mother') {
      this.mother?.setTint(tint);
      this.mother?.setAlpha(1);
      return;
    }

    const targetImage = this.propImages.get(marker.interaction.targetId);
    if (targetImage) {
      targetImage.setTint(tint);
      targetImage.setAlpha(clamp(0.95 + alpha, 0, 1));
    }
  }

  private resetTargetImageEffects() {
    for (const propImage of this.propImages.values()) {
      propImage.clearTint();
      propImage.setAlpha(1);
    }

    if (!this.mother) {
      return;
    }

    if (this.currentMotherCondition === 'normal') {
      this.mother.clearTint();
      this.mother.setAlpha(1);
      return;
    }

    this.mother.setTint(0xffc2b7);
    this.mother.setAlpha(1);
  }

  private syncFromStore(state: GameState) {
    this.currentPhase = state.phase;
    this.currentMotherCondition = state.motherCondition;
    this.updateDangerPresentation(state.phase, state.motherCondition);
  }

  private updateDangerPresentation(phase: AppPhase, condition: MotherCondition) {
    const emergencyActive =
      phase === 'emergency' || phase === 'minigame' || phase === 'callEmergency';

    this.dangerOverlay?.setVisible(emergencyActive);

    if (!this.mother) {
      return;
    }

    if (condition === 'normal') {
      this.mother.clearTint();
      this.mother.setAlpha(1);
      this.mother.setTexture(getCharacterTextureKey('mother', 'south-west'));
      return;
    }

    this.mother.setTint(0xffc2b7);
    this.mother.setAlpha(1);
    this.mother.setTexture(getCharacterTextureKey('mother', 'south'));
  }

  private isBlocked(tileX: number, tileY: number) {
    // Check props
    const hitProp = ROOM_LAYOUT.props.some((prop) => {
      if (!prop.blocksMovement) {
        return false;
      }
      return this.collidesWithProp(tileX, tileY, prop);
    });
    if (hitProp) {
      return true;
    }

    // Check mother (character-to-character collision)
    const mother = ROOM_LAYOUT.characters.find((c) => c.id === 'mother');
    if (mother) {
      const playerRadius = 0.35;
      const motherRadius = 0.35;
      const dx = tileX - mother.tileX;
      const dy = tileY - mother.tileY;
      if (Math.abs(dx) < playerRadius + motherRadius && Math.abs(dy) < playerRadius + motherRadius) {
        return true;
      }
    }

    return false;
  }

  private collidesWithProp(tileX: number, tileY: number, prop: RoomProp) {
    const manifestProp = assetManifest.assets.props[prop.assetKey];
    const footprint = manifestProp.footprintTiles;

    // Player radius in tile units
    const pr = 0.28;

    // Assuming prop.tileX/Y is the center of its footprint
    const halfW = footprint.width / 2 + pr;
    const halfH = footprint.height / 2 + pr;

    return Math.abs(tileX - prop.tileX) < halfW && Math.abs(tileY - prop.tileY) < halfH;
  }

  private isKeyDown(
    cursorKey: Phaser.Input.Keyboard.Key | undefined,
    letterKey: Phaser.Input.Keyboard.Key | undefined
  ) {
    return Boolean(cursorKey?.isDown || letterKey?.isDown);
  }

  private disposeStoreSubscription() {
    this.unsubscribeStore?.();
    this.unsubscribeStore = undefined;
  }
}
