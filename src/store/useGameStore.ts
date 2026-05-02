import { create } from 'zustand';

import {
  getAudioModeForPhase,
  type PrototypeAudioMode
} from '../audio/prototypeAudio';
import {
  FACE_HOTSPOTS,
  scoreFaceHotspotClick,
  type FaceHotspot,
  type FaceHotspotPoint
} from '../game/faceHotspots';

export type LanguageCode = 'vi';
export type AppRoute = 'boot' | 'menu' | 'sceneSelection' | 'storyIntro' | 'settings' | 'tutorial' | 'game';
export type AppPhase =
  | 'loading'
  | 'freeRoam'
  | 'emergency'
  | 'minigame'
  | 'callEmergency'
  | 'resolution'
  | 'ending';
export type MotherCondition = 'normal' | 'onset' | 'distressed' | 'collapsed';
export type AudioMode = PrototypeAudioMode;
export type MinigameKey = 'balance' | 'eye' | 'face' | 'arm' | 'speech' | 'time';
export type EndingRating = 'excellent' | 'good' | 'delayed' | 'critical';
export type MajorUiLayer = 'roomDialogue' | 'faceMinigame' | 'call115' | 'ending' | null;
export type DialogueBeatId =
  | 'introContext'
  | 'checkMother'
  | 'noticeSymptoms'
  | 'faceComplete'
  | 'call115';
export type DialogueSpeaker = 'Bạn' | 'Mẹ' | 'Hệ thống' | '115';

export type DialogueBeat = {
  id: DialogueBeatId;
  speaker: DialogueSpeaker;
  text: string;
};

type MinigameProgress = Record<
  MinigameKey,
  {
    completed: boolean;
    score: number;
  }
>;

type OverlayState = {
  showDangerBorder: boolean;
  showDangerVignette: boolean;
  showColdTint: boolean;
  showMotherPortraitCutIn: boolean;
};

type EndingSummary = {
  rating: EndingRating;
  score: number;
  informationAccuracy: number;
  mistakesMade: number;
  remainingTimeSeconds: number;
  isNewBest: boolean;
};

type DialogueState = {
  isOpen: boolean;
  currentBeatId: DialogueBeatId | null;
  currentBeat: DialogueBeat | null;
};

export type GameStoreState = {
  route: AppRoute;
  bestScore: number;
  playerName: string;
  language: LanguageCode;
  phase: AppPhase;
  motherCondition: MotherCondition;
  audioMode: AudioMode;
  activeMinigame: MinigameKey | null;
  emergencyStartedAt: number | null;
  totalEmergencyTimeSeconds: number;
  remainingTimeSeconds: number;
  informationAccuracy: number;
  mistakesMade: number;
  minigames: MinigameProgress;
  dialogue: DialogueState;
  faceMinigameFeedback: string | null;
  faceMinigameFoundHotspots: FaceHotspot['id'][];
  overlays: OverlayState;
  ending: EndingSummary | null;
  navigate: (route: AppRoute) => void;
  setPlayerName: (name: string) => void;
  startGame: () => void;
  finishLoading: () => void;
  startFreeRoam: () => void;
  triggerEmergency: (startedAt?: number) => void;
  setRemainingTime: (seconds: number) => void;
  setReportAccuracy: (accuracy: number) => void;
  recordMistake: (count?: number) => void;
  openDialogue: (beatId: DialogueBeatId) => void;
  advanceDialogue: () => void;
  closeDialogue: () => void;
  startMinigame: (key: MinigameKey) => void;
  submitFaceHotspotClick: (point: FaceHotspotPoint) => boolean;
  completeMinigame: (key: MinigameKey, score?: number) => void;
  enterCallEmergency: () => void;
  resolveEmergency: () => void;
  finalizeEnding: () => void;
  resetGame: () => void;
};

const TOTAL_EMERGENCY_TIME_SECONDS = 180;

const minigameKeys: MinigameKey[] = ['balance', 'eye', 'face', 'arm', 'speech', 'time'];
const faceHotspotCount = FACE_HOTSPOTS.length;

