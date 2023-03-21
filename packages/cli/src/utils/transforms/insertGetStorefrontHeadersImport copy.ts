import type {API, FileInfo} from 'jscodeshift';
import {
  hasImportDeclaration,
  insertImportSpecifier,
  hasImportSpecifier,
  insertImportDeclaration,
} from './imports.js';

export default function insertGetStorefrontHeadersImport(
  file: FileInfo,
  {jscodeshift: j}: API,
) {
  const source = j(file.source);

  if (!file.path.endsWith('server.ts') && !file.path.endsWith('server.js')) {
    return file.source;
  }

  if (hasImportDeclaration(j, source, '@shopify/remix-oxygen')) {
    if (
      hasImportSpecifier(
        j,
        source,
        'getStorefrontHeaders',
        '@shopify/remix-oxygen',
      )
    ) {
      return file.source;
    }

    insertImportSpecifier(
      j,
      source,
      'getStorefrontHeaders',
      '@shopify/remix-oxygen',
    );
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
}
