type TKebabCaseToCamelCase<S extends string> = S extends `${infer F}-${infer R}`
  ? `${F}${Capitalize<TKebabCaseToCamelCase<R>>}`
  : S;

export type TKebabCaseKeysToCamelCase<T> = {
  [K in keyof T as TKebabCaseToCamelCase<K & string>]: T[K];
};
