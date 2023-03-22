import {applyTransform, type Transform} from './transform.js';

interface Change {
  before?: string;
  after?: string;
  description?: string;
  filename?: string;
}

export function runChangesets(changes: [Change, Transform[] | Transform][]) {
  const tasks = changes.map(([changeset, transform]) => {
    const {before = '', description = '', filename = ''} = changeset;

    return {
      title: description,
      task: async () => {
        await applyTransform(transform, {
          source: before,
          filename,
        });
      },
    };
  });

  return tasks;
}
