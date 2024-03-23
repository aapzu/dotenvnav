import fs from 'node:fs';
import path from 'node:path';

import Directory from 'mock-fs/lib/directory';
import SymbolicLink from 'mock-fs/lib/symlink';
import MockFsFile from 'mock-fs/lib/file';
import FileSystem from 'mock-fs/lib/filesystem';

import { parser } from '../cli';
import { METADATA_FILE_NAME } from '../consts';

export const runCommand = async (
  command: string,
  options: Record<string, string | number | boolean>,
) => {
  const args = [
    command,
    ...Object.entries(options).map(([key, value]) => `--${key}=${value}`),
  ].join(' ');

  return parser.parse(args);
};

export const expectFile = (
  filePath: string,
  value: FileSystem.DirectoryItem,
  rootPath: string = '',
) => {
  const fullPath = path.join(rootPath, filePath);
  if (typeof value === 'string') {
    expect(fs.existsSync(fullPath)).toBe(true);
    expect(fs.readFileSync(fullPath, 'utf-8')).toBe(value);
  } else if (value instanceof Buffer) {
    expect(fs.existsSync(fullPath)).toBe(true);
    expect(fs.readFileSync(fullPath)).eql(value);
  } else if (typeof value === 'function') {
    const item = value();
    if (item instanceof SymbolicLink) {
      expect(fs.lstatSync(fullPath).isSymbolicLink()).toBe(true);
      expect(fs.readlinkSync(fullPath)).toBe(item.getPath());
    } else if (item instanceof MockFsFile) {
      expect(fs.existsSync(fullPath)).toBe(true);
      expect(fs.readFileSync(fullPath, 'utf-8')).toBe(item.getContent());
    } else if (item instanceof Directory) {
      throw new Error('Directories are not supported');
    }
  } else {
    expect(fs.existsSync(fullPath)).toBe(true);
    expectFiles(value, fullPath);
  }
};

export const expectFiles = (
  structure: FileSystem.DirectoryItems,
  rootPath: string = '',
) => {
  Object.entries(structure).forEach(([key, value]) => {
    expectFile(key, value, rootPath);
  });
};

export const createMockMetadataFile = (projectRoot: string) => ({
  [METADATA_FILE_NAME]: JSON.stringify({ projectRoot }, null, 2),
});
