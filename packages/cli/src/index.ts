#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { readFile, writeFile, rename, lstat, mkdir } from 'node:fs/promises';
import { resolve, dirname, relative, isAbsolute } from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse } from 'yaml';
import { createPatch } from 'diff';
import { z } from 'zod';
import { scanSource, toJSON, toSARIF, toTerminal, formatLesson, rules, severitySchema, type Lesson } from '@secmentor/core';
import { scanPath, loadLessons } from '@secmentor/core/node';
import { runQuiz } from './tutor.js';

const program = new Command().name('secmentor').description('Segurança de código que ensina em português. Local, offline, sem IA por padrão.').version('0.1.0').option('--lessons <pasta>', 'Pacote de lições YAML externo');
const configSchema = z.object({ ignore: z.array(z.string()).default([]), ignoreRules: z.array(z.string().regex(/^SM\d{3}$/)).default([]), minimumSeverity: severitySchema.default('baixa') }).strict();
async function config(target: string) {
  let directory = (await lstat(target)).isDirectory() ? resolve(target) : dirname(resolve(target));
  for (;;) {
    try { return configSchema.parse(parse(await readFile(resolve(directory, '.secmentorrc'), 'utf8'))); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw new Error('.secmentorrc inválido. Use ignore, ignoreRules e minimumSeverity.'); }
    const parent = dirname(directory); if (parent === directory) return configSchema.parse({}); directory = parent;
  }
}
async function getLessons() { return loadLessons(program.opts<{ lessons?: string }>().lessons); }
async function lessonById(id: string): Promise<Lesson> { const lesson = (await getLessons()).find(l => l.id === id.toUpperCase()); if (!lesson) throw new Error(`Lição ${id} não encontrada. Use secmentor rules.`); return lesson; }
async function interactive<T>(run: (ask: (q: string) => Promise<string>) => Promise<T>) {
  const readline = createInterface({ input: stdin, output: stdout });
  try { return await run(q => readline.question(q)); } finally { readline.close(); }
}

