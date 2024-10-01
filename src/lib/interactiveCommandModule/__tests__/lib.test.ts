import enquirer from 'enquirer';
import type { MockInstance } from 'vitest';
import type { Options } from 'yargs';
import { getOptions, getValueWithEnquirer } from '../lib';
import type { FactoryOptions } from '../types';

vi.mock('enquirer');

describe('interactiveCommandModule lib', () => {
  describe('getOptions', () => {
    it('should return correct options for a given field', () => {
      const coerceFn = (value: unknown) =>
        typeof value === 'string' ? value.toUpperCase() : value;
      const options = getOptions('env-file-name', {
        local: ['_'],
        configObjects: [],
        array: ['env-file-name', 'f'],
        boolean: [
          'verbose',
          'v',
          'dry-run',
          'd',
          'help',
          'override-existing',
          'o',
          'yes',
          'y',
        ],
        string: [
          'project-root',
          'r',
          'config-root',
          'c',
          'env-file-name',
          'f',
          'metadata-file-path',
          'm',
          'env-name',
          'e',
        ],
        coerce: {
          'env-file-name': coerceFn,
        },
        skipValidation: [],
        count: [],
        normalize: ['env-name'],
        number: [],
        hiddenOptions: [],
        narg: {},
        key: {
          'project-root': true,
          r: true,
          'config-root': true,
          c: true,
          'env-file-name': true,
          f: true,
          'metadata-file-path': true,
          m: true,
          verbose: true,
          v: true,
          'dry-run': true,
          d: true,
          help: true,
          'override-existing': true,
          o: true,
          yes: true,
          y: true,
          'env-name': true,
          e: true,
        },
        alias: {
          'project-root': ['r'],
          'config-root': ['c'],
          'env-file-name': ['f'],
          'metadata-file-path': ['m'],
          verbose: ['v'],
          'dry-run': ['d'],
          'override-existing': ['o'],
          yes: ['y'],
          'env-name': ['e'],
        },
        default: {
          'project-root': '/Users/aapelihaanpuu/workspace/dotenvnav',
          'config-root': '~/.dotenvnav',
          'env-file-name': ['.env.local'],
          'metadata-file-path': '~/.dotenvnav.json',
          verbose: false,
          'dry-run': false,
          yes: false,
          'env-name': 'default',
        },
        defaultDescription: {
          'env-name': 'default foobar',
        },
        config: {},
        choices: {},
        demandedOptions: {
          'override-existing': undefined,
        },
        demandedCommands: {},
        deprecatedOptions: {},
        envPrefix: undefined,
        configuration: {},
      });

      expect(options).toMatchObject({
        alias: ['f'],
        array: true,
        boolean: false,
        choices: undefined,
        coerce: coerceFn,
        config: undefined,
        count: false,
        default: ['.env.local'],
        defaultDescription: undefined,
        demandedOptions: undefined,
        deprecatedOptions: undefined,
        envPrefix: undefined,
        hiddenOptions: false,
        key: true,
        local: false,
        narg: undefined,
        normalize: false,
        number: false,
        skipValidation: false,
        string: true,
        type: 'array',
      });
    });
  });

  describe('getValueWithEnquirer', () => {
    beforeEach(() => {
      vi.mock('enquirer', () => ({
        default: {
          prompt: vi.fn(() => Promise.resolve({ value: 'value' })),
        },
      }));
    });

    afterEach(() => {
      vi.resetAllMocks();
    });

    it('should prompt for boolean type', async () => {
      const result = await getValueWithEnquirer('test', 'Is this a test?', {
        type: 'boolean',
        default: false,
      } as Options);

      expect(vi.mocked(enquirer.prompt)).toHaveBeenCalledWith({
        name: 'value',
        initial: false,
        message: 'Is this a test?',
        required: true,
        type: 'confirm',
      });
      expect(result).toBe('value');
    });

    it('should prompt for string type', async () => {
      const result = await getValueWithEnquirer('test', 'Is this a test?', {
        type: 'string',
        default: false,
      } as Options);

      expect(vi.mocked(enquirer.prompt)).toHaveBeenCalledWith({
        name: 'value',
        initial: false,
        message: 'Is this a test?',
        required: true,
        type: 'input',
      });
      expect(result).toBe('value');
    });

    it('should prompt for number type', async () => {
      const result = await getValueWithEnquirer('test', 'Is this a test?', {
        type: 'number',
        default: false,
      } as Options);

      expect(vi.mocked(enquirer.prompt)).toHaveBeenCalledWith({
        name: 'value',
        initial: false,
        message: 'Is this a test?',
        required: true,
        type: 'numeral',
      });
      expect(result).toBe('value');
    });

    it('should prompt for array type', async () => {
      const result = await getValueWithEnquirer('test', 'Is this a test?', {
        type: 'array',
        string: true,
        default: ['foo', 'bar'],
      } as Options);

      expect(vi.mocked(enquirer.prompt)).toHaveBeenCalledWith({
        name: 'value',
        initial: ['foo', 'bar'],
        message: 'Is this a test?',
        required: true,
        type: 'list',
        multiline: true,
      });
      expect(result).toBe('value');
    });
  });

  it('should prompt for number type', async () => {
    const result = await getValueWithEnquirer('test', 'Is this a test?', {
      type: 'count',
      default: false,
    } as Options);

    expect(vi.mocked(enquirer.prompt)).toHaveBeenCalledWith({
      name: 'value',
      initial: false,
      message: 'Is this a test?',
      required: true,
      type: 'numeral',
    });
    expect(result).toBe('value');
  });

  it('should throw an error for unknown type', async () => {
    await expect(
      getValueWithEnquirer('test', 'Is this a test?', {
        type: 'unknown' as never,
        default: false,
      } as Options),
    ).rejects.toThrow('Unsupported prompt type: unknown');
  });
});
