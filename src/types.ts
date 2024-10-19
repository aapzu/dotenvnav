import type { Argv, CommandModule } from 'yargs';
import type { Prettify } from './lib/typeUtils';

type TKebabCaseToCamelCase<S extends string> = S extends `${infer F}-${infer R}`
  ? `${F}${Capitalize<TKebabCaseToCamelCase<R>>}`
  : S;

export type TKebabCaseKeysToCamelCase<T> = {
  [K in keyof T as TKebabCaseToCamelCase<K & string>]: T[K];
};

export type YargsModuleArgs<T> = T extends CommandModule<infer U, infer V>
  ? Prettify<TKebabCaseKeysToCamelCase<U & V>>
  : never;

export type SomeRequired<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type GetT<Y extends Argv<any>> = Y extends Argv<infer T> ? T : never;
