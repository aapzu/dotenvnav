export const mapObject = <T, U>(
  obj: T,
  mapper: (key: keyof T, value: T[keyof T]) => U,
): { [K in keyof T]: U } =>
  Object.keys(obj as Record<string, unknown>).reduce(
    (acc, key) => {
      const typedKey = key as keyof T;
      acc[typedKey] = mapper(typedKey, obj[typedKey]);
      return acc;
    },
    {} as { [K in keyof T]: U },
  );

export const filterObject = <T>(
  obj: T,
  predicate: (key: keyof T, value: T[keyof T]) => boolean,
): Partial<T> =>
  Object.keys(obj as Record<string, unknown>).reduce<Partial<T>>((acc, key) => {
    const typedKey = key as keyof T;
    if (predicate(typedKey, obj[typedKey])) {
      acc[typedKey] = obj[typedKey];
    }
    return acc;
  }, {});

export const withoutKeys = <T, K extends Array<keyof T>>(
  obj: T,
  keys: K,
): Omit<T, K[number]> =>
  filterObject(obj, (key) => !keys.includes(key as K[number])) as Omit<
    T,
    K[number]
  >;

export const pick = <T, K extends Array<keyof T>>(
  obj: T,
  keys: K,
): Pick<T, K[number]> =>
  filterObject(obj, (key) => keys.includes(key as K[number])) as Pick<
    T,
    K[number]
  >;

export const toEntries = <O extends object>(obj: O) =>
  Object.entries(obj) as Array<{ [key in keyof O]: [key, O[key]] }[keyof O]>;

export const fromEntries = <K extends PropertyKey, V>(
  pairs: readonly [K, V][],
) => Object.fromEntries(pairs) as { [P in K]: V };
