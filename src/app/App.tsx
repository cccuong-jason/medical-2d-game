import { usePrototypeAudioBridge } from '../audio/usePrototypeAudioBridge';
import { GameCanvas } from '../game/GameCanvas';
import {
  getActiveMajorUiLayer,
  useGameStore,
  type AppPhase,
  type MotherCondition
} from '../store/useGameStore';
import { TypewriterText } from './TypewriterText';
import { BootScreen } from './screens/BootScreen';
import { MainMenu } from './screens/MainMenu';
import { SceneSelection } from './screens/SceneSelection';
import { StoryIntroduction } from './screens/StoryIntroduction';
import { SettingsMenu, TutorialScreen } from './screens/SettingsMenu';

const phaseLabels: Record<AppPhase, string> = {
  loading: 'Đang nạp',
  freeRoam: 'Quan sát',
  emergency: 'Khẩn cấp',
  minigame: 'Kiểm tra Face',
  callEmergency: 'Gọi 115',
  resolution: 'Chờ hỗ trợ',
  ending: 'Kết quả'
};

const motherConditionLabels: Record<MotherCondition, string> = {
  normal: 'Bình thường',
  onset: 'Có dấu hiệu bất thường',
  distressed: 'Cần kiểm tra ngay',
  collapsed: 'Cần cấp cứu'
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function objectiveForPhase(phase: AppPhase) {
  if (phase === 'loading') {
    return 'Đang chuẩn bị phòng chơi và âm thanh nền.';
  }
  if (phase === 'freeRoam') {
    return 'Lại gần mẹ để hỏi thăm khi thấy dấu hiệu bất thường.';
  }
  if (phase === 'minigame') {
    return 'Chọn đủ ba vùng bất thường trên khuôn mặt của mẹ.';
  }
  if (phase === 'callEmergency') {
    return 'Báo thời điểm, dấu hiệu và địa chỉ cho tổng đài 115.';
  }
  if (phase === 'ending') {
    return 'Xem kết quả phản ứng và thử lại để cải thiện.';
  }
  return 'Tìm điện thoại trong phòng và gọi 115 ngay.';
}

export function App() {
  const route = useGameStore((state) => state.route);
  const phase = useGameStore((state) => state.phase);
  const motherCondition = useGameStore((state) => state.motherCondition);
  const audioMode = useGameStore((state) => state.audioMode);
  const remainingTimeSeconds = useGameStore((state) => state.remainingTimeSeconds);
  const dialogue = useGameStore((state) => state.dialogue);
  const ending = useGameStore((state) => state.ending);
  const bestScore = useGameStore((state) => state.bestScore);
  const majorLayer = useGameStore((state) => getActiveMajorUiLayer(state));
  const advanceDialogue = useGameStore((state) => state.advanceDialogue);
  const closeDialogue = useGameStore((state) => state.closeDialogue);
  const finalizeEnding = useGameStore((state) => state.finalizeEnding);
  const resetGame = useGameStore((state) => state.resetGame);

  usePrototypeAudioBridge({ audioMode, phase });

  if (route === 'boot') return <BootScreen />;
  if (route === 'menu') return <MainMenu />;
  if (route === 'sceneSelection') return <SceneSelection />;
  if (route === 'storyIntro') return <StoryIntroduction />;
  if (route === 'settings') return <SettingsMenu />;
  if (route === 'tutorial') return <TutorialScreen />;

  const dialoguePrimaryCopy =
    dialogue.currentBeat?.id === 'faceComplete' || dialogue.currentBeat?.id === 'call115'
      ? 'Đã hiểu'
      : 'Tiếp tục';

  const showObjectiveRibbon = majorLayer === null;
  const showHud = majorLayer !== 'ending';

  return (
    <main className="app-shell">
      <section className="game-shell" aria-label="BE FAST phòng chơi tương tác">
        <div className="game-space">
          <GameCanvas />
        </div>

        {showHud && (
          <header className="game-hud" aria-label="Trạng thái lượt chơi">
            <div className="hud-brand">
              <span className="eyebrow">BE FAST</span>
              <strong>Nhận biết đột quỵ tại nhà</strong>
            </div>
            <div className="hud-pill">
              <span>Pha</span>
              <strong>{phaseLabels[phase] || 'Đang chơi'}</strong>
            </div>
            <div className="hud-pill">
              <span>Mẹ</span>
              <strong>{motherConditionLabels[motherCondition]}</strong>
            </div>
            <div className="hud-pill hud-pill--timer">
              <span>Thời gian vàng</span>
              <strong>{formatTime(remainingTimeSeconds)}</strong>
            </div>
          </header>
        )}

        {showObjectiveRibbon && (
          <section className="objective-ribbon" aria-label="Mục tiêu hiện tại">
            {objectiveForPhase(phase)}
          </section>
        )}

        {majorLayer === 'roomDialogue' && dialogue.currentBeat && (
          <section className="game-overlay-panel dialogue-panel" data-ui-layer="roomDialogue">
            <p className="eyebrow">{dialogue.currentBeat.speaker}</p>
            <p className="dialogue-text">
              <TypewriterText text={dialogue.currentBeat.text} />
            </p>
            <div className="button-row">
              <button type="button" onClick={advanceDialogue}>
                {dialoguePrimaryCopy}
              </button>
              <button type="button" className="button-ghost" onClick={closeDialogue}>
                Bỏ qua
              </button>
            </div>
          </section>
        )}

        {majorLayer === 'call115' && dialogue.currentBeat && (
          <section className="game-overlay-panel call-panel" data-ui-layer="call115">
            <p className="eyebrow">Cuộc gọi 115</p>
            <h2>Báo rõ thời điểm và triệu chứng</h2>
            <p>
              <TypewriterText text={dialogue.currentBeat.text} />
            </p>
            <p>Nói thêm địa chỉ hiện tại, số người bệnh và tình trạng tỉnh táo của mẹ.</p>
            <button type="button" onClick={finalizeEnding}>
              Hoàn tất nguyên mẫu
            </button>
          </section>
        )}

        {majorLayer === 'ending' && ending && (
          <section className="game-overlay-panel ending-panel" data-ui-layer="ending">
            <p className="eyebrow">Kết quả lượt chơi</p>
            <h2>Điểm phản ứng: {ending.score}</h2>
            {ending.isNewBest && <div className="new-best-badge">NEW BEST SCORE!</div>}
            {!ending.isNewBest && <p>Kỷ lục hiện tại: {bestScore}</p>}
            <p>
              Xếp loại: <strong>{ending.rating}</strong>. Độ chính xác báo cáo:{' '}
              {Math.round(ending.informationAccuracy * 100)}%.
            </p>
            <button type="button" onClick={resetGame}>
              Tiếp tục
            </button>
          </section>
        )}
      </section>
    </main>
  );
}
