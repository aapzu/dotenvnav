# dotenvnav

A utility tool to store your project's local `.env` files in a single place, symlink them back to the project and change them to a different set of files with a single command.

## Getting started

```sh
npx @aapzu/dotenvnav init
```

## Creating a new environment
Symlinks all found `.env*` files into the config directory

```sh
npx @aapzu/dotenvnav clone-env default new-env
```

## Using an environment
```sh
npx @aapzu/dotenvnav env new-env
```

## Restoring old files
Removes all symlinks and restores the values of the config files
```sh
npx @aapzu/dotenvnav restore
```

## Print all commands and options

```sh
npx dotenvnav [command] --help
```
