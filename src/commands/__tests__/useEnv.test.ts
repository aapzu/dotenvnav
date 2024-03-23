import mock from 'mock-fs';

import {
  createMockMetadataFile,
  expectFiles,
  runCommand,
} from '../../testUtils';

const defaultOptions = {
  configRoot: '/temp/.dotenvnav',
  projectRoot: '/temp/projectRoot',
  envFileName: '.env',
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
          ...createMockMetadataFile(defaultOptions.projectRoot),
          test: {
            'root.env': 'test=root',
            'inner__.env': 'test=inner',
            'inner__doubleInner__.env': 'test=doubleInner',
          },
        },
        projectRoot: {
          inner: {
            doubleInner: {},
            doubleInner2: {},
          },
          inner2: {},
        },
      },
    });

    await runCommand('use-env test', defaultOptions);

    expectFiles({
      '/temp': {
        projectRoot: {
          '.env': mock.symlink({ path: '/temp/.dotenvnav/test/root.env' }),
          inner: {
            '.env': mock.symlink({ path: '/temp/.dotenvnav/test/inner__.env' }),
            doubleInner: {
              '.env': mock.symlink({
                path: '/temp/.dotenvnav/test/inner__doubleInner__.env',
              }),
            },
          },
        },
      },
    });
  });

  it('should overwrite existing config files with the new env', async () => {
    mock({
      '/temp': {
        '.dotenvnav': {
          ...createMockMetadataFile(defaultOptions.projectRoot),
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
        projectRoot: {
          '.env': mock.symlink({
            path: '/temp/.dotenvnav/other/root.env',
          }),
          inner: {
            '.env': mock.symlink({
              path: '/temp/.dotenvnav/other/inner__.env',
            }),
            doubleInner: {
              '.env': mock.symlink({
                path: '/temp/.dotenvnav/other/inner__doubleInner__.env',
              }),
            },
            doubleInner2: {},
          },
          inner2: {},
        },
      },
    });

    await runCommand('use-env test', defaultOptions);

    expectFiles({
      '/temp/projectRoot': {
        '.env': mock.symlink({ path: '/temp/.dotenvnav/test/root.env' }),
        inner: {
          '.env': mock.symlink({ path: '/temp/.dotenvnav/test/inner__.env' }),
          doubleInner: {
            '.env': mock.symlink({
              path: '/temp/.dotenvnav/test/inner__doubleInner__.env',
            }),
          },
        },
      },
    });
  });
});
