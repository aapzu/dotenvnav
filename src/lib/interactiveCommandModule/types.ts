import type enquirer from 'enquirer';
import type { _ } from 'vitest/dist/reporters-1evA5lom.js';
import type {
  ArgumentsCamelCase,
  CommandModule,
  Options,
  ParserConfigurationOptions,
} from 'yargs';
import type { TCommonOptions } from '../../cli';

type CoerceCallback = (arg: unknown) => unknown;
type ConfigCallback = (
  configPath: string,
) => { [key: string]: unknown } | Error;

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

export type TYargsInstance<T, U> = import('yargs').Argv<T> & {
  getOptions: () => FactoryOptions;
  getInternalMethods: () => {
    getCommandInstance: () => {
      usage: {
        getDescriptions: () => Record<OptionsKey<U>, string>;
      };
    };
  };
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

declare module 'yargs' {
  interface Argv<T> {
    middleware(
      middleware: TMiddlewareFunction<T> | TMiddlewareFunction<T>[],
      applyBeforeValidation?: boolean,
    ): Argv<T>;
  }
}

export type TInteractiveCommandOptions<T, I extends string> = T & {
  /**
   * Run the command in interactive mode.
   */
  [K in I]: boolean;
};

export type TInteractivityOptions<_T, U, I extends string> = {
  /** @default 'demanded' */
  defaultInteractivity?: 'all' | 'demanded';
  extraInteractiveFields?: Array<OptionsKey<U>>;
  /** @default 'interactive' */
  interactiveOptionName?: I;
  /** @default 'i' */
  interactiveOptionAlias?: string;
};

export type CommandBuilderFunction<T, U> = Exclude<
  Required<CommandModule<T, U>>['builder'],
  Record<string, unknown>
>;

export type TInteractiveCommandModuleBuilderFunction<
  T extends TCommonOptions,
  U,
  I extends string,
> = Required<TInteractiveCommandModule<T, U, I>>['builder'];

export type TInteractiveCommandModule<
  T extends TCommonOptions,
  U,
  I extends string,
> = Omit<
  CommandModule<TInteractiveCommandOptions<T, I>, U>,
  'command' | 'builder'
> & {
  command: string;
  builder: CommandBuilderFunction<TInteractiveCommandOptions<T, I>, U>;
};

export type PromptOptions = Exclude<
  Parameters<typeof enquirer.prompt>[0],
  ((...args: unknown[]) => unknown) | Array<unknown>
>;
