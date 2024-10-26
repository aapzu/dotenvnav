import path from 'node:path';
import { readMetadataFile } from './metadataFile';

export const getProjectName = (projectRoot: string) =>
  path.basename(projectRoot);

export const getConfigDirectory = ({
  configRoot,
  projectRoot,
}: {
  configRoot: string;
  projectRoot: string;
}) => path.join(configRoot, getProjectName(projectRoot));

export const getConfigDirectoryWithEnv = ({
  envName,
  ...getConfigDirectoryOpts
}: {
  configRoot: string;
  projectRoot: string;
  envName: string;
}) => path.join(getConfigDirectory(getConfigDirectoryOpts), envName);

export const getConfigDirectoryFromMetadataFile = async ({
  metadataFilePath,
  projectRoot,
  envName,
}: {
  metadataFilePath: string;
  projectRoot: string;
  envName: string;
}) => {
  const { configRoot } = await readMetadataFile(metadataFilePath);

  return getConfigDirectoryWithEnv({
    configRoot,
    projectRoot,
    envName,
  });
};

export const getConfigFilePath = (
  configFileName: string,
  opts: {
    configRoot: string;
    projectRoot: string;
    envName: string;
  },
) => path.join(getConfigDirectoryWithEnv(opts), configFileName);

export const getConfigFilePathFromMetadataFile = async (
  configFileName: string,
  opts: {
    metadataFilePath: string;
    projectRoot: string;
    envName: string;
  },
) => {
  const { configRoot } = await readMetadataFile(opts.metadataFilePath);

  return getConfigFilePath(configFileName, {
    configRoot,
    projectRoot: opts.projectRoot,
    envName: opts.envName,
  });
};
