import mock from 'mock-fs';
import type FileSystem from 'mock-fs/lib/filesystem';

import {
  createMockMetadataFile,
  expectFiles,
  runCommand,
} from '../../testUtils';

const defaultOptions = {
  configRoot: '/temp/.dotenvnav',
  projectRoot: '/temp/testProject',
  overrideExisting: false,
  envName: 'testEnv',
  envFileName: '.env',
  alwaysYes: true,
};

describe('init command', () => {
  const setup = (files: FileSystem.DirectoryItems = {}) => {
    mock({
      '/temp': files,
    });
  };

  afterEach(() => {
    mock.restore();
  });

  it('throws if the metadataFile does not match the given projectRoot', async () => {
    setup({
      '.dotenvnav': {
        ...createMockMetadataFile('/temp/foobar/testProject'),
      },
      testProject: {
        '.env': 'foo=bar',
      },
    });

    await expect(runCommand('init', defaultOptions)).rejects.toThrow(
      'The project testProject was initialized using different project root (/temp/foobar/testProject). Refusing to proceed.',
    );
  });

  it('creates configRoot if it does not exist', async () => {
    setup({
      testProject: {
        '.env': 'foo=bar',
        inner: {
          '.env': 'foobar=barfoo',
        },
      },
    });
    await runCommand('init', defaultOptions);
    expect({
      '/temp/.dotenvnav': {},
    }).toMatchFileStructure();
  });

  it('creates configRoot/metadataFile with correct content if it does not exist', async () => {
    setup({
      '.dotenvnav': {},
      testProject: {
        '.env': 'foo=bar',
        inner: {
          '.env': 'foobar=barfoo',
        },
      },
    });
    await runCommand('init', defaultOptions);
    expect({
      '/temp/.dotenvnav': {
        ...createMockMetadataFile(defaultOptions.projectRoot),
      },
    }).toMatchFileStructure();
  });

  it('creates configRoot/projectName/envName if it does not exist', async () => {
    setup({
      '.dotenvnav': {},
      testProject: {
        '.env': 'foo=bar',
        inner: {
          '.env': 'foobar=barfoo',
        },
      },
    });
    await runCommand('init', defaultOptions);
    expect({
      '/temp/.dotenvnav/testProject/testEnv': {},
    }).toMatchFileStructure();
  });

  it('moves .env files to configRoot/projectName/envName', async () => {
    setup({
      '.dotenvnav': {},
      testProject: {
        '.env': 'foo=bar',
        inner: {
          '.env': 'foobar=barfoo',
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
      '.dotenvnav': {},
      testProject: {
        '.env': 'foo=bar',
        inner: {
          '.env': 'foobar=barfoo',
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
