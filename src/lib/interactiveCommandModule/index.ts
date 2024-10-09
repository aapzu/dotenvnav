import type { Argv, CommandModule } from 'yargs';
import parser from 'yargs-parser';

import type { TCommonOptions } from '../../cli';
import type { SomeRequired } from '../../types';
import { createAskMissingValuesMiddleware } from './askMissingValuesMiddleware';
import { type TParsedCommand, parseCommand } from './parse-command';
import type {
  CommandBuilderFunction,
  TInteractiveCommandModule,
  TInteractiveCommandOptions,
  TInteractivityOptions,
} from './types';

const withInteractiveOption = <
  T extends TCommonOptions,
  const U,
  const I extends string,
>(
  yargs: Argv<T>,
  interactivityOptions: SomeRequired<
    TInteractivityOptions<T, U, I>,
    'interactiveOptionName' | 'interactiveOptionAlias'
  >,
): Argv<TInteractiveCommandOptions<T, I>> =>
  yargs.option(interactivityOptions.interactiveOptionName, {
    type: 'boolean',
    alias: interactivityOptions.interactiveOptionAlias,
    description: 'Run the command in interactive mode',
    default: false,
  });

const builderWithInteractiveOption =
  <T extends TCommonOptions, U, I extends string>(
    builder: CommandBuilderFunction<TInteractiveCommandOptions<T, I>, U>,
    interactivityOptions: SomeRequired<
      TInteractivityOptions<T, U, I>,
      'interactiveOptionName' | 'interactiveOptionAlias'
    >,
  ): CommandBuilderFunction<TInteractiveCommandOptions<T, I>, U> =>
  async (yargs) => {
    return builder(
      withInteractiveOption(yargs as Argv<T>, interactivityOptions),
    );
  };

const interactiveCommandBuilder =
  <T extends TCommonOptions, U, I extends string>(
    builder: CommandBuilderFunction<TInteractiveCommandOptions<T, I>, U>,
    interactivityOptions: SomeRequired<
      TInteractivityOptions<T, U, I>,
      'interactiveOptionName' | 'interactiveOptionAlias'
    >,
    parsedCommand: TParsedCommand,
  ): CommandBuilderFunction<TInteractiveCommandOptions<T, I>, U> =>
  async (yargs) =>
    builder(
      withInteractiveOption(yargs as Argv<T>, interactivityOptions).middleware(
        createAskMissingValuesMiddleware(interactivityOptions, parsedCommand),
        true,
      ),
    );

export const createCommandModule = <U>(
  module: CommandModule<TCommonOptions, U>,
) => module;

export const createInteractiveCommandModule = <
  T extends TCommonOptions,
  U,
  const I extends string = 'interactive',
>(
  { command, builder, ...rest }: TInteractiveCommandModule<T, U, I>,
  interactivityOptions?: TInteractivityOptions<T, U, I>,
): CommandModule<T, U> => {
  const parsedCommand = parseCommand(command);
  const { interactive } = parser(process.argv.slice(2), {
    boolean: ['interactive'],
    alias: { interactive: 'i' },
  });
  const interactivityOptionsWithDefaults = {
    interactiveOptionName: 'interactive' as I,
    interactiveOptionAlias: 'i',
    ...interactivityOptions,
  } as const;

  if (interactive) {
    return {
      ...rest,
      command: command.replaceAll('<', '[').replaceAll('>', ']'),
      builder: interactiveCommandBuilder(
        builder,
        interactivityOptionsWithDefaults,
        parsedCommand,
      ),
    } as CommandModule<T, U>;
  }

  return {
    ...rest,
    command,
    builder: builderWithInteractiveOption(
      builder,
      interactivityOptionsWithDefaults,
    ),
  } as CommandModule<T, U>;
};
