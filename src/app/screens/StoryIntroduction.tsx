import { useGameStore } from '../../store/useGameStore';
import { TypewriterText } from '../TypewriterText';

export function StoryIntroduction() {
  const startGame = useGameStore((state) => state.startGame);
  const navigate = useGameStore((state) => state.navigate);

  return (
    <section className="screen-container story-screen">
      <div className="story-content">
        <h2>Chương 1: Phòng Khách</h2>
        <p className="story-text">
          <TypewriterText text="Bạn vừa đi làm về sau một ngày dài. Mẹ bạn đang ngồi ở phòng khách. Gần đây sức khỏe của bà không được tốt lắm. Hãy quan sát và trò chuyện cùng bà." />
        </p>
        <div className="story-actions">
          <button className="start-btn" onClick={startGame}>
            Bắt Đầu
          </button>
          <button className="back-btn" onClick={() => navigate('sceneSelection')}>
            Quay lại
          </button>
        </div>
      </div>
    </section>
  );
}
