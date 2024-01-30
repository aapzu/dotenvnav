import { createCommandModule } from '../lib/createCommandModule';
import {
  copy,
  createIfNotExists,
  getFiles,
  resolvePath,
  runActionWithBackup,
} from '../lib/fsUtils';
import { logger } from '../lib/logger';
import { checkEnv } from '../lib/validators';

const cloneEnvCommand = createCommandModule({
  command: 'clone-env <fromEnvName> <toEnvName>',
  aliases: ['clone'],
  describe: 'Clone an environment',
  builder: (yargs) =>
    yargs
      .positional('from-env-name', {
        type: 'string',
        description: 'Name of the environment to clone from',
        demandOption: true,
      })
      .positional('to-env-name', {
        type: 'string',
        description: 'Name of the environment to clone to',
        demandOption: true,
      })
      .option('override-existing', {
        alias: 'o',
        type: 'boolean',
        description: 'Override existing env',
        default: false,
      })
      .check((argv) => checkEnv(argv['from-env-name'], argv['config-root'])),
  handler: async ({ configRoot, fromEnvName, toEnvName, overrideExisting }) => {
    const absoluteFrom = resolvePath(configRoot, fromEnvName);
    const absoluteTo = resolvePath(configRoot, toEnvName);

    logger.info(`Cloning environment ${fromEnvName} to ${toEnvName}`);

    await createIfNotExists(absoluteTo);

    const files = await getFiles(absoluteFrom);

    await runActionWithBackup(async () => {
      for (const file of files) {
        const configFileAbsolutePath = resolvePath(absoluteFrom, file);
        const newConfigFileAbsolutePath = resolvePath(absoluteTo, file);

        const commonOpts = { overrideExisting, backup: false };

        await copy(configFileAbsolutePath, newConfigFileAbsolutePath, {
          ...commonOpts,
        });
      }
    }, files);

    logger.info('Environment cloned');
  },
});

export default cloneEnvCommand;
