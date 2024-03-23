import mock from 'mock-fs';
import FileSystem from 'mock-fs/lib/filesystem';

import { expectFiles, runCommand } from '../../testUtils';
import { METADATA_FILE_NAME } from '../../consts';

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

  it('throws if the metadataFile.projectRoot does not match the given projectRoot', async () => {
    setup({
      '.dotenvnav': {
        [METADATA_FILE_NAME]: JSON.stringify(
          {
            projectRoot: '/temp/otherProject',
          },
          null,
          2,
        ),
      },
      testProject: {
        '.env': 'foo=bar',
      },
    });

    await expect(runCommand('init', defaultOptions)).rejects.toThrow(
      'The config root /temp/.dotenvnav was initialized using different project root (/temp/otherProject). Refusing to proceed.',
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
    expectFiles({
      '/temp/.dotenvnav': {},
    });
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
    expectFiles({
      '/temp/.dotenvnav': {
        '.envnav.json': JSON.stringify(
          {
            projectRoot: '/temp/testProject',
          },
          null,
          2,
        ),
      },
    });
  });

  it('creates configRoot/envName if it does not exist', async () => {
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
    expectFiles({
      '/temp/.dotenvnav': {
        testEnv: {},
      },
    });
  });

  it('moves .env files to configRoot/envName', async () => {
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

    expectFiles({
      '/temp/.dotenvnav/testEnv': {
        'root.env': 'foo=bar',
        'inner__.env': 'foobar=barfoo',
      },
    });
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

    expectFiles({
      '/temp/testProject': {
        '.env': mock.symlink({ path: '/temp/.dotenvnav/testEnv/root.env' }),
        inner: {
          '.env': mock.symlink({
            path: '/temp/.dotenvnav/testEnv/inner__.env',
          }),
        },
      },
    });
  });
});
