import path from 'node:path';

import { z } from 'zod';

import { TCommonOptionsCamelCase } from '../cli';
import { METADATA_FILE_NAME } from '../consts';

import { exists, readFileContent, writeFile } from './fsUtils';
import { logger } from './logger';
import { getProjectName } from './commonUtils';

const metadataFileSchema = z
  .object({
    projects: z.record(z.string(), z.string()),
  })
  .strict();

export type MetadataFile = z.infer<typeof metadataFileSchema>;

export const getMetadataFilePath = (configRoot: string) =>
  path.join(configRoot, METADATA_FILE_NAME);

export const upsertMetadataFile = async ({
  configRoot,
  projectRoot,
}: Pick<TCommonOptionsCamelCase, 'configRoot' | 'projectRoot'>) => {
  const currentMetadataFile = (await exists(getMetadataFilePath(configRoot)))
    ? await readMetadataFile({ configRoot })
    : undefined;
  const metadata: MetadataFile = {
    projects: {
      ...(currentMetadataFile?.projects ?? {}),
      [getProjectName(projectRoot)]: projectRoot,
    },
  };
  logger.debug('Creating or updating the metadata file');
  await writeFile(
    getMetadataFilePath(configRoot),
    JSON.stringify(metadata, null, 2),
  );
};

export const readMetadataFile = async ({
  configRoot,
}: Pick<TCommonOptionsCamelCase, 'configRoot'>): Promise<MetadataFile> => {
  const fileContent = await readFileContent(getMetadataFilePath(configRoot));
  let parsedMetadataFile: unknown;
  try {
    parsedMetadataFile = JSON.parse(fileContent);
  } catch (error) {
    throw new Error('Invalid JSON in metadata file');
  }
  try {
    return metadataFileSchema.parse(parsedMetadataFile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid metadata file: ${JSON.stringify(error.format(), null, 2)}`,
      );
    }
    throw error;
  }
};

type TValidateMetadataFileOptions = Pick<
  TCommonOptionsCamelCase,
  'configRoot' | 'projectRoot'
> & { allowNotExists?: boolean };

export const validateMetadataFile = async ({
  configRoot,
  projectRoot,
  allowNotExists,
}: TValidateMetadataFileOptions) => {
  const metadataFilePath = getMetadataFilePath(configRoot);
  if (!(await exists(metadataFilePath))) {
    if (allowNotExists) {
      logger.debug('No metadata file found');
      return;
    }
    throw new Error(
      `Metadata file not found in ${metadataFilePath}. Please run 'init' first.`,
    );
  }
  const metadataFileContent = await readMetadataFile({ configRoot });
  const projectName = getProjectName(projectRoot);
  const initializedWithProjectRoot = metadataFileContent.projects[projectName];
  if (!initializedWithProjectRoot) {
    if (allowNotExists) {
      return;
    }
    throw new Error(
      `The project ${projectName} was not initialized. Please run 'init' first.`,
    );
  }
  if (initializedWithProjectRoot !== projectRoot) {
    throw new Error(
      `The project ${projectName} was initialized using different project root (${initializedWithProjectRoot}). Refusing to proceed.`,
    );
  }
};
