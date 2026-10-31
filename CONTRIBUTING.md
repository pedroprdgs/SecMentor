# Contribuir com o SecMentor

Você não precisa ser especialista em segurança. Uma explicação mais clara já ajuda. Participe em português ou peça ajuda para tradução. Leia o [código de conduta](CODE_OF_CONDUCT.md).

## Ambiente

Node 20+, Git e pnpm 9.15.9. Execute `pnpm install --frozen-lockfile` e `pnpm build`.
Antes de abrir PR: `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage` e `pnpm lint-lessons`.
Os testes da CLI precisam do build atualizado. Não execute os exemplos vulneráveis com dados reais.

## Adicionar uma regra em dez minutos

O tempo é uma estimativa para um padrão pequeno; valide segurança com calma.

1. Confira `docs/regras.md` e escolha um ID livre, como `SM013`.
2. Em `packages/core/src/scanner.ts`, adicione uma condição AST no visitante. Use `report(id, node, mensagem)` para manter posições e filtros. Não rode código nem abra rede.
3. Crie `lessons/pt-BR/SM013.yaml`, copiando uma lição existente. Explique o risco com uma analogia e ofereça uma demonstração local inofensiva. Cite uma página CWE ou OWASP.
4. Crie fixtures em `packages/core/fixtures/SM013/`: vulnerável, corrigida e falso positivo conhecido. Acrescente um teste de detecção, um de correção e um de falso positivo. Para regra de configuração, acrescente o caminho e metadados corretos ao teste.
5. Rode `pnpm build`. Ele valida e recompila as lições em TypeScript. A lista de regras usa os metadados das lições compiladas.
6. Rode os gates, atualize a tabela de regras, o changelog e as métricas se alterarem. Abra um PR descrevendo exemplo antes/depois e limites.

Não adicione correção automática se ela depender de bibliotecas, dados ou contexto que não conhecemos. Uma lição útil é melhor que um patch incorreto. Não altere os limiares de cobertura só para passar.

## Adicionar só uma lição

Para melhorar conteúdo, edite o YAML de um ID existente. Para distribuir uma explicação alternativa sem alterar o projeto, use `--lessons ./minhas-licoes`. IDs novos no pacote externo não registram detectores novos.

Campos obrigatórios: `id`, `titulo`, `severidade`, `resumo`, `por_que_e_perigoso`, `exemplo_vulneravel`, `exemplo_corrigido`, `como_explorar_inofensivo`, `erros_comuns_de_iniciante`, `checklist_de_correcao`, `referencias`, `quiz`. `resposta` é o índice da opção correta começando em **zero**. Referências devem ser URLs válidas. Strings e listas obrigatórias não podem ficar vazias.

Rode `pnpm lessons:compile`, `pnpm build`, `pnpm lint-lessons` e os testes. O YAML é a fonte; não edite `lessons.generated.ts` manualmente. Use linguagem acolhedora: explique termos e evite culpar o aluno. Exemplos devem conter somente dados fictícios.

## Revisão e testes

Cada mudança de detecção precisa de um caso que falharia antes dela. Inclua variantes de TS/JSX e posições quando aplicável. Core deve continuar importável em navegador; não exporte APIs de Node pelo entrypoint principal. Use `@secmentor/core/node` e `/llm` para capacidades opcionais.

Não envie benchmarks sintéticos como prova de precisão. Descreva ambiente e cenário das medições. Antes de promover uma correção como segura, teste o código corrigido e revise sua semântica.

## Comunicação de segurança

Não abra uma issue pública com segredo ou exploração real. Consulte [SECURITY.md](SECURITY.md). Issues de bug, regra e falso positivo têm templates próprios. Comece pelas [tarefas de entrada](docs/good-first-issues.md).
