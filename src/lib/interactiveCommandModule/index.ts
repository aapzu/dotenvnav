import { camelCase } from 'change-case';
import type { Argv, CommandModule } from 'yargs';

import type { TCommonOptions } from '../../cli';
import { asError } from '../commonUtils';
import { logger } from '../logger';
import { getOptions, getValueWithEnquirer } from './lib';
import type { TInteractiveCommandModuleOptions } from './types';

const interactiveCommandBuilder = <T, const U>(
  builder: CommandModule<T, U>['builder'],
  { interactiveFields = [] }: TInteractiveCommandModuleOptions<T, U>,
): CommandModule<T, U>['builder'] => {
  if (typeof builder !== 'function') {
    logger.warn('Object builder is not supported');
    return builder;
  }
  return async (yargs: Argv<T>) =>
    builder(
      yargs.middleware<U>(async (args, yargsInstance) => {
        const allOptions = yargsInstance.getOptions();
        const allDescriptions = yargsInstance
          .getInternalMethods()
          .getCommandInstance()
          .usage.getDescriptions();

        const valuesByField: Record<string, unknown> = {};

        for (const field of interactiveFields) {
          const options = getOptions(field, allOptions);
          try {
            const value = await getValueWithEnquirer<U[typeof field]>(
              field,
              allDescriptions[field],
              options,
            );
            valuesByField[field] = value;
            valuesByField[camelCase(field)] = value;
            for (const alias of options.alias ?? []) {
              valuesByField[alias] = value;
            }
          } catch (err) {
            // err === '' means the user aborted the prompt
            // I don't have an earthly idea why enquirer does it that way
            if (err === '') {
              logger.warn('Aborting');
              process.exit(0);
            }
            const error = asError(err);
            logger.error(error);
            process.exit(1);
          }
        }

        return {
          ...args,
          ...valuesByField,
        };
      }, true),
    );
};
export const createCommandModule = <U>(
  module: CommandModule<TCommonOptions, U>,
) => module;

export const createInteractiveCommandModule = <const U>({
  interactiveFields,
  ...module
}: CommandModule<TCommonOptions, U> &
  TInteractiveCommandModuleOptions<TCommonOptions, U>) => ({
  ...module,
  builder: interactiveCommandBuilder<TCommonOptions, U>(module.builder, {
    interactiveFields,
  }),
});
