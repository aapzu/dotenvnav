import path from 'node:path';
import { readMetadataFile } from './metadataFile';

export const getProjectName = (projectRoot: string) =>
  path.basename(projectRoot);

export const getConfigDirectory = ({
  configRoot,
  projectRoot,
}: { configRoot: string; projectRoot: string }) =>
  path.join(configRoot, getProjectName(projectRoot));

export const getConfigDirectoryWithEnv = ({
  configRoot,
  projectRoot,
  envName,
}: {
  configRoot: string;
  projectRoot: string;
  envName: string;
}) => path.join(getConfigDirectory({ configRoot, projectRoot }), envName);

export const getConfigFilePath = async (
  configFileName: string,
  {
    metadataFilePath,
    projectRoot,
    envName,
  }: {
    metadataFilePath: string;
    projectRoot: string;
    envName: string;
  },
) => {
  const { configRoot } = await readMetadataFile({ metadataFilePath });
  return path.join(
    getConfigDirectoryWithEnv({ configRoot, projectRoot, envName }),
    configFileName,
  );
};
