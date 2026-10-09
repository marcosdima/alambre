import type { ReactNode } from 'react';
import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Line,
  Path,
  Rect,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { useHarmonicMotion, useRipplePulse } from 'alambre';
import { art, defaultMotion } from './art';
import type { ArtProps, MotionSettings } from './art';

/*
 * Skia renditions of the Colguetti kinetic illustrations.
 *
 * Why Skia: every animated value is handed to the canvas as a Reanimated
 * derived value, so motion is evaluated and drawn on the UI thread without
 * going through react-native-svg's per-node prop bridge. Coordinates match the
 * original SVG viewBoxes; a root scale maps them onto the requested `size`.
 *
 * Motion lifecycle (reduced motion, `paused`, app backgrounded) is owned by
 * alambre's `useHarmonicMotion` / `useRipplePulse`.
 */

const DEG = Math.PI / 180;

type Point = readonly [number, number];
type MotionProps = { motion: MotionSettings; children?: ReactNode };

function timing(motion: MotionSettings, duration: number, delay: number) {
  return { duration: duration / motion.speed, delay: delay / motion.speed, paused: motion.paused };
}

/** Pendulum around `origin`. Nested swings compose like a real mobile. */
function Swing({ origin, swing, duration, delay = 0, motion, children }: MotionProps & {
  origin: Point;
  swing: number;
  duration: number;
  delay?: number;
}) {
  const angle = useHarmonicMotion({ profile: 'sine', amplitude: swing * motion.amplitude, ...timing(motion, duration, delay) });
  const transform = useDerivedValue(() => [{ rotate: angle.value * DEG }]);
  return <Group origin={vec(origin[0], origin[1])} transform={transform}>{children}</Group>;
}

/** Constant-speed rotation around `origin`. */
function Spin({ origin, duration, motion, children }: MotionProps & { origin: Point; duration: number }) {
  const angle = useHarmonicMotion({ profile: 'spin', amplitude: 360, ...timing(motion, duration, 0) });
  const transform = useDerivedValue(() => [{ rotate: angle.value * DEG }]);
  return <Group origin={vec(origin[0], origin[1])} transform={transform}>{children}</Group>;
}

/** Bobbing: lifts by `lift` (negative = up) while tilting `tilt` degrees around `origin`. */
function Float({ origin, lift, tilt = 0, duration, delay = 0, motion, children }: MotionProps & {
  origin: Point;
  lift: number;
  tilt?: number;
  duration: number;
  delay?: number;
}) {
  const y = useHarmonicMotion({ profile: 'swell', amplitude: lift * motion.amplitude, ...timing(motion, duration, delay) });
  const angle = useHarmonicMotion({ profile: 'swell', amplitude: tilt * motion.amplitude, ...timing(motion, duration, delay) });
  const transform = useDerivedValue(() => [{ translateY: y.value }, { rotate: angle.value * DEG }]);
  return <Group origin={vec(origin[0], origin[1])} transform={transform}>{children}</Group>;
}

/** Bell clatter: rests, then shakes in a short burst each cycle. */
function Wobble({ origin, degrees, duration, active, motion, children }: MotionProps & {
  origin: Point;
  degrees: number;
  duration: number;
  active: boolean;
}) {
  const angle = useHarmonicMotion({
    profile: 'wobble',
    amplitude: degrees * motion.amplitude,
    ...timing(motion, duration, 0),
    paused: motion.paused || !active,
  });
  const transform = useDerivedValue(() => [{ rotate: (active ? angle.value : 0) * DEG }], [active]);
  return <Group origin={vec(origin[0], origin[1])} transform={transform}>{children}</Group>;
}

/** Scales a fixed design viewBox onto the canvas. */
function Viewport({ width, height, scale, children }: { width: number; height: number; scale: number; children: ReactNode }) {
  return (
    <Canvas style={{ width, height }}>
      <Group transform={[{ scale }]}>{children}</Group>
    </Canvas>
  );
}

type StrokeProps = { color: string; width?: number; opacity?: number };

function Seg({ from, to, color, width = 3, opacity = 1 }: StrokeProps & { from: Point; to: Point }) {
  return (
    <Line
      p1={vec(from[0], from[1])}
      p2={vec(to[0], to[1])}
      color={color}
      strokeWidth={width}
      opacity={opacity}
      style="stroke"
      strokeCap="round"
    />
  );
}

/** Thin suspension string. */
function Thread({ from, to, line }: { from: Point; to: Point; line: string }) {
  return <Seg from={from} to={to} color={line} width={1.5} opacity={0.5} />;
}

