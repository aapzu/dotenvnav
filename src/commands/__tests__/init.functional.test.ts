import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs'
import mock from 'mock-fs'

import { runCommand } from '../../lib/testUtils';
import FileSystem from 'mock-fs/lib/filesystem';

const defaultOptions = {
  configRoot: '/temp/.dotenvnav',
  projectRoot: '/temp/testProject',
  overrideExisting: false,
  envName: 'testEnv',
  envFileName: '.env',
};

describe('init command', () => {
  const setup = (files: FileSystem.DirectoryItems = {}) => {
    // vol.fromNestedJSON(files, '/temp');
    mock({
      '/temp': files,
    })
  };

  afterEach(() => {
    // vol.reset();
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
    expect(fs.existsSync('/temp/.dotenvnav')).toBe(true);
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
    expect(fs.existsSync('/temp/.dotenvnav/testEnv')).toBe(true);
  });

  it('moves .env files to configRoot/envName', async () => {
    setup({
      testProject: {
        '.dotenvnav': {},
        '.env': 'foo=bar',
        inner: {
          '.env': 'foobar=barfoo',
        },
      },
    });
    await runCommand('init', defaultOptions);

    expect(fs.existsSync('/temp/.dotenvnav/testEnv/.env')).toBe(true);
    expect(fs.existsSync('/temp/.dotenvnav/testEnv/inner__.env')).toBe(true);
  });
});
