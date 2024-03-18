import mock from 'mock-fs';
import FileSystem from 'mock-fs/lib/filesystem';

import { expectFiles, runCommand } from '../../tests/testUtils';

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

    expectFiles({
      '/temp/.dotenvnav/testEnv2': {
        'root.env': 'rootEnv=testEnv',
        'inner__.env': 'innerEnv=testEnv',
      },
    });
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

    expectFiles({
      '/temp/.dotenvnav/testEnv2': {
        'root.env': 'rootEnv=testEnv',
        'inner__.env': 'innerEnv=testEnv',
      },
    });
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

    expectFiles({
      '/temp/.dotenvnav/testEnv': {
        'root.env': 'rootEnv=testEnv',
      },
    });
  });
});
