import { afterEach } from 'node:test';

import mock, { symlink } from 'mock-fs';

import { createMockMetadataFile } from '../../testUtils';
import {
  getEnvFilesFromConfigDir,
  getEnvFilesFromProjectDir,
} from '../getEnvFiles';

const defaultOptions = {
  metadataFilePath: '/temp/.dotenvnav.json',
  projectRoot: '/temp/testProject',
  configRoot: '/temp/.dotenvnav',
  envName: 'default',
  envFileName: ['.env', '.env2'],
};

describe('getEnvFiles', () => {
  afterEach(() => {
    mock.restore();
  });

  describe('getEnvFilesFromProjectDir', () => {
    it('should find all env files from project and map them properly', async () => {
      mock({
        [defaultOptions.configRoot]: {},
        [defaultOptions.projectRoot]: {
          '.env': '',
          foobar: {
            test: {
              '.env': '',
            },
            test2: {
              '.env': '',
              '.env2': '',
            },
          },
        },
        ...createMockMetadataFile(defaultOptions),
      });
      const envFiles = await getEnvFilesFromProjectDir(defaultOptions);
      expect(envFiles).toEqual([
        {
          projectPath: '/temp/testProject/foobar/test2/.env',
          configDirPath:
            '/temp/.dotenvnav/testProject/default/foobar__test2__.env',
        },
        {
          projectPath: '/temp/testProject/foobar/test2/.env2',
          configDirPath:
            '/temp/.dotenvnav/testProject/default/foobar__test2__.env2',
        },
        {
          projectPath: '/temp/testProject/foobar/test/.env',
          configDirPath:
            '/temp/.dotenvnav/testProject/default/foobar__test__.env',
        },
        {
          projectPath: '/temp/testProject/.env',
          configDirPath: '/temp/.dotenvnav/testProject/default/root.env',
        },
      ]);
    });

    it("should not list other projects' env files", async () => {
      mock({
        [defaultOptions.configRoot]: {},
        [defaultOptions.projectRoot]: {
          '.env': '',
          foobar: {
            test: {
              '.env': '',
            },
            test2: {
              '.env': '',
            },
          },
        },
        '/temp/testProject2': {
          '.env': '',
          foobar: {
            '.env': '',
          },
        },
        ...createMockMetadataFile(defaultOptions),
      });
      const envFiles = await getEnvFilesFromProjectDir(defaultOptions);
      expect(envFiles).toEqual([
        {
          projectPath: '/temp/testProject/foobar/test2/.env',
          configDirPath:
            '/temp/.dotenvnav/testProject/default/foobar__test2__.env',
        },
        {
          projectPath: '/temp/testProject/foobar/test/.env',
          configDirPath:
            '/temp/.dotenvnav/testProject/default/foobar__test__.env',
        },
        {
          projectPath: '/temp/testProject/.env',
          configDirPath: '/temp/.dotenvnav/testProject/default/root.env',
        },
      ]);
    });
  });

  describe('getEnvFilesFromConfigDir', () => {
    it('should find all env files from config and map them properly', async () => {
      mock({
        [defaultOptions.configRoot]: {
          testProject: {
            default: {
              'root.env': symlink({ path: '/temp/testProject/.env' }),
              'inner__.env': symlink({
                path: '/temp/testProject/inner/.env',
              }),
              'inner__doubleInner__.env': symlink({
                path: '/temp/testProject/inner/doubleInner/.env',
              }),
            },
          },
        },
        [defaultOptions.projectRoot]: {
          '.env': '',
          another: { '.env': '' },
        },
        ...createMockMetadataFile(defaultOptions),
      });
      const envFiles = await getEnvFilesFromConfigDir(defaultOptions);
      expect(envFiles).toEqual([
        {
          projectPath: '/temp/testProject/inner/.env',
          configDirPath: '/temp/.dotenvnav/testProject/default/inner__.env',
        },
        {
          projectPath: '/temp/testProject/inner/doubleInner/.env',
          configDirPath:
            '/temp/.dotenvnav/testProject/default/inner__doubleInner__.env',
        },
        {
          projectPath: '/temp/testProject/.env',
          configDirPath: '/temp/.dotenvnav/testProject/default/root.env',
        },
      ]);
    });
  });
});
