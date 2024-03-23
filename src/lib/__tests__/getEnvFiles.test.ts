import { afterEach } from 'node:test';

import mock from 'mock-fs';

import { getEnvFiles } from '../getEnvFiles';

describe('getEnvFiles', () => {
  afterEach(() => {
    mock.restore();
  });

  it('should find all env files and map them properly', async () => {
    mock({
      '/.dotenvnav': {
        default: {
          'inner__directory__test__.env': '',
          'inner__directory__test2__.env': '',
        },
      },
      '/testProject': {
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
    });
    const envFiles = await getEnvFiles({
      configRoot: '/.dotenvnav',
      projectRoot: '/testProject',
      envName: 'default',
      envFileName: ['.env'],
    });
    expect(envFiles).toEqual([
      {
        projectPath: '/testProject/foobar/test2/.env',
        dotenvnavFileName: 'foobar__test2__.env',
      },
      {
        projectPath: '/testProject/foobar/test/.env',
        dotenvnavFileName: 'foobar__test__.env',
      },
      {
        projectPath: '/testProject/inner/directory/test2/.env',
        dotenvnavFileName: 'inner__directory__test2__.env',
      },
      {
        projectPath: '/testProject/inner/directory/test/.env',
        dotenvnavFileName: 'inner__directory__test__.env',
      },
      {
        projectPath: '/testProject/.env',
        dotenvnavFileName: 'root.env',
      },
    ]);
  });
});
