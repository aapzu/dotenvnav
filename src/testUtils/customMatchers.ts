import 'vitest'; // This import is required to extend the global `expect` object
import fs from 'node:fs';
import path from 'node:path';
import Directory from 'mock-fs/lib/directory';
import MockFsFile from 'mock-fs/lib/file';
import type FileSystem from 'mock-fs/lib/filesystem';
import SymbolicLink from 'mock-fs/lib/symlink';
import { z } from 'zod';

const directoryItemSchema: z.ZodType<FileSystem.DirectoryItem> = z.union([
  z.string(),
  z.instanceof(Buffer),
  z.function().returns(z.instanceof(MockFsFile)),
  z.function().returns(z.instanceof(Directory)),
  z.function().returns(z.instanceof(SymbolicLink)),
  z.record(z.lazy(() => directoryItemSchema)),
]);

const directoryItemsSchema: z.ZodType<FileSystem.DirectoryItems> =
  z.record(directoryItemSchema);

type TMatcherFn<ExpectedValue = void, Options = void> = (
  this: MatcherState,
  received: unknown,
  expected?: ExpectedValue,
  options?: Options,
) => ExpectationResult;

type TCustomMatchersObject = {
  /** Check if a file exists */
  toExistFile: TMatcherFn;
  /** Check if a file exists and its content matches the given text */
  toEqualTextFile: TMatcherFn<string | Buffer>;
  /** Check if a file exists and its content matches the given buffer */
  toEqualBufferFile: TMatcherFn<Buffer>;
  /** Check if exists and is a file is a file and not a directory or a symbolic link */
  toBeFile: TMatcherFn;
  /** Check if a file is a symbolic link */
  toBeSymbolicLink: TMatcherFn;
  /** Check if a file is a symbolic link to a specific target */
  toBeSymbolicLinkTo: TMatcherFn<string>;
  /** Check if a file exists and is a directory */
  toBeDirectory: TMatcherFn;
  /** Check if a directory contains a specific file structure */
  toMatchDirectory: TMatcherFn<FileSystem.DirectoryItems>;
  /** Check if a file exists and its content matches the given value */
  toEqualFileValue: TMatcherFn<FileSystem.DirectoryItem, { rootPath?: string }>;
  /** Check if the file system matches a specific file structure */
  toMatchFileStructure: TMatcherFn<void, { rootPath?: string }>;
};

export type CustomMatchers<R = unknown> = {
  [K in keyof TCustomMatchersObject]: (
    expected: Parameters<TCustomMatchersObject[K]>[1],
    options?: Parameters<TCustomMatchersObject[K]>[2],
  ) => R;
};

type RawMatcherFn = Parameters<typeof expect.extend>[0][string];
type MatcherState = RawMatcherFn extends (
  this: infer S,
  ...args: unknown[]
) => unknown
  ? S
  : never;

// Only sync matchers are supported for now
type ExpectationResult = Exclude<ReturnType<RawMatcherFn>, Promise<unknown>>;

function expectString(value: unknown): asserts value is string {
  expect(value).toBeTypeOf('string');
}

function expectDefined<T>(value: T | undefined): asserts value is T {
  expect(value).not.toBeUndefined();
}

function expectDirectoryItems(
  value: unknown,
): asserts value is FileSystem.DirectoryItems {
  directoryItemsSchema.parse(value);
}

const runMatcher = (match: () => void): ExpectationResult => {
  try {
    match();
    return {
      pass: true,
      message: () => '',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      pass: false,
      message: () => message,
    };
  }
};

export const matchers: TCustomMatchersObject = {
  toExistFile(fileName) {
    expectString(fileName);

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
  toBeFile(fileName) {
    expectString(fileName);

    const { isNot } = this;

    const result = runMatcher(() => {
      expect(fileName).toExistFile();
      expect(fileName).not.toBeDirectory();
      expect(fileName).not.toBeSymbolicLink();
    });
    if (!result.pass) {
      return result;
    }

    const isFile = fs.lstatSync(fileName).isFile();

    return {
      pass: isFile,
      message: () =>
        isNot
          ? `expected ${fileName} not to be a file, but it is`
          : `expected ${fileName} to be a file, but it is not`,
    };
  },
  toEqualTextFile(fileName, text) {
    expectString(fileName);
    expectDefined(text);

    const { isNot } = this;

    const result = runMatcher(() => expect(fileName).toBeFile());
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
  toEqualBufferFile(fileName, buffer) {
    expectString(fileName);
    expectDefined(buffer);

    const { isNot } = this;

    const result = runMatcher(() => expect(fileName).toBeFile());
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
  toBeSymbolicLink(fileName) {
    expectString(fileName);

    const { isNot } = this;

    const result = runMatcher(() => expect(fileName).toExistFile());
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
  toBeDirectory(fileName) {
    expectString(fileName);

    const { isNot } = this;

    const result = runMatcher(() => expect(fileName).toExistFile());
    if (!result.pass) {
      return result;
    }

    const isDirectory = fs.lstatSync(fileName).isDirectory();

    return {
      pass: isDirectory,
      message: () =>
        isNot
          ? `expected ${fileName} not to be a directory, but it is`
          : `expected ${fileName} to be a directory, but it is not`,
    };
  },
  toBeSymbolicLinkTo(fileName, target) {
    expectString(fileName);

    const { isNot } = this;

    const result: ExpectationResult = runMatcher(() =>
      expect(fileName).toBeSymbolicLink(),
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
  toMatchDirectory(fullPath, structure) {
    expectString(fullPath);
    expectDefined(structure);

    let result: ExpectationResult;

    result = matchers.toBeDirectory.call(this, fullPath);
    if (!result.pass) {
      return result;
    }

    return matchers.toMatchFileStructure.call(this, structure, undefined, {
      rootPath: fullPath,
    });
  },
  toEqualFileValue(fileName, value, options = {}) {
    expectString(fileName);
    expectDefined(value);

    const { rootPath = '' } = options;
    const fullPath = path.join(rootPath, fileName);

    let result: ExpectationResult;

    if (typeof value === 'string') {
      result = runMatcher(() => expect(fullPath).toEqualTextFile(value));
    } else if (value instanceof Buffer) {
      result = runMatcher(() => expect(fullPath).toEqualBufferFile(value));
    } else if (typeof value === 'function') {
      const item = value();
      if (item instanceof SymbolicLink) {
        result = runMatcher(() =>
          expect(fullPath).toBeSymbolicLinkTo(item.getPath()),
        );
      } else if (item instanceof MockFsFile) {
        result = runMatcher(() =>
          expect(fullPath).toEqualTextFile(item.getContent()),
        );
      } else if (item instanceof Directory) {
        throw new Error('Directories are not supported');
      } else {
        throw new Error('Unknown file type');
      }
    } else {
      result = runMatcher(() => expect(fullPath).toMatchDirectory(value));
    }

    return result;
  },
  toMatchFileStructure(structure, _expected, options = {}) {
    expectDirectoryItems(structure);

    const { rootPath = '' } = options;

    for (const [key, value] of Object.entries(structure)) {
      const result = runMatcher(() =>
        expect(key).toEqualFileValue(value, { rootPath }),
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
};
