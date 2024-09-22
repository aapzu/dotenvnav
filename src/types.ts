import type { CommandModule } from 'yargs';

type TKebabCaseToCamelCase<S extends string> = S extends `${infer F}-${infer R}`
  ? `${F}${Capitalize<TKebabCaseToCamelCase<R>>}`
  : S;

export type TKebabCaseKeysToCamelCase<T> = {
  [K in keyof T as TKebabCaseToCamelCase<K & string>]: T[K];
};

export type Prettify<T> = T extends object ? { [K in keyof T]: T[K] } & {} : T;
export type YargsModuleArgs<T> = T extends CommandModule<infer U, infer V>
  ? Prettify<TKebabCaseKeysToCamelCase<U & V>>
  : never;
