import { useEffect, useMemo, useRef, type CSSProperties, type MouseEvent } from 'react';

import { prototypeAudio } from '../audio/prototypeAudio';
import {
  getEmergencyRemainingSeconds,
  isEmergencyTimerActive,
  useGameStore
} from '../store/useGameStore';
import { assetManifest } from './assetManifest';
import { createRoomGame } from './createRoomGame';
import { FACE_HOTSPOTS } from './faceHotspots';

function hotspotPositionStyle(hotspot: (typeof FACE_HOTSPOTS)[number]): CSSProperties {
  return {
    '--cue-left': `${((hotspot.rect.left + hotspot.rect.right) / 2) * 100}%`,
    '--cue-top': `${((hotspot.rect.top + hotspot.rect.bottom) / 2) * 100}%`
  } as CSSProperties;
}

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<ReturnType<typeof createRoomGame> | null>(null);
  const phase = useGameStore((state) => state.phase);
  const overlays = useGameStore((state) => state.overlays);
  const activeMinigame = useGameStore((state) => state.activeMinigame);
  const minigames = useGameStore((state) => state.minigames);
  const faceMinigameFeedback = useGameStore((state) => state.faceMinigameFeedback);
  const faceMinigameFoundHotspots = useGameStore(
    (state) => state.faceMinigameFoundHotspots
  );
  const emergencyStartedAt = useGameStore((state) => state.emergencyStartedAt);
  const totalEmergencyTimeSeconds = useGameStore(
    (state) => state.totalEmergencyTimeSeconds
  );
  const setRemainingTime = useGameStore((state) => state.setRemainingTime);
  const submitFaceHotspotClick = useGameStore((state) => state.submitFaceHotspotClick);
  const resolveEmergency = useGameStore((state) => state.resolveEmergency);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) {
      return;
    }

    gameRef.current = createRoomGame(containerRef.current);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isEmergencyTimerActive(phase) || emergencyStartedAt === null) {
      return;
    }

    const tick = () => {
      const nextRemaining = getEmergencyRemainingSeconds({
        startedAt: emergencyStartedAt,
        now: Date.now(),
        totalSeconds: totalEmergencyTimeSeconds
      });

      setRemainingTime(nextRemaining);

      if (nextRemaining === 0) {
        resolveEmergency();
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 500);

    return () => window.clearInterval(intervalId);
  }, [
    emergencyStartedAt,
    phase,
    resolveEmergency,
    setRemainingTime,
    totalEmergencyTimeSeconds
  ]);

  const emergencyActive =
    phase === 'emergency' || phase === 'minigame' || phase === 'callEmergency';
  const faceMinigameActive =
    activeMinigame === 'face' &&
    phase === 'minigame' &&
    !minigames.face.completed &&
    overlays.showMotherPortraitCutIn;
  const foundHotspots = useMemo(
    () => new Set(faceMinigameFoundHotspots),
    [faceMinigameFoundHotspots]
  );

  const handleFacePortraitClick = (event: MouseEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = {
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height
    };
    const accepted = submitFaceHotspotClick(point);

    prototypeAudio.playSfx(accepted ? 'faceCorrect' : 'faceWrong');
  };

  return (
    <section
      className={`game-stage ${emergencyActive ? 'is-emergency' : ''} ${
        faceMinigameActive ? 'is-face-active' : ''
      }`}
    >
      <div className="game-frame">
        <div ref={containerRef} className="phaser-host" aria-label="Cảnh phòng chơi" />

        {faceMinigameActive && (
          <aside className="face-minigame-scene" data-ui-layer="faceMinigame" aria-live="polite">
            <div className="face-transition-flash" />
            <div className="face-title-beat">F - Face</div>
            <div className="face-reference">
              <button
                type="button"
                className="face-reference-button"
                onClick={handleFacePortraitClick}
                aria-label="Chọn vùng mặt bất thường của mẹ"
              >
                <img
                  className="face-reference-portrait"
                  src={assetManifest.assets.portraits.motherFaceDrooping.path}
                  alt="Chân dung mẹ trong tình huống nghi ngờ đột quỵ"
                />
                {FACE_HOTSPOTS.map((hotspot) => (
                  <span
                    key={hotspot.id}
                    className={`face-cue-pin ${
                      foundHotspots.has(hotspot.id) ? 'is-found' : ''
                    }`}
                    style={hotspotPositionStyle(hotspot)}
                    aria-hidden="true"
                  />
                ))}
              </button>
            </div>

            <div className="face-minigame-hud">
              <p className="eyebrow">F - Face</p>
              <h2>Kiểm tra khuôn mặt</h2>
              <p>
                Chọn đủ ba vùng bất thường: miệng, má và mắt. Mỗi dấu hiệu đúng sẽ
                được đánh dấu trên chân dung.
              </p>
              <div className="face-cue-list" aria-label="Tiến độ kiểm tra Face">
                {FACE_HOTSPOTS.map((hotspot) => (
                  <span
                    key={hotspot.id}
                    className={foundHotspots.has(hotspot.id) ? 'is-found' : ''}
                  >
                    {hotspot.label}
                  </span>
                ))}
              </div>
              {faceMinigameFeedback && (
                <p className="face-minigame-feedback">{faceMinigameFeedback}</p>
              )}
              <img
                className="face-minigame-icon"
                src={assetManifest.assets.portraits.faceDroopSymptomIcon.path}
                alt="Minh họa dấu hiệu méo miệng"
              />
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
