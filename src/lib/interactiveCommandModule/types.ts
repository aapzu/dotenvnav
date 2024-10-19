import type enquirer from 'enquirer';
import type { _ } from 'vitest/dist/reporters-1evA5lom.js';
import type {
  ArgumentsCamelCase,
  Argv,
  Options,
  ParserConfigurationOptions,
} from 'yargs';
import type { SomeRequired } from '../../types';

export type InteractiveYargsOptions<I extends string> = {
  interactiveOptionName: I;
  /** @default 'i' */
  interactiveOptionAlias: string;
  /** @default 'demanded' */
  defaultInteractivity: 'all' | 'demanded';
};

type CoerceCallback = (arg: unknown) => unknown;
type ConfigCallback = (
  configPath: string,
) => { [key: string]: unknown } | Error;

export type OptionsKey<U> = keyof U & string;

type Dictionary<T> = Record<string, T>;

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

export type TYargsInstance<T, U> = import('yargs').Argv<T> & {
  getOptions: () => FactoryOptions;
  getInternalMethods: () => {
    getCommandInstance: () => {
      usage: {
        getDescriptions: () => Record<OptionsKey<U>, string>;
      };
    };
  };
  // own field
  interactiveYargsOptions: SomeRequired<
    InteractiveYargsOptions<string>,
    'interactiveOptionName' | 'defaultInteractivity'
  >;
};
declare module 'yargs-parser' {
  interface DetailedArguments {
    defaulted: Record<string, true>;
  }
}

export type TMiddlewareFunction<T> = (
  args: ArgumentsCamelCase<T>,
  yargsInstance: TYargsInstance<T, unknown>,
) =>
  | void
  | Promise<void>
  | ArgumentsCamelCase<T>
  | Promise<ArgumentsCamelCase<T>>;

export type InteractiveCommandOptions<T, I extends string> = T & {
  /**
   * Run the command in interactive mode.
   */
  [K in I]: boolean;
};

export type InteractiveCommandModuleBuilderFunction<T, U> =
  | ((args: Argv<T>) => Argv<U>)
  | ((args: Argv<T>) => PromiseLike<Argv<U>>);

export type PromptOptions = Parameters<typeof enquirer.prompt>[0];

export type PromptOptionsObject = Exclude<
  PromptOptions,
  ((...args: unknown[]) => unknown) | Array<unknown>
>;
