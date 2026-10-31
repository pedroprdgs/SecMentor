import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import type { Lesson } from '@secmentor/core';

const progressSchema = z.object({
  answered: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(),
  completed: z.array(z.string()),
  achievements: z.array(z.string()),
});
export type Progress = z.infer<typeof progressSchema>;
export async function runQuiz(
  lessons: Lesson[],
  ask: (question: string) => Promise<string>,
  output: (text: string) => void,
  home = process.env.SECMENTOR_HOME ?? join(homedir(), '.secmentor'),
) {
  const path = join(home, 'progresso.json');
  let progress: Progress = {
    answered: 0,
    correct: 0,
    completed: [],
    achievements: [],
  };
  try {
    progress = progressSchema.parse(JSON.parse(await readFile(path, 'utf8')));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
      throw new Error(
        'Progresso inválido. Faça uma cópia de progresso.json antes de restaurá-lo.',
      );
  }
  let score = 0;
  let count = 0;
  for (const lesson of lessons)
    for (const question of lesson.quiz) {
      const options = question.opcoes.map((text, original) => ({
        text,
        original,
      }));
      // Fisher–Yates evita que a opção correta fique sempre na mesma posição.
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      output(
        `\n${lesson.id} · ${question.pergunta}\n${options.map((o, i) => `${i + 1}. ${o.text}`).join('\n')}`,
      );
      let answer: number;
      do {
        answer = Number((await ask('Sua resposta (número): ')).trim()) - 1;
        if (!Number.isInteger(answer) || answer < 0 || answer >= options.length)
          output('Escolha um número entre 1 e ' + options.length + '.');
      } while (
        !Number.isInteger(answer) ||
        answer < 0 ||
        answer >= options.length
      );
      const correct = options[answer].original === question.resposta;
      count++;
      progress.answered++;
      if (correct) {
        score++;
        progress.correct++;
        if (!progress.completed.includes(lesson.id))
          progress.completed.push(lesson.id);
      }
      output(`${correct ? 'Correto!' : 'Ainda não.'} ${question.explicacao}`);
    }
  if (!progress.achievements.includes('Primeiro passo'))
    progress.achievements.push('Primeiro passo');
  if (
    progress.completed.length >= 12 &&
    !progress.achievements.includes('Guardião do código')
  )
    progress.achievements.push('Guardião do código');
  await mkdir(home, { recursive: true, mode: 0o700 });
  const temporary = path + `.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(progress, null, 2) + '\n', {
    mode: 0o600,
  });
  await rename(temporary, path);
  output(
    `\nPontuação: ${score}/${count} · Nível ${1 + Math.floor(progress.correct / 5)}\nConquistas: ${progress.achievements.join(', ')}\nProgresso salvo em ${path}`,
  );
  return progress;
}
