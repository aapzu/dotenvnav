import mock from 'mock-fs';
import type FileSystem from 'mock-fs/lib/filesystem';

import chalk from 'chalk';
import { createMockMetadataFile, runCommand } from '../../testUtils';
import { createMockLogger } from '../../testUtils/mockLogger';
import type { YargsModuleArgs } from '../../types';
import type cloneEnvCommandModule from '../cloneEnv';

const defaultOptions: Omit<
  YargsModuleArgs<typeof cloneEnvCommandModule>,
  'toEnvName' | 'fromEnvName'
> = {
  metadataFilePath: '/temp/.dotenvnav.json',
  projectRoot: '/temp/testProject',
  envFileName: ['.env', '.env2'],
  overrideExisting: false,
  verbose: false,
  dryRun: false,
};

describe('cloneEnv command', () => {
  const setup = (files: FileSystem.DirectoryItems = {}) => {
    mock(files);
  };

  afterEach(() => {
    mock.restore();
  });

  it('throws if the metadataFile does not match the given projectRoot', async () => {
    const { getLogs } = createMockLogger();

    setup({
      '/temp': {
        '.dotenvnav': {
          testProject: {
            testEnv: {},
          },
        },
        testProject: {
          '.env': 'foo=bar',
        },
      },
      ...createMockMetadataFile({
        ...defaultOptions,
        projectRoot: '/temp/foobar/testProject',
      }),
    });

    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);

    await runCommand('clone-env testEnv testEnv2', defaultOptions);
    const { error } = getLogs();
    expect(error).eql(`
${chalk.redBright('The project testProject was initialized using different project root (/temp/foobar/testProject). Refusing to proceed.')}
`);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should clone an environment', async () => {
    setup({
      '/temp': {
        '.dotenvnav': {
          testProject: {
            testEnv: {
              'root.env': 'rootEnv=testEnv',
              'inner__.env': 'innerEnv=testEnv',
            },
          },
        },
      },
      ...createMockMetadataFile(defaultOptions),
    });

    await runCommand('clone-env testEnv testEnv2', defaultOptions);

    expect({
      '/temp/.dotenvnav/testProject/testEnv2': {
        'root.env': 'rootEnv=testEnv',
        'inner__.env': 'innerEnv=testEnv',
      },
    }).toMatchFileStructure();
  });

  it('should override existing environment if override-existing is true', async () => {
    setup({
      '/temp': {
        '.dotenvnav': {
          testProject: {
            testEnv: {
              'root.env': 'rootEnv=testEnv',
              'inner__.env': 'innerEnv=testEnv',
            },
            testEnv2: {
              'root.env': 'rootEnv=testEnv2',
            },
          },
        },
      },
      ...createMockMetadataFile(defaultOptions),
    });

    await runCommand('clone-env testEnv testEnv2', {
      ...defaultOptions,
      overrideExisting: true,
    });

    expect({
      '/temp/.dotenvnav/testProject/testEnv2': {
        'root.env': 'rootEnv=testEnv',
        'inner__.env': 'innerEnv=testEnv',
      },
    }).toMatchFileStructure();
  });

  it('should not override existing environment if override-existing is false', async () => {
    setup({
      '/temp': {
        '.dotenvnav': {
          testProject: {
            testEnv: {
              'root.env': 'rootEnv=testEnv',
            },
            testEnv2: {
              'root.env': 'rootEnv=testEnv2',
            },
          },
        },
      },
      ...createMockMetadataFile(defaultOptions),
    });

    await runCommand('clone-env testEnv testEnv2', defaultOptions);

    expect({
      '/temp/.dotenvnav/testProject/testEnv': {
        'root.env': 'rootEnv=testEnv',
      },
    }).toMatchFileStructure();
  });
});
