import { copy } from 'fs-extra';
import { nowAsString, shouldExist, resolveMigrationsDirPath, getIndexName } from '../helpers';
import * as path from 'path';
import { connect, createIndex, exists, save } from '../elastic';
import moment = require('moment');

const migrationsIndexMapping = {
  dynamic: 'false',
  properties: {
    name: {
      type: 'keyword'
    },
    status: {
      type: 'keyword'
    },
    created_at: {
      type: 'date'
    },
    updated_at: {
      type: 'date'
    }
  }
};

const migrationsIndexSettings = {
  number_of_shards: 1,
  number_of_replicas: 0
};

export async function create(description) {
  if (!description) {
    throw new Error('Missing parameter: description');
  }

  await shouldExist();
  const migrationsDirPath = await resolveMigrationsDirPath();

  const source = path.join(__dirname, '../../samples/migration.json');

  const filename = `${nowAsString()}-${description.split(' ').join('_')}.json`;
  const destination = path.join(migrationsDirPath, filename);
  await copy(source, destination);

  const client = connect();
  const indexName = getIndexName();
  const indexAlreadyExists = await exists(client, indexName);
  if (!indexAlreadyExists) {
    console.log('Migrations index does not exist. Creating');
    await createIndex(client, indexName, migrationsIndexMapping, migrationsIndexSettings);
  }

  const momentDate = moment(Date.now());

  await save(client, indexName, {
    name: filename,
    status: 'pending',
    created_at: momentDate.toISOString(),
    updated_at: momentDate.toISOString()
  });

  return filename;
}
