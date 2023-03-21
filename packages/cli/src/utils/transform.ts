import {path, file} from '@shopify/cli-kit';
import {AbortError} from '@shopify/cli-kit/node/error';

export async function transform(
  transformFile: string,
  {path: appPath}: {path: string},
) {
  // @ts-expect-error `@types/jscodeshift` doesn't have types for this
  const applyTransform = (await import('jscodeshift/dist/testUtils.js'))
    .applyTransform;
  const transforms = await import(transformFile);
  const filePaths = await path.glob([`${appPath}/server.ts`]);

  if (filePaths.length === 0) {
    throw new AbortError(`No files found for ${appPath}`);
  }

  for (const filePath of filePaths) {
    const source = await file.read(filePath);

    if (!source) {
      throw new AbortError(`No file found for ${filePath}`);
    }

    try {
      const output = applyTransform(
        {parser: 'tsx', ...transforms},
        {},
        {
          source,
          path: filePath,
        },
      );

      await file.write(filePath, output);
    } catch (error: unknown) {
      throw new AbortError((error as Error).message);
    }
  }
}
