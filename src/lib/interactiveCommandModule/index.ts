import type { Argv, CommandModule } from 'yargs';

import type { GetT } from '../../types';
import { createInteractiveYargsMiddleware } from './askMissingValuesMiddleware';
import type {
  InteractiveCommandOptions,
  InteractiveYargsOptions,
} from './types';

export const initInteractiveYargs = <T, I extends string = 'interactive'>(
  yargsInstance: Argv<T>,
  {
    interactiveOptionName = 'interactive' as I,
    interactiveOptionAlias,
    defaultInteractivity,
  }: Partial<InteractiveYargsOptions<I>> = {},
): Argv<InteractiveCommandOptions<T, I>> =>
  yargsInstance
    .option(interactiveOptionName, {
      type: 'boolean',
      alias: interactiveOptionAlias,
      description: 'Run the command in interactive mode',
      default: false,
    })
    .middleware(
      createInteractiveYargsMiddleware({
        interactiveOptionName,
        defaultInteractivity,
      }),
      true,
    );

export const commandModule =
  <Y extends Argv<T>, T = GetT<Y>>() =>
  <U>(module: CommandModule<T, U>) =>
    module;
