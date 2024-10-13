import type { Argv } from 'yargs';
import parser from 'yargs-parser';

import { createAskMissingValuesMiddleware } from './askMissingValuesMiddleware';
import { type TParsedCommand, parseCommand } from './parse-command';
import type {
  GetI,
  GetT,
  InteractiveArgv,
  InteractiveCommandModule,
  InteractiveCommandModuleBuilderFunction,
  InteractiveCommandModuleOptions,
  InteractiveCommandOptions,
  InteractiveYargsOptions,
} from './types';

export const interactiveYargs = <T, I extends string = 'interactive'>(
  yargsInstance: InteractiveArgv<T>,
  {
    interactiveOptionName = 'interactive' as I,
    interactiveOptionAlias,
  }: InteractiveYargsOptions<I> = {},
): Argv<InteractiveCommandOptions<T, I>> =>
  yargsInstance.option(interactiveOptionName, {
    type: 'boolean',
    alias: interactiveOptionAlias,
    description: 'Run the command in interactive mode',
    default: false,
  });

const interactiveCommandBuilder =
  <T, U>(
    builder: InteractiveCommandModuleBuilderFunction<T, U>,
    interactivityOptions: InteractiveCommandModuleOptions<T, U>,
    parsedCommand: TParsedCommand,
    interactive: boolean,
  ): InteractiveCommandModuleBuilderFunction<T, U> =>
  async (yargs) =>
    (await builder(yargs)).middleware(
      createAskMissingValuesMiddleware(
        interactivityOptions,
        parsedCommand,
        interactive,
      ),
      true,
    );

export const interactiveCommandModule =
  <
    // biome-ignore lint/suspicious/noExplicitAny: this seems to only work with any
    Y extends InteractiveArgv<any>,
    T = GetT<Y>,
  >() =>
  <U>(
    { command, builder, ...rest }: InteractiveCommandModule<T, U>,
    interactivityOptions?: InteractiveCommandModuleOptions<T, U>,
  ): InteractiveCommandModule<T, U> => {
    const parsedCommand = parseCommand(command);

    const interactivityOptionsWithDefaults = {
      interactiveOptionName: 'interactive' as GetI<Y>,
      interactiveOptionAlias: 'i',
      ...interactivityOptions,
    } as const;
    const { interactive } = parser(process.argv.slice(2), {
      boolean: [interactivityOptionsWithDefaults.interactiveOptionName],
      alias: {
        interactive: interactivityOptionsWithDefaults.interactiveOptionAlias,
      },
    });
    const finalCommand = interactive
      ? command.replaceAll('<', '[').replaceAll('>', ']')
      : command;
    return {
      ...rest,
      command: finalCommand,
      builder: interactiveCommandBuilder(
        builder,
        interactivityOptionsWithDefaults,
        parsedCommand,
        interactive,
      ),
    };
  };
