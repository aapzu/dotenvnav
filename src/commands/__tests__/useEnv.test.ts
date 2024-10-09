import mock from 'mock-fs';

import { createMockMetadataFile, runCommand } from '../../testUtils';
import type { YargsModuleArgs } from '../../types';
import type useEnvCommandModule from '../useEnv';

const defaultOptions: YargsModuleArgs<typeof useEnvCommandModule> = {
  metadataFilePath: '/temp/.dotenvnav.json',
  configRoot: '/temp/.dotenvnav',
  projectRoot: '/temp/testProject',
  envFileName: ['.env'],
  envName: 'default',
  verbose: false,
  dryRun: false,
  interactive: false,
};

describe('useEnv command', () => {
  afterEach(() => {
    mock.restore();
    vi.restoreAllMocks();
  });

  it('should take the new env into use when the config files are entirely missing', async () => {
    mock({
      '/temp': {
        '.dotenvnav': {
          testProject: {
            test: {
              'root.env': 'test=root',
              'inner__.env': 'test=inner',
              'inner__doubleInner__.env': 'test=doubleInner',
            },
          },
        },
        testProject: {
          inner: {
            doubleInner: {},
            doubleInner2: {},
          },
          inner2: {},
        },
      },
      ...createMockMetadataFile(defaultOptions),
    });

    await runCommand('use-env test', defaultOptions);

    expect({
      '/temp': {
        testProject: {
          '.env': mock.symlink({
            path: '/temp/.dotenvnav/testProject/test/root.env',
          }),
          inner: {
            '.env': mock.symlink({
              path: '/temp/.dotenvnav/testProject/test/inner__.env',
            }),
            doubleInner: {
              '.env': mock.symlink({
                path: '/temp/.dotenvnav/testProject/test/inner__doubleInner__.env',
              }),
            },
          },
        },
      },
    }).toMatchFileStructure();
  });

  it('should overwrite existing config files with the new env', async () => {
    mock({
      '/temp': {
        '.dotenvnav': {
          testProject: {
            test: {
              'root.env': 'test=root',
              'inner__.env': 'test=inner',
              'inner__doubleInner__.env': 'test=doubleInner',
            },
            other: {
              'root.env': 'other=root',
              'inner__.env': 'other=inner',
              'doubleInner__.env': 'other=doubleInner',
            },
          },
        },
        testProject: {
          '.env': mock.symlink({
            path: '/temp/.dotenvnav/testProject/other/root.env',
          }),
          inner: {
            '.env': mock.symlink({
              path: '/temp/.dotenvnav/testProject/other/inner__.env',
            }),
            doubleInner: {
              '.env': mock.symlink({
                path: '/temp/.dotenvnav/testProject/other/inner__doubleInner__.env',
              }),
            },
            doubleInner2: {},
          },
          inner2: {},
        },
      },
      ...createMockMetadataFile(defaultOptions),
    });

    await runCommand('use-env test', defaultOptions);

    expect({
      '/temp/testProject': {
        '.env': mock.symlink({
          path: '/temp/.dotenvnav/testProject/test/root.env',
        }),
        inner: {
          '.env': mock.symlink({
            path: '/temp/.dotenvnav/testProject/test/inner__.env',
          }),
          doubleInner: {
            '.env': mock.symlink({
              path: '/temp/.dotenvnav/testProject/test/inner__doubleInner__.env',
            }),
          },
        },
      },
    }).toMatchFileStructure();
  });

  it('should only go through the files in config dir, not all env files in the project', async () => {
    mock({
      '/temp': {
        '.dotenvnav': {
          testProject: {
            test: {
              'root.env': 'test=root',
              'inner__.env': 'test=inner',
              'inner__doubleInner__.env': 'test=doubleInner',
            },
            other: {
              'root.env': 'other=root',
              'inner__.env': 'other=inner',
              'doubleInner__.env': 'other=doubleInner',
            },
          },
        },
        testProject: {
          '.env': mock.symlink({
            path: '/temp/.dotenvnav/testProject/other/root.env',
          }),
          inner: {
            '.env': mock.symlink({
              path: '/temp/.dotenvnav/testProject/other/inner__.env',
            }),
            doubleInner: {
              '.env': mock.symlink({
                path: '/temp/.dotenvnav/testProject/other/inner__doubleInner__.env',
              }),
            },
            doubleInner2: {
              '.env': 'doubleInner2',
            },
          },
          inner2: {
            '.env': 'inner2',
          },
        },
      },
      ...createMockMetadataFile(defaultOptions),
    });

    await runCommand('use-env test', defaultOptions);

    expect({
      '/temp/testProject': {
        '.env': mock.symlink({
          path: '/temp/.dotenvnav/testProject/test/root.env',
        }),
        inner: {
          '.env': mock.symlink({
            path: '/temp/.dotenvnav/testProject/test/inner__.env',
          }),
          doubleInner: {
            '.env': mock.symlink({
              path: '/temp/.dotenvnav/testProject/test/inner__doubleInner__.env',
            }),
          },
          doubleInner2: {
            '.env': 'doubleInner2',
          },
        },
        inner2: {
          '.env': 'inner2',
        },
      },
    }).toMatchFileStructure();
  });
});
