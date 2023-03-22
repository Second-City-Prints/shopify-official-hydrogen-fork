import {output, path, file} from '@shopify/cli-kit';
import {applyTransform, type Transform} from './transform.js';
import fs from 'node:fs';
import glob from 'fast-glob';

interface Changeset {
  before: string;
  after: string;
  description: string;
  filename: string;
  title: string;
}

export async function runChangesets(
  directory: string,
  changes: Changeset[],
  transforms: Transform[] | Transform,
  options: {
    dry?: boolean;
    silent?: boolean;
  } = {},
) {
  const files = await glob(path.join(directory, '/**/*.{js,ts,tsx,jsx}'), {
    ignore: ['**/node_modules/**', '**/dist/**'],
  });

  const tasks = changes.map((changeset) => {
    const {title = '', description = ''} = changeset;

    return {
      title,
      task: async () => {
        const results = await applyTransform(transforms, files);
        if (!options.silent) output.info(description);

        for (const result of results) {
          switch (result.state) {
            case 'unchanged':
              if (!options.silent) output.info(`Unchanged ${result.filename}`);
              break;
            case 'changed':
              output.info(`Changed ${result.filename}`);

              if (options.dry) {
                output.info('Before:');
                output.info(result.before);
                output.info('After:');
                output.info(result.after);
              }

              if (!options.dry) {
                await file.write(result.filename, result.after);
              }
          }
        }
      },
    };
  });

  return tasks;
}

export function parseUpgradeGuide(root: string): Changeset[] {
  const markdown = fs.readFileSync(new URL('./upgrade-guide.md', root), 'utf8');
  const samples = markdown
    .split(/^## /gm)
    .slice(1)
    .map((block: string) => {
      const lines = block.split('\n');
      const title = lines[0] || '';

      const descriptionEnd = lines.findIndex((line) => line.startsWith('###'));
      const description = lines.slice(1, descriptionEnd).join('\n');

      const filename = /### In file `(.+)`/.exec(block);
      const before = /```(js|jsx|ts|tsx) before\n([^]*?)\n```/.exec(block);
      const after = /```(js|jsx|ts|tsx) after\n([^]*?)\n```/.exec(block);
      return {
        title,
        description,
        before: before && before[2] ? before[2] : '',
        after: after && after[2] ? after[2] : '',
        filename: filename && filename[1] ? filename[1] : '',
      };
    });

  return samples;
}
