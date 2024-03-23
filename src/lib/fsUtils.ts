import * as fsOriginal from 'node:fs';

import { logger } from './logger';

const fsPromises = fsOriginal.promises;

const DRY_RUN_KEYS = [
  'unlink',
  'rmdir',
  'symlink',
  'cp',
  'rename',
  'mkdir',
  'writeFile',
] satisfies (keyof typeof fsPromises)[];

type TFsPromisesFunctionKey = keyof {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof typeof fsPromises as (typeof fsPromises)[K] extends Function
    ? K
    : never]: true;
};

export const fs: typeof fsPromises = {
  ...fsPromises,
  ...DRY_RUN_KEYS.reduce<typeof fsPromises>(
    <K extends TFsPromisesFunctionKey>(acc: typeof fsPromises, key: K) => ({
      ...acc,
      [key]: (...args: Parameters<(typeof fsPromises)[K]>) => {
        if (process.env.DRY_RUN) {
          logger.debug(
            `Running fs.${key} with args \n  ${args
              .map((arg) => JSON.stringify(arg))
              .join('\n  ')})`,
          );
          return Promise.resolve();
        }
        // @ts-expect-error can't figure out how to type this
        return fsPromises[key](...args);
      },
    }),
    fsPromises,
  ),
};

type TCommonOpts = {
  overrideExisting?: boolean;
};

const isEnoentError = (err: unknown): err is Error =>
  !!err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT';

export const exists = async (filePath: string) => {
  try {
    await fs.lstat(filePath);
    return true;
  } catch (err: unknown) {
    if (isEnoentError(err)) {
      return false;
    }
    throw err;
  }
};

export const symlinkExists = async (symlinkPath: string) =>
  (await exists(symlinkPath)) && (await isSymlink(symlinkPath));

export const fileExists = async (relativePath: string) =>
  (await exists(relativePath)) && !(await isSymlink(relativePath));

export const runActionWithBackup = async (
  action: () => Promise<void>,
  filePathOrPathsToBackup: string | string[],
  { skip }: { skip?: boolean } = {},
) => {
  if (skip) {
    await action();
    return;
  }

  const filePathsToBackup = Array.isArray(filePathOrPathsToBackup)
    ? filePathOrPathsToBackup
    : [filePathOrPathsToBackup];

  const backupPaths = filePathsToBackup.map((p) => `${p}.bak`);

  logger.debug('Backing up files');

  await Promise.all(
    filePathsToBackup.map(async (p, i) => {
      const backupPath = backupPaths[i];
      if (await exists(p)) {
        logger.debug(`Copying ${p} to ${backupPath}`);
        await fs.cp(p, backupPath, { recursive: true });
      }
    }),
  );

  try {
    logger.debug('Running action');
    await action();

    await Promise.all(
      backupPaths.map(async (backupPath) => {
        if (await exists(backupPath)) {
          logger.debug(`Removing backup at ${backupPath}`);
          await remove(backupPath);
        }
      }),
    );
  } catch (err: unknown) {
    logger.debug('Action failed, restoring backups');
    await Promise.all(
      filePathsToBackup.map(async (p, i) => {
        const backupPath = backupPaths[i];
        if (await exists(backupPath)) {
          logger.debug(`Restoring backup at ${backupPath}`);
          await remove(p);
          await move(backupPath, p);
        }
      }),
    );
    throw err;
  }
};

export const createDirectoryIfNotExists = async (directoryPath: string) => {
  const alreadyExists = await exists(directoryPath);
  if (!alreadyExists) {
    logger.debug(`Creating directory ${directoryPath}`);
    await fs.mkdir(directoryPath);
  }
};

export const move = async (
  from: string,
  to: string,
  { overrideExisting }: TCommonOpts = {},
) => {
  if (await exists(to)) {
    if (overrideExisting) {
      logger.debug(`Overriding existing file: ${to}`);
    } else {
      logger.debug(`File already exists: ${to}, skipping`);
      return;
    }
  }
  logger.debug(`Moving from ${from} to ${to}`);
  await fs.rename(from, to);
};

export const copy = async (
  from: string,
  to: string,
  { overrideExisting }: TCommonOpts = {},
) => {
  if (await exists(to)) {
    if (overrideExisting) {
      logger.debug(`Overriding existing file: ${to}`);
    } else {
      logger.debug(`File already exists: ${to}, skipping`);
      return;
    }
  }
  logger.debug(`Copying from ${from} to ${to}`);
  await fs.cp(from, to, { recursive: true, force: !!overrideExisting });
};

export const createSymlink = async (
  originalFilePath: string,
  symlinkPath: string,
  { overrideExisting }: TCommonOpts = {},
) => {
  const symlinkExists = await exists(symlinkPath);
  const originalFileExists = await exists(originalFilePath);

  if (!originalFileExists) {
    logger.error(`File not found: ${originalFilePath}`);
    return;
  }

  if (symlinkExists) {
    if (overrideExisting) {
      logger.debug(`Overriding existing symlink at ${symlinkPath}`);
      await remove(symlinkPath);
    } else {
      logger.debug(`Symlink already exists at ${symlinkPath}, skipping`);
      return;
    }
  }

  logger.debug(`Creating symlink from ${originalFilePath} to ${symlinkPath}`);
  await fs.symlink(originalFilePath, symlinkPath);
};

export const getFiles = async (dir: string) => {
  const files = await fs.readdir(dir);
  return files.filter((f) => !f.startsWith('.'));
};

export const remove = async (path: string) => {
  if (!(await exists(path))) {
    logger.error(`File not found: ${path}`);
    return;
  }
  const stat = await fs.lstat(path);
  if (stat.isDirectory()) {
    await fs.rmdir(path, { recursive: true });
  } else {
    await fs.unlink(path);
  }
};

export const isSymlink = async (path: string) => {
  const stat = await fs.lstat(path);
  return stat.isSymbolicLink();
};

export const readFileContent = async (path: string) => {
  const finalPath = await fs.realpath(path);

  return fs.readFile(finalPath, 'utf8');
};

export const writeFile = async (path: string, content: string) =>
  fs.writeFile(path, content, {
    encoding: 'utf8',
  });
