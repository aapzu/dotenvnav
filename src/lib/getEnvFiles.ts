import { resolve } from 'node:path';

import fastGlob from 'fast-glob';

import type { TCommonOptionsCamelCase } from '../cli';
import { getConfigDirectoryWithEnv, getConfigFilePath } from './commonUtils';
import { getFiles } from './fsUtils';
import { logger } from './logger';

type TEnvFileObject = {
  projectPath: string;
  configDirPath: string;
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

const configFileNameToProjectFilePath = (configFileName: string) =>
  configFileName.replace(/__/g, '/').replace(/^root(\.\w+)/, '$1');

type TGetEnvFilesFromProjectDirOpts = Pick<
  TCommonOptionsCamelCase,
  'projectRoot' | 'configRoot' | 'envFileName'
> & {
  envName: string;
  ignore?: string[];
};

export const getEnvFilesFromProjectDir = async ({
  configRoot,
  envFileName,
  projectRoot,
  envName,
  ignore = ['**/node_modules/**'],
}: TGetEnvFilesFromProjectDirOpts): Promise<Array<TEnvFileObject>> => {
  const envFileNames = Array.isArray(envFileName) ? envFileName : [envFileName];

  const filesFromProject = await fastGlob(
    envFileNames.map((name) => `**/${name}`),
    {
      cwd: resolve(projectRoot),
      ignore,
      followSymbolicLinks: true,
    },
  );

  const mappedFilesFromProject = filesFromProject.map((filePath) =>
    projectFilePathToConfigFileName(filePath, envFileName),
  );

  if (mappedFilesFromProject.length === 0) {
    logger.warn('No env files found');
  }

  return mappedFilesFromProject.sort().map((dotenvnavFileName) => ({
    projectPath: resolve(
      projectRoot,
      configFileNameToProjectFilePath(dotenvnavFileName),
    ),
    configDirPath: getConfigFilePath(dotenvnavFileName, {
      configRoot,
      projectRoot,
      envName,
    }),
  }));
};

export type TGetEnvFilesFromConfigDirOpts = Pick<
  TCommonOptionsCamelCase,
  'projectRoot' | 'configRoot' | 'envFileName'
> & {
  envName: string;
};

export const getEnvFilesFromConfigDir = async ({
  projectRoot,
  configRoot,
  envName,
}: TGetEnvFilesFromConfigDirOpts): Promise<Array<TEnvFileObject>> => {
  const configDirectory = getConfigDirectoryWithEnv({
    projectRoot,
    configRoot,
    envName,
  });
  const filesFromConfig = await getFiles(configDirectory);

  return filesFromConfig.sort().map((dotenvnavFileName) => ({
    projectPath: resolve(
      projectRoot,
      configFileNameToProjectFilePath(dotenvnavFileName),
    ),
    configDirPath: getConfigFilePath(dotenvnavFileName, {
      configRoot,
      projectRoot,
      envName,
    }),
  }));
};
