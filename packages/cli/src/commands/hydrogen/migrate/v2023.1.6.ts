import {path, file} from '@shopify/cli-kit';
import url from 'url';
import {commonFlags} from '../../../utils/flags.js';
import {transform} from '../../../utils/transform.js';
import Command from '@shopify/cli-kit/node/base-command';
import {format, resolveFormatConfig} from '../../../utils/transpile-ts.js';
import Listr from 'listr';

export type TransformOptions = {};

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
        title: 'Adding import for getStorefrontHeaders to server.ts',
        task: async () => {
          await transform(
            path.join(
              __dirname,
              '../../../utils/transforms/',
              'insertGetStorefrontHeadersImport.js',
            ),
            {path: directory},
          );
        },
      },
      {
        title: 'Modifying createStorefrontClient to use getStorefrontHeaders',
        task: async () => {
          await transform(
            path.join(
              __dirname,
              '../../../utils/transforms/',
              'createStorefrontClient.js',
            ),
            {path: directory},
          );
        },
      },
      {
        title: 'Formatting server.ts',
        task: async () => {
          const serverTsPath = path.join(directory, 'server.ts');
          const formattedContent = await format(
            await file.read(serverTsPath),
            await resolveFormatConfig(serverTsPath),
            serverTsPath,
          );

          await file.write(serverTsPath, formattedContent);
        },
      },
    ];

    const list = new Listr(tasks);

    await list.run();
  }
}
