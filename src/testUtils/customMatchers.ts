import 'vitest'; // This import is required to extend the global `expect` object
import fs from 'node:fs';
import path from 'node:path';
import Directory from 'mock-fs/lib/directory';
import MockFsFile from 'mock-fs/lib/file';
import type FileSystem from 'mock-fs/lib/filesystem';
import SymbolicLink from 'mock-fs/lib/symlink';

export interface CustomMatchers<R = unknown> {
  toExistFile: () => R;
  toEqualTextFile: (text: string | Buffer) => R;
  toEqualBufferFile: (buffer: Buffer) => R;
  toBeSymbolicLink: () => R;
  toBeSymbolicLinkTo: (target: string) => R;
  toEqualFileValue: (value: FileSystem.DirectoryItem) => R;
  toMatchFileStructure: () => R;
}

interface MatcherResult {
  pass: boolean;
  message: () => string;
}

export const matchers = {
  toExistFile(fileName: string) {
    const { isNot } = this;
    const exists = fs.existsSync(fileName);
    return {
      pass: exists,
      message: () =>
        isNot
          ? `expected file ${fileName} not to exist, but it does`
          : `expected file ${fileName} to exist, but it does not`,
    };
  },
  toEqualTextFile(fileName: string, text: string | Buffer) {
    const { isNot } = this;

    const result: MatcherResult = matchers.toExistFile.call(this, fileName);
    if (!result.pass) {
      return result;
    }

    const fileText = fs.readFileSync(fileName, 'utf-8');
    return {
      pass: fileText === text.toString('utf-8'),
      message: () =>
        isNot
          ? `expected file ${fileName} content not to equal "${text}", but it does`
          : `expected file ${fileName} content to equal "${text}", but received "${fileText}"`,
    };
  },
  toEqualBufferFile(fileName: string, buffer: Buffer) {
    const { isNot } = this;

    const result: MatcherResult = matchers.toExistFile.call(this, fileName);
    if (!result.pass) {
      return {
        pass: false,
        message: result.message,
      };
    }

    const fileBuffer = fs.readFileSync(fileName);
    return {
      pass: fileBuffer.equals(buffer),
      message: () => {
        return isNot
          ? `expected file ${fileName} buffer content not to equal the given buffer, but it does`
          : `expected file ${fileName} buffer content to equal the given buffer, but it differs`;
      },
    };
  },
  toBeSymbolicLink(fileName: string) {
    const { isNot } = this;

    const result: MatcherResult = matchers.toExistFile.call(this, fileName);
    if (!result.pass) {
      return result;
    }

    const isSymbolicLink = fs.lstatSync(fileName).isSymbolicLink();

    return {
      pass: isSymbolicLink,
      message: () =>
        isNot
          ? `expected ${fileName} not to be a symbolic link, but it is`
          : `expected ${fileName} to be a symbolic link, but it is not`,
    };
  },
  toBeSymbolicLinkTo(fileName: string, target: string) {
    const { isNot } = this;

    const result: MatcherResult = matchers.toBeSymbolicLink.call(
      this,
      fileName,
    );
    if (!result.pass) {
      return result;
    }

    const linkTarget = fs.readlinkSync(fileName);

    return {
      pass: linkTarget === target,
      message: () =>
        isNot
          ? `expected ${fileName} not to be a symbolic link to "${target}", but it is`
          : `expected ${fileName} to be a symbolic link to "${target}", but it points to "${linkTarget}"`,
    };
  },
  toEqualFileValue(
    fileName: string,
    value: FileSystem.DirectoryItem,
    options: { rootPath?: string } = {},
  ) {
    const { rootPath = '' } = options;
    const fullPath = path.join(rootPath, fileName);

    let result: MatcherResult;

    if (typeof value === 'string') {
      result = matchers.toEqualTextFile.call(this, fullPath, value);
    } else if (value instanceof Buffer) {
      result = matchers.toEqualBufferFile.call(this, fullPath, value);
    } else if (typeof value === 'function') {
      const item = value();
      if (item instanceof SymbolicLink) {
        result = matchers.toBeSymbolicLinkTo.call(
          this,
          fullPath,
          item.getPath(),
        );
      } else if (item instanceof MockFsFile) {
        result = matchers.toEqualTextFile.call(
          this,
          fullPath,
          item.getContent(),
        );
      } else if (item instanceof Directory) {
        throw new Error('Directories are not supported');
      } else {
        throw new Error('Unknown file type');
      }
    } else {
      result = matchers.toMatchFileStructure.call(this, value, {
        rootPath: fullPath,
      });
    }

    return result;
  },
  toMatchFileStructure(
    structure: FileSystem.DirectoryItems,
    options: { rootPath?: string } = {},
  ) {
    const { rootPath = '' } = options;

    for (const [key, value] of Object.entries(structure)) {
      const result: MatcherResult = matchers.toEqualFileValue.call(
        this,
        key,
        value,
        {
          rootPath,
        },
      );
      if (!result.pass) {
        return result;
      }
    }

    return {
      pass: true,
      message: () => 'expected the file structure not to match, but it does',
    };
  },
} satisfies Record<
  keyof CustomMatchers,
  Parameters<typeof expect.extend>[0][string]
>;
