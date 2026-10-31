import { readdir, readFile, writeFile } from 'node:fs/promises';
import { parse } from '../packages/core/node_modules/yaml/dist/index.js';
import { lessonSchema } from '../packages/core/src/types.js';
const files = (await readdir('lessons/pt-BR')).filter(f => f.endsWith('.yaml')).sort();
const lessons = await Promise.all(files.map(async f => lessonSchema.parse(parse(await readFile(`lessons/pt-BR/${f}`, 'utf8')))));
if (new Set(lessons.map(l => l.id)).size !== lessons.length) throw new Error('IDs duplicados');
const text = '// Gerado por scripts/compile-lessons.ts. Não edite manualmente.\nimport type { Lesson } from "./types.js";\nexport const lessons: Lesson[] = ' + JSON.stringify(lessons, null, 2) + ';\n';
await writeFile('packages/core/src/lessons.generated.ts', text);
console.log(`${lessons.length} lições compiladas.`);
