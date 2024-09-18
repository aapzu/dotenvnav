import mock from 'mock-fs';

import { METADATA_FILE_NAME } from '../../consts';
import { expectFiles } from '../../testUtils';
import {
  readMetadataFile,
  upsertMetadataFile,
  validateMetadataFile,
} from '../metadataFile';

describe('metadatafile', () => {
  describe('upsertMetadataFile', () => {
    it('should create a metadata file', async () => {
      mock({
        '/temp/.dotenvnav': {},
      });

      await upsertMetadataFile({
        configRoot: '/temp/.dotenvnav',
        projectRoot: '/temp/projectRootPath',
      });

      expectFiles({
        [`/temp/.dotenvnav/${METADATA_FILE_NAME}`]: JSON.stringify(
          { projects: { projectRootPath: '/temp/projectRootPath' } },
          null,
          2,
        ),
      });
    });

    it('should update a metadata file', async () => {
      mock({
        '/temp/.dotenvnav': {
          [METADATA_FILE_NAME]: JSON.stringify(
            {
              projects: {
                projectRootPath: '/temp/projectRootPath',
              },
            },
            null,
            2,
          ),
        },
      });

      await upsertMetadataFile({
        configRoot: '/temp/.dotenvnav',
        projectRoot: '/temp/anotherProjectRootPath',
      });

      expectFiles({
        [`/temp/.dotenvnav/${METADATA_FILE_NAME}`]: JSON.stringify(
          {
            projects: {
              projectRootPath: '/temp/projectRootPath',
              anotherProjectRootPath: '/temp/anotherProjectRootPath',
            },
          },
          null,
          2,
        ),
      });
    });
  });

  describe('readMetadataFile', () => {
    it('should read a metadata file', async () => {
      mock({
        '/temp/.dotenvnav': {
          [METADATA_FILE_NAME]: JSON.stringify(
            { projects: { projectRootPath: '/temp/projectRootPath' } },
            null,
            2,
          ),
        },
      });

      const metadata = await readMetadataFile({
        configRoot: '/temp/.dotenvnav',
      });

      expect(metadata).toEqual({
        projects: { projectRootPath: '/temp/projectRootPath' },
      });
    });

    it('should throw an error if the metadata file has invalid json in it', async () => {
      mock({
        '/temp/.dotenvnav': {
          [METADATA_FILE_NAME]: 'invalid',
        },
      });

      await expect(
        readMetadataFile({ configRoot: '/temp/.dotenvnav' }),
      ).rejects.toThrow('Invalid JSON in metadata file');
    });

    it('should throw an error if the metadata file format is not valid', async () => {
      mock({
        '/temp/.dotenvnav': {
          [METADATA_FILE_NAME]: JSON.stringify(
            { projects: 1, extra: 'extra' },
            null,
            2,
          ),
        },
      });

      await expect(
        readMetadataFile({ configRoot: '/temp/.dotenvnav' }),
      ).rejects.toThrow(`Invalid metadata file: {
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
      mock({
        '/temp/.dotenvnav': {},
      });

      await expect(
        validateMetadataFile({
          configRoot: '/temp/.dotenvnav',
          projectRoot: '/temp/projectRootPath',
          allowNotExists: true,
        }),
      ).resolves.not.toThrow();
    });

    it('should throw if metadata file is missing', async () => {
      mock({
        '/temp/.dotenvnav': {},
      });

      await expect(
        validateMetadataFile({
          configRoot: '/temp/.dotenvnav',
          projectRoot: '/temp/projectRootPath',
        }),
      ).rejects.toThrow(
        "Metadata file not found in /temp/.dotenvnav/.envnav.json. Please run 'init' first",
      );
    });

    it('should not throw if called with correct projectRoot', async () => {
      mock({
        '/temp/.dotenvnav': {
          [METADATA_FILE_NAME]: JSON.stringify(
            { projects: { projectRootPath: '/temp/projectRootPath' } },
            null,
            2,
          ),
        },
      });

      await expect(
        validateMetadataFile({
          configRoot: '/temp/.dotenvnav',
          projectRoot: '/temp/projectRootPath',
        }),
      ).resolves.not.toThrow();
    });

    it('should throw if called with incorrect projectRoot', async () => {
      mock({
        '/temp/.dotenvnav': {
          [METADATA_FILE_NAME]: JSON.stringify(
            { projects: { projectRootPath: '/temp/foobar/projectRootPath' } },
            null,
            2,
          ),
        },
      });

      await expect(
        validateMetadataFile({
          configRoot: '/temp/.dotenvnav',
          projectRoot: '/temp/projectRootPath',
        }),
      ).rejects.toThrow(
        'The project projectRootPath was initialized using different project root (/temp/foobar/projectRootPath). Refusing to proceed.',
      );
    });
  });
});
