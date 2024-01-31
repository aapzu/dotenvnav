import fs from 'fs';

import mock from 'mock-fs';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  copy,
  exists,
  fileExists,
  getFiles,
  move,
  symlinkExists,
  remove,
} from '../fsUtils';

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

  describe('runActionWithBackup', () => {});

  describe('createIfNotExists', () => {});

  describe('move', () => {
    it('should move file', async () => {
      await move('foo/test', 'bar/test');
      expect(await exists('foo/test')).toBeFalsy();
      expect(await exists('bar/test')).toBeTruthy();
    });

    it('should override existing file if overrideExisting: true', async () => {
      await move('foo/test', 'bar/test', { overrideExisting: true });
      expect(await exists('foo/test')).toBeFalsy();
      expect(fs.readFileSync('bar/test', 'utf8')).toBe('foo-test');
    });

    it('should not override existing file if overrideExisting: false', async () => {
      await move('foo/test', 'bar/test2', { overrideExisting: false });
      expect(await exists('foo/test')).toBeTruthy();
      expect(fs.readFileSync('bar/test2', 'utf8')).toBe('bar-test2');
    });
  });

  describe('copy', () => {
    it('should copy file', async () => {
      await copy('foo/test', 'bar/test');
      expect(fs.readFileSync('foo/test')).toEqual(fs.readFileSync('bar/test'));
    });

    it('should override existing file if overrideExisting: true', async () => {
      await copy('foo/test', 'bar/test2', { overrideExisting: true });
      expect(fs.readFileSync('foo/test')).toEqual(fs.readFileSync('bar/test2'));
    });

    it('should not override existing file if overrideExisting: false', async () => {
      await copy('foo/test', 'bar/test2', { overrideExisting: false });
      expect(fs.readFileSync('bar/test2', 'utf8')).toBe('bar-test2');
    });
  });

  describe('createSymlink', () => {});

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
});
