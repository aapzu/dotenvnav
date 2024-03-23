import fs from 'fs';

import mock from 'mock-fs';

import {
  copy,
  exists,
  fileExists,
  getFiles,
  move,
  symlinkExists,
  remove,
  createSymlink,
  createDirectoryIfNotExists,
  runActionWithBackup,
  isSymlink,
  readFileContent,
} from '../fsUtils';
import { expectFile, expectFiles } from '../../testUtils';

describe('fsUtils', () => {
  beforeEach(() => {
    mock({
      foo: {
        test: 'foo-test',
        test2: 'foo-test2',
      },
      bar: {
        test2: 'bar-test2',
      },
    });
  });

  afterEach(() => {
    mock.restore();
  });

  describe('symLinkExists', () => {
    it('should return true if symlink exists', async () => {
      fs.symlinkSync('foo/test', 'bar/symlink');
      expect(await symlinkExists('bar/symlink')).toBe(true);
    });

    it('should return false if symlink does not exist', async () => {
      expect(await symlinkExists('bar/symlink')).toBe(false);
    });

    it('should return false if calling for a file', async () => {
      expect(await symlinkExists('bar/test2')).toBe(false);
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      expect(await fileExists('foo/test')).toBeTruthy();
    });

    it('should return false if file does not exist', async () => {
      expect(await fileExists('foo/nonexistent')).toBeFalsy();
    });

    it('should return false if calling for a symlink', async () => {
      fs.symlinkSync('foo/test', 'bar/symlink');
      expect(await fileExists('bar/symlink')).toBeFalsy();
    });
  });

  describe('exists', () => {
    it('should return true if file exists', async () => {
      expect(await exists('foo/test')).toBeTruthy();
    });

    it('should return true if symlink exists', async () => {
      fs.symlinkSync('foo/test', 'bar/symlink');
      expect(await exists('bar/symlink')).toBeTruthy();
    });

    it('should return false if file does not exist', async () => {
      expect(await exists('foo/nonexistent')).toBeFalsy();
    });
  });

  describe('runActionWithBackup', () => {
    it('should not backup files if skip: true', async () => {
      const action = vi.fn().mockImplementation(async () => {
        expect(await exists('foo/test.bak')).toBeFalsy();
      });
      await runActionWithBackup(action, 'foo/test', { skip: true });
      expect(action).toHaveBeenCalled();
    });

    it('should backup files and run action', async () => {
      const action = vi.fn().mockImplementation(async () => {
        expect(await exists('foo/test.bak')).toBeTruthy();
        expect(await exists('foo/test2.bak')).toBeTruthy();
      });
      await runActionWithBackup(action, ['foo/test', 'foo/test2']);
      expect(action).toHaveBeenCalled();
    });

    it('should delete backups after successful run', async () => {
      const action = vi.fn().mockResolvedValue(undefined);
      await runActionWithBackup(action, ['foo/test', 'foo/test2']);
      expect(action).toHaveBeenCalled();
      expect(await exists('foo/test.bak')).toBeFalsy();
      expect(await exists('foo/test2.bak')).toBeFalsy();
    });

    it('should restore backups after failed run', async () => {
      const originalValue1 = fs.readFileSync('foo/test', 'utf8');
      const originalValue2 = fs.readFileSync('foo/test2', 'utf8');
      const action = vi.fn().mockImplementation(async () => {
        fs.writeFileSync('foo/test', 'test');
        fs.writeFileSync('foo/test2', 'test2');
        throw new Error('test');
      });
      await expect(
        runActionWithBackup(action, ['foo/test', 'foo/test2']),
      ).rejects.toThrow();
      expect(action).toHaveBeenCalled();
      expect(fs.readFileSync('foo/test', 'utf8')).toBe(originalValue1);
      expect(fs.readFileSync('foo/test2', 'utf8')).toBe(originalValue2);
    });

    it('should delete backups after failed run', async () => {
      const action = vi.fn().mockImplementation(async () => {
        fs.writeFileSync('foo/test', 'test');
        fs.writeFileSync('foo/test2', 'test2');
        throw new Error('test');
      });
      await expect(
        runActionWithBackup(action, ['foo/test', 'foo/test2']),
      ).rejects.toThrow();
      expect(action).toHaveBeenCalled();
      expect(await exists('foo/test.bak')).toBeFalsy();
      expect(await exists('foo/test2.bak')).toBeFalsy();
    });
  });

  describe('createDirectoryIfNotExists', () => {
    it('should create directory if it does not exist', async () => {
      expect(await exists('foo/bar')).toBeFalsy();
      await createDirectoryIfNotExists('foo/bar');
      expect(await exists('foo/bar')).toBeTruthy();
    });

    it('should not create directory if it exists', async () => {
      expect(await exists('foo')).toBeTruthy();
      await createDirectoryIfNotExists('foo');
      expect(await exists('foo')).toBeTruthy();
    });
  });

  describe('move', () => {
    it('should move file', async () => {
      await move('foo/test', 'bar/test');
      expect(await exists('foo/test')).toBeFalsy();
      expect(await exists('bar/test')).toBeTruthy();
    });

    it('should override existing file if overrideExisting: true', async () => {
      await move('foo/test', 'bar/test', { overrideExisting: true });
      expect(await exists('foo/test')).toBeFalsy();
      expectFile('bar/test', 'foo-test');
    });

    it('should not override existing file if overrideExisting: false', async () => {
      await move('foo/test', 'bar/test2', { overrideExisting: false });
      expect(await exists('foo/test')).toBeTruthy();
      expectFile('bar/test2', 'bar-test2');
    });
  });

  describe('copy', () => {
    it('should copy file', async () => {
      await copy('foo/test', 'bar/test');
      expectFiles({
        foo: {
          test: 'foo-test',
        },
        bar: {
          test: 'foo-test',
        },
      });
    });

    it('should override existing file if overrideExisting: true', async () => {
      await copy('foo/test', 'bar/test2', { overrideExisting: true });
      expectFiles({
        foo: {
          test: 'foo-test',
        },
        bar: {
          test2: 'foo-test',
        },
      });
    });

    it('should not override existing file if overrideExisting: false', async () => {
      await copy('foo/test', 'bar/test2', { overrideExisting: false });
      expectFiles({
        foo: {
          test: 'foo-test',
        },
        bar: {
          test2: 'bar-test2',
        },
      });
    });
  });

  describe('createSymlink', () => {
    it('should create symlink', async () => {
      await createSymlink('foo/test', 'bar/test');
      expectFiles({
        bar: {
          test: mock.symlink({ path: 'foo/test' }),
        },
        foo: {
          test: 'foo-test',
        },
      });
    });

    it('should override existing symlink if overrideExisting: true', async () => {
      fs.symlinkSync('foo/test', 'bar/test');
      await createSymlink('foo/test2', 'bar/test', { overrideExisting: true });
      expectFiles({
        bar: {
          test: mock.symlink({ path: 'foo/test2' }),
        },
        foo: {
          test2: 'foo-test2',
        },
      });
    });

    it('should not override existing symlink if overrideExisting: false', async () => {
      fs.symlinkSync('foo/test', 'bar/test');
      await createSymlink('foo/test2', 'bar/test', { overrideExisting: false });
      expectFiles({
        foo: {
          test: 'foo-test',
        },
        bar: {
          test: mock.symlink({ path: 'foo/test' }),
        },
      });
    });
  });

  describe('getFiles', async () => {
    it('should return files in directory', async () => {
      expect(await getFiles('foo')).toEqual(['test', 'test2']);
    });

    it('should ignore hidden files', async () => {
      fs.writeFileSync('foo/.bar', '');
      expect(await getFiles('foo')).toEqual(['test', 'test2']);
    });
  });

  describe('remove', () => {
    it('should remove file', async () => {
      expect(await exists('foo/test')).toBeTruthy();
      await remove('foo/test');
      expect(await exists('foo/test')).toBeFalsy();
    });

    it('should remove directory', async () => {
      expect(await exists('bar')).toBeTruthy();
      await remove('bar');
      expect(await exists('bar')).toBeFalsy();
    });
  });

  describe('isSymlink', () => {
    it('should return true if file is symlink', async () => {
      mock({
        'foo/test': 'foo-test',
        'bar/test': mock.symlink({ path: 'foo/test' }),
      });
      expect(await isSymlink('bar/test')).toBeTruthy();
    });

    it('should return false if file is not symlink', async () => {
      expect(await isSymlink('foo/test')).toBeFalsy();
    });
  });

  describe('readFile', () => {
    it('should read file content', async () => {
      expect(await readFileContent('foo/test')).toBe('foo-test');
    });

    it('should follow symlink', async () => {
      mock({
        '/foo/test': 'foo-test',
        '/bar/test': mock.symlink({ path: '/foo/test' }),
      });
      expect(await readFileContent('/bar/test')).toBe('foo-test');
    });
  });
});
