import { afterEach } from 'node:test';

import chalk from 'chalk';
import mock from 'mock-fs';

import { createMockMetadataFile, runCommand } from '../../testUtils';
import { createMockLogger } from '../../testUtils/mockLogger';
import type { YargsModuleArgs } from '../../types';
import type listEnvsCommandModule from '../listEnvs';

const defaultOptions: YargsModuleArgs<typeof listEnvsCommandModule> = {
  metadataFilePath: '/temp/.dotenvnav.json',
  projectRoot: '/temp/testProject',
  envFileName: ['.env'],
  verbose: false,
  dryRun: false,
};

const configRoot = '/temp/.dotenvnav';

describe('listEnvs command', () => {
  afterEach(() => {
    mock.restore();
    vi.restoreAllMocks();
  });

  it('should find all envs and map them properly', async ({ expect }) => {
    const { getLogs } = createMockLogger();
    mock({
      [configRoot]: {
        testProject: {
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
        testProject2: {
          foo: {
            'inner__directory__test__.env': '',
            'inner__directory__test2__.env': '',
          },
          bar: {
            'inner__directory__test__.env': '',
            'inner__directory__test2__.env': '',
          },
        },
      },
      ...createMockMetadataFile({ ...defaultOptions, configRoot }),
    });
    await runCommand('list-envs', defaultOptions);
    const { info } = getLogs();
    expect(info).toEqual(`
${chalk.whiteBright('Getting environments from /temp/.dotenvnav for project /temp/testProject')}

${chalk.whiteBright('default')}
${chalk.whiteBright('default2')}
${chalk.whiteBright('test')}
`);
  });
});
