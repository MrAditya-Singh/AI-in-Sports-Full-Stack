/**
 * ATHLETIX — Constants: Sports & Exercises
 * constants/sports.ts
 *
 * Single source of truth for all supported sports and exercises.
 * Used by upload screen, AI pipeline routing, leaderboard filters.
 */

export type Sport = 'powerlifting' | 'calisthenics';

export type PowerliftingExercise = 'squat' | 'bench_press' | 'deadlift';
export type CalisthenicsExercise = 'pushup' | 'pullup' | 'handstand';
export type Exercise = PowerliftingExercise | CalisthenicsExercise;

export interface ExerciseOption {
  key: Exercise;
  label: string;
  description: string;
  hasRepCount: boolean; // calisthenics only
}

export interface SportOption {
  key: Sport;
  label: string;
  icon: string;
  exercises: ExerciseOption[];
}

export const SPORTS: SportOption[] = [
  {
    key: 'powerlifting',
    label: 'Powerlifting',
    icon: '🏋️',
    exercises: [
      {
        key: 'squat',
        label: 'Squat',
        description: 'AI evaluates depth, knee tracking, torso angle & lockout',
        hasRepCount: false,
      },
      {
        key: 'bench_press',
        label: 'Bench Press',
        description: 'AI evaluates bar path, elbow angle, arch & lockout',
        hasRepCount: false,
      },
      {
        key: 'deadlift',
        label: 'Deadlift',
        description: 'AI evaluates hip hinge, spine neutrality & lockout',
        hasRepCount: false,
      },
    ],
  },
  {
    key: 'calisthenics',
    label: 'Calisthenics',
    icon: '🤸',
    exercises: [
      {
        key: 'pushup',
        label: 'Push-ups',
        description: 'AI evaluates form, plank alignment & counts reps',
        hasRepCount: true,
      },
      {
        key: 'pullup',
        label: 'Pull-ups',
        description: 'AI evaluates chin-over-bar, extension & counts reps',
        hasRepCount: true,
      },
      {
        key: 'handstand',
        label: 'Handstand',
        description: 'AI evaluates alignment, body line & hold duration',
        hasRepCount: false,
      },
    ],
  },
];

/** Flat list of all exercise keys — used for type narrowing */
export const ALL_EXERCISES: Exercise[] = SPORTS.flatMap((s) =>
  s.exercises.map((e) => e.key),
);

/** Lookup helper: get sport + exercise metadata by exercise key */
export function findExercise(key: Exercise): ExerciseOption | undefined {
  return SPORTS.flatMap((s) => s.exercises).find((e) => e.key === key);
}
