import { CommandModule } from 'yargs';

type TKebabCaseToCamelCase<S extends string> = S extends `${infer F}-${infer R}`
  ? `${F}${Capitalize<TKebabCaseToCamelCase<R>>}`
  : S;

export type TKebabCaseKeysToCamelCase<T extends Record<string, unknown>> = {
  [K in keyof T as TKebabCaseToCamelCase<K & string>]: T[K];
};

export type TArgsByCommandModule<
  T,
  U,
  M extends CommandModule<T, U>,
> = M extends CommandModule<infer A>
  ? A extends Record<string, unknown>
    ? TKebabCaseKeysToCamelCase<A>
    : never
  : never;
