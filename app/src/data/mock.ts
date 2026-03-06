// ─── MOCK DATA — 100% statique / synthétique ────────────────────────────────
// Aucune donnée réelle. Ces valeurs simulent une saison de sessions de karting
// sur le circuit SpeedKart Hyères pour le pilote Leo GREGORI.

export const MOCK_DRIVER = {
  name: 'Leo GREGORI',
  initials: 'LG',
  license: 'PRO',
  team: 'Team Mokart',
  kart: 'Sodi RT8 #07',
  totalLaps: 1248,
  bestLap: 48.234,
  consistencyScore: 94.2,
  trackRecord: 46.891, // record du circuit (référence externe)
};

export interface MockSession {
  id: string;
  date: string;
  circuit: string;
  kart: string;
  laps: number;
  bestLap: number;
  avgLap: number;
  topSpeed: number;
  improvement: number; // négatif = amélioration vs session précédente
}

export const MOCK_SESSIONS: MockSession[] = [
  { id: 'sess-001', date: '2026-02-28', circuit: 'SpeedKart Hyères', kart: 'Sodi RT8 #07', laps: 18, bestLap: 48.234, avgLap: 51.187, topSpeed: 84.3, improvement: -0.842 },
  { id: 'sess-002', date: '2026-02-21', circuit: 'SpeedKart Hyères', kart: 'Sodi RT8 #07', laps: 22, bestLap: 49.076, avgLap: 52.341, topSpeed: 83.1, improvement: -1.203 },
  { id: 'sess-003', date: '2026-02-14', circuit: 'SpeedKart Hyères', kart: 'Sodi RT8 #12', laps: 15, bestLap: 50.279, avgLap: 53.842, topSpeed: 82.4, improvement:  0.182 },
  { id: 'sess-004', date: '2026-02-07', circuit: 'SpeedKart Hyères', kart: 'Sodi RT8 #07', laps: 20, bestLap: 50.097, avgLap: 53.104, topSpeed: 83.6, improvement: -0.654 },
  { id: 'sess-005', date: '2026-01-31', circuit: 'SpeedKart Hyères', kart: 'Sodi RT8 #12', laps: 12, bestLap: 50.751, avgLap: 54.218, topSpeed: 81.9, improvement:  0.312 },
  { id: 'sess-006', date: '2026-01-24', circuit: 'SpeedKart Hyères', kart: 'Sodi RT8 #07', laps: 24, bestLap: 51.063, avgLap: 54.712, topSpeed: 82.7, improvement: -0.923 },
];

export interface MockLap {
  lap: number;
  time: number;
  s1: number;
  s2: number;
  s3: number;
}

export const MOCK_LAPS: MockLap[] = [
  { lap: 1,  time: 53.412, s1: 17.8, s2: 19.4, s3: 16.2 },
  { lap: 2,  time: 51.876, s1: 17.2, s2: 18.9, s3: 15.8 },
  { lap: 3,  time: 51.234, s1: 17.0, s2: 18.6, s3: 15.6 },
  { lap: 4,  time: 50.887, s1: 16.8, s2: 18.4, s3: 15.7 },
  { lap: 5,  time: 50.102, s1: 16.5, s2: 18.1, s3: 15.5 },
  { lap: 6,  time: 49.543, s1: 16.3, s2: 17.9, s3: 15.3 },
  { lap: 7,  time: 49.231, s1: 16.2, s2: 17.8, s3: 15.2 },
  { lap: 8,  time: 48.891, s1: 16.0, s2: 17.6, s3: 15.3 },
  { lap: 9,  time: 48.543, s1: 15.9, s2: 17.4, s3: 15.2 },
  { lap: 10, time: 48.234, s1: 15.9, s2: 16.8, s3: 15.5 }, // BEST LAP
  { lap: 11, time: 48.621, s1: 16.1, s2: 17.1, s3: 15.4 },
  { lap: 12, time: 49.012, s1: 16.3, s2: 17.4, s3: 15.3 },
  { lap: 13, time: 48.987, s1: 16.2, s2: 17.5, s3: 15.3 },
  { lap: 14, time: 49.234, s1: 16.4, s2: 17.6, s3: 15.2 },
  { lap: 15, time: 49.543, s1: 16.6, s2: 17.7, s3: 15.2 },
  { lap: 16, time: 50.123, s1: 16.8, s2: 18.0, s3: 15.3 },
  { lap: 17, time: 50.876, s1: 17.1, s2: 18.3, s3: 15.5 },
  { lap: 18, time: 51.234, s1: 17.3, s2: 18.5, s3: 15.4 },
];

export const MOCK_SPEED_TRACE = [
  { dist: 0,   speed: 72, ref: 74 },
  { dist: 50,  speed: 68, ref: 70 },
  { dist: 100, speed: 45, ref: 43 },
  { dist: 150, speed: 38, ref: 36 },
  { dist: 200, speed: 52, ref: 54 },
  { dist: 250, speed: 78, ref: 80 },
  { dist: 300, speed: 82, ref: 83 },
  { dist: 350, speed: 84, ref: 84 },
  { dist: 400, speed: 76, ref: 78 },
  { dist: 450, speed: 42, ref: 40 },
  { dist: 500, speed: 35, ref: 33 },
  { dist: 550, speed: 48, ref: 50 },
  { dist: 600, speed: 65, ref: 67 },
  { dist: 650, speed: 72, ref: 74 },
  { dist: 700, speed: 75, ref: 76 },
  { dist: 750, speed: 55, ref: 54 },
  { dist: 800, speed: 48, ref: 47 },
  { dist: 850, speed: 62, ref: 64 },
  { dist: 900, speed: 70, ref: 72 },
  { dist: 950, speed: 72, ref: 74 },
];

// Points de contrôle du circuit SpeedKart Hyères (depuis prototype.py)
export const TRACK_CONTROL_POINTS = [
  [253, 210], [229, 174], [225, 135],
  [251, 116], [277, 140], [260, 181],
  [278, 191], [396, 119], [452, 131],
  [451, 168], [408, 201], [353, 194],
  [318, 198], [299, 221], [311, 237],
  [367, 231], [388, 252], [364, 272],
  [232, 291], [221, 278], [265, 261],
  [272, 242],
];

export const fmtLap = (t: number): string => {
  const mins = Math.floor(t / 60);
  const secs = t % 60;
  return `${mins}:${secs.toFixed(3).padStart(6, '0')}`;
};

export const fmtDelta = (d: number): string =>
  `${d >= 0 ? '+' : ''}${d.toFixed(3)}s`;
