# Changelog

## Não lançado · evolução do front end

- Playground evoluído para aplicação React 18 com rotas, CodeMirror 6 e análise em Worker.
- Importação de arquivos, pastas e ZIP, filtros, diff e correção segura com desfazer.
- Quiz por modo, progresso local, biblioteca, criador de lições YAML e configurações de IA com consentimento.
- Relatórios, links comprimidos, tour, modo demonstração e PWA offline.
- Testes de componentes, E2E, capturas reais e medições Lighthouse; CI e Pages atualizados.

## 0.1.0 — 2026-10-31

- Monorepo pnpm, TypeScript strict, Node 20 e CI com lint, tipos, cobertura, lições e build.
- Scanner AST e configuração com 12 famílias de regras e lições pt-BR validadas por Zod.
- CLI scan/explain/quiz/fix/rules/lint-lessons/init, filtros, progresso e pacotes externos.
- Reporters terminal, JSON e SARIF com ocultação de trechos de credenciais.
- LLMProvider opcional e adaptador compatível com Chat Completions; fallback offline.
- Playground local com editor, exemplos, lições, antes/depois, quiz, progresso e temas.
- Extensão VS Code com diagnósticos, painel e ações rápidas.
- Action composta, resumo/comentário de PR, upload SARIF, Pages e hook opcional.
- Material do hackathon, contribuição e tarefas para iniciantes.

Limites: heurísticas por arquivo, auto-fix apenas httpOnly, sem release npm/Marketplace ou deploy remoto nesta entrega. Confira `docs/regras.md` e `docs/hackathon/METRICAS.md`.
