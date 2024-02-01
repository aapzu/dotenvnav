import fs from 'node:fs';

import { describe, it, expect, afterEach } from 'vitest';
import mock from 'mock-fs';
import FileSystem from 'mock-fs/lib/filesystem';

import { runCommand } from '../../lib/testUtils';

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
      '.dotenvnav': {},
      testProject: {
        '.env': 'foo=bar',
        inner: {
          '.env': 'foobar=barfoo',
        },
      },
    });
    await runCommand('init', defaultOptions);

    expect(fs.existsSync('/temp/.dotenvnav/testEnv/root.env')).toBe(true);
    expect(fs.existsSync('/temp/.dotenvnav/testEnv/inner__.env')).toBe(true);
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

    expect(fs.existsSync('/temp/testProject/.env')).toBe(true);
    expect(fs.readlinkSync('/temp/testProject/.env')).toBe(
      '/temp/.dotenvnav/testEnv/root.env',
    );
    expect(fs.existsSync('/temp/testProject/inner/.env')).toBe(true);
    expect(fs.readlinkSync('/temp/testProject/inner/.env')).toBe(
      '/temp/.dotenvnav/testEnv/inner__.env',
    );
  });
});
