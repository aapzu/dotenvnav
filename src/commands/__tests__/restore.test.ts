import mock from 'mock-fs';

import { createMockMetadataFile, runCommand } from '../../testUtils';
import type { YargsModuleArgs } from '../../types';
import type restoreCommandModule from '../restore';

const defaultOptions: YargsModuleArgs<typeof restoreCommandModule> = {
  metadataFilePath: '/temp/.envnav.json',
  configRoot: '/temp/.dotenvnav',
  projectRoot: '/temp/testProject',
  verbose: false,
  dryRun: false,
  envFileName: ['.env'],
  envName: 'default',
  interactive: false,
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
          testProject: {
            test: {
              'root.env': 'test=root',
              'inner__.env': 'test=inner',
              'inner__doubleInner__.env': 'test=doubleInner',
            },
          },
        },
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
      ...createMockMetadataFile(defaultOptions),
    });

    await runCommand('restore test', defaultOptions);

    expect({
      '/temp': {
        testProject: {
          '.env': 'test=root',
          inner: {
            '.env': 'test=inner',
            doubleInner: {
              '.env': 'test=doubleInner',
            },
          },
        },
      },
    }).toMatchFileStructure();
  });

  it('should not remove the files from the config directory', async () => {
    mock({
      '/temp': {
        '.dotenvnav': {
          testProject: {
            test: {
              'root.env': 'test=root',
            },
          },
        },
        testProject: {
          '.env': mock.symlink({
            path: '/temp/.dotenvnav/testProject/test/root.env',
          }),
        },
      },
      ...createMockMetadataFile(defaultOptions),
    });
    await runCommand('restore test', defaultOptions);
    expect({
      '/temp': {
        '.dotenvnav': {
          testProject: {
            test: {
              'root.env': 'test=root',
            },
          },
        },
        testProject: {
          '.env': 'test=root',
        },
      },
      ...createMockMetadataFile(defaultOptions),
    }).toMatchFileStructure();
  });
});