export const DIALOGUE_BEATS: Record<DialogueBeatId, DialogueBeat> = {
  introContext: {
    id: 'introContext',
    speaker: 'Hệ thống',
    text: 'Bạn vừa về nhà. Hãy quan sát phòng khách và lại gần mẹ nếu thấy có điều bất thường.'
  },
  checkMother: {
    id: 'checkMother',
    speaker: 'Bạn',
    text: 'Mẹ ơi, mẹ có thấy mệt hay chóng mặt không? Con thấy mẹ hơi khác thường.'
  },
  noticeSymptoms: {
    id: 'noticeSymptoms',
    speaker: 'Bạn',
    text: 'Một bên miệng của mẹ có vẻ xệ xuống. Mình cần kiểm tra dấu hiệu Face ngay.'
  },
  faceComplete: {
    id: 'faceComplete',
    speaker: 'Hệ thống',
    text: 'Bạn đã ghi nhận đủ ba dấu hiệu Face. Hãy tới điện thoại và gọi 115 ngay.'
  },
  call115: {
    id: 'call115',
    speaker: '115',
    text: 'Hãy báo ngắn gọn: thời điểm bắt đầu bất thường, dấu hiệu méo miệng và địa chỉ hiện tại.'
  }
};

function createMinigameProgress(): MinigameProgress {
  return minigameKeys.reduce<MinigameProgress>((progress, key) => {
    progress[key] = {
      completed: false,
      score: 0
    };
    return progress;
  }, {} as MinigameProgress);
}

function createDialogueState(beatId: DialogueBeatId | null): DialogueState {
  return {
    isOpen: beatId !== null,
    currentBeatId: beatId,
    currentBeat: beatId ? DIALOGUE_BEATS[beatId] : null
  };
}

