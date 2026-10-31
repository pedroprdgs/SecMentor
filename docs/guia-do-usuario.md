# Guia do usuário

## Analisar e aprender

Execute os comandos na raiz após `pnpm install` e `pnpm build`. `pnpm secmentor scan <caminho>` aceita pastas ou arquivos JS, TS, JSX, TSX, MJS, CJS, MTS, CTS, `package.json` e `.env`/variantes. Não há suporte a outros idiomas. Arquivos maiores que 1 MiB são ignorados com aviso.

O scanner não executa imports nem scripts do projeto. `.git`, `node_modules`, `dist`, `coverage` e `.next` são excluídos. Links simbólicos encontrados durante a caminhada não são seguidos. Um arquivo solicitado diretamente é resolvido antes de análise. Caminhos nos resultados são relativos à pasta analisada.

`.gitignore` usa `git check-ignore --no-index` em lote; arquivos rastreados continuam analisados mesmo se ignorados. `.env` é inspecionado mesmo quando ignorado para conferir se já está rastreado. Sem Git, o scanner emite aviso e considera a proteção do `.env` não confirmada.

Códigos de saída: **0** sem achados ou avisos; **1** com achados; **2** erro ou análise incompleta. Não interprete falha de parse como aprovação.

## Filtros e configuração

```sh
pnpm secmentor init
pnpm secmentor scan src --severidade-minima alta --ignorar 'SM003,**/generated/**'
```

`.secmentorrc` é YAML com chaves `ignore`, `ignoreRules` e `minimumSeverity`. O arquivo mais próximo, começando na pasta analisada e subindo até a raiz do sistema, é usado. Não combina múltiplos arquivos. Níveis válidos: `baixa`, `media`, `alta`, `critica`.

```yaml
ignore:
  - '**/fixtures/**'
ignoreRules:
  - SM011
minimumSeverity: media
```

Globs de `ignore` são relativos à raiz do scan: `*` não atravessa diretórios, `**` atravessa, `?` representa um caractere. Sem negação ou classes de caracteres. Se você analisa `src`, não prefixe os padrões com `src/`. Ignorar regras deve ser uma decisão consciente, registrada na revisão.

## Lições e quiz

```sh
pnpm secmentor explain SM001
pnpm secmentor quiz SM001
pnpm secmentor quiz
```

Cada lição contém resumo, analogia, exemplos, experimento inofensivo, erros comuns, checklist, referências e quiz. O quiz completo percorre as 12 lições; o quiz por ID contém uma pergunta nesta versão. As opções são embaralhadas. A cada cinco acertos acumulados, o nível aumenta. Repetir perguntas conta para o nível; a conquista Guardião do código exige acertar pelo menos uma pergunta de cada uma das 12 lições.

O progresso fica em `~/.secmentor/progresso.json`, com permissão restrita e gravação por renomeação. `SECMENTOR_HOME` muda a pasta. Arquivo corrompido não é sobrescrito: copie-o e restaure manualmente. Sessões simultâneas não são sincronizadas; evite dois quizzes CLI ao mesmo tempo.

No playground, o progresso conta lições distintas e usa um nível a cada quatro lições. Ele não se sincroniza com a CLI. Limpar dados do navegador remove esse progresso. Sem armazenamento disponível, o estado dura só a sessão.

## Correção assistida

`pnpm secmentor fix arquivo.ts` mostra um diff de `httpOnly: false` para `true` em chamada de cookie reconhecida. Só grava após digitar `sim`; qualquer outra resposta cancela. Mudanças concorrentes no arquivo impedem aplicação. Não há correção automática para outras regras. Confira sessões que dependiam de ler cookies no JavaScript e rode seus testes.

## IA opcional

Exporte `SECMENTOR_LLM_BASE_URL`, `SECMENTOR_LLM_MODEL` e, se necessário, `SECMENTOR_LLM_API_KEY`. A base deve incluir `/v1` se o servidor exigir. A CLI acrescenta `/chat/completions`. Sem `--ia`, nenhuma chamada acontece, mesmo com variáveis configuradas.

Use `scan --ia`, `explain SM001 --ia --pergunta 'O que é um parâmetro?'` ou `quiz SM001 --ia`. O timeout é de oito segundos por chamada. O quiz gerado passa pelo mesmo schema Zod. O fallback usa lições embutidas ou personalizadas. Respostas de IA são texto sem execução e não recebem automaticamente o código analisado.

## Pacotes de lições

Copie um YAML de `lessons/pt-BR` para uma pasta própria e mantenha o ID da regra. Execute `pnpm secmentor --lessons ./minhas-licoes lint-lessons`. Um pacote parcial substitui IDs correspondentes; as demais lições permanecem embutidas. IDs adicionais são aceitos para consulta e quiz, mas não criam detectores. Nenhum pacote executa scripts. Arquivos inválidos, IDs duplicados e índice de resposta fora das opções são rejeitados.

## Hook e extensão

`pnpm secmentor init --hook` cria um pre-commit se ainda não existir. O hook usa caminhos absolutos para o Node e a CLI compilada desta instalação, sem depender de um bin global. Rode o build antes de gerar o hook. Se mover a instalação ou remover o runtime, atualize o hook manualmente. Ele analisa a árvore de trabalho inteira, não apenas mudanças staged. Um hook existente é preservado.

A extensão detecta 10 famílias de código em buffers JS/TS; regras de `.env` e manifesto dependem da CLI. O status mostra achados do arquivo ativo. F5 abre o ambiente de desenvolvimento. A ação rápida aplica somente `httpOnly`; use desfazer do editor se necessário.

## Problemas comuns

- **Nenhum comando pnpm:** habilite Corepack ou instale pnpm 9.15.9 pelo gerenciador oficial.
- **Não encontra @secmentor/core:** rode `pnpm build`; os consumidores usam o core compilado.
- **Lições desatualizadas:** rode `pnpm lessons:compile` e `pnpm build`.
- **Parse inválido:** confira o aviso, corrija a sintaxe e repita o scan.
- **SARIF sem upload:** confira permissões e disponibilidade de code scanning para seu repositório no GitHub.
- **Sem resposta de IA:** confira base e modelo. A lição local continua disponível.
