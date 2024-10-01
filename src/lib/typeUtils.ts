type UnionToIntersection<U> = (
  U extends unknown
    ? (x: U) => unknown
    : never
) extends (x: infer R) => unknown
  ? R
  : never;

type LastOf<T> = UnionToIntersection<
  T extends unknown ? (x: T) => 0 : never
> extends (x: infer Last) => 0
  ? Last
  : never;

export type UnionToTuple<T, L = LastOf<T>> = [T] extends [never]
  ? []
  : [...UnionToTuple<Exclude<T, L>>, L];

export type Prettify<T> = { [K in keyof T]: T[K] } & {};
export type Replace<T, U> = Omit<T, keyof U> & U;

export type KeyOf<T> = keyof T;

export type ValueOf<T> = T[keyof T];
