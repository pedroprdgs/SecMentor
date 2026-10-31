# Evolução do front end

## Leitura e reaproveitamento

O monorepo contém core, CLI, extensão e playground. A API pública fornece scanSource, regras, lições, schema Zod, reporters e LLMProvider. A entrada /node isola filesystem; /llm é opcional e não recebe código automaticamente. Há 12 lições pt-BR e 99 testes de core/CLI. O playground atual concentra editor simples, biblioteca e progresso em um componente.

Vamos evoluir packages/playground, alternativa explicitamente permitida pelo briefing, preservando seus scripts e o core. Uma entrada leve de conteúdo evita carregar Babel na landing. O Worker usa scanSource sem reescrever detectores. Metadados de Git não existem no navegador: a interface explicita esse limite.

## Direção visual

Manter a linguagem de mentor: verde folha, fundos de papel no claro e carvão no escuro, tipografia de sistema e monoespaçada local. A landing tem composição editorial assimétrica e demonstração identificada como exemplo. O analisador tem prioridade operacional, editor amplo, árvore e painel didático. No mobile, navegação recolhida e painéis empilhados. Severidades usam texto e ícone além de cor.

## Etapas e prova

1. Leitura e plano (este arquivo).
2. Rotas, tokens, shell e temas.
3. Entrada leve do core e Worker tipado.
4. CodeMirror, arquivos/pastas/ZIP, filtros e resultados.
5. Lição, diff, IA opcional e correção com desfazer.
6. Quiz, progresso e conquistas locais.
7. Biblioteca e rotas de lições.
8. Contribuir e criador YAML validado.
9. Relatórios, compartilhamento explícito, tour e /demo.
10. PWA e orçamento de carregamento.
11. Testes de unidades/componentes, E2E, CI e Pages.
12. Documentação, capturas e métricas observadas.
13. Revisão final com build servido localmente e Lighthouse.

Nenhuma publicação remota faz parte da implementação local. Achados não provam explorabilidade; ausência de achados não prova segurança. IA recebe lição e dúvida somente após confirmação por envio; o código do editor nunca é transmitido automaticamente.
