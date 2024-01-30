import fastGlob from 'fast-glob';

import { resolvePath } from './fsUtils';
import { logger } from './logger';

export type TGetEnvFilesOpts = {
  projectRoot: string;
  configRoot: string;
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
      envFileNames.map((name) => `**/${name}`),
      {
        cwd: resolvePath(projectRoot),
        ignore: ['**/node_modules/**'],
      },
    )
  ).map((filePath) => filePath.replace(/\//g, '__'));

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
      dotenvnavFileName.replace(/__/g, '/'),
    ),
    dotenvnavFileName,
  }));
};
