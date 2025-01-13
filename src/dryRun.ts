import mock from 'mock-fs';
import { exists } from './lib/fsUtils';

export const initDryRun = async ({
  metadataFilePath,
  projectRoot,
}: {
  metadataFilePath: string;
  projectRoot: string;
}) => {
  const mapPathToObject = (p: string, v: ReturnType<typeof mock.load>) =>
    p
      .split('/')
      .map((part) => (part === '' ? '/' : part))
      .reduceRight(
        (acc, key) => ({ [key]: acc }),
        v as Record<string, unknown>,
      ) as Record<string, ReturnType<typeof mock.load>>;

  const mockLoad = async (p: string) =>
    (await exists(p)) ? mapPathToObject(p, mock.load(p, { lazy: false })) : {};

  mock({
    ...(await mockLoad(metadataFilePath)),
    ...(await mockLoad(projectRoot)),
  });
};
