import { afterEach } from 'node:test';

import mock from 'mock-fs';

import { getEnvs } from '../getEnvs';

describe('getEnvs', () => {
  afterEach(() => {
    mock.restore();
  });

  it('should throw if configDirectory does not exist', async () => {
    mock({
      '/temp': {},
    });
    await expect(
      getEnvs({
        configRoot: '/temp/.dotenvnav',
        projectRoot: '/temp/testProject',
      }),
    ).rejects.toThrow(
      'Config directory does not exist: /temp/.dotenvnav/testProject',
    );
  });

  it('should find all envs', async () => {
    mock({
      '/temp': {
        '.dotenvnav': {
          testProject: {
            default: {},
            testEnv: {},
            foobar: {},
          },
        },
      },
    });
    expect(
      await getEnvs({
        configRoot: '/temp/.dotenvnav',
        projectRoot: '/temp/testProject',
      }),
    ).toEqual(['default', 'foobar', 'testEnv']);
  });

  it("should not list other projects' envs", async () => {
    mock({
      '/temp': {
        '.dotenvnav': {
          testProject: {
            default: {},
            testEnv: {},
            foobar: {},
          },
          testProject2: {
            default2: {},
            testEnv2: {},
            foobar2: {},
          },
        },
      },
    });
    expect(
      await getEnvs({
        configRoot: '/temp/.dotenvnav',
        projectRoot: '/temp/testProject',
      }),
    ).toEqual(['default', 'foobar', 'testEnv']);
  });
});
