type DashStyle = {
  strokeDasharray: number;
  strokeDashoffset: number;
};

export type Animation = (v: number) => number;

export type IconAnimationConfig = {
  fillOpacity?: number;
  strokeDasharray?: number,
  resetAnimation?: Animation,
  drawAnimation?: Animation,
};

export type UseIconAnimationReturn = {
  strokeOffestStyle: Partial<DashStyle>;
  strokeOffsetStyle?: Partial<DashStyle>;
  reset: () => void;
  draw: (v: number) => void;
};
