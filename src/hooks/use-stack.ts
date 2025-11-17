import { useState } from 'react';

export default <T>() => {
  const [stack, setStack] = useState<T[]>([]);
  const [top] = stack;

  const push = (d: T) => {
    setStack((prev) => prev.concat(d));
  };

  const pop = () => {
    setStack((prev) => prev.filter((d: T) => d !== top));
    return top;
  };

  return {
    top,
    push,
    pop,
  };
} ;
