import fs from 'node:fs';
import {file, path} from '@shopify/cli-kit';

export function migrationGuideExamples(testSuite: string) {
  const markdown = fs.readFileSync(
    new URL('./migration-guide.md', testSuite),
    'utf8',
  );
  const samples = markdown
    .split(/^## /gm)
    .slice(1)
    .map((block: string) => {
      const lines = block.split('\n');
      const title = lines[0];

      const descriptionEnd = lines.findIndex((line) => line.startsWith('###'));
      const description = lines.slice(1, descriptionEnd).join('\n');
      const filename = /### In file `(.+)`/.exec(block);
      const before = /```(js|jsx|ts|tsx) before\n([^]*?)\n```/.exec(block);
      const after = /```(js|jsx|ts|tsx) after\n([^]*?)\n```/.exec(block);

      return {
        title,
        description,
        before: before ? before[2] : '',
        after: after ? after[2] : '',
        filename: filename?.[1],
      };
    });

  return samples;
}

export async function createFixture(
  directory: string,
  files: Record<string, string>,
) {
  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(directory, filename);

    await file.write(filePath, content);
  }
}
