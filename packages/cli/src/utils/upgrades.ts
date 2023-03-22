import {renderInfo} from '@shopify/cli-kit/node/ui';
import {applyTransform, type Transform} from './transform.js';

interface Changeset {
  before?: string;
  description?: string;
  filename?: string;
  title: string;
}

export function runChangesets(changes: [Changeset, Transform[] | Transform][]) {
  const tasks = changes.map(([changeset, transform]) => {
    const {title = '', before = '', filename = ''} = changeset;

    return {
      title,
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
