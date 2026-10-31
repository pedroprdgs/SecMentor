import { writeFile } from 'node:fs/promises';
import { readLessonPack } from '../packages/core/src/node.js';
const lessons = await readLessonPack('lessons/pt-BR');
const text =
  '// Gerado por scripts/compile-lessons.ts. Não edite manualmente.\nimport type { Lesson } from "./types.js";\nexport const lessons: Lesson[] = ' +
  JSON.stringify(lessons, null, 2) +
  ';\n';
await writeFile('packages/core/src/lessons.generated.ts', text);
console.log(`${lessons.length} lições compiladas.`);
