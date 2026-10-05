import type { ReactNode } from 'react';
import Animated, { useAnimatedProps, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Polygon, Rect } from 'react-native-svg';
import { useHarmonicMotion, useRipplePulse } from 'alambre';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Illustration palette. Brand tones are fixed; strokes follow the theme via `line`. */
export const art = {
  sage: '#a2af9b',
  sand: '#dccfc0',
  cream: '#faf9ee',
  ink: '#2b3127',
};

/** Global motion knobs driven by the testbed's ConfigSliders / ConfigSwitch. */
export type MotionSettings = {
  /** Playback rate multiplier (2 = twice as fast). */
  speed: number;
  /** Multiplier applied to every angle / distance. */
  amplitude: number;
  paused: boolean;
};

type Point = readonly [number, number];

type MotionProps = {
  motion: MotionSettings;
  children?: ReactNode;
};

function timing(motion: MotionSettings, duration: number, delay: number) {
  return { duration: duration / motion.speed, delay: delay / motion.speed, paused: motion.paused };
}

/** Pendulum: rotates its children around `origin`. Nested swings compose like a real mobile. */
function Swing({ origin, swing, duration, delay = 0, motion, children }: MotionProps & {
  origin: Point;
  swing: number;
  duration: number;
  delay?: number;
}) {
  const angle = useHarmonicMotion({ profile: 'sine', amplitude: swing * motion.amplitude, ...timing(motion, duration, delay) });
  const animatedProps = useAnimatedProps(() => ({ rotation: angle.value }));
  return (
    <AnimatedG originX={origin[0]} originY={origin[1]} animatedProps={animatedProps}>
      {children}
    </AnimatedG>
  );
}

/** Constant-speed rotation around `origin`. */
function Spin({ origin, duration, motion, children }: MotionProps & { origin: Point; duration: number }) {
  const angle = useHarmonicMotion({ profile: 'spin', amplitude: 360, ...timing(motion, duration, 0) });
  const animatedProps = useAnimatedProps(() => ({ rotation: angle.value }));
  return (
    <AnimatedG originX={origin[0]} originY={origin[1]} animatedProps={animatedProps}>
      {children}
    </AnimatedG>
  );
}

/** Bobbing: lifts by `lift` (negative = up) while tilting by `tilt` degrees around `origin`. */
function Float({ origin, lift, tilt = 0, duration, delay = 0, motion, children }: MotionProps & {
  origin: Point;
  lift: number;
  tilt?: number;
  duration: number;
  delay?: number;
}) {
  const y = useHarmonicMotion({ profile: 'swell', amplitude: lift * motion.amplitude, ...timing(motion, duration, delay) });
  const angle = useHarmonicMotion({ profile: 'swell', amplitude: tilt * motion.amplitude, ...timing(motion, duration, delay) });
  const animatedProps = useAnimatedProps(() => ({ translateY: y.value, rotation: angle.value }));
  return (
    <AnimatedG originX={origin[0]} originY={origin[1]} animatedProps={animatedProps}>
      {children}
    </AnimatedG>
  );
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
  const isActive = useDerivedValue(() => active, [active]);
  const animatedProps = useAnimatedProps(() => ({ rotation: isActive.value ? angle.value : 0 }));
  return (
    <AnimatedG originX={origin[0]} originY={origin[1]} animatedProps={animatedProps}>
      {children}
    </AnimatedG>
  );
}

const string = (line: string) => ({ stroke: line, strokeOpacity: 0.5, strokeWidth: 1.5 });

type ArtProps = { motion: MotionSettings; line: string; size?: number };

