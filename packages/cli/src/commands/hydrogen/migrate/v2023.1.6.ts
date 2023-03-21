import {path, file} from '@shopify/cli-kit';
import url from 'url';
import {commonFlags} from '../../../utils/flags.js';
import Command from '@shopify/cli-kit/node/base-command';
import {format, resolveFormatConfig} from '../../../utils/transpile-ts.js';
import type {Collection} from 'jscodeshift';
import j from 'jscodeshift';
import Listr from 'listr';

type Transform = (
  j: j.JSCodeshift,
  source: Collection<any>,
  sourcePath: string,
) => string;

interface Change {
  before?: string;
  after?: string;
  description?: string;
  filename?: string;
}

interface Result {
  source: string;
  state: 'changed' | 'unchanged';
}

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// @ts-ignore
export default class Migrate extends Command {
  static description =
    'Apply migration steps to upgrade a Hydrogen storefront.';
  static flags = {
    path: commonFlags.path,
  };

  async run(): Promise<void> {
    const {flags} = await this.parse(Migrate);
    const directory = flags.path ? path.resolve(flags.path) : process.cwd();
    const migrations = await v2023_1_6(directory);

    await new Listr(migrations, {concurrent: true}).run();
  }
}

const transformer: Transform = (j, source) => {
  return source
    .find(j.Identifier)
    .forEach((path) => {
      j(path).replaceWith(
        j.identifier(path.node.name.split('').reverse().join('')),
      );
    })
    .toSource();
};

export function applyTransform(
  transform: Transform[] | Transform,
  {
    source,
    filename,
  }: {
    source: string;
    filename: string;
  },
): Result {
  const transforms = Array.isArray(transform) ? transform : [transform];

  let newSource = source;

  for (const t of transforms) {
    newSource = t(j, j(newSource), filename) || newSource;
  }

  return {
    source: newSource,
    state: source === newSource ? 'unchanged' : 'changed',
  };
}

interface Options {
  directory: string;
}

export const v2023_1_6 = async (directory: string) => {
  return runChangesets([
    [
      {
        description: 'Adding import for getStorefrontHeaders to server.ts',
        before: await file.read(path.join(directory, 'server.ts')),
        filename: 'server.ts',
      },
      transformer,
    ],
  ]);
};

function runChangesets(changes: [Change, Transform[] | Transform][]) {
  let results: Result[] = [];
  const tasks: Listr.ListrTask[] = changes.map(([changeset, transform]) => {
    const {before = '', after = '', filename = ''} = changeset;

    return {
      title: filename,
      task: async () => {
        results.push(
          applyTransform(transform, {
            source: before,
            filename,
          }),
        );
      },
    };
  });

  tasks.push({
    title: 'Formatting',
    task: async () => {
      // const formattedContent = await format(
      //   await file.read(serverTsPath),
      //   await resolveFormatConfig(serverTsPath),
      //   serverTsPath,
      // );
      // await file.write(serverTsPath, formattedContent);
    },
  });

  return tasks;
}
