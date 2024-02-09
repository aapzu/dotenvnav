import mock from 'mock-fs';

import { runCommand } from '../../tests/testUtils';
import { expectContent } from '../../tests/matchers';
import { isSymlink } from '../../lib/fsUtils';

describe('restore command', () => {
  afterEach(() => {
    mock.restore();
    vi.restoreAllMocks();
  });

  it('should replace the symlink with the real files', async () => {
    mock({
      '.dotenvnav': {
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
    });

    await runCommand('restore test', {
      configRoot: '.dotenvnav',
      projectRoot: 'projectRoot',
    });
    await expectContent('projectRoot/.env', 'test=root');
    await expectContent('projectRoot/inner/.env', 'test=inner');
    await expectContent(
      'projectRoot/inner/doubleInner/.env',
      'test=doubleInner',
    );

    expect(await isSymlink('projectRoot/.env')).toBe(false);
    expect(await isSymlink('projectRoot/inner/.env')).toBe(false);
    expect(await isSymlink('projectRoot/inner/doubleInner/.env')).toBe(false);
  });

  it('should not remove the files from the config directory', async () => {
    mock({
      '.dotenvnav': {
        test: {
          'root.env': 'test=root',
        },
      },
      projectRoot: {
        '.env': mock.symlink({
          path: '.dotenvnav/test/root.env',
        }),
      },
    });
    await runCommand('restore test', {
      configRoot: '.dotenvnav',
      projectRoot: 'projectRoot',
    });
    await expectContent('.dotenvnav/test/root.env', 'test=root');
  });
});
