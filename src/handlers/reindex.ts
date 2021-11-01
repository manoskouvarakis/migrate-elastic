import moment = require('moment');
import { connect, createIndex, reindex, getTask, search, save } from '../elastic';
import { getIndexName, loadMigration } from '../helpers';

export async function up() {
  const client = connect();

  const searchRequest = {
    query: {
      term: {
        status: {
          value: 'pending'
        }
      }
    },
    sort: [
      {
        created_at: {
          order: 'asc'
        }
      }
    ]
  };

  const migrationsIndexName = getIndexName();

  const pendingMigrations = await search(migrationsIndexName, searchRequest);

  if (pendingMigrations.hits.hits.length === 0) {
    console.log(`There aren't any pending migrations`);
    return;
  }

  const migrationDocument = pendingMigrations.hits.hits[0]._source;

  const migration = await loadMigration(migrationDocument.name);
  const { sourceIndex, targetIndex, mappings, settings, script } = migration;

  await createIndex(client, targetIndex, mappings, settings);

  if (!sourceIndex) {
    await updateMigrationStatus(client, migrationDocument.name, 'finished');
    console.log(`Source index does not exist. Only created the target: ${targetIndex}`);
    return;
  }

  console.log(`Start reindexing from: ${sourceIndex} to: ${targetIndex}`);

  const taskId = await reindex(client, sourceIndex, targetIndex, script);

  let delayInMs = 2000;
  let taskCondition = await getTask(client, taskId);
  while (!taskCondition.body.completed) {
    await delay(delayInMs);
    taskCondition = await getTask(client, taskId);
  }

  await updateMigrationStatus(client, migrationDocument.name, 'finished');

  console.log(`Finished reindexing from: ${sourceIndex} to: ${targetIndex}`);
  console.log(`Task: ${JSON.stringify(taskCondition)}`);
}

async function updateMigrationStatus(client, name, status) {
  const momentDate = moment(Date.now());
  await save(client, getIndexName(), {
    name,
    status,
    updated_at: momentDate.toISOString()
  });
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
