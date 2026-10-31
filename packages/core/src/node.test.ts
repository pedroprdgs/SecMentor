import { describe, it, expect, afterEach } from 'vitest';
import {
  mkdtemp,
  writeFile,
  mkdir,
  rm,
  symlink,
  readFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { scanPath, loadLessons, matchesIgnore } from './node.js';
import { lessons } from './index.js';
const temporary: string[] = [];
async function directory() {
  const path = await mkdtemp(join(tmpdir(), 'secmentor-test-'));
  temporary.push(path);
  return path;
}
afterEach(async () => {
  await Promise.all(
    temporary.splice(0).map((p) => rm(p, { recursive: true, force: true })),
  );
});
function git(path: string, args: string[]) {
  return execFileSync('git', args, {
    cwd: path,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}
describe('scan de projetos sem executar código', () => {
  it('respeita Git, mantém .env sob inspeção e pula symlinks', async () => {
    const path = await directory();
    git(path, ['init']);
    await writeFile(join(path, '.gitignore'), '.env\nignored.js\n');
    await writeFile(join(path, '.env'), 'KEY=ficticia');
    await writeFile(join(path, 'ignored.js'), 'eval(input)');
    await writeFile(join(path, 'app.ts'), 'eval(input)');
    await mkdir(join(path, 'node_modules'));
    await writeFile(join(path, 'node_modules/a.ts'), 'eval(input)');
    await symlink(join(path, 'app.ts'), join(path, 'link.ts'));
    const result = await scanPath(path);
    expect(result.filesScanned).toBe(2);
    expect(result.findings.map((f) => f.ruleId)).toEqual(['SM006']);
    expect(result.warnings).toEqual([]);
    git(path, ['add', '-f', '.env']);
    expect((await scanPath(path)).findings.map((f) => f.ruleId)).toContain(
      'SM005',
    );
  });
  it('sinaliza .env sem ignore, globs e severidade', async () => {
    const path = await directory();
    git(path, ['init']);
    await writeFile(join(path, '.env.local'), 'KEY=ficticia');
    await writeFile(join(path, 'unsafe.ts'), 'eval(input)');
    expect((await scanPath(path)).findings.map((f) => f.ruleId)).toContain(
      'SM005',
    );
    const result = await scanPath(path, {
      ignore: ['*.ts'],
      minimumSeverity: 'alta',
    });
    expect(result.filesScanned).toBe(1);
    expect(result.findings).toHaveLength(1);
    expect(
      (await scanPath(path, { ignoreRules: ['SM005', 'SM006'] })).findings,
    ).toEqual([]);
  });
  it('avisa sobre pasta sem Git, arquivos grandes e formato não suportado', async () => {
    const path = await directory();
    await writeFile(join(path, 'big.ts'), ' '.repeat(1_048_577));
    await writeFile(join(path, 'notes.txt'), 'texto');
    const result = await scanPath(path);
    expect(result.filesScanned).toBe(0);
    expect(result.warnings).toHaveLength(2);
    expect(
      (await scanPath(join(path, 'notes.txt'))).warnings.some((w) =>
        w.message.includes('Formato'),
      ),
    ).toBe(true);
    await expect(scanPath(join(path, 'missing'))).rejects.toThrow();
  });
  it('analisa arquivo individual e não altera o conteúdo', async () => {
    const path = await directory();
    git(path, ['init']);
    const file = join(path, 'test.js');
    await writeFile(file, 'eval(input);');
    const before = await readFile(file, 'utf8');
    expect((await scanPath(file)).findings).toHaveLength(1);
    expect(await readFile(file, 'utf8')).toBe(before);
  });
  it('matcher de globs cobre caminhos e caracteres literais', () => {
    expect(matchesIgnore('src/test/a.ts', '**/test/**')).toBe(true);
    expect(matchesIgnore('test/a.ts', '**/test/**')).toBe(true);
    expect(matchesIgnore('a.ts', '?.ts')).toBe(true);
    expect(matchesIgnore('a.ts', '*.js')).toBe(false);
    expect(matchesIgnore('dir/a.ts', 'dir')).toBe(true);
    expect(matchesIgnore('a+b.ts', 'a+b.ts')).toBe(true);
  });
});
describe('pacotes de lições', () => {
  it('aceita substituições e preserva lições embutidas', async () => {
    expect(await loadLessons()).toEqual(lessons);
    const path = await directory();
    await writeFile(
      join(path, 'custom.yaml'),
      JSON.stringify({ ...lessons[0], titulo: 'Minha explicação' }),
    );
    await writeFile(join(path, 'readme.md'), 'ignorado');
    const result = await loadLessons(path);
    expect(result).toHaveLength(12);
    expect(result.find((l) => l.id === 'SM001')?.titulo).toBe(
      'Minha explicação',
    );
  });
  it('rejeita vazio, YAML inválido e IDs duplicados', async () => {
    const path = await directory();
    await expect(loadLessons(path)).rejects.toThrow('sem arquivos');
    await writeFile(join(path, 'a.yml'), 'id: 123');
    await expect(loadLessons(path)).rejects.toThrow('Lição inválida');
    await writeFile(join(path, 'a.yml'), JSON.stringify(lessons[0]));
    await writeFile(join(path, 'b.yaml'), JSON.stringify(lessons[0]));
    await expect(loadLessons(path)).rejects.toThrow('duplicados');
  });
});
