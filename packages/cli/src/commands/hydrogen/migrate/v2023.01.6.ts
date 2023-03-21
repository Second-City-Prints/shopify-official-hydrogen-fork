import {path, file} from '@shopify/cli-kit';
import url from 'url';
import {commonFlags} from '../../../utils/flags.js';
import {transform} from '../../../utils/transform.js';
import Command from '@shopify/cli-kit/node/base-command';
import {AbortError} from '@shopify/cli-kit/node/error';
import Listr from 'listr';

export type TransformOptions = {};

interface MigrateOptions {
  path: string;
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
    // @ts-ignore
    const {flags, args} = await this.parse(Migrate);
    const directory = flags.path ? path.resolve(flags.path) : process.cwd();

    const tasks = [
      {
        title: 'Running test migration',
        task: async () => {
          await transform(
            path.join(
              __dirname,
              '../../../utils/transforms/',
              'reverseEverything.js',
            ),
            {path: directory},
          );
        },
      },
    ];

    const list = new Listr(tasks);

    await list.run();
  }
}
