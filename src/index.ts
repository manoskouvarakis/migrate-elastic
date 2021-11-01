#!/usr/bin/env node

import yargs = require('yargs');
import { up } from './handlers/reindex';
import { init } from './handlers/init';
import { create } from './handlers/create';

yargs
  .command(
    'init',
    'Initialize configuration',
    (yargs: yargs.Argv) => {
      yargs.option('port', {
        describe: 'Port to bind on',
        default: '5000'
      });
    },
    async (args: any) => {
      if (args.verbose) {
        console.info('Starting the server...');
      }
      await init();
    }
  )
  .command(
    'create',
    'Create new migration',
    (yargs: yargs.Argv) => {
      yargs.option('name', {
        describe: 'Migration name',
        default: `new_migration`
      });
    },
    async (args: any) => {
      if (args.verbose) {
        console.info('Creating new migration');
      }
      await create(args.name);
    }
  )
  .command(
    'up',
    'Execute migrations',
    (yargs: yargs.Argv) => {},
    async (args: any) => {
      if (args.verbose) {
        console.info('Executing migration');
      }
      await up();
    }
  )
  .help().argv;
