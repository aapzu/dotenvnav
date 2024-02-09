import fs from 'fs/promises';
import path from 'path';

import { exists, readFileContent } from '../lib/fsUtils';

export const expectExists = async (filePath: string) => {
  if (!(await exists(filePath))) {
    expect.fail(`Expected ${filePath} to exist`);
  }
};

export const expectNotExists = async (filePath: string) => {
  if (await exists(filePath)) {
    expect.fail(`Expected ${filePath} to not exist`);
  }
};

export const expectContent = async (filePath: string, content: string) => {
  const fileContent = await readFileContent(filePath);
  expect(fileContent).toEqual(content);
};

export const expectSymbolicLink = async (filePath: string, target: string) => {
  const linkTarget = await fs.readlink(filePath);
  expect(linkTarget).toEqual(path.resolve(target));
};
