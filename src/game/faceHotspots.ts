export type FaceHotspotPoint = {
  x: number;
  y: number;
};

export type FaceHotspot = {
  id: 'mouthDroop' | 'cheekAsymmetry' | 'eyeAsymmetry';
  label: string;
  rect: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  successFeedback: string;
};

export type FaceHotspotResult =
  | {
      correct: true;
      hotspotId: FaceHotspot['id'];
      feedback: string;
    }
  | {
      correct: false;
      hotspotId: null;
      feedback: string;
    };

export const FACE_HOTSPOTS: FaceHotspot[] = [
  {
    id: 'mouthDroop',
    label: 'Miệng bị xệ một bên',
    rect: {
      left: 0.54,
      top: 0.52,
      right: 0.76,
      bottom: 0.76
    },
    successFeedback: 'Đúng rồi: vùng miệng bị xệ một bên là dấu hiệu Face cần báo ngay.'
  },
  {
    id: 'cheekAsymmetry',
    label: 'Má và nửa mặt không đều',
    rect: {
      left: 0.33,
      top: 0.42,
      right: 0.53,
      bottom: 0.68
    },
    successFeedback: 'Đúng: hai bên má không cân xứng, cần ghi nhận khi gọi cấp cứu.'
  },
  {
    id: 'eyeAsymmetry',
    label: 'Mắt một bên không cân',
    rect: {
      left: 0.45,
      top: 0.22,
      right: 0.66,
      bottom: 0.42
    },
    successFeedback: 'Đúng: vùng mắt và nửa trên khuôn mặt cho thấy một bên yếu hơn.'
  }
];

export function scoreFaceHotspotClick(
  point: FaceHotspotPoint,
  hotspots: readonly FaceHotspot[] = FACE_HOTSPOTS
): FaceHotspotResult {
  const hit = hotspots.find((hotspot) => {
    return (
      point.x >= hotspot.rect.left &&
      point.x <= hotspot.rect.right &&
      point.y >= hotspot.rect.top &&
      point.y <= hotspot.rect.bottom
    );
  });

  if (hit) {
    return {
      correct: true,
      hotspotId: hit.id,
      feedback: hit.successFeedback
    };
  }

  return {
    correct: false,
    hotspotId: null,
    feedback:
      'Chưa đúng. Hãy so sánh miệng, má và mắt hai bên để tìm dấu hiệu khuôn mặt bị lệch.'
  };
}
