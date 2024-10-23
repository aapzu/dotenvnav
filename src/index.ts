#!/usr/bin/env node

import { parser } from './cli';

await parser.parseAsync();
