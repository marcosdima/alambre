/** Illustration palette. Brand tones are fixed; strokes follow the theme via `line`. */
export const art = {
  sage: '#a2af9b',
  sand: '#dccfc0',
  cream: '#faf9ee',
  ink: '#2b3127',
};

/** Global motion knobs shared by every illustration. */
export type MotionSettings = {
  /** Playback rate multiplier (2 = twice as fast). */
  speed: number;
  /** Multiplier applied to every angle / distance. */
  amplitude: number;
  paused: boolean;
};

/** Default motion used by app screens (no testbed sliders in production). */
export const defaultMotion: MotionSettings = { speed: 1, amplitude: 1, paused: false };

export type ArtProps = { motion?: MotionSettings; line: string; size?: number };
