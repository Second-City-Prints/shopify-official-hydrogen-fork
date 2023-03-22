import Command from '@shopify/cli-kit/node/base-command';
import {path} from '@shopify/cli-kit';
import Flags from '@oclif/core/lib/flags.js';
import {commonFlags} from '../../utils/flags.js';
import {v2023_1_6} from '../../upgrades/v2023.1.6/v2023.1.6.js';

const VERSIONS = ['2023.1.6'];

// @ts-ignore
export default class Upgrade extends Command {
  static description =
    'Apply steps to upgrade a Hydrogen storefront to a new version.';
  static flags = {
    path: commonFlags.path,
    silent: Flags.boolean({
      name: 'verbose',
      description: `Output more information about the upgrade process.`,
      env: 'SHOPIFY_HYDROGEN_FLAG_VERBOSE',
    }),
    dry: Flags.boolean({
      name: 'dry',
      description: `Don't actually make any changes.`,
      env: 'SHOPIFY_HYDROGEN_FLAG_DRY',
    }),
  };

  static args = [
    {
      name: 'version',
      description: `The version to upgrade to.`,
      required: true,
      options: VERSIONS,
      env: 'SHOPIFY_HYDROGEN_ARG_VERSION',
      default: VERSIONS.at(-1),
    },
  ];

  async run(): Promise<void> {
    const {flags, args} = await this.parse(Upgrade);
    const directory = flags.path ? path.resolve(flags.path) : process.cwd();

    let migrations;

    switch (args.version) {
      case '2023.1.6':
        migrations = await v2023_1_6(directory, flags);
        break;
      default:
        throw new Error(`Unknown version ${args.version}`);
    }

    await migrations.run();
  }
}
