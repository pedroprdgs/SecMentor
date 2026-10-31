import { describe, it, expect, afterEach } from 'vitest';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { runQuiz } from './tutor.js';
import { lessons } from '@secmentor/core';
const temporary: string[] = [];
async function directory() {
  const path = await mkdtemp(join(tmpdir(), 'secmentor-cli-'));
  temporary.push(path);
  return path;
}
afterEach(async () => {
  await Promise.all(
    temporary.splice(0).map((p) => rm(p, { recursive: true, force: true })),
  );
});
const cli = resolve('packages/cli/dist/index.js');
function run(args: string[], cwd = process.cwd()) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
}
// Exercita respostas digitadas uma por vez, além do teste de entrada em lote.
function interactive(
  args: string[],
  responses: string[],
  env: NodeJS.ProcessEnv = {},
) {
  return new Promise<{ code: number | null; output: string }>(
    (accept, reject) => {
      const child = spawn(process.execPath, [cli, ...args], {
        env: { ...process.env, ...env, NO_COLOR: '1' },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      let output = '';
      let sent = 0;
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error('CLI não concluiu em 10 s'));
      }, 10000);
      child.stdout.on('data', (chunk) => {
        output += String(chunk);
        const prompts = (
          output.match(/Sua resposta \(número\): |Digite sim: /g) ?? []
        ).length;
        if (prompts > sent && sent < responses.length) {
          child.stdin.write(responses[sent++] + '\n');
        }
      });
      child.stderr.on('data', (chunk) => {
        output += String(chunk);
      });
      child.on('error', reject);
      child.on('close', (code) => {
        clearTimeout(timer);
        accept({ code, output });
      });
    },
  );
}
describe('CLI ponta a ponta', () => {
  it('scan examples gera relatório e saída 1, sem executar os exemplos', () => {
    const result = run(['scan', 'examples', '--json']);
    expect(result.status).toBe(1);
    const report = JSON.parse(result.stdout);
    expect(report.findings.length).toBeGreaterThanOrEqual(10);
    expect(report.warnings).toEqual([]);
    expect(
      report.findings.some((f: { ruleId: string }) => f.ruleId === 'SM001'),
    ).toBe(true);
  });
  it('SARIF, filtros e erros amigáveis', () => {
    expect(
      JSON.parse(run(['scan', 'examples', '--sarif']).stdout).version,
    ).toBe('2.1.0');
    const filtered = run([
      'scan',
      'examples',
      '--json',
      '--severidade-minima',
      'critica',
      '--ignorar',
      'SM003',
    ]);
    expect(
      JSON.parse(filtered.stdout).findings.every(
        (f: { ruleId: string }) => f.ruleId === 'SM007',
      ),
    ).toBe(true);
    const invalid = run(['scan', 'examples', '--severidade-minima', 'extrema']);
    expect(invalid.status).toBe(2);
    expect(invalid.stderr).toContain('Opção inválida');
    expect(invalid.stderr).not.toContain('at ');
    expect(run(['scan', 'examples', '--json', '--sarif']).status).toBe(2);
    expect(run(['scan', '/caminho-inexistente-secmentor']).status).toBe(2);
  });
  it('rules, explain e lint-lessons', () => {
    expect(run(['rules']).stdout).toContain('SM012');
    expect(run(['explain', 'SM001']).stdout).toContain('Checklist');
    expect(run(['explain', 'desconhecida']).status).toBe(2);
    expect(run(['lint-lessons']).stdout).toContain('12 lições válidas');
  });
  it('pacote de lições externo chega ao explain', async () => {
    const path = await directory();
    await writeFile(
      join(path, 'SM001.yaml'),
      JSON.stringify({ ...lessons[0], titulo: 'Texto personalizado' }),
    );
    expect(run(['--lessons', path, 'explain', 'SM001']).stdout).toContain(
      'Texto personalizado',
    );
  });
  it('quiz real interativo salva progresso local e dá feedback', async () => {
    const home = await directory();
    const result = await interactive(
      ['quiz'],
      Array.from({ length: 12 }, () => '1'),
      {
        SECMENTOR_HOME: home,
      },
    );
    expect(result.code).toBe(0);
    expect(result.output).toContain('Pontuação:');
    expect(
      JSON.parse(await readFile(join(home, 'progresso.json'), 'utf8')).answered,
    ).toBe(12);
  });
  it('quiz preserva respostas recebidas em lote e trata EOF sem stack trace', async () => {
    const home = await directory();
    const options = {
      encoding: 'utf8' as const,
      env: { ...process.env, SECMENTOR_HOME: home, NO_COLOR: '1' },
      timeout: 5000,
    };
    const result = spawnSync(process.execPath, [cli, 'quiz'], {
      ...options,
      input: '1\n'.repeat(12),
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Pontuação:');
    expect(
      JSON.parse(await readFile(join(home, 'progresso.json'), 'utf8')).answered,
    ).toBe(12);
    const ended = spawnSync(process.execPath, [cli, 'quiz'], {
      ...options,
      input: '',
    });
    expect(ended.status).toBe(2);
    expect(ended.stderr).toContain('Entrada encerrada');
    expect(ended.stderr).not.toContain('at ');
  });
  it('fix pede confirmação, cancela e aplica somente o patch previsto', async () => {
    const path = await directory();
    const file = join(path, 'app.js');
    const original = 'res.cookie("s",value,{httpOnly:false,secure:true});';
    await writeFile(file, original);
    const cancelled = await interactive(['fix', file], ['não']);
    expect(cancelled.output).toContain('Correção cancelada');
    expect(await readFile(file, 'utf8')).toBe(original);
    const applied = await interactive(['fix', file], ['sim']);
    expect(applied.code).toBe(0);
    expect(applied.output).toContain('-res.cookie');
    expect(await readFile(file, 'utf8')).toBe(
      original.replace('httpOnly:false', 'httpOnly:true'),
    );
    expect(run(['fix', file]).stdout).toContain('Nenhuma correção automática');
  });
  it('init instala hook executável e preserva um hook existente', async () => {
    const path = await directory();
    execFileSync('git', ['init', '-q'], { cwd: path });
    expect(run(['init', '--hook'], path).status).toBe(0);
    const hook = join(path, '.git/hooks/pre-commit');
    const content = await readFile(hook, 'utf8');
    expect(content).toContain('scan . --severidade-minima alta');
    await writeFile(join(path, 'app.js'), 'eval(input);');
    const result = spawnSync('sh', [hook], { cwd: path, encoding: 'utf8' });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('SM006');
    expect(run(['init', '--hook'], path).stdout).toContain(
      'Hook existente preservado',
    );
    expect(await readFile(hook, 'utf8')).toBe(content);
  });
  it('init preserva configuração existente', async () => {
    const path = await directory();
    expect(run(['init'], path).status).toBe(0);
    const original = await readFile(join(path, '.secmentorrc'), 'utf8');
    expect(run(['init'], path).stdout).toContain('preservado');
    expect(await readFile(join(path, '.secmentorrc'), 'utf8')).toBe(original);
  });
});
describe('tutor e progresso', () => {
  it('valida entrada, pontua, avança nível e conquista', async () => {
    const path = await directory();
    const answers = ['x', '99', ...lessons.map(() => '1')];
    const messages: string[] = [];
    // All options are equal so any shuffled choice is correct; this tests progress, not lesson correctness.
    const quiz = lessons.map((l) => ({
      ...l,
      quiz: [{ ...l.quiz[0], opcoes: ['correta', 'correta'], resposta: 0 }],
    }));
    const source = lessons[0];
    const result = await runQuiz(
      [source],
      async () => answers.shift()!,
      (s) => messages.push(s),
      path,
    );
    expect(result.answered).toBe(1);
    expect(messages.join('\n')).toContain('Escolha um número');
    await writeFile(
      join(path, 'progresso.json'),
      JSON.stringify({
        answered: 12,
        correct: 12,
        completed: quiz.map((l) => l.id),
        achievements: ['Primeiro passo'],
      }),
    );
    const next = await runQuiz(
      [],
      async () => '',
      () => {},
      path,
    );
    expect(next.achievements).toContain('Guardião do código');
  });
  it('recusa progresso corrompido sem sobrescrever', async () => {
    const path = await directory();
    await writeFile(join(path, 'progresso.json'), 'quebrado');
    await expect(
      runQuiz(
        [],
        async () => '',
        () => {},
        path,
      ),
    ).rejects.toThrow('Progresso inválido');
    expect(await readFile(join(path, 'progresso.json'), 'utf8')).toBe(
      'quebrado',
    );
  });
});
