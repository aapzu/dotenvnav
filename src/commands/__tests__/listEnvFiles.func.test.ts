import { afterEach } from 'node:test';
import path from 'node:path';

import mock from 'mock-fs';
import chalk from 'chalk';

import { runCommand } from '../../tests/testUtils';
import { createMockLogger } from '../../tests/mockLogger';

const root = path.join(__dirname, '..', '..', '..');

describe('listEnvFiles command', () => {
  afterEach(() => {
    mock.restore();
    vi.restoreAllMocks();
  });

  it('should find all env files and map them properly', async ({ expect }) => {
    const { getLogs } = createMockLogger();
    mock({
      '.dotenvnav': {
        default: {
          'inner__directory__test__.env': '',
          'inner__directory__test2__.env': '',
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
    });
    await runCommand('list-env-files default', {
      configRoot: '.dotenvnav',
      projectRoot: 'testProject',
      envFileName: '.env',
    });
    const { info } = getLogs();
    expect(info).toEqual(`
${chalk.whiteBright('Searching for environment files with pattern .env')}
${chalk.whiteBright(
  path.join(root, 'testProject/foobar/test2/.env\tfoobar__test2__.env'),
)}
${chalk.whiteBright(
  path.join(root, 'testProject/foobar/test/.env\tfoobar__test__.env'),
)}
${chalk.whiteBright(
  path.join(
    root,
    'testProject/inner/directory/test2/.env\tinner__directory__test2__.env',
  ),
)}
${chalk.whiteBright(
  path.join(
    root,
    'testProject/inner/directory/test/.env\tinner__directory__test__.env',
  ),
)}
${chalk.whiteBright(path.join(root, 'testProject/.env\troot.env'))}`);
  });
});
