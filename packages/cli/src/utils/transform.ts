import j, {type Collection, type JSCodeshift} from 'jscodeshift';
import {format, resolveFormatConfig} from './transpile-ts.js';
import {file} from '@shopify/cli-kit';

export type Transform = (
  j: JSCodeshift,
  source: Collection<any>,
  sourcePath: string,
) => string;

interface Result {
  filename: string;
  before: string;
  after: string;
  state: 'changed' | 'unchanged';
}

export async function applyTransform(
  transform: Transform[] | Transform,
  files: string[],
): Promise<Result[]> {
  const results = [];
  const transforms = Array.isArray(transform) ? transform : [transform];
  const jscodeshift = j.withParser('tsx');

  for (const filename of files) {
    const source = await file.read(filename);

    let newSource = source;

    for (const t of transforms) {
      newSource = t(jscodeshift, jscodeshift(newSource), filename) || newSource;
    }

    const formattedContent = await format(
      newSource,
      await resolveFormatConfig(filename),
      filename,
    );

    results.push({
      filename,
      before: source,
      after: formattedContent,
      state:
        source === newSource ? ('unchanged' as const) : ('changed' as const),
    });
  }

  return results;
}
