import path from 'node:path';

import { z } from 'zod';

import { TCommonOptionsCamelCase } from '../cli';

import { readFileContent, writeFile } from './fsUtils';

const metadataFileSchema = z.object({
  projectRoot: z.string(),
});

export type MetadataFile = z.infer<typeof metadataFileSchema>;

export const createMetadataFile = async ({
  configRoot,
  projectRoot,
  metadataFileName,
}: TCommonOptionsCamelCase) => {
  const metadata: MetadataFile = { projectRoot };
  await writeFile(
    path.join(configRoot, metadataFileName),
    JSON.stringify(metadata, null, 2),
  );
};

export const readMetadataFile = async ({
  configRoot,
  metadataFileName,
}: TCommonOptionsCamelCase): Promise<MetadataFile> => {
  const fileContent = await readFileContent(
    path.join(configRoot, metadataFileName),
  );
  return metadataFileSchema.parse(JSON.parse(fileContent));
};
