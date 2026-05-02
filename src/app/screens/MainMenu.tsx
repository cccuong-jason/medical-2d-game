import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';

export function MainMenu() {
  const navigate = useGameStore((state) => state.navigate);
  const bestScore = useGameStore((state) => state.bestScore);
  const playerName = useGameStore((state) => state.playerName);
  const setPlayerName = useGameStore((state) => state.setPlayerName);
  
  const [showNameInput, setShowNameInput] = useState(false);
  const [tempName, setTempName] = useState(playerName);

  const handlePlayClick = () => {
    if (!playerName) {
      setShowNameInput(true);
    } else {
      navigate('sceneSelection');
    }
  };

  const submitName = () => {
    if (tempName.trim()) {
      setPlayerName(tempName.trim());
      setShowNameInput(false);
      navigate('sceneSelection');
    }
  };

  return (
    <section className="screen-container menu-screen">
      <div className="menu-content">
        <div className="medical-logo">
          <svg viewBox="0 0 100 100" width="80" height="80">
            {/* Pixel cross + Brain/Heart concept */}
            <rect x="40" y="20" width="20" height="60" fill="#e74e3b" />
            <rect x="20" y="40" width="60" height="20" fill="#e74e3b" />
            <rect x="45" y="45" width="10" height="10" fill="#fff" />
          </svg>
        </div>
        <h1 className="game-title">BE FAST</h1>
        <p className="game-subtitle">Nhận biết đột quỵ tại nhà</p>
        
        <div className="highscore-display">
          <p>Kỷ lục cao nhất: <span>{bestScore}</span></p>
          {playerName && <p>Người chơi: <span>{playerName}</span></p>}
        </div>
        
        {showNameInput ? (
          <div className="name-input-container">
            <p>Nhập tên của bạn:</p>
            <input 
              type="text" 
              className="name-input" 
              value={tempName} 
              onChange={(e) => setTempName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && submitName()}
            />
            <button className="menu-btn start-btn" onClick={submitName}>
              Tiếp tục
            </button>
            <button className="menu-btn back-btn" onClick={() => setShowNameInput(false)}>
              Quay lại
            </button>
          </div>
        ) : (
          <div className="menu-buttons">
            <button className="menu-btn" onClick={handlePlayClick}>
              Chơi ngay
            </button>
            <button className="menu-btn" onClick={() => navigate('tutorial')}>
              Hướng dẫn
            </button>
            <button className="menu-btn" onClick={() => navigate('settings')}>
              Cài đặt
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
