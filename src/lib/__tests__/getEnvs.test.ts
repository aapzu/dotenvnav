import { afterEach } from 'node:test';

import mock from 'mock-fs';

import { createMockMetadataFile } from '../../testUtils';
import { getEnvs } from '../getEnvs';

const defaultOptions = {
  projectRoot: '/temp/testProject',
  metadataFilePath: '/temp/.dotenvnav.json',
  configRoot: '/temp/.dotenvnav',
};

describe('getEnvs', () => {
  afterEach(() => {
    mock.restore();
  });

  it('should throw if configDirectory does not exist', async () => {
    mock({
      ...createMockMetadataFile(defaultOptions),
    });
    await expect(getEnvs(defaultOptions)).rejects.toThrow(
      'Config directory does not exist: /temp/.dotenvnav/testProject',
    );
  });

  it('should find all envs', async () => {
    mock({
      [defaultOptions.configRoot]: {
        testProject: {
          default: {},
          testEnv: {},
          foobar: {},
        },
      },
      ...createMockMetadataFile(defaultOptions),
    });
    expect(await getEnvs(defaultOptions)).toEqual([
      'default',
      'foobar',
      'testEnv',
    ]);
  });

  it("should not list other projects' envs", async () => {
    mock({
      [defaultOptions.configRoot]: {
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
      ...createMockMetadataFile(defaultOptions),
    });
    expect(await getEnvs(defaultOptions)).toEqual([
      'default',
      'foobar',
      'testEnv',
    ]);
  });
});
