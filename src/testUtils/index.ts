import { parser } from '../cli';
import { METADATA_FILE_NAME } from '../consts';
import { getProjectName } from '../lib/commonUtils';

export const runCommand = async (
  command: string,
  options: Record<string, string | number | boolean>,
) => {
  const args = [
    command,
    ...Object.entries(options).map(([key, value]) => `--${key}=${value}`),
  ].join(' ');

  return parser.parse(args);
};

export const createMockMetadataFile = (
  projectRoot: string,
): Record<string, string> => ({
  [METADATA_FILE_NAME]: JSON.stringify(
    { projects: { [getProjectName(projectRoot)]: projectRoot } },
    null,
    2,
  ),
});