program.command('scan').argument('<caminho>').description('Analisa código sem executar os arquivos.').option('--json', 'Relatório JSON').option('--sarif', 'Relatório SARIF 2.1.0').option('--ia', 'Aprofunda explicações com endpoint configurado').option('--severidade-minima <nivel>', 'baixa, media, alta ou critica').option('--ignorar <padroes>', 'Globs e IDs separados por vírgula').action(async (target: string, flags: { json?: boolean; sarif?: boolean; ia?: boolean; severidadeMinima?: string; ignorar?: string }) => {
  if (flags.json && flags.sarif) throw new Error('Escolha apenas um formato: --json ou --sarif.');
  const settings = await config(target);
  const minimumSeverity = severitySchema.parse(flags.severidadeMinima ?? settings.minimumSeverity);
  const ignores = flags.ignorar?.split(',').map(p => p.trim()).filter(Boolean) ?? [];
  const spinner = ora({ text: 'Analisando localmente…', isEnabled: Boolean(stdout.isTTY && !flags.json && !flags.sarif) }).start();
  let result;
  try { result = await scanPath(target, { minimumSeverity, ignore: [...settings.ignore, ...ignores.filter(p => !/^SM\d{3}$/.test(p))], ignoreRules: [...settings.ignoreRules, ...ignores.filter(p => /^SM\d{3}$/.test(p))] }); } finally { spinner.stop(); }
  await getLessons(); // Valida um pacote externo mesmo nos formatos de máquina.
  // LLM_SCAN
  const info = await lstat(target);
  const base = relative(process.cwd(), info.isDirectory() ? resolve(target) : dirname(resolve(target))).replaceAll('\\', '/');
  const prefix = base && !base.startsWith('..') && !isAbsolute(base) ? base + '/' : '';
  console.log(flags.json ? toJSON(result) : flags.sarif ? toSARIF(result, prefix) : toTerminal(result, (text, severity) => severity === 'critica' ? chalk.red.bold(text) : severity === 'alta' ? chalk.red(text) : chalk.yellow(text)));
  process.exitCode = result.warnings.length ? 2 : result.findings.length ? 1 : 0;
});
program.command('explain').argument('<id>').description('Mostra a lição completa.').action(async (id: string) => console.log(formatLesson(await lessonById(id))));
program.command('rules').description('Lista regras disponíveis.').action(async () => { const lessons = await getLessons(); for (const rule of rules) console.log(`${rule.id}  ${rule.severity.padEnd(7)}  ${lessons.find(l => l.id === rule.id)?.titulo ?? rule.title}`); });
program.command('lint-lessons').description('Valida os YAMLs com Zod.').action(async () => {
  const directory = program.opts<{ lessons?: string }>().lessons ?? resolve(dirname(new URL(import.meta.url).pathname), '../../../lessons/pt-BR');
  const loaded = await loadLessons(directory);
  const missing = rules.filter(r => !loaded.some(l => l.id === r.id));
  if (missing.length) throw new Error('Há regras sem lição.');
  console.log(`${loaded.length} lições válidas · schema, referências e quiz conferidos.`);
});
program.command('quiz').argument('[id]').description('Tutor interativo com progresso local.').action(async (id?: string) => {
  const selected = id ? [await lessonById(id)] : await getLessons();
  await interactive(ask => runQuiz(selected, ask, text => console.log(text)));
});
program.command('fix').argument('<arquivo>').description('Mostra diff e pede confirmação antes de aplicar uma correção segura.').action(async (file: string) => {
  const path = resolve(file); const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error('Escolha um arquivo regular, sem link simbólico.');
  const original = await readFile(path, 'utf8');
  const fixes = scanSource({ path, content: original }).findings.flatMap(f => f.fix ? [f.fix] : []).sort((a, b) => b.start - a.start);
  if (!fixes.length) { console.log('Nenhuma correção automática segura. Consulte secmentor explain <id>.'); return; }
  let corrected = original; let last = original.length;
  for (const fix of fixes) { if (fix.end > last) throw new Error('Correções sobrepostas. Revise manualmente.'); corrected = corrected.slice(0, fix.start) + fix.replacement + corrected.slice(fix.end); last = fix.start; }
  console.log(createPatch(file, original, corrected));
  console.log('A correção ativa httpOnly. Teste o fluxo de sessão após aplicar.');
  const answer = await interactive(ask => ask('Aplicar este diff? Digite sim: '));
  if (answer.trim().toLowerCase() !== 'sim') { console.log('Correção cancelada.'); return; }
  if (await readFile(path, 'utf8') !== original) throw new Error('O arquivo mudou. Gere o diff novamente.');
  const temporary = path + `.secmentor-${process.pid}.tmp`;
  await writeFile(temporary, corrected, { mode: info.mode, flag: 'wx' }); await rename(temporary, path);
  console.log('Correção aplicada. Rode os testes do projeto.');
});
program.command('init').description('Cria configuração local e hook opcional.').option('--hook', 'Instala pre-commit sem sobrescrever hooks existentes').action(async (flags: { hook?: boolean }) => {
  try { await writeFile('.secmentorrc', 'ignore:\n  - "**/fixtures/**"\nignoreRules: []\nminimumSeverity: baixa\n', { flag: 'wx' }); console.log('.secmentorrc criado.'); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; console.log('.secmentorrc existente preservado.'); }
  if (flags.hook) {
    let hook: string;
    try { hook = execFileSync('git', ['rev-parse', '--git-path', 'hooks/pre-commit'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { throw new Error('Execute init --hook dentro de um repositório Git.'); }
    await mkdir(dirname(hook), { recursive: true });
    try { await writeFile(hook, '#!/bin/sh\n# Analisa a árvore de trabalho inteira, incluindo mudanças ainda não staged.\nexec pnpm exec secmentor scan . --severidade-minima alta\n', { mode: 0o755, flag: 'wx' }); console.log('Hook de pre-commit instalado. Requer secmentor no PATH do pnpm.'); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; console.log('Hook existente preservado. Integre o comando manualmente.'); }
  }
});
program.showHelpAfterError();
try { await program.parseAsync(); }
catch (error) { console.error(chalk.red('SecMentor: ' + (error instanceof z.ZodError ? 'Opção inválida. Confira --help e os níveis de severidade.' : error instanceof Error ? error.message : 'Falha inesperada.'))); process.exitCode = 2; }
