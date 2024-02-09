import mock from 'mock-fs';

import { runCommand } from '../../tests/testUtils';
import { expectSymbolicLink } from '../../tests/matchers';

describe('useEnv command', () => {
  afterEach(() => {
    mock.restore();
    vi.restoreAllMocks();
  });

  it('should take the new env into use when the config files are entirely missing', async () => {
    mock({
      '.dotenvnav': {
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
    });

    await runCommand('use-env test', {
      configRoot: '.dotenvnav',
      projectRoot: 'projectRoot',
    });

    await expectSymbolicLink('projectRoot/.env', '.dotenvnav/test/root.env');
    await expectSymbolicLink(
      'projectRoot/inner/.env',
      '.dotenvnav/test/inner__.env',
    );
    await expectSymbolicLink(
      'projectRoot/inner/doubleInner/.env',
      '.dotenvnav/test/inner__doubleInner__.env',
    );
  });

  it('should overwrite existing config files with the new env', async () => {
    mock({
      '.dotenvnav': {
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
          path: '.dotenvnav/other/root.env',
        }),
        inner: {
          '.env': mock.symlink({
            path: '.dotenvnav/other/inner__.env',
          }),
          doubleInner: {
            '.env': mock.symlink({
              path: '.dotenvnav/other/inner__doubleInner__.env',
            }),
          },
          doubleInner2: {},
        },
        inner2: {},
      },
    });

    await runCommand('use-env test', {
      configRoot: '.dotenvnav',
      projectRoot: 'projectRoot',
    });

    await expectSymbolicLink('projectRoot/.env', '.dotenvnav/test/root.env');
    await expectSymbolicLink(
      'projectRoot/inner/.env',
      '.dotenvnav/test/inner__.env',
    );
    await expectSymbolicLink(
      'projectRoot/inner/doubleInner/.env',
      '.dotenvnav/test/inner__doubleInner__.env',
    );
  });
});
