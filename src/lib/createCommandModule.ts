import { CommandModule } from 'yargs';

import type { TRootOptions } from '..';

export const createCommandModule = <U>(
  module: CommandModule<TRootOptions, U>,
) => module;
