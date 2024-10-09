import type enquirer from 'enquirer';
import type { _ } from 'vitest/dist/reporters-1evA5lom.js';
import type {
  ArgumentsCamelCase,
  Argv,
  CommandModule,
  Options,
  ParserConfigurationOptions,
} from 'yargs';

export type InteractiveYargsOptions<I extends string> = {
  interactiveOptionName?: I;
  /** @default 'i' */
  interactiveOptionAlias?: string;
};

export type InteractiveCommandModuleOptions<_T, U> = {
  /** @default 'demanded' */
  defaultInteractivity?: 'all' | 'demanded';
  extraInteractiveFields?: Array<OptionsKey<U>>;
};

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

export interface InteractiveArgv<T>
  extends Omit<Argv<T>, 'command' | 'middleware'> {
  command<U>(module: InteractiveCommandModule<T, U>): InteractiveArgv<T>;
  command<U>(
    modules: Array<InteractiveCommandModule<T, U>>,
  ): InteractiveArgv<T>;

  middleware(
    middleware: TMiddlewareFunction<T> | TMiddlewareFunction<T>[],
    applyBeforeValidation?: boolean,
  ): InteractiveArgv<T>;
}

export type InteractiveCommandOptions<T, I extends string> = T & {
  /**
   * Run the command in interactive mode.
   */
  [K in I]: boolean;
};

export type InteractiveCommandModuleBuilderFunction<T, U> =
  | ((args: Argv<T>) => Argv<U>)
  | ((args: Argv<T>) => PromiseLike<Argv<U>>);

export type InteractiveCommandModule<T, U> = Omit<
  CommandModule<T, U>,
  'command' | 'builder'
> & {
  command: string;
  builder: InteractiveCommandModuleBuilderFunction<T, U>;
};

export type PromptOptions = Parameters<typeof enquirer.prompt>[0];

export type PromptOptionsObject = Exclude<
  PromptOptions,
  ((...args: unknown[]) => unknown) | Array<unknown>
>;

// biome-ignore lint/suspicious/noExplicitAny: any needed for type inference
type AnyInteractiveCommandOptions = InteractiveCommandOptions<any, any>;
export type GetT<Y extends InteractiveArgv<AnyInteractiveCommandOptions>> =
  Y extends InteractiveArgv<infer T> ? T : never;

export type GetI<Y extends InteractiveArgv<AnyInteractiveCommandOptions>> =
  Y extends InteractiveArgv<InteractiveCommandOptions<infer _T, infer I>>
    ? I
    : never;
