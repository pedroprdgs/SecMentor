import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir, platform, arch } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { scanPath } from '../packages/core/src/node.js';
const content = Array.from(
  { length: 20 },
  (_, j) => `export function soma${j}(a: number, b: number) { return a + b; }`,
).join('\n');
const directory = await mkdtemp(join(tmpdir(), 'secmentor-bench-'));
try {
  execFileSync('git', ['init', '-q'], { cwd: directory });
  for (let batch = 0; batch < 10; batch++) {
    const folder = join(directory, String(batch));
    await mkdir(folder);
    await Promise.all(
      Array.from({ length: 100 }, (_, i) =>
        writeFile(join(folder, `file-${i}.ts`), content),
      ),
    );
  }
  const start = performance.now();
  const result = await scanPath(directory);
  const elapsed = Math.round(performance.now() - start);
  if (
    result.filesScanned !== 1000 ||
    result.warnings.length ||
    result.findings.length
  )
    throw new Error('Benchmark incompleto.');
  console.log(
    JSON.stringify(
      {
        files: result.filesScanned,
        milliseconds: elapsed,
        bytesPerFile: Buffer.byteLength(content),
        node: process.version,
        platform: platform() + '-' + arch(),
        scenario:
          '1.000 arquivos TypeScript sintéticos, ~1,2 KiB cada, sem achados; inclui leitura e parse, exclui criação dos arquivos',
      },
      null,
      2,
    ),
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
