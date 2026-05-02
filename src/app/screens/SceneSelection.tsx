import { useGameStore } from '../../store/useGameStore';

export function SceneSelection() {
  const navigate = useGameStore((state) => state.navigate);

  return (
    <section className="screen-container scene-screen">
      <h2>Chọn Màn Chơi</h2>
      <div className="scene-grid">
        <button className="scene-card" onClick={() => navigate('storyIntro')}>
          <div className="scene-thumb living-room-thumb">
            <svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
              <rect width="200" height="150" fill="#2b2020" />
              <rect x="0" y="75" width="200" height="75" fill="#4a3028" />
              
              {/* Mô phỏng Sofa Pixel Art */}
              <rect x="60" y="60" width="80" height="30" fill="#5ab7a8" />
              <rect x="55" y="70" width="10" height="25" fill="#3a8a7c" />
              <rect x="135" y="70" width="10" height="25" fill="#3a8a7c" />
              <rect x="65" y="85" width="70" height="15" fill="#429a8c" />
              
              {/* Bàn / Đồ vật nhỏ */}
              <rect x="20" y="90" width="25" height="15" fill="#7a5040" />
              <rect x="20" y="105" width="5" height="15" fill="#503020" />
              <rect x="40" y="105" width="5" height="15" fill="#503020" />
              
              {/* TV hoặc Cửa sổ */}
              <rect x="80" y="20" width="40" height="25" fill="#101619" />
              <rect x="85" y="25" width="30" height="15" fill="#304050" />
            </svg>
          </div>
          <span>Phòng Khách</span>
        </button>
        <button className="scene-card locked" disabled>
          <div className="scene-thumb locked-thumb">
            <svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
              <rect width="200" height="150" fill="#1a1515" />
              <text x="100" y="85" fill="#3b2418" fontSize="60" fontFamily="DearPix, monospace" textAnchor="middle" fontWeight="bold">?</text>
            </svg>
          </div>
          <span>Đang phát triển</span>
        </button>
      </div>
      <button className="back-btn" onClick={() => navigate('menu')}>
        Quay lại
      </button>
    </section>
  );
}
