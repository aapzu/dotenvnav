import mock from 'mock-fs';
import type FileSystem from 'mock-fs/lib/filesystem';

import chalk from 'chalk';
import { createMockMetadataFile, runCommand } from '../../testUtils';
import { createMockLogger } from '../../testUtils/mockLogger';
import type { YargsModuleArgs } from '../../types';
import type initCommandModule from '../init';

const defaultOptions: YargsModuleArgs<typeof initCommandModule> = {
  metadataFilePath: '/temp/.dotenvnav.json',
  configRoot: '/temp/.dotenvnav',
  projectRoot: '/temp/testProject',
  overrideExisting: false,
  envName: 'testEnv',
  envFileName: ['.env', '.env2'],
  alwaysYes: true,
  dryRun: false,
  verbose: false,
};

describe('init command', () => {
  const setup = (files: FileSystem.DirectoryItems = {}) => {
    mock(files);
  };

  afterEach(() => {
    mock.restore();
  });

  it('throws if the metadataFile does not match the given projectRoot', async () => {
    const { getLogs } = createMockLogger();

    setup({
      [defaultOptions.configRoot]: {},
      [defaultOptions.projectRoot]: {
        '.env': 'foo=bar',
      },
      ...createMockMetadataFile({
        ...defaultOptions,
        projectRoot: '/temp/foobar/testProject',
      }),
    });

    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);

    await runCommand('init', defaultOptions);

    const { error } = getLogs();
    expect(error).eql(`
${chalk.redBright('The project testProject was initialized using different project root (/temp/foobar/testProject). Refusing to proceed.')}
`);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('creates a metadata file if it does not exist', async () => {
    setup({
      '/temp': {},
    });
    await runCommand('init', defaultOptions);
    expect({
      '/temp/.dotenvnav.json': JSON.stringify(
        {
          configRoot: '/temp/.dotenvnav',
          projects: { testProject: '/temp/testProject' },
        },
        null,
        2,
      ),
    }).toMatchFileStructure();
  });

  it('creates configRoot if it does not exist', async () => {
    setup({
      [defaultOptions.projectRoot]: {
        '.env': 'foo=bar',
        inner: {
          '.env': 'foobar=barfoo',
        },
      },
    });
    await runCommand('init', defaultOptions);
    expect({
      [defaultOptions.configRoot]: {
        testProject: {
          testEnv: {
            'root.env': 'foo=bar',
            'inner__.env': 'foobar=barfoo',
          },
        },
      },
    }).toMatchFileStructure();
  });

  it('creates configRoot/metadataFile with correct content if it does not exist', async () => {
    setup({
      '/temp': {
        '.dotenvnav': {},
        testProject: {
          '.env': 'foo=bar',
          inner: {
            '.env': 'foobar=barfoo',
          },
        },
      },
    });
    await runCommand('init', defaultOptions);
    expect({
      '/temp/.dotenvnav': {
        testProject: {
          testEnv: {
            'root.env': 'foo=bar',
            'inner__.env': 'foobar=barfoo',
          },
        },
      },
      ...createMockMetadataFile(defaultOptions),
    }).toMatchFileStructure();
  });

  it('creates configRoot/projectName/envName if it does not exist', async () => {
    setup({
      '/temp': {
        '.dotenvnav': {},
        testProject: {
          '.env': 'foo=bar',
          inner: {
            '.env': 'foobar=barfoo',
          },
        },
      },
    });
    await runCommand('init', defaultOptions);
    expect({
      '/temp/.dotenvnav/testProject/testEnv': {
        'root.env': 'foo=bar',
        'inner__.env': 'foobar=barfoo',
      },
    }).toMatchFileStructure();
  });

  it('moves .env files to configRoot/projectName/envName', async () => {
    setup({
      '/temp': {
        '.dotenvnav': {},
        testProject: {
          '.env': 'foo=bar',
          inner: {
            '.env': 'foobar=barfoo',
          },
        },
      },
    });
    await runCommand('init', defaultOptions);

    expect({
      '/temp/.dotenvnav/testProject/testEnv': {
        'root.env': 'foo=bar',
        'inner__.env': 'foobar=barfoo',
      },
    }).toMatchFileStructure();
  });

  it('creates symlinks to .env files in the project root', async () => {
    setup({
      '/temp': {
        '.dotenvnav': {},
        testProject: {
          '.env': 'foo=bar',
          inner: {
            '.env': 'foobar=barfoo',
          },
        },
      },
    });
    await runCommand('init', defaultOptions);

    expect({
      '/temp/testProject': {
        '.env': mock.symlink({
          path: '/temp/.dotenvnav/testProject/testEnv/root.env',
        }),
        inner: {
          '.env': mock.symlink({
            path: '/temp/.dotenvnav/testProject/testEnv/inner__.env',
          }),
        },
      },
    }).toMatchFileStructure();
  });
});
