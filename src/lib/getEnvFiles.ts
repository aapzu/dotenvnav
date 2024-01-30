import fastGlob from 'fast-glob';

import { TRootOptions } from '../types';

import { resolvePath } from './fsUtils';
import { logger } from './logger';

export type TGetEnvFilesOpts = TRootOptions & {
  envFileName: string | string[];
  envName: string;
};

export const getEnvFiles = async ({
  projectRoot,
  envFileName,
  configRoot,
  envName,
}: TGetEnvFilesOpts): Promise<
  Array<{
    projectPath: string;
    dotenvnavFileName: string;
  }>
> => {
  const envFileNames = Array.isArray(envFileName) ? envFileName : [envFileName];

  const filesFromProject = (
    await fastGlob(
      envFileNames.map((name) => `packages/**/${name}`),
      {
        cwd: resolvePath(projectRoot),
        ignore: ['**/node_modules/**'],
      },
    )
  ).map((filePath) => filePath.replace('packages/', '').replace(/\//g, '__'));

  const filesFromConfig = await fastGlob(
    envFileNames.map((name) => `*${name}`),
    { cwd: resolvePath(configRoot, envName) },
  );

  const allFiles = [
    ...new Set([...filesFromProject, ...filesFromConfig]),
  ].sort();

  if (allFiles.length === 0) {
    logger.warn('No env files found');
  }

  return allFiles.map((dotenvnavFileName) => ({
    projectPath: resolvePath(
      projectRoot,
      'packages',
      dotenvnavFileName.replace(/__/g, '/'),
    ),
    dotenvnavFileName,
  }));
};
