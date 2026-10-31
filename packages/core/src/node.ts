import { readdir, readFile, stat, realpath } from 'node:fs/promises';
import { resolve, relative, basename, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse } from 'yaml';
import { lessons } from './lessons.generated.js';
import { scanSource, type ScanOptions } from './scanner.js';
import { lessonSchema, type Lesson, type ScanResult } from './types.js';

export async function readLessonPack(directory: string): Promise<Lesson[]> {
  const files = (await readdir(directory))
    .filter((f) => /\.ya?ml$/.test(f))
    .sort();
  if (!files.length) throw new Error('Pacote de lições sem arquivos YAML.');
  const custom = await Promise.all(
    files.map(async (file) => {
      try {
        return lessonSchema.parse(
          parse(await readFile(resolve(directory, file), 'utf8')),
        );
      } catch {
        throw new Error(
          `Lição inválida: ${file}. Confira o schema e o índice da resposta do quiz.`,
        );
      }
    }),
  );
  if (new Set(custom.map((l) => l.id)).size !== custom.length)
    throw new Error('IDs duplicados no pacote de lições.');
  return custom;
}
export async function loadLessons(directory?: string): Promise<Lesson[]> {
  if (!directory) return lessons;
  const custom = await readLessonPack(directory);
  return [
    ...lessons.filter((l) => !custom.some((c) => c.id === l.id)),
    ...custom,
  ];
}

// Padrões glob relativos à raiz do scan; não implementa negação ou classes de caracteres.
export function matchesIgnore(path: string, pattern: string): boolean {
  let expression = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '*' && pattern[i + 1] === '*') {
      i++;
      if (pattern[i + 1] === '/') {
        i++;
        expression += '(?:.*/)?';
      } else expression += '.*';
    } else if (c === '*') expression += '[^/]*';
    else if (c === '?') expression += '[^/]';
    else expression += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^(?:${expression})(?:/.*)?$`).test(path);
}
export async function scanPath(
  target: string,
  options: ScanOptions & { ignore?: string[] } = {},
): Promise<ScanResult> {
  const start = performance.now();
  const absolute = await realpath(resolve(target));
  const info = await stat(absolute);
  const root = info.isDirectory() ? absolute : dirname(absolute);
  const paths: string[] = [];
  const warnings: ScanResult['warnings'] = [];
  const excluded = new Set([
    'node_modules',
    '.git',
    'dist',
    'coverage',
    '.next',
  ]);
  async function collect(path: string) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const full = resolve(path, entry.name);
      const rel = relative(root, full).replaceAll('\\', '/');
      if (
        excluded.has(entry.name) ||
        options.ignore?.some((p) => matchesIgnore(rel, p))
      )
        continue;
      if (entry.isDirectory()) await collect(full);
      else if (entry.isFile() && supported(full)) paths.push(full);
    }
  }
  if (info.isDirectory()) await collect(absolute);
  else if (supported(absolute)) paths.push(absolute);
  else
    warnings.push({
      file: target,
      message:
        'Formato não suportado. Use JS, TS, JSX, TSX, package.json ou .env.',
    });
  let tracked = new Set<string>();
  let ignored = new Set<string>();
  let git = false;
  try {
    const repo = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    git = true;
    tracked = new Set(
      execFileSync('git', ['ls-files', '-z'], { cwd: repo, encoding: 'utf8' })
        .split('\0')
        .filter(Boolean)
        .map((p) => resolve(repo, p)),
    );
    try {
      ignored = new Set(
        execFileSync('git', ['check-ignore', '--no-index', '--stdin', '-z'], {
          cwd: root,
          input: paths.join('\0') + '\0',
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        })
          .split('\0')
          .filter(Boolean),
      );
    } catch (error) {
      const e = error as { status?: number; stdout?: string };
      if (e.status !== 1) throw error;
    }
  } catch {
    warnings.push({
      file: target,
      message:
        'Git indisponível ou pasta sem repositório: proteção do .env não pôde ser confirmada.',
    });
  }
  const findings: ScanResult['findings'] = [];
  let filesScanned = 0;
  for (let index = 0; index < paths.length; index += 24) {
    await Promise.all(
      paths.slice(index, index + 24).map(async (path) => {
        const env = /^\.env(?:\.|$)/.test(basename(path));
        if (ignored.has(path) && !env && !tracked.has(path)) return;
        try {
          const size = (await stat(path)).size;
          if (size > 1_048_576) {
            warnings.push({
              file: path,
              message: 'Arquivo acima de 1 MiB ignorado.',
            });
            return;
          }
          const result = scanSource(
            {
              path: relative(root, path).replaceAll('\\', '/'),
              content: await readFile(path, 'utf8'),
              tracked: tracked.has(path),
              envIgnored: git ? ignored.has(path) : false,
            },
            options,
          );
          filesScanned++;
          findings.push(...result.findings);
          warnings.push(...result.warnings);
        } catch {
          warnings.push({
            file: path,
            message: 'Não foi possível ler o arquivo.',
          });
        }
      }),
    );
  }
  return {
    findings: findings.sort(
      (a, b) =>
        a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column,
    ),
    warnings,
    filesScanned,
    durationMs: performance.now() - start,
  };
}
function supported(path: string) {
  return (
    /\.[cm]?[jt]sx?$/.test(path) ||
    basename(path) === 'package.json' ||
    /^\.env(?:\.|$)/.test(basename(path))
  );
}
