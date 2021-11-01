import { Client } from '@elastic/elasticsearch';
import { getUrl } from './helpers';
import { identity, pickBy } from 'lodash';

export function connect() {
  const url = getUrl();
  const client = new Client({ node: url });
  return client;
}

export async function exists(client: Client, index: string) {
  const result = await client.indices.exists({ index });
  return result.body;
}

export async function createIndex(client: Client, indexName: string, mappings, settings) {
  console.log('Create started');

  await client.indices.create({
    index: indexName,
    body: {
      settings,
      mappings
    }
  });

  console.log('Create finished');
}

export async function reindex(client, sourceIndex, targetIndex, script) {
  const body = pickBy(
    {
      source: {
        index: sourceIndex
      },
      dest: {
        index: targetIndex
      },
      script
    },
    identity
  );

  const response = await client.reindex({
    waitForCompletion: false,
    refresh: true,
    body
  });

  return response.body.task;
}

export async function getTask(client, taskId) {
  const task = await client.tasks.get({
    task_id: taskId
  });
  return task;
}

export async function save(client, index, body, id = body.name) {
  const res = await client.index({ index, id, body });
  return res.body;
}

export async function search(index, body) {
  const client = connect();
  const searchRequest = {
    index,
    body: { ...body }
  };
  const res = await client.search(searchRequest);
  return res.body;
}
