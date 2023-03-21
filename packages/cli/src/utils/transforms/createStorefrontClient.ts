import type {API, FileInfo} from 'jscodeshift';
import {
  hasImportDeclaration,
  insertImportSpecifier,
  hasImportSpecifier,
  insertImportDeclaration,
} from './imports.js';

export default function modifyCreateStorefrontClient(
  file: FileInfo,
  {jscodeshift: j}: API,
) {
  const source = j(file.source);

  if (!file.path.endsWith('server.ts') && !file.path.endsWith('server.js')) {
    return file.source;
  }

  source
    .find(j.CallExpression)
    .filter(
      ({node: callExpression}) =>
        callExpression.callee.name === 'createStorefrontClient',
    )
    .forEach((path) => {
      path.node.arguments.forEach((arg) => {
        const propsToKeep = arg.properties.filter((prop) => {
          return !['buyerIp', 'requestGroupId'].includes(prop.key.name);
        });

        const propsToAdd = propsToKeep.find(
          (prop) => prop.key.name === 'storefrontHeaders',
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
}