function createInitialState() {
  const savedBestScore = parseInt(localStorage.getItem('beFastBestScore') || '0', 10);
  const savedPlayerName = localStorage.getItem('beFastPlayerName') || '';
  return {
    route: 'boot' as AppRoute,
    bestScore: isNaN(savedBestScore) ? 0 : savedBestScore,
    playerName: savedPlayerName,
    language: 'vi' as LanguageCode,
    phase: 'loading' as AppPhase,
    motherCondition: 'normal' as MotherCondition,
    audioMode: 'calm' as AudioMode,
    activeMinigame: null as MinigameKey | null,
    emergencyStartedAt: null as number | null,
    totalEmergencyTimeSeconds: TOTAL_EMERGENCY_TIME_SECONDS,
    remainingTimeSeconds: TOTAL_EMERGENCY_TIME_SECONDS,
    informationAccuracy: 0,
    mistakesMade: 0,
    minigames: createMinigameProgress(),
    dialogue: createDialogueState(null),
    faceMinigameFeedback: null as string | null,
    faceMinigameFoundHotspots: [] as FaceHotspot['id'][],
    overlays: {
      showDangerBorder: false,
      showDangerVignette: false,
      showColdTint: false,
      showMotherPortraitCutIn: false
    } satisfies OverlayState,
    ending: null as EndingSummary | null
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hasFoundFaceHotspot(
  foundHotspots: readonly FaceHotspot['id'][],
  hotspotId: FaceHotspot['id']
) {
  return foundHotspots.includes(hotspotId);
}

function feedbackWithProgress(feedback: string, foundCount: number) {
  const remaining = Math.max(faceHotspotCount - foundCount, 0);

  if (remaining === 0) {
    return `${feedback} Bạn đã nhận đủ ba dấu hiệu Face.`;
  }

  return `${feedback} Còn ${remaining} vùng cần kiểm tra.`;
}

function audioModeForEnding(rating: EndingRating): AudioMode {
  return getAudioModeForPhase({
    phase: 'ending',
    endingRating: rating
  });
}

export function getActiveMajorUiLayer(
  state: Pick<
    GameStoreState,
    'activeMinigame' | 'dialogue' | 'ending' | 'minigames' | 'overlays' | 'phase'
  >
): MajorUiLayer {
  if (state.phase === 'ending' && state.ending) {
    return 'ending';
  }

  if (state.phase === 'callEmergency') {
    return 'call115';
  }

  if (
    state.activeMinigame === 'face' &&
    !state.minigames.face.completed &&
    state.overlays.showMotherPortraitCutIn
  ) {
    return 'faceMinigame';
  }

  if (state.dialogue.isOpen && state.dialogue.currentBeat) {
    return 'roomDialogue';
  }

  return null;
}

export function calculateEndingSummary(input: {
  totalEmergencyTimeSeconds: number;
  remainingTimeSeconds: number;
  informationAccuracy: number;
  mistakesMade: number;
  bestScore: number;
}): EndingSummary {
  const timeRatio = clamp(
    input.remainingTimeSeconds / input.totalEmergencyTimeSeconds,
    0,
    1
  );
  const accuracy = clamp(input.informationAccuracy, 0, 1);
  const mistakes = Math.max(input.mistakesMade, 0);

  const timeScore = timeRatio * 50;
  const accuracyScore = accuracy * 30;
  const safetyScore = Math.max(0, 20 - mistakes * 10);
  const score = Math.round(timeScore + accuracyScore + safetyScore);

  let rating: EndingRating = 'critical';
  if (score >= 85) {
    rating = 'excellent';
  } else if (score >= 60) {
    rating = 'good';
  } else if (score >= 40) {
    rating = 'delayed';
  }

  const isNewBest = score > input.bestScore;

  return {
    rating,
    score,
    informationAccuracy: accuracy,
    mistakesMade: mistakes,
    remainingTimeSeconds: clamp(
      input.remainingTimeSeconds,
      0,
      input.totalEmergencyTimeSeconds
    ),
    isNewBest
  };
}

export function getEmergencyRemainingSeconds(input: {
  startedAt: number;
  now: number;
  totalSeconds: number;
}) {
  const elapsedSeconds = Math.floor((input.now - input.startedAt) / 1000);

  return clamp(input.totalSeconds - elapsedSeconds, 0, input.totalSeconds);
}

export function isEmergencyTimerActive(phase: AppPhase) {
  return phase === 'emergency' || phase === 'minigame' || phase === 'callEmergency';
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  ...createInitialState(),
  navigate: (route) => {
    set({ route });
  },
  setPlayerName: (name) => {
    localStorage.setItem('beFastPlayerName', name);
    set({ playerName: name });
  },
  startGame: () => {
    set({
      route: 'game',
      phase: 'freeRoam',
      audioMode: 'calm',
      dialogue: createDialogueState('introContext')
    });
  },
  finishLoading: () => {
    set({
      phase: 'freeRoam',
      audioMode: 'calm',
      dialogue: createDialogueState('introContext')
    });
  },
  startFreeRoam: () => {
    set({
      phase: 'freeRoam',
      audioMode: 'calm',
      dialogue: createDialogueState('introContext')
    });
  },
  triggerEmergency: (startedAt = Date.now()) => {
    set({
      phase: 'emergency',
      motherCondition: 'onset',
      audioMode: 'intense',
      emergencyStartedAt: startedAt,
      remainingTimeSeconds: get().totalEmergencyTimeSeconds,
      overlays: {
        showDangerBorder: true,
        showDangerVignette: true,
        showColdTint: true,
        showMotherPortraitCutIn: true
      }
    });
  },
  setRemainingTime: (seconds) => {
    set((state) => ({
      remainingTimeSeconds: clamp(seconds, 0, state.totalEmergencyTimeSeconds)
    }));
  },
  setReportAccuracy: (accuracy) => {
    set({
      informationAccuracy: clamp(accuracy, 0, 1)
    });
  },
  recordMistake: (count = 1) => {
    set((state) => ({
      mistakesMade: state.mistakesMade + Math.max(count, 0)
    }));
  },
  openDialogue: (beatId) => {
    set({
      dialogue: createDialogueState(beatId)
    });
  },
  advanceDialogue: () => {
    const beatId = get().dialogue.currentBeatId;

    if (beatId === null) {
      return;
    }

    if (beatId === 'checkMother') {
      set((state) => ({
        phase: 'emergency',
        motherCondition: 'onset',
        audioMode: 'intense',
        emergencyStartedAt: state.emergencyStartedAt ?? Date.now(),
        remainingTimeSeconds: state.totalEmergencyTimeSeconds,
        overlays: {
          showDangerBorder: true,
          showDangerVignette: true,
          showColdTint: true,
          showMotherPortraitCutIn: true
        },
        dialogue: createDialogueState('noticeSymptoms')
      }));
      return;
    }

    if (beatId === 'noticeSymptoms') {
      get().startMinigame('face');
      set({
        dialogue: createDialogueState(null)
      });
      return;
    }

    set({
      dialogue: createDialogueState(null)
    });
  },
  closeDialogue: () => {
    set({
      dialogue: createDialogueState(null)
    });
  },
  startMinigame: (key) => {
    const phase = get().phase;
    if (phase !== 'emergency' && phase !== 'callEmergency' && phase !== 'minigame') {
      return;
    }

    set({
      phase: 'minigame',
      activeMinigame: key,
      motherCondition: 'distressed',
      audioMode: 'intense',
      dialogue: createDialogueState(null),
      faceMinigameFeedback:
        key === 'face' ? 'Tìm đủ ba dấu hiệu bất thường trên khuôn mặt của mẹ.' : null,
      faceMinigameFoundHotspots: key === 'face' ? [] : get().faceMinigameFoundHotspots,
      overlays: {
        ...get().overlays,
        showMotherPortraitCutIn: key === 'face'
      }
    });
  },
  submitFaceHotspotClick: (point) => {
    const state = get();

    if (state.activeMinigame !== 'face' || state.minigames.face.completed) {
      return false;
    }

    const result = scoreFaceHotspotClick(point);

    if (!result.correct) {
      set((currentState) => ({
        mistakesMade: currentState.mistakesMade + 1,
        faceMinigameFeedback: result.feedback
      }));
      return false;
    }

    if (hasFoundFaceHotspot(state.faceMinigameFoundHotspots, result.hotspotId)) {
      set({
        faceMinigameFeedback: 'Vùng này đã được ghi nhận. Hãy tìm dấu hiệu còn lại.'
      });
      return false;
    }

    const nextFoundHotspots = [...state.faceMinigameFoundHotspots, result.hotspotId];
    const completed = nextFoundHotspots.length >= faceHotspotCount;

    if (!completed) {
      set({
        faceMinigameFoundHotspots: nextFoundHotspots,
        faceMinigameFeedback: feedbackWithProgress(
          result.feedback,
          nextFoundHotspots.length
        )
      });
      return true;
    }

    set((currentState) => ({
      phase: 'emergency',
      activeMinigame: null,
      audioMode: 'intense',
      informationAccuracy: Math.max(currentState.informationAccuracy, 0.86),
      faceMinigameFeedback: feedbackWithProgress(result.feedback, nextFoundHotspots.length),
      faceMinigameFoundHotspots: nextFoundHotspots,
      minigames: {
        ...currentState.minigames,
        face: {
          completed: true,
          score: 1
        }
      },
      overlays: {
        ...currentState.overlays,
        showMotherPortraitCutIn: false
      },
      dialogue: createDialogueState('faceComplete')
    }));

    return true;
  },
  completeMinigame: (key, score = 1) => {
    set((state) => ({
      phase: 'emergency',
      activeMinigame: null,
      faceMinigameFeedback: null,
      faceMinigameFoundHotspots:
        key === 'face'
          ? FACE_HOTSPOTS.map((hotspot) => hotspot.id)
          : state.faceMinigameFoundHotspots,
      minigames: {
        ...state.minigames,
        [key]: {
          completed: true,
          score
        }
      },
      overlays: {
        ...state.overlays,
        showMotherPortraitCutIn: false
      }
    }));
  },
  enterCallEmergency: () => {
    set({
      phase: 'callEmergency',
      activeMinigame: null,
      audioMode: 'intense',
      faceMinigameFeedback: null,
      dialogue: createDialogueState('call115'),
      overlays: {
        ...get().overlays,
        showMotherPortraitCutIn: false
      }
    });
  },
  resolveEmergency: () => {
    set({
      phase: 'resolution',
      motherCondition: 'collapsed',
      audioMode: 'intense',
      overlays: {
        ...get().overlays,
        showMotherPortraitCutIn: false
      }
    });
  },
  finalizeEnding: () => {
    const state = get();
    const ending = calculateEndingSummary({
      totalEmergencyTimeSeconds: state.totalEmergencyTimeSeconds,
      remainingTimeSeconds: state.remainingTimeSeconds,
      informationAccuracy: state.informationAccuracy,
      mistakesMade: state.mistakesMade,
      bestScore: state.bestScore
    });

    if (ending.isNewBest) {
      localStorage.setItem('beFastBestScore', ending.score.toString());
    }

    set({
      phase: 'ending',
      bestScore: ending.isNewBest ? ending.score : state.bestScore,
      audioMode: audioModeForEnding(ending.rating),
      activeMinigame: null,
      dialogue: createDialogueState(null),
      overlays: {
        ...state.overlays,
        showMotherPortraitCutIn: false
      },
      ending
    });
  },
  resetGame: () => {
    // Reset back to main menu, preserving the best score by re-initializing it
    const initialState = createInitialState();
    set({
      ...initialState,
      route: 'menu' // Return to menu instead of boot
    });
  }
}));
