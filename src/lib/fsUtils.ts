import * as fsOriginal from 'node:fs';

import path from 'node:path';
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
  // biome-ignore lint/complexity/noBannedTypes: will fix
  [K in keyof typeof fsPromises as (typeof fsPromises)[K] extends Function
    ? K
    : never]: true;
};

/**
 * File system functions with dry run support
 */
export const fs: typeof fsPromises = {
  ...fsPromises,
  ...DRY_RUN_KEYS.reduce<typeof fsPromises>(
    <K extends TFsPromisesFunctionKey>(acc: typeof fsPromises, key: K) => ({
      // biome-ignore lint/performance/noAccumulatingSpread: will fix soon
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

/**
 * Whether a file, directory, or symbolic link exists. For symbolic links, it doesn't check the target
 *
 * @param path - Path to the file or directory
 */
export const exists = async (path: string): Promise<boolean> => {
  try {
    await fs.lstat(path);
    return true;
  } catch (err: unknown) {
    if (isEnoentError(err)) {
      return false;
    }
    throw err;
  }
};

/**
 * Whether a symbolic link and its target exist
 *
 * @param path - Path to the symbolic link
 * @returns
 */
export const symlinkExists = async (path: string) =>
  (await exists(path)) && (await isSymlink(path));

/**
 * Whether a file exists and is not a symbolic link
 *
 * @param path - Path to the file
 */
export const fileExists = async (path: string): Promise<boolean> =>
  (await exists(path)) && !(await isSymlink(path));

/**
 * Backup files before running an action and restore them if the action fails
 *
 * @param action - The action to run
 * @param filePathOrPathsToBackup - Path or paths to backup
 * @param options
 * @param options.skip - Whether to skip the backup and only run the action
 */
export const runActionWithBackup = async (
  action: () => Promise<void>,
  filePathOrPathsToBackup: string | string[],
  { skip }: { skip?: boolean } = {},
): Promise<void> => {
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

    logger.debug('Removing backups');
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

/**
 * Create a directory if it does not exist
 *
 * @param directoryPath - Path to the directory
 */
export const createDirectoryIfNotExists = async (
  directoryPath: string,
): Promise<void> => {
  const alreadyExists = await exists(directoryPath);
  if (!alreadyExists) {
    logger.debug(`Creating directory ${directoryPath}`);
    await fs.mkdir(directoryPath, {
      recursive: true,
    });
  }
};

/**
 * Move an item from one path to another
 *
 * @param from - Source path
 * @param to - Destination path
 * @param options
 * @param options.overrideExisting - Whether to override an existing file
 */
export const move = async (
  from: string,
  to: string,
  { overrideExisting }: TCommonOpts = {},
): Promise<void> => {
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

/**
 * Copy a file or directory
 *
 * @param from - Source path
 * @param to - Destination path
 * @param options
 * @param options.overrideExisting - Whether to override an existing file
 */
export const copy = async (
  from: string,
  to: string,
  { overrideExisting }: TCommonOpts = {},
): Promise<void> => {
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

/**
 * Create a symbolic link
 *
 * @param originalFilePath - Path to the original file, relative to the symlinkPath
 * @param symlinkPath - Path of to the symbolic link
 * @param options - Options
 * @param options.overrideExisting - Whether to override the existing symlink
 */
export const createSymlink = async (
  relativeOriginalFilePath: string,
  symlinkPath: string,
  { overrideExisting }: TCommonOpts = {},
): Promise<void> => {
  const symlinkExists = await exists(symlinkPath);
  const originalFilePath = path.resolve(
    path.dirname(symlinkPath),
    relativeOriginalFilePath,
  );
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
  await fs.symlink(relativeOriginalFilePath, symlinkPath);
};

/**
 * Get the list of files in a directory
 *
 * @param dir - Directory path
 * @returns List of files in the directory
 */
export const getFiles = async (dir: string): Promise<string[]> => {
  const files = await fs.readdir(dir);
  return files.filter((f) => !f.startsWith('.'));
};

/**
 * Remove a file or directory
 *
 * @param path - Path to the file or directory to remove
 */
export const remove = async (path: string): Promise<void> => {
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

/**
 * Whether an item is a symbolic link or not
 *
 * @param path - Path to the file or directory
 */
export const isSymlink = async (path: string): Promise<boolean> => {
  const stat = await fs.lstat(path);
  return stat.isSymbolicLink();
};

/**
 * Read the content of a file
 *
 * @param path - Path to the file
 */
export const readFileContent = async (path: string): Promise<string> => {
  const finalPath = await fs.realpath(path);

  return fs.readFile(finalPath, 'utf8');
};

/**
 * Write content to a file
 *
 * @param path - Path to the file
 * @param content - Content to write
 */
export const writeFile = async (path: string, content: string): Promise<void> =>
  fs.writeFile(path, content, {
    encoding: 'utf8',
  });
