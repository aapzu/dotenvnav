import { afterEach } from 'node:test';

import mock, { symlink } from 'mock-fs';

import { createMockMetadataFile } from '../../testUtils';
import {
  getEnvFilesFromConfigDir,
  getEnvFilesFromProjectDir,
} from '../getEnvFiles';

describe('getEnvFiles', () => {
  afterEach(() => {
    mock.restore();
  });

  describe('getEnvFilesFromProjectDir', () => {
    it('should find all env files from project and map them properly', async () => {
      mock({
        '/temp': {
          '.dotenvnav': {},
          testProject: {
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
        },
        ...createMockMetadataFile({
          metadataFilePath: '/temp/.dotenvnav.json',
          projectRoot: '/temp/testProject',
        }),
      });
      const envFiles = await getEnvFilesFromProjectDir({
        metadataFilePath: '/temp/.dotenvnav.json',
        projectRoot: '/temp/testProject',
        envName: 'default',
        envFileName: ['.env', '.env2'],
      });
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
        '/temp': {
          '.dotenvnav': {},
          testProject: {
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
          testProject2: {
            '.env': '',
            foobar: {
              '.env': '',
            },
          },
        },
        ...createMockMetadataFile({
          metadataFilePath: '/temp/.dotenvnav.json',
          projectRoot: '/temp/testProject',
        }),
      });
      const envFiles = await getEnvFilesFromProjectDir({
        metadataFilePath: '/temp/.dotenvnav.json',
        projectRoot: '/temp/testProject',
        envName: 'default',
        envFileName: ['.env'],
      });
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
        '/temp': {
          '.dotenvnav': {
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
          testProject: {
            '.env': '',
            another: { '.env': '' },
          },
        },
        ...createMockMetadataFile({
          metadataFilePath: '/temp/.dotenvnav.json',
          projectRoot: '/temp/testProject',
        }),
      });
      const envFiles = await getEnvFilesFromConfigDir({
        metadataFilePath: '/temp/.dotenvnav.json',
        projectRoot: '/temp/testProject',
        envName: 'default',
        envFileName: ['.env'],
      });
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
