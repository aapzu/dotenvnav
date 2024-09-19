import { afterEach } from 'node:test';

import mock from 'mock-fs';

import { getEnvFiles } from '../getEnvFiles';

describe('getEnvFiles', () => {
  afterEach(() => {
    mock.restore();
  });

  it('should find all env files and map them properly', async () => {
    mock({
      '/temp': {
        '.dotenvnav': {
          testProject: {
            default: {
              'inner__directory__test__.env': '',
              'inner__directory__test2__.env': '',
            },
          },
        },
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
    });
    const envFiles = await getEnvFiles({
      configRoot: '/temp/.dotenvnav',
      projectRoot: '/temp/testProject',
      envName: 'default',
      envFileName: ['.env', '.env2'],
    });
    expect(envFiles).toEqual([
      {
        projectPath: '/temp/testProject/foobar/test2/.env',
        dotenvnavFileName: 'foobar__test2__.env',
      },
      {
        projectPath: '/temp/testProject/foobar/test2/.env2',
        dotenvnavFileName: 'foobar__test2__.env2',
      },
      {
        projectPath: '/temp/testProject/foobar/test/.env',
        dotenvnavFileName: 'foobar__test__.env',
      },
      {
        projectPath: '/temp/testProject/inner/directory/test2/.env',
        dotenvnavFileName: 'inner__directory__test2__.env',
      },
      {
        projectPath: '/temp/testProject/inner/directory/test/.env',
        dotenvnavFileName: 'inner__directory__test__.env',
      },
      {
        projectPath: '/temp/testProject/.env',
        dotenvnavFileName: 'root.env',
      },
    ]);
  });

  it("should not list other projects' env files", async () => {
    mock({
      '/temp': {
        '.dotenvnav': {
          testProject: {
            default: {
              'inner__directory__test__.env': '',
              'inner__directory__test2__.env': '',
            },
          },
          testProject2: {
            default: {
              'foobar__.env': '',
              'foobar2__.env': '',
            },
          },
        },
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
    });
    const envFiles = await getEnvFiles({
      configRoot: '/temp/.dotenvnav',
      projectRoot: '/temp/testProject',
      envName: 'default',
      envFileName: ['.env'],
    });
    expect(envFiles).toEqual([
      {
        projectPath: '/temp/testProject/foobar/test2/.env',
        dotenvnavFileName: 'foobar__test2__.env',
      },
      {
        projectPath: '/temp/testProject/foobar/test/.env',
        dotenvnavFileName: 'foobar__test__.env',
      },
      {
        projectPath: '/temp/testProject/inner/directory/test2/.env',
        dotenvnavFileName: 'inner__directory__test2__.env',
      },
      {
        projectPath: '/temp/testProject/inner/directory/test/.env',
        dotenvnavFileName: 'inner__directory__test__.env',
      },
      {
        projectPath: '/temp/testProject/.env',
        dotenvnavFileName: 'root.env',
      },
    ]);
  });
});
