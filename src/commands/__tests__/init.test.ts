import { describe, it, expect, vi } from 'vitest'
import * as FsUtils from '../../lib/fsUtils'
import * as GetEnvFiles from '../../lib/getEnvFiles'

import { init } from '../init';

import { join, resolve } from 'node:path';
import { afterEach } from 'node:test';
import { e } from 'vitest/dist/reporters-1evA5lom';

const defaultOptions = {
  configRoot: 'test',
  overrideExisting: false,
  envName: 'testEnv',
  envFileName: '.env',
  projectRoot: 'test',
}

describe('init command', () => {
  it('creates configRoot if it does not exist', async () => {
    const createIfNoteExistsSpy = vi.spyOn(FsUtils, 'createIfNotExists').mockResolvedValue();
    await init(defaultOptions)
    expect(createIfNoteExistsSpy).toHaveBeenCalledWith(defaultOptions.configRoot);
  });

  it('creates configRoot/envName if it does not exist', async () => {
    const createIfNoteExistsSpy = vi.spyOn(FsUtils, 'createIfNotExists').mockResolvedValue();
    await init(defaultOptions)
    expect(createIfNoteExistsSpy).toHaveBeenCalledWith(join(defaultOptions.configRoot, defaultOptions.envName));
  });

  it('calls getEnvFiles and calls runActionWithBackup with the result', async () => {
    const runActionWithBackupSpy = vi.spyOn(FsUtils, 'runActionWithBackup').mockResolvedValue();
    vi.spyOn(GetEnvFiles, 'getEnvFiles').mockResolvedValue([
      { projectPath: 'test', dotenvnavFileName: 'test' },
      { projectPath: 'test2', dotenvnavFileName: 'test2' },
    ]);
    await init(defaultOptions)
    expect(runActionWithBackupSpy).toHaveBeenCalledWith(
      expect.any(Function),
      ['test', 'test2'],
    );
  });

  it('checks if symlinkExists and does not do anything if it does', async () => {
    const symlinkExistsSpy = vi.spyOn(FsUtils, 'symlinkExists').mockResolvedValue(true);
    const moveSpy = vi.spyOn(FsUtils, 'move').mockResolvedValue();
    vi.spyOn(GetEnvFiles, 'getEnvFiles').mockResolvedValue([
      { projectPath: 'test', dotenvnavFileName: 'test' },
    ]);
    await init(defaultOptions)
    expect(symlinkExistsSpy).toHaveBeenCalledWith('test');
    expect(moveSpy).not.toHaveBeenCalled();
  });

  it('calls move with correct arguments', async () => {
    const moveSpy = vi.spyOn(FsUtils, 'move').mockResolvedValue();
    const envFile = { projectPath: 'test', dotenvnavFileName: 'test' };
    vi.spyOn(GetEnvFiles, 'getEnvFiles').mockResolvedValue([
      envFile,
    ]);
    await init(defaultOptions)
    expect(moveSpy).toHaveBeenCalledWith(
      envFile.projectPath,
      resolve(defaultOptions.configRoot, defaultOptions.envName, envFile.dotenvnavFileName),
      { overrideExisting: false },
    );
  });
});