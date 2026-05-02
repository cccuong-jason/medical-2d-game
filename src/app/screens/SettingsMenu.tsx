import { useGameStore } from '../../store/useGameStore';

export function SettingsMenu() {
  const navigate = useGameStore((state) => state.navigate);

  return (
    <section className="screen-container settings-screen">
      <h2>Cài Đặt</h2>
      <div className="settings-content">
        <p>Tính năng đang được phát triển.</p>
      </div>
      <button className="back-btn" onClick={() => navigate('menu')}>
        Quay lại
      </button>
    </section>
  );
}

export function TutorialScreen() {
  const navigate = useGameStore((state) => state.navigate);

  return (
    <section className="screen-container tutorial-screen">
      <h2>Hướng Dẫn</h2>
      <div className="tutorial-content">
        <p>Sử dụng <strong>WASD</strong> hoặc phím mũi tên để di chuyển.</p>
        <p>Nhấn <strong>E</strong> để tương tác khi thấy biểu tượng.</p>
        <p>Quan sát dấu hiệu <strong>F.A.S.T</strong> để nhận biết đột quỵ.</p>
      </div>
      <button className="back-btn" onClick={() => navigate('menu')}>
        Quay lại
      </button>
    </section>
  );
}
