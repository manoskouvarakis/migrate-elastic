import { copy, mkdirs } from 'fs-extra';
import * as path from 'path';

function copySampleConfigFile() {
  const source = path.join(__dirname, '../../samples/migrate-elastic-config.json');
  const destination = path.join(process.cwd(), 'migrate-elastic-config.json');
  return copy(source, destination);
}

function createMigrationsDirectory() {
  return mkdirs(path.join(process.cwd(), 'migrations'));
}

export async function init() {
  await copySampleConfigFile();
  createMigrationsDirectory();
}
