// import {describe, expect, test} from 'vitest';
// import fs from 'node:fs';
// import {v2023_1_6} from './v2023.1.6.js';

// interface Change {
//   before?: string;
//   after?: string;
//   description?: string;
//   filename?: string;
// }
// const testCases = migrationGuideExamples(import.meta.url);

// describe.each(testCases)('$description', (change: Change) => {
//   const {before = '', after = '', description = '', filename = ''} = change;

//   test(description, async () => {
//     const result = v2023_1_6(before, filename);

//     expect(result.source).toBe(after);
//   });
// });

// function migrationGuideExamples(testSuite: string) {
//   const markdown = fs.readFileSync(
//     new URL('./migration-guide.md', testSuite),
//     'utf8',
//   );
//   const samples = markdown
//     .split(/^## /gm)
//     .slice(1)
//     .map((block: string) => {
//       const description = block.split('\n')[0];

//       const before = /```(js|jsx|ts|tsx) before\n([^]*?)\n```/.exec(block);
//       const after = /```(js|jsx|ts|tsx) after\n([^]*?)\n```/.exec(block);

//       const match = /### In file `(.+)`/.exec(block);

//       return {
//         description,
//         before: before ? before[2] : '',
//         after: after ? after[2] : '',
//         filename: match?.[1],
//       };
//     });

//   return samples;
// }
