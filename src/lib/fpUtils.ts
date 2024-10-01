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
