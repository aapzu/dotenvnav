import path from 'node:path';

import type { TCommonOptionsCamelCase } from '../cli';

export const getProjectName = (projectRoot: string) =>
  path.basename(projectRoot);

export const getConfigDirectory = ({
  configRoot,
  projectRoot,
}: Pick<TCommonOptionsCamelCase, 'configRoot' | 'projectRoot'>) =>
  path.join(configRoot, getProjectName(projectRoot));

export const getConfigDirectoryWithEnv = ({
  configRoot,
  projectRoot,
  envName,
}: Pick<TCommonOptionsCamelCase, 'configRoot' | 'projectRoot'> & {
  envName: string;
}) => path.join(getConfigDirectory({ configRoot, projectRoot }), envName);

export const getConfigFilePath = (
  configFileName: string,
  {
    configRoot,
    projectRoot,
    envName,
  }: Pick<TCommonOptionsCamelCase, 'configRoot' | 'projectRoot'> & {
    envName: string;
  },
) =>
  path.join(
    getConfigDirectoryWithEnv({ configRoot, projectRoot, envName }),
    configFileName,
  );
