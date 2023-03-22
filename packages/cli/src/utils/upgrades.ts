import {output, path, file} from '@shopify/cli-kit';
import {renderInfo, renderSuccess} from '@shopify/cli-kit/node/ui';
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

        const changed = Array.from(results.entries())
          .filter(([_, result]) => result.state === 'changed')
          .map(([filename, result]) => ({
            ...result,
            filename,
            pathname: path.relative(directory, filename),
          }));

        for (const {pathname, filename, after, diff} of changed) {
          if (options.dry) {
            renderInfo({
              headline: pathname,
              body: output.content`${output.token.linesDiff(diff)}`.value,
            });
          } else {
            await file.write(filename, after);
          }
        }

        if (options.dry) {
          return;
        }

        renderSuccess({
          headline: `${changed.length} files changed`,
          body: {
            list: {
              items: changed
                .filter(Boolean)
                .map(({state, pathname}) => `[${state}] ${pathname}`),
            },
          },
        });
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
