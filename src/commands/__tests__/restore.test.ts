import mock from 'mock-fs';

import {
  createMockMetadataFile,
  expectFiles,
  runCommand,
} from '../../testUtils';

const defaultOptions = {
  configRoot: '/temp/.dotenvnav',
  projectRoot: '/temp/projectRoot',
};

describe('restore command', () => {
  afterEach(() => {
    mock.restore();
    vi.restoreAllMocks();
  });

  it('should replace the symlink with the real files', async () => {
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
          '.env': mock.symlink({
            path: '.dotenvnav/test/root.env',
          }),
          inner: {
            '.env': mock.symlink({
              path: '.dotenvnav/test/inner__.env',
            }),
            doubleInner: {
              '.env': mock.symlink({
                path: '.dotenvnav/test/inner__doubleInner__.env',
              }),
            },
          },
        },
      },
    });

    await runCommand('restore test', defaultOptions);

    expectFiles({
      '/temp': {
        projectRoot: {
          '.env': 'test=root',
          inner: {
            '.env': 'test=inner',
            doubleInner: {
              '.env': 'test=doubleInner',
            },
          },
        },
      },
    });
  });

  it('should not remove the files from the config directory', async () => {
    mock({
      '/temp': {
        '.dotenvnav': {
          ...createMockMetadataFile(defaultOptions.projectRoot),
          test: {
            'root.env': 'test=root',
          },
        },
        projectRoot: {
          '.env': mock.symlink({
            path: '.dotenvnav/test/root.env',
          }),
        },
      },
    });
    await runCommand('restore test', defaultOptions);
    expectFiles({
      '/temp': {
        '.dotenvnav': {
          test: {
            'root.env': 'test=root',
          },
        },
        projectRoot: {
          '.env': 'test=root',
        },
      },
    });
  });
});
