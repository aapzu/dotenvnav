import enquirer from 'enquirer';
import type { Options } from 'yargs';
import { mapObject, withoutKeys } from '../fpUtils';
import type { UnionToTuple } from '../typeUtils';
import type { FactoryOptions, PromptOptions, TPromptType } from './types';

const ALL_TYPES_OBJECT: Record<TPromptType, boolean> = {
  array: true,
  boolean: true,
  string: true,
  number: true,
  count: true,
};

const ALL_TYPES = Object.keys(ALL_TYPES_OBJECT) as UnionToTuple<TPromptType>;

export const getOptions = (
  field: string,
  allOptions: FactoryOptions,
): Options => {
  const filteredOptions = withoutKeys(allOptions, [
    'configObjects',
    'demandedCommands',
    'configObjects',
    'showHiddenOpt',
    'configuration',
  ]);

  const getOptionValue = (valueFieldName: keyof typeof filteredOptions) => {
    const value = allOptions[valueFieldName];
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.includes(field);
    }
    return value?.[field];
  };

  const type = ALL_TYPES.find(getOptionValue) || 'boolean';

  return {
    ...mapObject(filteredOptions, (key) => {
      return getOptionValue(key);
    }),
    type,
  } as Options;
};

const expectNever = (value: never): never => value;

const createPromptFactory =
  <T>(
    fieldName: string,
    description: string,
    { default: defaultValue, coerce }: Options,
  ) =>
  async <O extends Omit<PromptOptions, 'name' | 'message' | 'initial'>>(
    options: O,
  ): Promise<T> => {
    const { value } = await enquirer.prompt<{ value: T }>({
      name: 'value',
      initial: defaultValue,
      message: description || fieldName,
      required: true,
      ...options,
    });
    if (coerce) {
      return coerce(value);
    }
    return value;
  };

export const getValueWithEnquirer = async <T>(
  fieldName: string,
  description: string,
  options: Options,
): Promise<T> => {
  const { type } = options;
  const createPrompt = createPromptFactory<T>(fieldName, description, options);

  switch (type) {
    case undefined:
    case 'boolean':
      return createPrompt({ type: 'confirm' });
    case 'string':
      return createPrompt({ type: 'input' });
    case 'number':
    case 'count':
      return createPrompt({ type: 'numeral' });
    case 'array':
      return createPrompt({
        type: 'list',
        multiline: true,
      });
    default:
      throw new Error(`Unsupported prompt type: ${expectNever(type)}`);
  }
};
