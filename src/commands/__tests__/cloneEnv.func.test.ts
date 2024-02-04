import fs from 'node:fs';

import mock from 'mock-fs';
import FileSystem from 'mock-fs/lib/filesystem';

import { runCommand } from '../../tests/testUtils';

const defaultOptions = {
  configRoot: '/temp/.dotenvnav',
  projectRoot: '/temp/testProject',
  overrideExisting: false,
};

describe('cloneEnv command', () => {
  const setup = (files: FileSystem.DirectoryItems = {}) => {
    mock({
      '/temp': files,
    });
  };

  afterEach(() => {
    mock.restore();
  });

  it('should clone an environment', async () => {
    setup({
      '.dotenvnav': {
        testEnv: {
          'root.env': 'rootEnv=testEnv',
          'inner__.env': 'innerEnv=testEnv',
        },
      },
    });

    await runCommand('clone-env testEnv testEnv2', defaultOptions);

    expect(
      fs.readFileSync('/temp/.dotenvnav/testEnv2/root.env', 'utf8'),
    ).toEqual('rootEnv=testEnv');

    expect(
      fs.readFileSync('/temp/.dotenvnav/testEnv2/inner__.env', 'utf8'),
    ).toEqual('innerEnv=testEnv');
  });

  it('should override existing environment if override-existing is true', async () => {
    setup({
      '.dotenvnav': {
        testEnv: {
          'root.env': 'rootEnv=testEnv',
          'inner__.env': 'innerEnv=testEnv',
        },
        testEnv2: {
          'root.env': 'rootEnv=testEnv2',
        },
      },
    });

    await runCommand('clone-env testEnv testEnv2', {
      ...defaultOptions,
      overrideExisting: true,
    });

    expect(
      fs.readFileSync('/temp/.dotenvnav/testEnv2/root.env', 'utf8'),
    ).toEqual('rootEnv=testEnv');

    expect(
      fs.readFileSync('/temp/.dotenvnav/testEnv2/inner__.env', 'utf8'),
    ).toEqual('innerEnv=testEnv');
  });

  it('should not override existing environment if override-existing is false', async () => {
    setup({
      '.dotenvnav': {
        testEnv: {
          'root.env': 'rootEnv=testEnv',
        },
        testEnv2: {
          'root.env': 'rootEnv=testEnv2',
        },
      },
    });

    await runCommand('clone-env testEnv testEnv2', defaultOptions);

    expect(
      fs.readFileSync('/temp/.dotenvnav/testEnv2/root.env', 'utf8'),
    ).toEqual('rootEnv=testEnv2');
  });
});
