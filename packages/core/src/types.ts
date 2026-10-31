import { z } from 'zod';

export const severitySchema = z.enum(['baixa', 'media', 'alta', 'critica']);
export type Severity = z.infer<typeof severitySchema>;
export const severityRank: Record<Severity, number> = {
  baixa: 0,
  media: 1,
  alta: 2,
  critica: 3,
};
export const lessonSchema = z.object({
  id: z.string().regex(/^SM\d{3}$/),
  titulo: z.string().min(1),
  severidade: severitySchema,
  resumo: z.string().min(1),
  por_que_e_perigoso: z.string().min(1),
  exemplo_vulneravel: z.string().min(1),
  exemplo_corrigido: z.string().min(1),
  como_explorar_inofensivo: z.string().min(1),
  erros_comuns_de_iniciante: z.array(z.string().min(1)).min(1),
  checklist_de_correcao: z.array(z.string().min(1)).min(1),
  referencias: z.array(z.string().url()).min(1),
  quiz: z
    .array(
      z
        .object({
          pergunta: z.string().min(1),
          opcoes: z.array(z.string().min(1)).min(2),
          resposta: z.number().int().nonnegative(),
          explicacao: z.string().min(1),
        })
        .refine(
          (q) => q.resposta < q.opcoes.length,
          'Resposta fora das opções',
        ),
    )
    .min(1),
});
export type Lesson = z.infer<typeof lessonSchema>;
export interface Fix {
  start: number;
  end: number;
  replacement: string;
  description: string;
}
export interface Finding {
  ruleId: string;
  title: string;
  severity: Severity;
  file: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  message: string;
  snippet: string;
  lessonId: string;
  fix?: Fix;
}
export interface ScanWarning {
  file: string;
  message: string;
}
export interface ScanResult {
  explanations?: { ruleId: string; text: string; source: 'ia' | 'licao' }[];
  findings: Finding[];
  warnings: ScanWarning[];
  filesScanned: number;
  durationMs: number;
}
export interface SourceFile {
  path: string;
  content: string;
  tracked?: boolean;
  envIgnored?: boolean;
}
