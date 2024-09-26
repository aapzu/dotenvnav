import type { TCommonOptionsCamelCase } from '../cli';
import { runActionWithBackup } from './fsUtils';
import {
  type TEnvFileObject,
  getEnvFilesFromConfigDir,
  getEnvFilesFromProjectDir,
} from './getEnvFiles';

type TForEachEnvFileArgs = Pick<
  TCommonOptionsCamelCase,
  'projectRoot' | 'configRoot' | 'envFileName'
> & {
  envName: string;
  getEnvFilesFromProject?: boolean;
  backup?: boolean;
};

export const forEachEnvFile = async (
  callback: (envFile: TEnvFileObject) => Promise<void>,
  { getEnvFilesFromProject, backup = true, ...args }: TForEachEnvFileArgs,
): Promise<void> => {
  const getEnvFilesFn = getEnvFilesFromProject
    ? getEnvFilesFromProjectDir
    : getEnvFilesFromConfigDir;

  const envFiles = await getEnvFilesFn(args);

  await runActionWithBackup(
    () => Promise.all(envFiles.map(callback)),
    envFiles.map(({ projectPath }) => projectPath),
    { skip: !backup },
  );
};
