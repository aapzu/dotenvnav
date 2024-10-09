// Copied from yargs/build/lib/parse-command.js
type Positional = {
  cmd: string[];
  variadic: boolean;
};
export type TParsedCommand = {
  cmd: string;
  demanded: Positional[];
  optional: Positional[];
};
export function parseCommand(cmd: string) {
  const extraSpacesStrippedCommand = cmd.replace(/\s{2,}/g, ' ');
  const splitCommand = extraSpacesStrippedCommand.split(/\s+(?![^[]*]|[^<]*>)/);
  const bregex = /\.*[\][<>]/g;
  const firstCommand = splitCommand.shift();
  if (!firstCommand) throw new Error(`No command found in: ${cmd}`);
  const parsedCommand: TParsedCommand = {
    cmd: firstCommand.replace(bregex, ''),
    demanded: [],
    optional: [],
  };
  splitCommand.forEach((cmd, i) => {
    let variadic = false;
    // biome-ignore lint/style/noParameterAssign: from yargs
    cmd = cmd.replace(/\s/g, '');
    if (/\.+[\]>]/.test(cmd) && i === splitCommand.length - 1) variadic = true;
    if (/^\[/.test(cmd)) {
      parsedCommand.optional.push({
        cmd: cmd.replace(bregex, '').split('|'),
        variadic,
      });
    } else {
      parsedCommand.demanded.push({
        cmd: cmd.replace(bregex, '').split('|'),
        variadic,
      });
    }
  });
  return parsedCommand;
}