/** Alexander Calder-style mobile: arms swing at different rates around their own pivots. */
export function HangingMobile({ motion, line, size = 320 }: ArtProps) {
  return (
    <Svg width={size} height={(size * 180) / 320} viewBox="0 0 320 180" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <Swing origin={[160, 0]} swing={2.2} duration={7500} motion={motion}>
        <Line x1={160} y1={0} x2={160} y2={30} {...string(line)} />
        <Line x1={54} y1={30} x2={266} y2={30} stroke={line} strokeWidth={3} />
        <Circle cx={160} cy={30} r={4} fill={line} />

        <Swing origin={[62, 30]} swing={6} duration={4600} delay={-1200} motion={motion}>
          <Line x1={62} y1={30} x2={62} y2={88} {...string(line)} />
          <Circle cx={62} cy={110} r={21} fill={art.sage} />
          <Circle cx={62} cy={110} r={7} fill={art.cream} />
          <Spin origin={[62, 110]} duration={18000} motion={motion}>
            <Circle cx={62} cy={110} r={28} stroke={line} strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="3 7" />
          </Spin>
        </Swing>

        <Swing origin={[134, 30]} swing={8} duration={3900} delay={-2400} motion={motion}>
          <Line x1={134} y1={30} x2={134} y2={106} {...string(line)} />
          <Path d="M114 128 A20 20 0 0 1 154 128 Z" fill={art.sand} />
          <Rect x={110} y={127} width={48} height={4} rx={2} fill={line} />
          <Circle cx={134} cy={137} r={4} fill={line} />
        </Swing>

        <Swing origin={[226, 30]} swing={4.5} duration={5600} delay={-600} motion={motion}>
          <Line x1={226} y1={30} x2={226} y2={64} {...string(line)} />
          <Line x1={192} y1={64} x2={260} y2={64} stroke={line} strokeWidth={2.5} />

          <Swing origin={[196, 64]} swing={9} duration={3400} delay={-1800} motion={motion}>
            <Line x1={196} y1={64} x2={196} y2={118} {...string(line)} />
            <Polygon points="196,118 214,150 178,150" fill={art.sage} />
          </Swing>

          <Swing origin={[256, 64]} swing={7} duration={4300} delay={-3000} motion={motion}>
            <Line x1={256} y1={64} x2={256} y2={98} {...string(line)} />
            <Polygon points="256,98 272,114 256,130 240,114" fill={art.sand} />
            <Polygon points="256,107 263,114 256,121 249,114" fill={art.cream} />
          </Swing>
        </Swing>
      </Swing>
    </Svg>
  );
}

function RippleRing({ index, wave, active, clock }: {
  index: number;
  wave: (index: number) => { scale: number; opacity: number };
  active: boolean;
  clock: import('react-native-reanimated').SharedValue<number>;
}) {
  const isActive = useDerivedValue(() => active, [active]);
  const animatedProps = useAnimatedProps(() => {
    void clock.value;
    const { scale, opacity } = wave(index);
    return { r: 38 * scale, opacity: isActive.value ? opacity : 0 };
  });
  return <AnimatedCircle cx={60} cy={64} r={38} stroke={art.cream} strokeWidth={2} fill="none" animatedProps={animatedProps} />;
}

export type AlarmGlyphProps = ArtProps & {
  /** Bell clatter and sound ripples play only while ringing. */
  ringing: boolean;
  rippleWaves: number;
  rippleDuration: number;
};

