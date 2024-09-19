import mock from 'mock-fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('Custom Matchers', () => {
  beforeEach(() => {
    mock({
      'test-dir': {
        'file.txt': 'Hello, World!',
        'buffer-file': Buffer.from('Buffer content'),
        'link-file': mock.symlink({ path: 'file.txt' }),
      },
    });
  });

  afterEach(() => {
    mock.restore();
  });

  describe('toExistFile', () => {
    it('should pass when the file exists', () => {
      expect('test-dir/file.txt').toExistFile();
    });

    it('should pass with .not when the file does not exist', () => {
      expect('non-existent-file.txt').not.toExistFile();
    });

    it('should pass with a symbolic link', () => {
      expect('test-dir/link-file').toExistFile();
    });

    it('should fail when the file should not exist', () => {
      expect(() => {
        expect('test-dir/non-existent.txt').toExistFile();
      }).toThrow(
        'expected file test-dir/non-existent.txt to exist, but it does not',
      );
    });

    it('should fail when the file exists but should not', () => {
      expect(() => {
        expect('test-dir/file.txt').not.toExistFile();
      }).toThrow('expected file test-dir/file.txt not to exist, but it does');
    });
  });

  describe('toEqualTextFile', () => {
    it('should pass when file content equals the given text', () => {
      expect('test-dir/file.txt').toEqualTextFile('Hello, World!');
    });

    it('should pass with .not when file content does not equal the given text', () => {
      expect('test-dir/file.txt').not.toEqualTextFile('Wrong content');
    });

    it('should pass with a buffer', () => {
      const buffer = Buffer.from('Buffer content');
      expect('test-dir/buffer-file').toEqualTextFile(buffer);
    });

    it('should pass with a symbolic link', () => {
      expect('test-dir/link-file').toEqualTextFile('Hello, World!');
    });

    it('should fail when file content does not equal the given text', () => {
      expect(() => {
        expect('test-dir/file.txt').toEqualTextFile('Wrong content');
      }).toThrow(
        'expected file test-dir/file.txt content to equal "Wrong content", but received "Hello, World!"',
      );
    });

    it('should fail when file content equals the given text but should not', () => {
      expect(() => {
        expect('test-dir/file.txt').not.toEqualTextFile('Hello, World!');
      }).toThrow(
        'expected file test-dir/file.txt content not to equal "Hello, World!", but it does',
      );
    });
  });

  describe('toEqualBufferFile', () => {
    it('should pass when file content equals the given buffer', () => {
      const buffer = Buffer.from('Buffer content');
      expect('test-dir/buffer-file').toEqualBufferFile(buffer);
    });

    it('should pass with .not when file content does not equal the given buffer', () => {
      const buffer = Buffer.from('Wrong buffer content');
      expect('test-dir/buffer-file').not.toEqualBufferFile(buffer);
    });

    it('should fail when file content does not equal the given buffer', () => {
      const buffer = Buffer.from('Wrong buffer content');
      expect(() => {
        expect('test-dir/buffer-file').toEqualBufferFile(buffer);
      }).toThrow(
        'expected file test-dir/buffer-file buffer content to equal the given buffer, but it differs',
      );
    });

    it('should fail when file content equals the given buffer but should not', () => {
      const buffer = Buffer.from('Buffer content');
      expect(() => {
        expect('test-dir/buffer-file').not.toEqualBufferFile(buffer);
      }).toThrow(
        'expected file test-dir/buffer-file buffer content not to equal the given buffer, but it does',
      );
    });
  });

  describe('toBeSymbolicLink', () => {
    it('should pass when the file is a symbolic link', () => {
      expect('test-dir/link-file').toBeSymbolicLink();
    });

    it('should pass with .not when the file is not a symbolic link but a file', () => {
      expect('test-dir/file.txt').not.toBeSymbolicLink();
    });

    it('should fail when the file does not exist', () => {
      expect(() => {
        expect('test-dir/non-existent.txt').toBeSymbolicLink();
      }).toThrow(
        'expected file test-dir/non-existent.txt to exist, but it does not',
      );
    });

    it('should fail when the file is not a symbolic link but should be', () => {
      expect(() => {
        expect('test-dir/file.txt').toBeSymbolicLink();
      }).toThrow(
        'expected test-dir/file.txt to be a symbolic link, but it is not',
      );
    });

    it('should fail when the file is a symbolic link but should not be', () => {
      expect(() => {
        expect('test-dir/link-file').not.toBeSymbolicLink();
      }).toThrow(
        'expected test-dir/link-file not to be a symbolic link, but it is',
      );
    });
  });

  describe('toBeSymbolicLinkTo', () => {
    it('should pass when the symbolic link points to the correct target', () => {
      expect('test-dir/link-file').toBeSymbolicLinkTo('file.txt');
    });

    it('should fail when the symbolic link points to a different target', () => {
      expect('test-dir/link-file').not.toBeSymbolicLinkTo('wrong-target.txt');
    });
  });

  describe('toEqualFileStructure', () => {
    it('should pass when the directory structure matches', () => {
      const expectedStructure = {
        'test-dir': {
          'file.txt': 'Hello, World!',
          'buffer-file': Buffer.from('Buffer content'),
          'link-file': mock.symlink({ path: 'file.txt' }),
        },
      };
      expect(expectedStructure).toMatchFileStructure();
    });

    it('should pass when the directory structure does not match', () => {
      const expectedStructure = {
        'test-dir': {
          'file.txt': 'Hello, World!',
          'buffer-file': Buffer.from('Buffer content'),
          'link-file': mock.symlink({ path: 'test-dir/wrong-file.txt' }),
        },
      };
      expect(expectedStructure).not.toMatchFileStructure();
    });

    it('should fail when the directory structure does not match', () => {
      const expectedStructure = {
        'test-dir': {
          'file.txt': 'Hello, World!',
          'buffer-file': Buffer.from('Wrong buffer content'),
          'link-file': mock.symlink({ path: 'file.txt' }),
        },
      };
      expect(() => {
        expect(expectedStructure).toMatchFileStructure();
      }).toThrow(
        'expected file test-dir/buffer-file buffer content to equal the given buffer, but it differs',
      );
    });

    it('should fail when the directory structure should not match', () => {
      const expectedStructure = {
        'test-dir': {
          'file.txt': 'Hello, World!',
          'buffer-file': Buffer.from('Buffer content'),
          'link-file': mock.symlink({ path: 'file.txt' }),
        },
      };
      expect(() => {
        expect(expectedStructure).not.toMatchFileStructure();
      }).toThrow('expected the file structure not to match, but it does');
    });
  });
});
