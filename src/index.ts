#!/usr/bin/env tsx

import yargs from "yargs";
import log from "loglevel";
import { checkEnv } from "./lib/validators";
import { init } from "./commands/init";
import { cloneEnv } from "./commands/cloneEnv";
import { listEnvs } from "./commands/listEnvs";
import { resolvePath } from "./lib/fsUtils";
import { listEnvFiles } from "./commands/listEnvFiles";
import { restore } from "./commands/restore";
import { useEnv } from "./commands/useEnv";

log.setLevel("INFO");

await yargs(process.argv.slice(2))
  .option("project-root", {
    alias: "r",
    type: "string",
    description: "Path to the root directory of your project",
    normalize: true,
    default: process.cwd(),
  })
  .option("config-root", {
    alias: "c",
    type: "string",
    description: "Path to the config root directory",
    default: "~/.dotenvnav",
    normalize: true,
    coerce: (path) => resolvePath(path),
  })
  .option("env-file-name", {
    alias: "f",
    type: "string",
    array: true,
    description: "Name of the env file",
    default: ".env.local",
  })
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Verbose",
    default: false,
  })
  .middleware((argv) => {
    if (argv["verbose"]) {
      log.setLevel("DEBUG");
    }
  })
  .command(
    "init [env-name]",
    "Initialize env variable links into a new directory",
    (yargs) =>
      yargs
        .option("override-existing", {
          alias: "o",
          type: "boolean",
          description: "Override existing symlinks",
          default: false,
        })
        .positional("env-name", {
          alias: "e",
          type: "string",
          description: "Name of the environment",
          default: "default",
        }),
    (argv) => init(argv),
  )
  .command(
    "restore [env-name]",
    "Restore env variables from a directory",
    (yargs) =>
      yargs.positional("env-name", {
        alias: "e",
        type: "string",
        description: "Name of the environment",
        default: "default",
      }),
    (argv) => restore(argv),
  )
  .command(
    "clone-env <fromEnvName> <toEnvName>",
    "Clone an environment",
    (yargs) =>
      yargs
        .positional("from-env-name", {
          type: "string",
          description: "Name of the environment to clone from",
          demandOption: true,
        })
        .positional("to-env-name", {
          type: "string",
          description: "Name of the environment to clone to",
          demandOption: true,
        })
        .option("override-existing", {
          alias: "o",
          type: "boolean",
          description: "Override existing env",
          default: false,
        })
        .check((argv) => checkEnv(argv["from-env-name"], argv["config-root"])),
    (argv) => cloneEnv(argv),
  )
  .command(
    "list-envs",
    "List all available environments",
    () => undefined,
    (argv) => listEnvs(argv),
  )
  .command(
    "list-env-files [env-name]",
    "List all dotenv files under the project root",
    (yargs) =>
      yargs.positional("env-name", {
        type: "string",
        description: "Name of the environment",
        default: "default",
      }),
    (argv) => listEnvFiles(argv),
  )
  .command(
    ["use-env <envName>", "env <envName>", "use <envName>", "$0 <envName>"],
    "Use an environment",
    (yargs) =>
      yargs
        .positional("env-name", {
          type: "string",
          description: "Name of the environment",
          demandOption: true,
        })
        .alias("env-name", "e")
        .check((argv) => checkEnv(argv["env-name"], argv["config-root"])),
    (argv) => useEnv(argv),
  )
  .strict()
  .demandCommand()
  .version(false)
  .help()
  .parse();