/** Alarm clock: sound ripples and a clattering bell while ringing; hands always turn. */
export function AlarmGlyph({ motion, line, size = 120, ringing, rippleWaves, rippleDuration }: AlarmGlyphProps) {
  const { count, wave, clock } = useRipplePulse({
    waves: rippleWaves,
    duration: rippleDuration / motion.speed,
    paused: motion.paused || !ringing,
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" strokeLinecap="round">
      {Array.from({ length: count }, (_, index) => (
        <RippleRing key={index} index={index} wave={wave} active={ringing} clock={clock} />
      ))}

      <Wobble origin={[60, 64]} degrees={10} duration={2800} active={ringing} motion={motion}>
        <Path d="M24 38 A14 14 0 0 1 44 22 Z" fill={art.sand} stroke={art.ink} strokeWidth={3} strokeLinejoin="round" />
        <Path d="M96 38 A14 14 0 0 0 76 22 Z" fill={art.sand} stroke={art.ink} strokeWidth={3} strokeLinejoin="round" />
        <Line x1={40} y1={96} x2={32} y2={106} stroke={line} strokeWidth={3} />
        <Line x1={80} y1={96} x2={88} y2={106} stroke={line} strokeWidth={3} />
        <Circle cx={60} cy={64} r={34} fill={art.cream} stroke={art.ink} strokeWidth={3} />
        {Array.from({ length: 12 }, (_, i) => (
          <Line
            key={i}
            x1={60}
            y1={35}
            x2={60}
            y2={i % 3 === 0 ? 41 : 38}
            stroke={art.ink}
            strokeOpacity={i % 3 === 0 ? 1 : 0.4}
            strokeWidth={2}
            rotation={i * 30}
            originX={60}
            originY={64}
          />
        ))}
        <Spin origin={[60, 64]} duration={48000} motion={motion}>
          <Line x1={60} y1={64} x2={60} y2={48} stroke={art.ink} strokeWidth={3.5} />
        </Spin>
        <Spin origin={[60, 64]} duration={8000} motion={motion}>
          <Line x1={60} y1={64} x2={60} y2={40} stroke={art.ink} strokeWidth={2.5} />
          <Circle cx={60} cy={40} r={3} fill={art.sage} stroke={art.ink} strokeWidth={1.5} />
        </Spin>
        <Circle cx={60} cy={64} r={4} fill={art.ink} />
      </Wobble>
    </Svg>
  );
}

/** Floating shapes resting on a shelf. */
export function ItemsGlyph({ motion, line, size = 120 }: ArtProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <Float origin={[34, 74]} lift={-5} tilt={-8} duration={5200} motion={motion}>
        <Rect x={16} y={56} width={36} height={36} rx={7} fill={art.sage} stroke={art.ink} strokeWidth={3} />
      </Float>

      <Float origin={[84, 72]} lift={-8} duration={4200} delay={-1500} motion={motion}>
        <Circle cx={84} cy={72} r={19} fill={art.cream} stroke={art.ink} strokeWidth={3} />
        <Circle cx={84} cy={72} r={7} fill={art.sand} stroke={art.ink} strokeWidth={2} />
        <Spin origin={[84, 72]} duration={6000} motion={motion}>
          <Circle cx={84} cy={45} r={3.5} fill={line} />
        </Spin>
      </Float>

      <Float origin={[52, 34]} lift={-6} tilt={10} duration={6000} delay={-3000} motion={motion}>
        <Polygon points="52,14 72,46 32,46" fill={art.cream} stroke={art.ink} strokeWidth={3} />
      </Float>

      <Line x1={10} y1={104} x2={110} y2={104} stroke={line} strokeWidth={3} />
      <Line x1={22} y1={104} x2={22} y2={112} stroke={line} strokeWidth={3} />
      <Line x1={98} y1={104} x2={98} y2={112} stroke={line} strokeWidth={3} />
    </Svg>
  );
}

export type GeoHeartProps = {
  motion: MotionSettings;
  color: string;
  size?: number;
  /** Beats per minute. */
  bpm: number;
  beating?: boolean;
};

/** Bauhaus heart (square + two circles) that beats with a systole/diastole rhythm. */
export function GeoHeart({ motion, color, size = 64, bpm, beating = true }: GeoHeartProps) {
  const pulse = useHarmonicMotion({
    profile: 'beat',
    amplitude: 0.18 * motion.amplitude,
    duration: 60000 / bpm / motion.speed,
    paused: motion.paused || !beating,
  });
  const isBeating = useDerivedValue(() => beating, [beating]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (isBeating.value ? pulse.value : 0) }],
  }));
  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, animatedStyle]}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <G originX={32} originY={34}>
          <Rect x={18} y={20} width={28} height={28} rotation={45} originX={32} originY={34} fill={color} />
          <Circle cx={22.1} cy={24.1} r={14} fill={color} />
          <Circle cx={41.9} cy={24.1} r={14} fill={color} />
        </G>
      </Svg>
    </Animated.View>
  );
}
