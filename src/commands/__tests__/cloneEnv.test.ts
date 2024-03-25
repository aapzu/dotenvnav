import mock from 'mock-fs';
import FileSystem from 'mock-fs/lib/filesystem';

import {
  createMockMetadataFile,
  expectFiles,
  runCommand,
} from '../../testUtils';

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

  it('throws if the metadataFile does not match the given projectRoot', async () => {
    setup({
      '.dotenvnav': {
        ...createMockMetadataFile('/temp/foobar/testProject'),
        testProject: {
          testEnv: {},
        },
      },
      testProject: {
        '.env': 'foo=bar',
      },
    });

    await expect(
      runCommand('clone-env testEnv testEnv2', defaultOptions),
    ).rejects.toThrow(
      'The project testProject was initialized using different project root (/temp/foobar/testProject). Refusing to proceed.',
    );
  });

  it('should clone an environment', async () => {
    setup({
      '.dotenvnav': {
        ...createMockMetadataFile(defaultOptions.projectRoot),
        testProject: {
          testEnv: {
            'root.env': 'rootEnv=testEnv',
            'inner__.env': 'innerEnv=testEnv',
          },
        },
      },
    });

    await runCommand('clone-env testEnv testEnv2', defaultOptions);

    expectFiles({
      '/temp/.dotenvnav/testProject/testEnv2': {
        'root.env': 'rootEnv=testEnv',
        'inner__.env': 'innerEnv=testEnv',
      },
    });
  });

  it('should override existing environment if override-existing is true', async () => {
    setup({
      '.dotenvnav': {
        ...createMockMetadataFile(defaultOptions.projectRoot),
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
    });

    await runCommand('clone-env testEnv testEnv2', {
      ...defaultOptions,
      overrideExisting: true,
    });

    expectFiles({
      '/temp/.dotenvnav/testProject/testEnv2': {
        'root.env': 'rootEnv=testEnv',
        'inner__.env': 'innerEnv=testEnv',
      },
    });
  });

  it('should not override existing environment if override-existing is false', async () => {
    setup({
      '.dotenvnav': {
        ...createMockMetadataFile(defaultOptions.projectRoot),
        testProject: {
          testEnv: {
            'root.env': 'rootEnv=testEnv',
          },
          testEnv2: {
            'root.env': 'rootEnv=testEnv2',
          },
        },
      },
    });

    await runCommand('clone-env testEnv testEnv2', defaultOptions);

    expectFiles({
      '/temp/.dotenvnav/testProject/testEnv': {
        'root.env': 'rootEnv=testEnv',
      },
    });
  });
});
