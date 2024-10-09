import enquirer from 'enquirer';
import type { Options } from 'yargs';
import { getAllFieldNames, getOptions, getValueWithEnquirer } from '../lib';

vi.mock('enquirer');

describe('interactiveCommandModule lib', () => {
  describe('getOptions', () => {
    const coerceFn = (value: unknown) =>
      typeof value === 'string' ? value.toUpperCase() : value;
    const allOptions = {
      local: ['_'],
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
        'env-file-name': undefined,
      },
      demandedCommands: {},
      deprecatedOptions: {},
    };
    const allDescriptions = {
      'env-file-name': 'foobar',
      'env-name': 'barfoo',
    };

    it('should return correct options for a demanded option', () => {
      const options = getOptions('env-file-name', allOptions, allDescriptions);

      expect(options).toMatchObject({
        alias: ['f'],
        array: true,
        boolean: false,
        choices: undefined,
        coerce: coerceFn,
        config: undefined,
        configParser: undefined,
        conflicts: undefined,
        count: false,
        default: ['.env.local'],
        defaultDescription: undefined,
        demand: true,
        demandOption: true,
        deprecate: undefined,
        deprecated: undefined,
        desc: 'foobar',
        describe: 'foobar',
        global: undefined,
        group: undefined,
        hidden: undefined,
        implies: undefined,
        nargs: undefined,
        normalize: false,
        number: false,
        require: true,
        required: true,
        skipValidation: false,
        string: true,
        type: 'array',
      });
    });

    it('should return correct options for a not demanded option', () => {
      const options = getOptions('env-name', allOptions, allDescriptions);

      expect(options).toMatchObject({
        alias: ['e'],
        array: false,
        boolean: false,
        choices: undefined,
        coerce: undefined,
        config: undefined,
        configParser: undefined,
        conflicts: undefined,
        count: false,
        default: 'default',
        defaultDescription: 'default foobar',
        demand: false,
        demandOption: false,
        deprecate: undefined,
        deprecated: undefined,
        desc: 'barfoo',
        describe: 'barfoo',
        global: undefined,
        group: undefined,
        hidden: undefined,
        implies: undefined,
        nargs: undefined,
        normalize: true,
        number: false,
        require: false,
        required: false,
        skipValidation: false,
        string: true,
        type: 'string',
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
      const result = await getValueWithEnquirer('test', {
        type: 'boolean',
        default: false,
        description: 'Is this a test?',
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
      const result = await getValueWithEnquirer('test', {
        type: 'string',
        default: false,
        description: 'Is this a test?',
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
      const result = await getValueWithEnquirer('test', {
        type: 'number',
        description: 'Is this a test?',
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
      const result = await getValueWithEnquirer('test', {
        type: 'array',
        string: true,
        description: 'Is this a test?',
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

    it('should prompt for number type', async () => {
      const result = await getValueWithEnquirer('test', {
        type: 'count',
        description: 'Is this a test?',
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
        getValueWithEnquirer('test', {
          type: 'unknown' as never,
          description: 'Is this a test?',
          default: false,
        } as Options),
      ).rejects.toThrow('Unsupported prompt type: unknown');
    });
  });

  describe('getAllFieldNames', () => {
    it('parses field names from given args', () => {
      expect(
        getAllFieldNames(
          {
            'option-a': ['optionA', 'a'],
            a: ['option-a', 'optionA'],
            optionA: ['a', 'option-a'],
            'option-b': ['optionB', 'b'],
            b: ['option-b', 'optionB'],
            optionB: ['b', 'option-b'],
            'option-c': ['optionC'],
            optionC: ['option-c'],
            optiond: [],
          },
          ['optionA', 'optionB', 'optionC'],
          {
            'option-a': ['a'],
            'option-b': ['b'],
          },
        ),
      ).toEqual(['option-a', 'option-b', 'option-c', 'optiond']);
    });
  });
});
