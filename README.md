# SecMentor

**Segurança de código que ensina. Em português. Na sua máquina.**

![Node 20+](https://img.shields.io/badge/Node-20%2B-416c25) ![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178c6) ![Offline](https://img.shields.io/badge/n%C3%BAcleo-100%25_offline-416c25) ![MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)

Quase todo material de segurança de código está em inglês e é pensado para profissionais. O SecMentor nasce para reduzir essa barreira: detecta falhas comuns no código do aluno e explica, em português e passo a passo, o que é, por que é perigoso, como demonstrar o risco de forma inofensiva e como corrigir. Essa é nossa motivação, não uma estatística de mercado medida.

**O objetivo é o próximo commit do aluno ser melhor — e ele entender por quê.**

![Playground do SecMentor](docs/assets/demo.png)

## Experimente em três comandos

Requisitos: Node 20+, Git e Corepack. Execute na raiz deste repositório já clonado:

```sh
corepack enable && pnpm install --frozen-lockfile
pnpm build
pnpm secmentor scan examples/
```

O último comando termina com **código 1**, pois os exemplos são vulneráveis de propósito. Não os publique.
Sem pnpm disponível, ative a versão do `packageManager` com Corepack. Se `corepack enable` exigir permissão, use uma instalação de Node gerenciada pelo usuário.

Abra o laboratório com `pnpm dev`, normalmente em **http://127.0.0.1:5173**. A CLI compilada também funciona com `node packages/cli/dist/index.js`.

## Um achado vira uma lição

```text
ALTA SM001 · SQL injection
  express/app.js:14:3
  A consulta mistura SQL e valores variáveis. Use parâmetros.
  Lição: secmentor explain SM001
```

```sh
pnpm secmentor explain SM001
pnpm secmentor quiz SM001
pnpm secmentor scan examples/ --json
pnpm secmentor scan examples/ --sarif > resultado.sarif
pnpm secmentor scan examples/ --severidade-minima alta --ignorar 'SM003,**/fixtures/**'
pnpm secmentor fix caminho/arquivo.js
pnpm secmentor --lessons ./minhas-licoes explain SM001
```

`fix` mostra o diff e exige **sim** antes de escrever. Nesta versão, só ativa `httpOnly: false` em chamadas de cookie reconhecidas. SQL, JWT e segredos exigem mudanças com contexto; suas correções são ensinadas nas lições.

## O que já existe

| Superfície  | Comportamento                                                                                             |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| Core        | 12 regras, AST Babel para JS/TS/JSX, configuração por regex, posições, filtros, avisos e 12 lições Zod    |
| CLI         | Scan, explain, quiz, fix, rules, lint-lessons e init; terminal, JSON e SARIF 2.1.0                        |
| Playground  | Editor, exemplos, filtros, marcação de linhas, lições, antes/depois, quiz, progresso e temas claro/escuro |
| VS Code     | Diagnósticos, painel lateral, ações rápidas e contagem na barra de status                                 |
| GitHub      | Action composta, resumo didático, comentário de PR elegível, upload SARIF e workflow Pages                |
| IA opcional | Aprofunda lições, responde dúvidas e gera quiz. Desligada por padrão, com fallback local                  |

As 12 regras cobrem SQL injection, XSS, segredos, senhas fracas, exposição de `.env`, execução dinâmica, command injection, path traversal, CORS/cookies, JWT, dependências imprevisíveis e comparação de segredos.

**Heurísticas educativas, não uma auditoria completa.** Há falsos positivos e falsos negativos. Não há análise de fluxo entre arquivos, resolução completa de escopo ou consulta a bancos de vulnerabilidades de dependências. Confira os [limites por regra](docs/regras.md).

## Privacidade é o padrão

O núcleo não tem cliente HTTP, telemetria ou backend. Scanner e extensão **não executam o código analisado**. O playground usa o mesmo core no navegador, com assets locais e sem fontes/CDNs externas. Depois de instalar e compilar, análise e lições não precisam de internet. Servir o build localmente permite usá-lo offline; não há service worker para garantir o cache de uma primeira visita remota.

Apenas `--ia` habilita acesso ao endpoint explicitamente configurado. O adaptador recebe a lição e, se informada, a dúvida do aluno: **não recebe o arquivo, o caminho nem o trecho detectado**. Não inclua segredos ou código privado em perguntas. Um endpoint remoto recebe esse conteúdo; use um endpoint local se quiser manter tudo na máquina.

```sh
export SECMENTOR_LLM_BASE_URL=http://127.0.0.1:1234/v1
export SECMENTOR_LLM_MODEL=identificador-do-modelo-local
# SECMENTOR_LLM_API_KEY é opcional para endpoints locais.
pnpm secmentor explain SM001 --ia --pergunta 'Por que parâmetros ajudam?'
```

O contrato usa [`POST /chat/completions`](https://developers.openai.com/api/reference/resources/chat), por compatibilidade com endpoints existentes. O projeto não escolhe nem baixa modelos. Falha de rede, resposta inválida ou ausência de configuração retorna conteúdo das lições. A IA **nunca detecta falhas** e suas respostas devem ser revisadas.

Progresso da CLI: `~/.secmentor/progresso.json`; do navegador: `localStorage`, sem sincronização. `SECMENTOR_HOME` permite uma pasta alternativa. Relatórios JSON/terminal ocultam trechos de SM003; outros trechos podem conter dados privados. SARIF não contém código, mas inclui caminhos e mensagens. Publicar relatórios continua sendo uma decisão do usuário. A Action envia o SARIF ao GitHub quando configurada.

## Arquitetura

```mermaid
flowchart LR
  Arquivos[JS / TS / JSX / configurações] --> Regras[Core: AST + regras]
  Regras --> Achados
  YAML[Lições YAML pt-BR + Zod] --> Tutor
  Achados --> Tutor
  Tutor --> CLI
  Tutor --> Playground[React no navegador]
  Tutor --> VSCode[VS Code]
  Achados --> SARIF[GitHub Action / SARIF]
  Tutor -. opt-in, somente lição e dúvida .-> LLM[LLMProvider]
  LLM -. falha: lição local .-> Tutor
```

```text
packages/core         scanner, schema, lições compiladas, relatórios e LLMProvider
packages/cli          comandos e progresso local
packages/playground   Vite + React + Tailwind
packages/vscode       extensão empacotada com esbuild
lessons/pt-BR          fonte das lições
lessons/en            esqueleto de tradução
examples              apps vulneráveis para inspeção local
docs/hackathon        pitch, roteiro, demo, arquitetura e métricas
```

## Desenvolvimento e qualidade

```sh
pnpm build
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm lint-lessons
pnpm benchmark
```

O build compila as lições antes dos pacotes. Os testes da CLI usam o build: execute `pnpm build` primeiro. A CI usa Node 20 e executa todos esses gates, exceto o benchmark. As métricas executadas e os limites da validação estão em [METRICAS.md](docs/hackathon/METRICAS.md).

Para testar a extensão: abra a raiz no VS Code e pressione F5 com a configuração **SecMentor: testar extensão**. Para gerar VSIX, veja [o guia](packages/vscode/README.md).

## GitHub Action e Pages

`action.yml` pode ser usada como Action local depois de checkout (`uses: ./`) ou via referência deste repositório após publicação. Copie o exemplo em [docs/github-action.md](docs/github-action.md), usando a referência real e, preferencialmente, um SHA revisado. Achados não bloqueiam o job por padrão; análise incompleta bloqueia. O output `exit-code` permite definir a política do repositório.

O workflow [Pages](.github/workflows/pages.yml) publica `packages/playground/dist` após habilitar **Settings → Pages → GitHub Actions** no GitHub. Nenhum deploy remoto foi feito por esta entrega.

## Comunidade e próximos passos

[Contribuir em dez minutos](CONTRIBUTING.md) · [Guia do usuário](docs/guia-do-usuario.md) · [Arquitetura](docs/arquitetura.md) · [Roadmap](docs/roadmap.md) · [Código de conduta](CODE_OF_CONDUCT.md) · [Segurança](SECURITY.md)

Comece por uma das [oito tarefas para iniciantes](docs/good-first-issues.md). Também aceitamos contribuições só nas lições: explicar bem é parte do produto.

Próximos passos: rastreamento de entrada com escopos, mais fixtures reais, teste automatizado no Extension Host, pacotes de idioma completos e estudo com alunos. Não afirmamos impacto educacional medido antes desse estudo.

Licença [MIT](LICENSE). Material do hackathon: [comece aqui](docs/hackathon/README.md).
