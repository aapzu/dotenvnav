import { afterEach } from 'node:test';

import chalk from 'chalk';
import mock from 'mock-fs';

import { createMockMetadataFile, runCommand } from '../../testUtils';
import { createMockLogger } from '../../testUtils/mockLogger';
import type { YargsModuleArgs } from '../../types';
import type listEnvFilesCommandModule from '../listEnvFiles';

const defaultOptions: YargsModuleArgs<typeof listEnvFilesCommandModule> = {
  projectRoot: '/temp/testProject',
  envFileName: ['.env'],
  metadataFilePath: '/temp/.dotenvnav.json',
  verbose: false,
  dryRun: false,
  envName: 'default',
};

describe('listEnvFiles command', () => {
  afterEach(() => {
    mock.restore();
    vi.restoreAllMocks();
  });

  it('should find all env files and map them properly', async ({ expect }) => {
    const { getLogs } = createMockLogger();
    mock({
      '/temp': {
        '.dotenvnav': {
          testProject: {
            default: {
              'inner__directory__test__.env': '',
              'inner__directory__test2__.env': '',
            },
          },
        },
        testProject: {},
      },
      ...createMockMetadataFile(defaultOptions),
    });
    await runCommand('list-env-files default', defaultOptions);
    const { info } = getLogs();
    expect(info).toEqual(`
${chalk.whiteBright('Searching for environment files with pattern .env')}

${chalk.whiteBright('/temp/testProject/inner/directory/test2/.env  /temp/.dotenvnav/testProject/default/inner__directory__test2__.env')}
${chalk.whiteBright('/temp/testProject/inner/directory/test/.env   /temp/.dotenvnav/testProject/default/inner__directory__test__.env ')}
`);
  });
});
