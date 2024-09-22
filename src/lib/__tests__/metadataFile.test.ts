import mock from 'mock-fs';

import { createMockMetadataFile } from '../../testUtils';
import {
  readMetadataFile,
  upsertMetadataFile,
  validateMetadataFile,
} from '../metadataFile';

const defaultOptions = {
  metadataFilePath: '/temp/.envnav.json',
  configRoot: '/temp/.dotenvnav',
  projectRoot: '/temp/testProject',
};

describe('metadatafile', () => {
  afterEach(() => {
    mock.restore();
  });

  describe('upsertMetadataFile', () => {
    it('should create a metadata file', async () => {
      mock({
        '/temp/.dotenvnav': {},
      });

      await upsertMetadataFile(defaultOptions);

      expect({
        ...createMockMetadataFile(defaultOptions),
      }).toMatchFileStructure();
    });

    it('should update a metadata file', async () => {
      mock({
        ...createMockMetadataFile(defaultOptions),
      });

      const updatedOptions = {
        ...defaultOptions,
        configRoot: '/temp2/.dotenvnav',
        projectRoot: '/temp2/testProject',
      };

      await upsertMetadataFile(updatedOptions);

      expect({
        ...createMockMetadataFile(updatedOptions),
      }).toMatchFileStructure();
    });
  });

  describe('readMetadataFile', () => {
    it('should read a metadata file', async () => {
      const metadataFile = createMockMetadataFile(defaultOptions);

      mock({
        ...metadataFile,
      });

      const metadata = await readMetadataFile(defaultOptions);

      expect(metadata).toEqual(
        JSON.parse(metadataFile[defaultOptions.metadataFilePath]),
      );
    });

    it('should throw an error if the metadata file has invalid json in it', async () => {
      mock({
        [defaultOptions.metadataFilePath]: 'invalid json',
      });

      await expect(readMetadataFile(defaultOptions)).rejects.toThrow(
        'Invalid JSON in metadata file',
      );
    });

    it('should throw an error if the metadata file format is not valid', async () => {
      mock({
        [defaultOptions.metadataFilePath]: JSON.stringify(
          {
            configRoot: 'foobar',
            projects: 1,
            extra: 'extra',
          },
          null,
          2,
        ),
      });

      await expect(readMetadataFile(defaultOptions)).rejects.toThrow(`Invalid metadata file: {
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

      await expect(
        validateMetadataFile({
          ...defaultOptions,
          allowNotExists: true,
        }),
      ).resolves.not.toThrow();
    });

    it('should throw if metadata file is missing', async () => {
      mock({ '/temp': {} });

      await expect(validateMetadataFile(defaultOptions)).rejects.toThrow(
        "Metadata file not found in /temp/.envnav.json. Please run 'init' first",
      );
    });

    it('should not throw if called with correct projectRoot', async () => {
      mock({
        ...createMockMetadataFile(defaultOptions),
      });

      await expect(validateMetadataFile(defaultOptions)).resolves.not.toThrow();
    });

    it('should throw if called with incorrect projectRoot', async () => {
      mock({
        ...createMockMetadataFile({
          ...defaultOptions,
          extraContent: {
            projects: {
              projectRootPath: '/temp/foobar/projectRootPath',
            },
          },
        }),
      });

      await expect(
        validateMetadataFile({
          ...defaultOptions,
          projectRoot: '/temp/projectRootPath',
        }),
      ).rejects.toThrow(
        'The project projectRootPath was initialized using different project root (/temp/foobar/projectRootPath). Refusing to proceed.',
      );
    });

    it('should throw if called with incorrect configRoot', async () => {
      mock({
        ...createMockMetadataFile({
          ...defaultOptions,
          extraContent: {
            configRoot: '/temp2/.dotenvnav',
          },
        }),
      });

      await expect(
        validateMetadataFile({
          ...defaultOptions,
          configRoot: '/temp/.dotenvnav',
        }),
      ).rejects.toThrow(
        'The metadata file /temp/.envnav.json was initialized with different config root (/temp2/.dotenvnav). Refusing to proceed.',
      );
    });
  });
});
