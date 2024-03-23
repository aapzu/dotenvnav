import mock from 'mock-fs';

import {
  createMetadataFile,
  readMetadataFile,
  validateMetadataFile,
} from '../metadataFile';
import { expectFiles } from '../../testUtils';
import { METADATA_FILE_NAME } from '../../consts';

describe('metadatafile', () => {
  describe('createMetadataFile', () => {
    it('should create a metadata file', async () => {
      mock({
        '.dotenvnav': {},
      });

      await createMetadataFile({
        configRoot: '.dotenvnav',
        projectRoot: 'projectRootPath',
      });

      expectFiles({
        [`.dotenvnav/${METADATA_FILE_NAME}`]: JSON.stringify(
          { projectRoot: 'projectRootPath' },
          null,
          2,
        ),
      });
    });
  });

  describe('readMetadataFile', () => {
    it('should read a metadata file', async () => {
      mock({
        '.dotenvnav': {
          [METADATA_FILE_NAME]: JSON.stringify(
            { projectRoot: 'projectRootPath' },
            null,
            2,
          ),
        },
      });

      const metadata = await readMetadataFile({ configRoot: '.dotenvnav' });

      expect(metadata).toEqual({ projectRoot: 'projectRootPath' });
    });

    it('should throw an error if the metadata file has invalid json in it', async () => {
      mock({
        '.dotenvnav': {
          [METADATA_FILE_NAME]: 'invalid',
        },
      });

      await expect(
        readMetadataFile({ configRoot: '.dotenvnav' }),
      ).rejects.toThrow('Invalid JSON in metadata file');
    });

    it('should throw an error if the metadata file format is not valid', async () => {
      mock({
        '.dotenvnav': {
          [METADATA_FILE_NAME]: JSON.stringify(
            { projectRoot: 1, extra: 'extra' },
            null,
            2,
          ),
        },
      });

      await expect(readMetadataFile({ configRoot: '.dotenvnav' })).rejects
        .toThrow(`Invalid metadata file: {
  "_errors": [
    "Unrecognized key(s) in object: 'extra'"
  ],
  "projectRoot": {
    "_errors": [
      "Expected string, received number"
    ]
  }
}`);
    });
  });

  describe('validateMetadataFile', () => {
    it('should not throw if metadata file is missing but called with allowNotExists=true', async () => {
      mock({
        '.dotenvnav': {},
      });

      await expect(
        validateMetadataFile({
          configRoot: '.dotenvnav',
          projectRoot: 'projectRootPath',
          allowNotExists: true,
        }),
      ).resolves.not.toThrow();
    });

    it('should throw if metadata file is missing', async () => {
      mock({
        '.dotenvnav': {},
      });

      await expect(
        validateMetadataFile({
          configRoot: '.dotenvnav',
          projectRoot: 'projectRootPath',
        }),
      ).rejects.toThrow(
        "Metadata file not found in .dotenvnav/.envnav.json. Please run 'init' first",
      );
    });

    it('should not throw if called with correct projectRoot', async () => {
      mock({
        '.dotenvnav': {
          [METADATA_FILE_NAME]: JSON.stringify(
            { projectRoot: 'projectRootPath' },
            null,
            2,
          ),
        },
      });

      await expect(
        validateMetadataFile({
          configRoot: '.dotenvnav',
          projectRoot: 'projectRootPath',
        }),
      ).resolves.not.toThrow();
    });

    it('should throw if called with incorrect projectRoot', async () => {
      mock({
        '.dotenvnav': {
          [METADATA_FILE_NAME]: `{
  "projectRoot": "projectRootPath"
}`,
        },
      });

      await expect(
        validateMetadataFile({
          configRoot: '.dotenvnav',
          projectRoot: 'wrongProjectRootPath',
        }),
      ).rejects.toThrow(
        'The config root .dotenvnav was initialized using different project root (projectRootPath). Refusing to proceed.',
      );
    });
  });
});
