import mock from 'mock-fs';

import { camelCase } from 'change-case';
import type { Arguments } from 'yargs';
import type { TCommonOptions, TCommonOptionsCamelCase } from '../../cli';
import { createMockMetadataFile } from '../../testUtils';
import {
  createValidateMetadataFileChecker,
  readMetadataFile,
  upsertMetadataFile,
} from '../metadataFile';

const defaultOptions: TCommonOptions & { 'config-root': string } = {
  'metadata-file-path': '/temp/.envnav.json',
  'config-root': '/temp/.dotenvnav',
  'project-root': '/temp/testProject',
  'dry-run': false,
  verbose: false,
  'env-file-name': ['.env.local'],
};

const defaultArguments: Arguments<TCommonOptions> = {
  ...defaultOptions,
  _: [],
  $0: '',
};

const defaultOptionsCamelCase = Object.fromEntries(
  Object.entries(defaultOptions).map(([key, value]) => [camelCase(key), value]),
) as TCommonOptionsCamelCase & { configRoot: string };

describe('metadatafile', () => {
  afterEach(() => {
    mock.restore();
  });

  describe('upsertMetadataFile', () => {
    it('should create a metadata file', async () => {
      mock({
        '/temp/.dotenvnav': {},
      });

      await upsertMetadataFile(defaultOptionsCamelCase);

      expect(
        createMockMetadataFile(defaultOptionsCamelCase),
      ).toMatchFileStructure();
    });

    it('should update a metadata file', async () => {
      mock(createMockMetadataFile(defaultOptionsCamelCase));

      const updatedOptions = {
        ...defaultOptionsCamelCase,
        configRoot: '/temp2/.dotenvnav',
        projectRoot: '/temp2/testProject',
      };

      await upsertMetadataFile(updatedOptions);

      expect(createMockMetadataFile(updatedOptions)).toMatchFileStructure();
    });
  });

  describe('readMetadataFile', () => {
    it('should read a metadata file', async () => {
      const metadataFile = createMockMetadataFile(defaultOptionsCamelCase);

      mock(metadataFile);

      const metadata = await readMetadataFile(defaultOptionsCamelCase);

      expect(metadata).toEqual(
        JSON.parse(metadataFile[defaultOptionsCamelCase.metadataFilePath]),
      );
    });

    it('should throw an error if the metadata file has invalid json in it', async () => {
      mock({
        [defaultOptionsCamelCase.metadataFilePath]: 'invalid json',
      });

      await expect(readMetadataFile(defaultOptionsCamelCase)).rejects.toThrow(
        'Invalid JSON in metadata file',
      );
    });

    it('should throw an error if the metadata file format is not valid', async () => {
      mock({
        [defaultOptionsCamelCase.metadataFilePath]: JSON.stringify(
          {
            configRoot: 'foobar',
            projects: 1,
            extra: 'extra',
          },
          null,
          2,
        ),
      });

      await expect(readMetadataFile(defaultOptionsCamelCase)).rejects.toThrow(`Invalid metadata file: {
  "_errors": [
    "Unrecognized key(s) in object: 'extra'"
  ],
  "projects": {
    "_errors": [
      "Expected object, received number"
    ]
  }
}`);
    });
  });

  describe('validateMetadataFile', () => {
    it('should not throw if metadata file is missing but called with allowNotExists=true', async () => {
      mock({ '/temp': {} });

      const validateMetadataFile = createValidateMetadataFileChecker({
        allowNotExists: true,
      });

      expect(await validateMetadataFile(defaultArguments)).eql(true);
    });

    it('should throw if metadata file is missing', async () => {
      mock({ '/temp': {} });

      const validateMetadataFile = createValidateMetadataFileChecker();

      expect(await validateMetadataFile(defaultArguments)).eql(
        "Metadata file not found in /temp/.envnav.json. Please run 'init' first.",
      );
    });

    it('should not throw if called with correct projectRoot', async () => {
      mock(createMockMetadataFile(defaultOptionsCamelCase));

      const validateMetadataFile = createValidateMetadataFileChecker();

      expect(await validateMetadataFile(defaultArguments)).eql(true);
    });

    it('should throw if called with incorrect projectRoot', async () => {
      mock(
        createMockMetadataFile({
          ...defaultOptionsCamelCase,
          extraContent: {
            projects: {
              projectRootPath: '/temp/foobar/projectRootPath',
            },
          },
        }),
      );

      const validateMetadataFile = createValidateMetadataFileChecker();

      expect(
        await validateMetadataFile({
          ...defaultArguments,
          'project-root': '/temp/projectRootPath',
        }),
      ).eql(
        'The project projectRootPath was initialized using different project root (/temp/foobar/projectRootPath). Refusing to proceed.',
      );
    });

    it('should throw if called with incorrect configRoot', async () => {
      mock(
        createMockMetadataFile({
          ...defaultOptionsCamelCase,
          extraContent: {
            configRoot: '/temp2/.dotenvnav',
          },
        }),
      );

      const validateMetadataFile = createValidateMetadataFileChecker();

      expect(
        await validateMetadataFile({
          ...defaultArguments,
          'config-root': '/temp/.dotenvnav',
        }),
      ).eql(
        'The metadata file /temp/.envnav.json was initialized with different config root (/temp2/.dotenvnav). Refusing to proceed.',
      );
    });
  });
});
