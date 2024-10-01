import type enquirer from 'enquirer';
import type {
  ArgumentsCamelCase,
  Options,
  ParserConfigurationOptions,
} from 'yargs';

type CoerceCallback = (arg: unknown) => unknown;
type ConfigCallback = (configPath: string) =>
  | {
      [key: string]: unknown;
    }
  | Error;

export type OptionsKey<U> = keyof U & string;

type Dictionary<T> = Record<string, T>;

// Copied and modified from
// https://github.com/yargs/yargs/blob/0c95f9c/lib/typings/yargs-parser-types.ts#L88-L128

export type ArrayOptionValue<U> = OptionsKey<U>[];
export type ObjectOptionValue<U, T> = Partial<Record<OptionsKey<U>, T>>;

// Copied and modified from
// https://github.com/yargs/yargs/blob/0c95f9c/lib/typings/yargs-parser-types.ts#L88-L128
// and
// https://github.com/yargs/yargs/blob/0c95f9c/lib/yargs-factory.ts#L2289-L2316

export interface FactoryOptions {
  alias: Dictionary<string[]>;
  array: string[];
  boolean: string[];
  choices: Dictionary<string[]>;
  config: Dictionary<ConfigCallback | boolean>;
  coerce: Dictionary<CoerceCallback>;
  configObjects: Dictionary<unknown>[];
  configuration: Partial<ParserConfigurationOptions>;
  count: string[];
  default: Dictionary<unknown>;
  defaultDescription: Dictionary<string | undefined>;
  demandedCommands: Dictionary<{
    min: number;
    max: number;
    minMsg?: string | null;
    maxMsg?: string | null;
  }>;
  demandedOptions: Dictionary<string | undefined>;
  deprecatedOptions: Dictionary<string | boolean | undefined>;
  envPrefix: string | undefined;
  hiddenOptions: string[];
  /** Manually set keys */
  key: Dictionary<boolean | string>;
  local: string[];
  narg: Dictionary<number>;

  normalize: string[];
  number: string[];
  showHiddenOpt?: string;
  skipValidation: string[];
  string: string[];
}

// #region Types

export type TPromptType = Exclude<Options['type'], undefined>;

type YargsInstance<T, U> = import('yargs').Argv<T> & {
  getOptions: () => FactoryOptions;
  getInternalMethods: () => {
    getCommandInstance: () => {
      usage: {
        getDescriptions: () => Record<OptionsKey<U>, string>;
      };
    };
  };
};
type MiddlewareFunctionWithYargsInstance<T, U> = (
  args: ArgumentsCamelCase<T>,
  yargsInstance: YargsInstance<T, U>,
) =>
  | void
  | Promise<void>
  | ArgumentsCamelCase<T>
  | Promise<ArgumentsCamelCase<T>>;

declare module 'yargs' {
  interface Argv<T> {
    middleware<U>(
      callbacks:
        | MiddlewareFunctionWithYargsInstance<T, U>
        | ReadonlyArray<MiddlewareFunctionWithYargsInstance<T, U>>,
      applyBeforeValidation?: boolean,
    ): Argv<T>;
  }
}

export type TInteractiveCommandModuleOptions<T, U> = {
  interactiveFields: Array<OptionsKey<U> & string>;
};

export type PromptOptions = Exclude<
  Parameters<typeof enquirer.prompt>[0],
  ((...args: unknown[]) => unknown) | Array<unknown>
>;
