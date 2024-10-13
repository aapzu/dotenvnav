import { kebabCase } from 'change-case';
import enquirer from 'enquirer';
import type { Options } from 'yargs';
import type { UnionToTuple } from '../typeUtils';
import type {
  FactoryOptions,
  OptionsKey,
  PromptOptionsObject,
  TPromptType,
  TYargsInstance,
} from './types';

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
  allOptions: Omit<
    FactoryOptions,
    'envPrefix' | 'showHiddenOpt' | 'configuration' | 'configObjects'
  >,
  allDescriptions: Record<string, string>,
): Options => {
  type GetOptionValue = <K extends keyof typeof allOptions>(
    valueFieldName: K,
  ) => (typeof allOptions)[K] extends string
    ? string
    : (typeof allOptions)[K] extends string[]
      ? boolean
      : (typeof allOptions)[K] extends Record<string, infer U>
        ? U
        : never;
  const getOptionValue: GetOptionValue = (valueFieldName) => {
    const value = allOptions[valueFieldName];
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.includes(field) as ReturnType<GetOptionValue>;
    }
    const kebabCaseField = kebabCase(field);
    if (
      value &&
      kebabCaseField in value &&
      value?.[kebabCaseField] === undefined
    ) {
      return true as ReturnType<GetOptionValue>;
    }
    return value?.[field] ?? value?.[kebabCaseField];
  };

  const type = ALL_TYPES.find(getOptionValue) || 'boolean';

  const demandOption = getOptionValue('demandedOptions') ?? false;

  return {
    alias: getOptionValue('alias'),
    choices: getOptionValue('choices'),
    coerce: getOptionValue('coerce'),
    config: getOptionValue('config') as boolean,
    configParser: undefined,
    conflicts: undefined,
    default: getOptionValue('default'),
    defaultDescription: getOptionValue('defaultDescription'),
    demand: demandOption,
    deprecate: getOptionValue('deprecatedOptions'),
    deprecated: getOptionValue('deprecatedOptions'),
    demandOption,
    desc: allDescriptions[field],
    describe: allDescriptions[field],
    description: allDescriptions[field],
    global: undefined,
    group: undefined,
    hidden: undefined,
    implies: undefined,
    nargs: getOptionValue('narg'),
    normalize: getOptionValue('normalize'),
    require: demandOption,
    required: demandOption,
    skipValidation: getOptionValue('skipValidation'),
    type,
  };
};

const createPromptFactory =
  <T>(
    fieldName: string,
    { default: defaultValue, coerce, description }: Options,
  ) =>
  async <O extends Omit<PromptOptionsObject, 'name' | 'message' | 'initial'>>(
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

const expectNever = (value: never): never => value;

export const getValueWithEnquirer = async <T>(
  fieldName: string,
  options: Options,
): Promise<T> => {
  const createPrompt = createPromptFactory<T>(fieldName, options);

  switch (options.type) {
    case undefined:
    case 'boolean':
      return createPrompt({ type: 'confirm' });
    case 'string':
      return options.choices?.length
        ? createPrompt({ type: 'select', choices: [...options.choices] })
        : createPrompt({ type: 'input' });
    case 'number':
      return options.choices?.length
        ? createPrompt({ type: 'select', choices: [...options.choices] })
        : createPrompt({ type: 'numeral' });
    case 'count':
      return createPrompt({ type: 'numeral' });
    case 'array':
      return options.choices?.length
        ? createPrompt({ type: 'multiselect', choices: [...options.choices] })
        : createPrompt({ type: 'list', multiline: true });
    default:
      throw new Error(`Unsupported prompt type: ${expectNever(options.type)}`);
  }
};

export const getAllFieldNames = <T, U>(
  allFieldsAndAliases: Exclude<
    TYargsInstance<T, U>['parsed'],
    false
  >['aliases'],
  camelCaseAliases: string[],
  optionsAliases: FactoryOptions['alias'],
) =>
  Object.keys(allFieldsAndAliases).filter(
    (name) =>
      !camelCaseAliases.includes(name) &&
      (Object.keys(optionsAliases).includes(name) ||
        Object.values(optionsAliases).every(
          (aliases) => !aliases.includes(name),
        )),
  ) as Array<OptionsKey<U>>;
