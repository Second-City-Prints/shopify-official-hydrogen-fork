import Command from '@shopify/cli-kit/node/base-command';
import {path, file} from '@shopify/cli-kit';
import Listr from 'listr';
import type {API, FileInfo, ObjectExpression} from 'jscodeshift';

import {commonFlags} from '../../../utils/flags.js';
import {runChangesets} from '../../../utils/upgrades.js';
import type {Transform} from '../../../utils/transform.js';
import {
  hasImportDeclaration,
  insertImportSpecifier,
  hasImportSpecifier,
  insertImportDeclaration,
  removeImportSpecifier,
} from '../../../utils/imports.js';

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

    await migrations.run();
  }
}

export const v2023_1_6 = async (directory: string) => {
  const tasks = new Listr(
    runChangesets([
      [
        {
          description: 'Adding import for getStorefrontHeaders to server.ts',
          before: await file.read(path.join(directory, 'server.ts')),
          filename: path.join(directory, 'server.ts'),
        },
        [importTransformer, storefrontClientTransfomer],
      ],
    ]),
  );

  return tasks;
};

const importTransformer: Transform = (j, source, sourcePath) => {
  if (!sourcePath.endsWith('server.ts') && !sourcePath.endsWith('server.js')) {
    return source.toSource();
  }

  if (hasImportDeclaration(j, source, '@shopify/remix-oxygen')) {
    if (hasImportSpecifier(j, source, 'getBuyerIp', '@shopify/remix-oxygen')) {
      removeImportSpecifier(j, source, 'getBuyerIp', '@shopify/remix-oxygen');
    }

    if (
      !hasImportSpecifier(
        j,
        source,
        'getStorefrontHeaders',
        '@shopify/remix-oxygen',
      )
    ) {
      insertImportSpecifier(
        j,
        source,
        'getStorefrontHeaders',
        '@shopify/remix-oxygen',
      );
    }
  } else {
    insertImportDeclaration(
      j,
      source,
      'getStorefrontHeaders',
      '@shopify/remix-oxygen',
      '@shopify/hydrogen',
    );
  }

  return source.toSource();
};

const storefrontClientTransfomer: Transform = (j, source, sourcePath) => {
  if (!sourcePath.endsWith('server.ts') && !sourcePath.endsWith('server.js')) {
    return source.toSource();
  }

  source
    .find(j.CallExpression)
    .filter(
      ({node: callExpression}) =>
        callExpression.callee.type === 'Identifier' &&
        callExpression.callee.name === 'createStorefrontClient',
    )
    .forEach((path) => {
      path.node.arguments.forEach((arg) => {
        if (arg.type !== 'ObjectExpression') {
          return;
        }

        const propsToKeep = removePropertiesFromObject(arg, [
          'buyerIp',
          'requestGroupId',
        ]);

        const propsToAdd = propsToKeep.find(
          (prop) =>
            prop.type === 'ObjectProperty' &&
            prop.key.type === 'Identifier' &&
            prop.key.name === 'storefrontHeaders',
        )
          ? []
          : [
              j.objectProperty(
                j.stringLiteral('storefrontHeaders'),
                j.callExpression(j.identifier('getStorefrontHeaders'), [
                  j.identifier('request'),
                ]),
              ),
            ];

        arg.properties = [...propsToKeep, ...propsToAdd];
      });
    });

  return source.toSource();
};

function removePropertiesFromObject(
  objectNode: ObjectExpression,
  propertyKeys: string[],
) {
  return objectNode.properties.filter((property) => {
    if (property.type !== 'ObjectProperty') {
      return [];
    }

    if (property.key.type !== 'Identifier') {
      return [];
    }
    return !propertyKeys.includes(property.key.name);
  });
}
