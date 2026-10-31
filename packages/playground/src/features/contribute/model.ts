import { lessonSchema, type Lesson } from '@secmentor/core/content';
import { stringify } from 'yaml';
export interface LessonDraft {
  id: string;
  titulo: string;
  severidade: string;
  resumo: string;
  por_que_e_perigoso: string;
  exemplo_vulneravel: string;
  exemplo_corrigido: string;
  como_explorar_inofensivo: string;
  erros_comuns_de_iniciante: string;
  checklist_de_correcao: string;
  referencias: string;
  pergunta: string;
  opcoes: string;
  resposta: string;
  explicacao: string;
}
export function lessonDraft(lesson: Lesson): LessonDraft {
  return {
    ...lesson,
    erros_comuns_de_iniciante: lesson.erros_comuns_de_iniciante.join('\n'),
    checklist_de_correcao: lesson.checklist_de_correcao.join('\n'),
    referencias: lesson.referencias.join('\n'),
    pergunta: lesson.quiz[0].pergunta,
    opcoes: lesson.quiz[0].opcoes.join('\n'),
    resposta: String(lesson.quiz[0].resposta + 1),
    explicacao: lesson.quiz[0].explicacao,
  };
}
const lines = (value: string) =>
  value
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);
export function validateDraft(draft: LessonDraft) {
  return lessonSchema
    .refine((lesson) =>
      lesson.referencias.every((url) => url.startsWith('https://')),
    )
    .safeParse({
      ...draft,
      erros_comuns_de_iniciante: lines(draft.erros_comuns_de_iniciante),
      checklist_de_correcao: lines(draft.checklist_de_correcao),
      referencias: lines(draft.referencias),
      quiz: [
        {
          pergunta: draft.pergunta,
          opcoes: lines(draft.opcoes),
          resposta: Number(draft.resposta) - 1,
          explicacao: draft.explicacao,
        },
      ],
    });
}
export function lessonYAML(lesson: Lesson) {
  return stringify(lesson, { lineWidth: 100 });
}
