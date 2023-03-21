import type {API, FileInfo, ObjectExpression} from 'jscodeshift';
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
}

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
