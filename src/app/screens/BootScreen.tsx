import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';

export function BootScreen() {
  const navigate = useGameStore((state) => state.navigate);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Đang khởi tạo bộ nhớ...');

  useEffect(() => {
    const texts = [
      'Đang tải dữ liệu y tế...',
      'Hiệu chuẩn giao thức phát hiện đột quỵ...',
      'Kết nối cơ sở dữ liệu giáo dục BE FAST...',
      'Hệ thống đã sẵn sàng.'
    ];
    let currentTextIndex = 0;

    const textInterval = setInterval(() => {
      currentTextIndex++;
      if (currentTextIndex < texts.length) {
        setLoadingText(texts[currentTextIndex]);
      }
    }, 800);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 15) + 5;
        return next > 100 ? 100 : next;
      });
    }, 300);

    const timer = setTimeout(() => {
      navigate('menu');
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, [navigate]);

  // For a segmented pixel art look
  const segmentWidth = 10;
  const segments = Array.from({ length: 20 });
  const activeSegments = Math.floor((progress / 100) * 20);

  return (
    <section className="screen-container boot-screen">
      <div className="boot-ekg">
        <svg viewBox="0 0 500 100" className="ekg-line">
          <polyline 
            points="0,50 50,50 70,20 90,80 110,50 250,50 270,20 290,80 310,50 500,50" 
            fill="none" 
            stroke="#e74e3b" 
            strokeWidth="4" 
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
      </div>

      <div className="boot-brand">
        <div className="medical-cross">+</div>
        <h1 className="boot-text blink">BE FAST OS v1.0</h1>
      </div>
      
      <div className="boot-pixel-loader">
        <div className="pixel-hourglass">
          <svg viewBox="0 0 24 24" width="48" height="48">
            <path d="M4 2h16v2H4zm2 2h12v4l-4 4 4 4v4H6v-4l4-4-4-4z" fill="#5ab7a8" />
            <path d="M11 14h2v2h-2zM10 16h4v2h-4zM9 18h6v2H9z" fill="#5ab7a8" className="blink"/>
          </svg>
        </div>
      </div>
      
      <div className="boot-progress-container">
        <div className="segmented-progress-bar">
          {segments.map((_, index) => (
            <div 
              key={index} 
              className={`progress-segment ${index < activeSegments ? 'active' : ''}`}
            ></div>
          ))}
        </div>
        <p className="boot-subtext">{progress}% {loadingText}</p>
      </div>
    </section>
  );
}
