import { afterEach } from 'node:test';

import mock from 'mock-fs';

import { runCommand } from '../../tests/testUtils';
import { createMockLogger } from '../../tests/mockLogger';

describe('listEnvs command', () => {
  afterEach(() => {
    mock.restore();
    vi.restoreAllMocks();
  });

  it('should find all envs and map them properly', async ({ expect }) => {
    const { getLogs } = createMockLogger();
    mock({
      '.dotenvnav': {
        default: {
          'inner__directory__test__.env': '',
          'inner__directory__test2__.env': '',
        },
        default2: {
          'inner__directory__test__.env': '',
          'inner__directory__test2__.env': '',
        },
        test: {
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
    await runCommand('list-envs', {
      configRoot: '.dotenvnav',
    });
    const { info } = getLogs();
    expect(info).toEqual(`
[97mGetting environments from .dotenvnav[39m
[97mdefault[39m
[97mdefault2[39m
[97mtest[39m`);
  });
});
