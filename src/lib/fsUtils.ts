import path from 'node:path';
import os from 'node:os';
import fsOriginal from 'node:fs';

import { v4 as uuid } from 'uuid';

import { logger } from './logger';

const fs = fsOriginal.promises;

type TCommonOpts = {
  overrideExisting?: boolean;
};

export const resolvePath = (...parts: string[]) =>
  path.resolve(...parts.map((p) => p.replace('~', os.homedir())));

const isEnoentError = (err: unknown) =>
  err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT';

const isInvalidArgumentError = (err: unknown) =>
  err && typeof err === 'object' && 'code' in err && err.code === 'EINVAL';

export const symlinkExists = async (relativeSymlinkPath: string) => {
  try {
    await fs.readlink(resolvePath(relativeSymlinkPath));
    return true;
  } catch (err: unknown) {
    if (isEnoentError(err) || isInvalidArgumentError(err)) {
      return false;
    }
    throw err;
  }
};

export const fileExists = async (relativePath: string) => {
  try {
    await fs.stat(resolvePath(relativePath));
    return true;
  } catch (err: unknown) {
    if (isEnoentError(err)) {
      return false;
    }
    throw err;
  }
};

export const exists = async (relativePath: string) => {
  return (
    (await fileExists(relativePath)) || (await symlinkExists(relativePath))
  );
};

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

  const backupPaths = filePathsToBackup.map((p) => `${p}.backup_${uuid()}`);

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

export const createIfNotExists = async (relativePath: string) => {
  const absolutePath = resolvePath(relativePath);
  const alreadyExists = await exists(absolutePath);
  if (!alreadyExists) {
    logger.debug(`Creating directory ${absolutePath}`);
    await fs.mkdir(absolutePath);
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
  await fs.cp(from, to, { recursive: true });
};

export const createSymlink = async (
  originalFilePath: string,
  symlinkPath: string,
  { overrideExisting }: TCommonOpts = {},
) => {
  try {
    const alreadyExists = await exists(symlinkPath);
    if (alreadyExists) {
      if (overrideExisting) {
        logger.debug(`Overriding existing symlink at ${symlinkPath}`);
      } else {
        logger.debug(`Symlink already exists at ${symlinkPath}, skipping`);
        return;
      }
    }
    const absoluteOriginalFilePath = resolvePath(originalFilePath);
    const absoluteSymlinkPath = resolvePath(symlinkPath);

    if (!(await exists(absoluteOriginalFilePath))) {
      logger.error(`File not found: ${absoluteOriginalFilePath}`);
      return;
    }

    if (alreadyExists) {
      logger.debug(`Removing existing symlink at ${absoluteSymlinkPath}`);
      await remove(absoluteSymlinkPath);
    }

    logger.debug(
      `Creating symlink from ${absoluteSymlinkPath} to ${absoluteOriginalFilePath}`,
    );
    await fs.symlink(absoluteOriginalFilePath, absoluteSymlinkPath);
  } catch (err: unknown) {
    if (isEnoentError(err)) {
      logger.error(`File not found: ${originalFilePath}`);
      return;
    }
    throw err;
  }
};

export const getFiles = async (dir: string) => {
  const files = await fs.readdir(dir);
  return files.filter((f) => !f.startsWith('.'));
};

export const remove = async (relativePath: string) => {
  if (!(await exists(relativePath))) {
    logger.error(`File not found: ${relativePath}`);
    return;
  }
  const absolutePath = resolvePath(relativePath);
  const stat = await fs.lstat(absolutePath);
  if (stat.isDirectory()) {
    await fs.rmdir(absolutePath, { recursive: true });
  } else {
    await fs.unlink(absolutePath);
  }
};
