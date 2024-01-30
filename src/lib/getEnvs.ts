import { getFiles } from './fsUtils';

export const getEnvs = async ({ configRoot }: { configRoot: string }) => {
  return getFiles(configRoot);
};
