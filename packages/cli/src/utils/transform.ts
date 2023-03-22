import j, {type Collection, type JSCodeshift} from 'jscodeshift';
import {format, resolveFormatConfig} from './transpile-ts.js';
import {file} from '@shopify/cli-kit';

export type Transform = (
  j: JSCodeshift,
  source: Collection<any>,
  sourcePath: string,
) => string;

interface Result {
  source: string;
  state: 'changed' | 'unchanged';
}

export async function applyTransform(
  transform: Transform[] | Transform,
  {
    source,
    filename,
  }: {
    source: string;
    filename: string;
  },
): Promise<Result> {
  const transforms = Array.isArray(transform) ? transform : [transform];

  let newSource = source;
  const jscodeshift = j.withParser('tsx');

  for (const t of transforms) {
    newSource = t(jscodeshift, jscodeshift(newSource), filename) || newSource;
  }

  const formattedContent = await format(
    newSource,
    await resolveFormatConfig(filename),
    filename,
  );

  await file.write(filename, formattedContent);

  return {
    source: newSource,
    state: source === newSource ? 'unchanged' : 'changed',
  };
}
