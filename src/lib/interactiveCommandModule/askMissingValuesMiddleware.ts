import { camelCase } from 'change-case';
import { asError } from '../commonUtils';
import { toEntries } from '../fpUtils';
import { logger } from '../logger';
import { getAllFieldNames, getOptions, getValueWithEnquirer } from './lib';
import type { TParsedCommand } from './parse-command';
import type {
  InteractiveCommandModuleOptions,
  TMiddlewareFunction,
} from './types';

export const createAskMissingValuesMiddleware =
  <T, U>(
    interactivityOptions: InteractiveCommandModuleOptions<T, U>,
    parsedCommand: TParsedCommand,
    interactive: boolean,
  ): TMiddlewareFunction<U> =>
  async (args, yargsInstance) => {
    if (!interactive) {
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

    const { defaultInteractivity = 'demanded', extraInteractiveFields = [] } =
      interactivityOptions;

    const parsed = yargsInstance.parsed || {
      aliases: {},
      newAliases: {},
      defaulted: undefined,
    };

    const allFields = getAllFieldNames<T, U>(
      parsed.aliases,
      Object.keys(parsed.newAliases),
      allOptions.alias,
    );

    const positionalsToPrompt = parsedCommand.demanded.map((d) => d.cmd[0]);

    const optionsToPrompt = allFields.filter((field) => {
      if (field === 'interactive') {
        return false;
      }
      const fieldHasValue =
        args[field] !== undefined && !parsed.defaulted?.[field];
      if (fieldHasValue) {
        return false;
      }
      const options = getOptions(field, allOptions, allDescriptions);
      return (
        defaultInteractivity === 'all' ||
        options.demandOption ||
        extraInteractiveFields.includes(field)
      );
    });

    const fieldsToPrompt = [
      ...new Set([...positionalsToPrompt, ...optionsToPrompt]),
    ];

    for (const field of fieldsToPrompt) {
      const options = getOptions(field, allOptions, allDescriptions);
      try {
        const value = await getValueWithEnquirer<
          typeof field extends keyof U ? U[typeof field] : unknown
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
  };
