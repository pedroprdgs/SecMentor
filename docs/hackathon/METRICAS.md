# Métricas executadas · 31/10/2026

Ambiente: macOS arm64, Node **20.20.2**, pnpm **9.15.9**. Também houve execução da suíte no Node 24.19.0. Os números abaixo descrevem esta máquina e estes cenários, não garantias de precisão ou velocidade em outros projetos.

| Medida                 | Resultado                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Famílias de regras     | 12, SM001–SM012                                                                                         |
| Lições completas pt-BR | 12 YAMLs validados por Zod                                                                              |
| Perguntas locais       | 12, uma por lição                                                                                       |
| Fixtures               | Vulnerável, corrigida e falso positivo por regra; configuração também tem testes com metadados Git/JSON |
| Suíte                  | 99 testes em 5 arquivos, incluindo CLI ponta a ponta                                                    |
| Cobertura do core      | 99,15% linhas/declarações; 95,41% branches; 100% funções                                                |
| Scan de examples/      | 12 achados em 6 arquivos; 0 avisos; saída 1 esperada                                                    |
| Benchmark              | 1.000 arquivos TS de 1.249 bytes em 219 ms, incluindo leitura e parse                                   |
| Build web              | ~905 kB JS, ~234 kB gzip, mais CSS/HTML; Babel domina o bundle                                          |
| VSIX                   | Empacotado com sucesso; aproximadamente 200 kB comprimido                                               |

A cobertura exclui o arquivo de conteúdo gerado e mede apenas o core. Os testes de CLI são processos reais, mas sua instrumentação não entra no percentual do core. Não apresentamos cobertura como taxa de acerto das regras.

## Gates e ações executadas

- `pnpm build`: core, CLI, extensão e playground compilados.
- `pnpm lint`: ESLint e Prettier.
- `pnpm typecheck`: TypeScript strict nos pacotes, scripts e testes.
- `pnpm test:coverage`: suíte e limiares de cobertura.
- `pnpm lint-lessons`: schema, IDs, opções de quiz e sincronização do conteúdo compilado.
- `secmentor scan examples/`: terminal, JSON e SARIF, sem executar os apps vulneráveis.
- `secmentor quiz`: percurso completo de 12 perguntas via processo interativo de teste, com feedback e progresso em pasta temporária. Quiz por ID também foi exercitado durante o desenvolvimento.
- `secmentor fix`: cancelamento e confirmação testados em arquivo descartável.
- `secmentor init --hook`: hook instalado e executado em repositório temporário; um hook existente é preservado.
- `vsce package --no-dependencies --allow-missing-repository`: pacote instalável gerado após corrigir o nome do manifesto.
- Playground em navegador real: temas, seleção de achado, antes/depois, navegação das abas por setas, quiz, progresso, edição e análise sem achados. Viewports 375, 768 e 1440 px sem overflow horizontal nos cenários conferidos. Menu mobile com foco inicial e fechamento por Escape.

Capturas reais: [desktop](../assets/demo.png) e [mobile](../assets/demo-mobile.png). São capturas do playground local, não um mockup.

## Reproduzir o benchmark

```sh
pnpm benchmark
```

O script cria um repositório temporário com 1.000 arquivos TypeScript sintéticos, cada um com 20 funções pequenas e distintas. Exclui o tempo de criação dos arquivos, inclui caminhada, leitura, consulta Git e parse. Não tem achados nem imports complexos. Remove só a pasta temporária criada pelo próprio script ao terminar. O desempenho em monorepos reais ainda precisa ser medido.

## O que não foi validado ou publicado

- A interface do Extension Host não pôde ser conferida: o controle nativo do VS Code expirou por timeout. Build, tipos e empacotamento passaram. Validação manual de diagnósticos, painel e ação rápida no editor ainda é necessária.
- Workflows de CI, comentário de PR, code scanning e Pages estão implementados, mas não foram executados no GitHub nesta sessão.
- Nenhuma publicação npm, Marketplace, push remoto, deploy público, criação de issues remotas ou submissão ao evento foi realizada.
- O adaptador de IA foi testado com respostas HTTP simuladas, falhas e fallback; não houve chamada a modelo real.
- Não houve auditoria completa de acessibilidade por leitor de tela, estudo com alunos ou medição de precisão em corpus externo.
- O bundle web é grande para uma primeira visita. A análise síncrona pode bloquear a interface em arquivos grandes; Worker e carregamento dividido são melhorias futuras.
- Auto-fix cobre apenas `httpOnly: false`. Tradução en é um esqueleto. Rastreamento de fluxo entre arquivos e resolução completa de escopos não existem nesta versão.

Esses limites devem acompanhar o pitch. Não apresentar funcionalidades futuras, impacto esperado ou integrações não executadas como resultados observados.
