# Changelog

## Não lançado · revisão de QA

- Correções de fetch no navegador, importação com limites cumulativos e erros de ZIP em português.
- Entradas HTML por rota para atualizar o Pages sem HTTP 404, h1 nas lições e diff atualizado.
- Quiz CLI preserva respostas em lote e trata fim da entrada com mensagem amigável.
- Bateria de release, métricas recalculadas, audit documentado e checklist com vídeo local de contingência.
- Publicação e tag v1.0.0 dependem de confirmação.

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

Limites: heurísticas por arquivo, auto-fix apenas httpOnly, sem release npm/Marketplace. Pages está disponível; as correções locais de QA ainda precisam ser publicadas. Confira `docs/regras.md` e `docs/hackathon/METRICAS.md`.
