import { format } from 'date-fns';
import { stat } from 'fs-extra';
import * as path from 'path';

const DEFAULT_MIGRATIONS_DIR_NAME = 'migrations';

const now = (dateString = Date.now()) => {
  const date = new Date(dateString);
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds()
  );
};

export function nowAsString() {
  return format(now(), 'yyyyMMddHHmmss');
}

export function getUrl() {
  const configContent = require('../migrate-elastic-config.json');
  if (!configContent) throw new Error("'init' should be called first");

  return configContent.elastic.url;
}

export function getIndexName() {
  const configContent = require('../migrate-elastic-config.json');
  if (!configContent) throw new Error("'init' should be called first");

  return configContent.changelogIndexName;
}

export async function resolveMigrationsDirPath() {
  let migrationsDir;
  try {
    const configContent = require('../migrate-elastic-config.json');
    migrationsDir = configContent.migrationsDir; // eslint-disable-line
    // if config file doesn't have migrationsDir key, assume default 'migrations' dir
    if (!migrationsDir) {
      migrationsDir = DEFAULT_MIGRATIONS_DIR_NAME;
    }
  } catch (err) {
    // config file could not be read, assume default 'migrations' dir
    migrationsDir = DEFAULT_MIGRATIONS_DIR_NAME;
  }

  if (path.isAbsolute(migrationsDir)) {
    return migrationsDir;
  }
  return path.join(process.cwd(), migrationsDir);
}

export async function shouldExist() {
  const migrationsDir = await resolveMigrationsDirPath();
  try {
    await stat(migrationsDir);
  } catch (err) {
    throw new Error(`migrations directory does not exist: ${migrationsDir}`);
  }
}

export async function loadMigration(fileName) {
  const migrationsDir = await resolveMigrationsDirPath();
  return require(path.join(migrationsDir, fileName)); // eslint-disable-line
}
