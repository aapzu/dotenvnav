import fs from 'fs';

import fastGlob from 'fast-glob';

import { resolvePath } from './fsUtils';
import { logger } from './logger';

export type TGetEnvFilesOpts = {
  projectRoot: string;
  configRoot: string;
  envFileName: string | string[];
  envName: string;
};

const projectFilePathToConfigFileName = (
  projectFilePath: string,
  envFileName: string | string[],
) => {
  const envFileNameRegex = Array.isArray(envFileName)
    ? envFileName.join('|')
    : envFileName;
  return projectFilePath
    .replace(/\//g, '__')
    .replace(new RegExp(`^(${envFileNameRegex})`), 'root$1');
};

const configFileNameToProjectFilePath = (
  configFileName: string,
  envFileName: string | string[],
) => {
  const envFileNameRegex = Array.isArray(envFileName)
    ? envFileName.join('|')
    : envFileName;
  return configFileName
    .replace(/__/g, '/')
    .replace(new RegExp(`^root(${envFileNameRegex})`), '$1');
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

  const filesFromProject = await fastGlob(
    envFileNames.map((name) => `**/${name}`),
    {
      cwd: resolvePath(projectRoot),
      ignore: ['**/node_modules/**'],
    },
  );

  const mappedFilesFromProject = filesFromProject.map((filePath) =>
    projectFilePathToConfigFileName(filePath, envFileName),
  );

  const filesFromConfig = await fastGlob(
    envFileNames.map((name) => `*${name}`),
    { cwd: resolvePath(configRoot, envName) },
  );

  const allFiles = [
    ...new Set([...mappedFilesFromProject, ...filesFromConfig]),
  ].sort();

  if (allFiles.length === 0) {
    logger.warn('No env files found');
  }

  return allFiles.map((dotenvnavFileName) => ({
    projectPath: resolvePath(
      projectRoot,
      configFileNameToProjectFilePath(dotenvnavFileName, envFileName),
    ),
    dotenvnavFileName,
  }));
};
