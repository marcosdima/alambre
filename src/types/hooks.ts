type DashStyle = {
  strokeDasharray: number;
  strokeDashoffset: number;
};

export type Animation = (v: number) => number;

export type UseIconAnimationProps = {
  fillOpacity?: number;
  strokeDasharray?: number,
  resetAnimation?: Animation,
  drawAnimation?: Animation,
};

export type UseIconAnimationReturn = {
  strokeOffestStyle: Partial<DashStyle>;
  reset: () => void;
  draw: (v: number) => void;
};
