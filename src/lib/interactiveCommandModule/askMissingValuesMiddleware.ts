import { camelCase } from 'change-case';
import type { ArgumentsCamelCase, MiddlewareFunction } from 'yargs';
import { asError } from '../commonUtils';
import { toEntries } from '../fpUtils';
import { logger } from '../logger';
import { getAllFieldNames, getOptions, getValueWithEnquirer } from './lib';
import type { InteractiveYargsOptions, TYargsInstance } from './types';

export const createInteractiveYargsMiddleware = <T, I extends string>(
  givenOptions: Partial<InteractiveYargsOptions<I>>,
): MiddlewareFunction<T> =>
  (async (args: ArgumentsCamelCase<T>, yargsInstance: TYargsInstance<T, T>) => {
    const interactiveYargsOptions: InteractiveYargsOptions<I> = {
      ...givenOptions,
      interactiveOptionAlias: 'i',
      interactiveOptionName: 'interactive' as I,
      defaultInteractivity: 'demanded',
    };
    yargsInstance.interactiveYargsOptions = interactiveYargsOptions;

    const { interactiveOptionName, defaultInteractivity } =
      interactiveYargsOptions;

    const isInteractive = args[interactiveOptionName];

    if (!isInteractive) {
      return args;
    }

    const allOptions = yargsInstance.getOptions();
    const allDescriptions = yargsInstance
      .getInternalMethods()
      .getCommandInstance()
      .usage.getDescriptions();

    const anotherFieldUsesAlias = toEntries(allOptions.alias).some(
      ([key, value]) => key !== 'interactive' && value.includes('i'),
    );

    if (anotherFieldUsesAlias) {
      logger.warn('Interactive alias "i" is already used by another field.');
    }

    const valuesByField: Record<string, unknown> = {};

    const parsed = yargsInstance.parsed || {
      aliases: {},
      newAliases: {},
      defaulted: undefined,
    };

    const allFields = getAllFieldNames(
      parsed.aliases,
      Object.keys(parsed.newAliases),
      allOptions.alias,
    );

    const optionsToPrompt = allFields.filter((field) => {
      if (field === interactiveOptionName) {
        return false;
      }
      const fieldHasValue =
        args[field] !== undefined && !parsed.defaulted?.[field];
      if (fieldHasValue) {
        return false;
      }
      const options = getOptions(field, allOptions, allDescriptions);
      return defaultInteractivity === 'all' || options.demandOption;
    });

    for (const field of optionsToPrompt) {
      const options = getOptions(field, allOptions, allDescriptions);
      try {
        const value = await getValueWithEnquirer<
          typeof field extends keyof T ? T[typeof field] : unknown
        >(field, options);
        const allFieldNames = [
          ...new Set([field, camelCase(field), ...(options.alias || [])]),
        ];
        for (const alias of allFieldNames) {
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

    return { ...args, ...valuesByField };
  }) as unknown as MiddlewareFunction<T>;