/** Filled shape with an ink outline (Skia paints fill and stroke separately). */
function Outlined({ path, fill, stroke = art.ink, width = 3 }: { path: string; fill: string; stroke?: string; width?: number }) {
  return (
    <>
      <Path path={path} color={fill} />
      <Path path={path} color={stroke} style="stroke" strokeWidth={width} strokeJoin="round" strokeCap="round" />
    </>
  );
}

function OutlinedCircle({ c, r, fill, stroke = art.ink, width = 3 }: { c: Point; r: number; fill: string; stroke?: string; width?: number }) {
  return (
    <>
      <Circle cx={c[0]} cy={c[1]} r={r} color={fill} />
      <Circle cx={c[0]} cy={c[1]} r={r} color={stroke} style="stroke" strokeWidth={width} />
    </>
  );
}

/** Alexander Calder-style mobile: arms swing at different rates around their own pivots. */
export function HangingMobile({ motion = defaultMotion, line, size = 320 }: ArtProps) {
  return (
    <Viewport width={size} height={(size * 180) / 320} scale={size / 320}>
      <Swing origin={[160, 0]} swing={2.2} duration={7500} motion={motion}>
        <Thread from={[160, 0]} to={[160, 30]} line={line} />
        <Seg from={[54, 30]} to={[266, 30]} color={line} />
        <Circle cx={160} cy={30} r={4} color={line} />

        <Swing origin={[62, 30]} swing={6} duration={4600} delay={-1200} motion={motion}>
          <Thread from={[62, 30]} to={[62, 88]} line={line} />
          <Circle cx={62} cy={110} r={21} color={art.sage} />
          <Circle cx={62} cy={110} r={7} color={art.cream} />
          <Spin origin={[62, 110]} duration={18000} motion={motion}>
            <Circle cx={62} cy={110} r={28} color={line} opacity={0.35} style="stroke" strokeWidth={1.5}>
              <DashPathEffect intervals={[3, 7]} />
            </Circle>
          </Spin>
        </Swing>

        <Swing origin={[134, 30]} swing={8} duration={3900} delay={-2400} motion={motion}>
          <Thread from={[134, 30]} to={[134, 106]} line={line} />
          <Path path="M114 128 A20 20 0 0 1 154 128 Z" color={art.sand} />
          <RoundedRect x={110} y={127} width={48} height={4} r={2} color={line} />
          <Circle cx={134} cy={137} r={4} color={line} />
        </Swing>

        <Swing origin={[226, 30]} swing={4.5} duration={5600} delay={-600} motion={motion}>
          <Thread from={[226, 30]} to={[226, 64]} line={line} />
          <Seg from={[192, 64]} to={[260, 64]} color={line} width={2.5} />

          <Swing origin={[196, 64]} swing={9} duration={3400} delay={-1800} motion={motion}>
            <Thread from={[196, 64]} to={[196, 118]} line={line} />
            <Path path="M196 118 L214 150 L178 150 Z" color={art.sage} />
          </Swing>

          <Swing origin={[256, 64]} swing={7} duration={4300} delay={-3000} motion={motion}>
            <Thread from={[256, 64]} to={[256, 98]} line={line} />
            <Path path="M256 98 L272 114 L256 130 L240 114 Z" color={art.sand} />
            <Path path="M256 107 L263 114 L256 121 L249 114 Z" color={art.cream} />
          </Swing>
        </Swing>
      </Swing>
    </Viewport>
  );
}

function RippleRing({ index, wave, clock, active }: {
  index: number;
  wave: (index: number) => { scale: number; opacity: number };
  clock: SharedValue<number>;
  active: boolean;
}) {
  // `clock` is read explicitly so Reanimated tracks it; `wave` reads it only through its own closure.
  const r = useDerivedValue(() => {
    void clock.value;
    return 38 * wave(index).scale;
  });
  const opacity = useDerivedValue(() => {
    void clock.value;
    return active ? wave(index).opacity : 0;
  }, [active]);
  return <Circle cx={60} cy={64} r={r} opacity={opacity} color={art.cream} style="stroke" strokeWidth={2} />;
}

export type AlarmGlyphProps = ArtProps & {
  /** Bell clatter and sound ripples play only while ringing. @default false */
  ringing?: boolean;
  /** @default 2 */
  rippleWaves?: number;
  /** @default 2400 */
  rippleDuration?: number;
};

