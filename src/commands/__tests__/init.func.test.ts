import mock from 'mock-fs';
import FileSystem from 'mock-fs/lib/filesystem';

import {
  createMockSymLink,
  expectFiles,
  runCommand,
} from '../../tests/testUtils';

const defaultOptions = {
  configRoot: '/temp/.dotenvnav',
  projectRoot: '/temp/testProject',
  overrideExisting: false,
  envName: 'testEnv',
  envFileName: '.env',
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
        '.env': createMockSymLink('/temp/.dotenvnav/testEnv/root.env'),
        inner: {
          '.env': createMockSymLink('/temp/.dotenvnav/testEnv/inner__.env'),
        },
      },
    });
  });
});