/** Alarm clock: sound ripples and a clattering bell while ringing; hands always turn. */
export function AlarmGlyph({
  motion = defaultMotion,
  line,
  size = 120,
  ringing = false,
  rippleWaves = 2,
  rippleDuration = 2400,
}: AlarmGlyphProps) {
  const { count, wave, clock } = useRipplePulse({
    waves: rippleWaves,
    duration: rippleDuration / motion.speed,
    paused: motion.paused || !ringing,
  });

  return (
    <Viewport width={size} height={size} scale={size / 120}>
      {Array.from({ length: count }, (_, index) => (
        <RippleRing key={index} index={index} wave={wave} clock={clock} active={ringing} />
      ))}

      <Wobble origin={[60, 64]} degrees={10} duration={2800} active={ringing} motion={motion}>
        <Outlined path="M24 38 A14 14 0 0 1 44 22 Z" fill={art.sand} />
        <Outlined path="M96 38 A14 14 0 0 0 76 22 Z" fill={art.sand} />
        <Seg from={[40, 96]} to={[32, 106]} color={line} />
        <Seg from={[80, 96]} to={[88, 106]} color={line} />
        <OutlinedCircle c={[60, 64]} r={34} fill={art.cream} />
        {Array.from({ length: 12 }, (_, i) => (
          <Group key={i} origin={vec(60, 64)} transform={[{ rotate: i * 30 * DEG }]}>
            <Seg from={[60, 35]} to={[60, i % 3 === 0 ? 41 : 38]} color={art.ink} width={2} opacity={i % 3 === 0 ? 1 : 0.4} />
          </Group>
        ))}
        <Spin origin={[60, 64]} duration={48000} motion={motion}>
          <Seg from={[60, 64]} to={[60, 48]} color={art.ink} width={3.5} />
        </Spin>
        <Spin origin={[60, 64]} duration={8000} motion={motion}>
          <Seg from={[60, 64]} to={[60, 40]} color={art.ink} width={2.5} />
          <OutlinedCircle c={[60, 40]} r={3} fill={art.sage} width={1.5} />
        </Spin>
        <Circle cx={60} cy={64} r={4} color={art.ink} />
      </Wobble>
    </Viewport>
  );
}

/** Floating shapes resting on a shelf. */
export function ItemsGlyph({ motion = defaultMotion, line, size = 120 }: ArtProps) {
  return (
    <Viewport width={size} height={size} scale={size / 120}>
      <Float origin={[34, 74]} lift={-5} tilt={-8} duration={5200} motion={motion}>
        <Outlined path="M23 56 H45 Q52 56 52 63 V85 Q52 92 45 92 H23 Q16 92 16 85 V63 Q16 56 23 56 Z" fill={art.sage} />
      </Float>

      <Float origin={[84, 72]} lift={-8} duration={4200} delay={-1500} motion={motion}>
        <OutlinedCircle c={[84, 72]} r={19} fill={art.cream} />
        <OutlinedCircle c={[84, 72]} r={7} fill={art.sand} width={2} />
        <Spin origin={[84, 72]} duration={6000} motion={motion}>
          <Circle cx={84} cy={45} r={3.5} color={line} />
        </Spin>
      </Float>

      <Float origin={[52, 34]} lift={-6} tilt={10} duration={6000} delay={-3000} motion={motion}>
        <Outlined path="M52 14 L72 46 L32 46 Z" fill={art.cream} />
      </Float>

      <Seg from={[10, 104]} to={[110, 104]} color={line} />
      <Seg from={[22, 104]} to={[22, 112]} color={line} />
      <Seg from={[98, 104]} to={[98, 112]} color={line} />
    </Viewport>
  );
}

export type GeoHeartProps = {
  motion?: MotionSettings;
  color: string;
  size?: number;
  /** Beats per minute. @default 64 */
  bpm?: number;
  beating?: boolean;
};

/** Bauhaus heart (square + two circles) that beats with a systole/diastole rhythm. */
export function GeoHeart({ motion = defaultMotion, color, size = 64, bpm = 64, beating = true }: GeoHeartProps) {
  const pulse = useHarmonicMotion({
    profile: 'beat',
    amplitude: 0.18 * motion.amplitude,
    duration: 60000 / bpm / motion.speed,
    paused: motion.paused || !beating,
  });
  const transform = useDerivedValue(() => [{ scale: 1 + (beating ? pulse.value : 0) }], [beating]);

  return (
    <Viewport width={size} height={size} scale={size / 64}>
      <Group origin={vec(32, 34)} transform={transform}>
        <Group origin={vec(32, 34)} transform={[{ rotate: 45 * DEG }]}>
          <Rect x={18} y={20} width={28} height={28} color={color} />
        </Group>
        <Circle cx={22.1} cy={24.1} r={14} color={color} />
        <Circle cx={41.9} cy={24.1} r={14} color={color} />
      </Group>
    </Viewport>
  );
}
