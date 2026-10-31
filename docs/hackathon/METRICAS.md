# Métricas executadas · 31/10/2026

Build, lint, tipos, lições e testes executados em macOS arm64 com **Node 20.20.2** e pnpm **9.15.9**. Lighthouse executado com Node 24.19.0, Lighthouse **12.8.2** e Chrome for Testing **156**, contra `vite preview` local. São medições de laboratório, não garantia em outros aparelhos nem prova de precisão das regras.

## Funcionalidade e testes

| Medida                               | Resultado observado                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| Famílias de regras / lições pt-BR    | 12 / 12, consumidas do core                                                               |
| Perguntas locais                     | 12; quiz rápido usa cinco perguntas embaralhadas                                          |
| Testes unitários e de componentes    | **118 aprovados**, em sete arquivos: 99 existentes de core/CLI + 19 do front end          |
| Playwright / Chromium                | **7 E2Es aprovados** no build de produção                                                 |
| Cobertura do core                    | **98,94% linhas/declarações**, **95,42% branches**, **100% funções**                      |
| Projeto Express + React no navegador | **3 arquivos, 12 achados, 7 ms de processamento no Worker**                               |
| CLI scan examples/                   | 12 achados em seis arquivos, sem avisos; saída 1 esperada                                 |
| Benchmark anterior do mesmo scanner  | 1.000 arquivos TS sintéticos de 1.249 bytes em 219 ms, incluindo leitura/parse no Node 20 |
| JavaScript inicial                   | Aproximadamente 285 kB minificado / **89 kB gzip**                                        |
| CSS principal                        | Aproximadamente 46 kB / **10 kB gzip**                                                    |
| Editor CodeMirror sob demanda        | Aproximadamente 512 kB / 173 kB gzip                                                      |
| Worker do scanner                    | Aproximadamente 650 kB, separado da thread principal                                      |
| Cache PWA                            | Aproximadamente 2,4 MiB de assets, incluindo rotas lazy e Worker                          |

O tempo de 7 ms vem do `durationMs` real exibido no teste do projeto; inclui o processamento dentro do Worker e suas pausas de progresso. Não inclui download nem criação do Worker. Uma primeira visita fria pode levar mais tempo. Os limites atuais são 1.500 entradas, 1 MiB por arquivo e 20 MiB de texto por projeto.

A cobertura mede apenas o core e exclui o conteúdo gerado. A entrada leve `core/content` é consumida compilada nos testes do front end e aparece como não instrumentada nesse percentual. Não apresentamos cobertura como taxa de acerto ou cobertura integral da UI.

## Lighthouse mobile

| Rota        | Performance | Acessibilidade | Boas práticas |   CLS |
| ----------- | ----------: | -------------: | ------------: | ----: |
| `/`         |      **99** |        **100** |       **100** | **0** |
| `/analisar` |      **93** |        **100** |       **100** | **0** |

Perfil mobile simulado: 412×823 CSS px, CPU 4×, RTT 150 ms e conexão nominal de 1.638,4 Kbps. Primeira visita, incluindo o tour inicial no analisador. As execuções finais foram feitas separadamente. Configuração, horários e FCP/LCP/TBT estão em [lighthouse.json](lighthouse.json).

A primeira medição encontrou contraste insuficiente na animação da landing e deslocamento de layout no analisador. O texto animado passou a manter opacidade integral; o carregamento da rota reserva espaço e o aviso de PWA não desloca a página. A medição foi repetida após essas correções. Lighthouse 100 não equivale a auditoria completa por leitor de tela.

Para reproduzir, sirva o build com `pnpm preview` e rode a ferramenta instalada (Chrome precisa estar disponível):

```sh
mkdir -p .lighthouse
pnpm --filter @secmentor/playground exec lighthouse http://127.0.0.1:4173/ --chrome-flags='--headless' --only-categories=performance,accessibility,best-practices --output=json --output-path=../../.lighthouse/inicio.json
pnpm --filter @secmentor/playground exec lighthouse http://127.0.0.1:4173/analisar --chrome-flags='--headless' --only-categories=performance,accessibility,best-practices --output=json --output-path=../../.lighthouse/analisador.json
```

## Fluxos verificados

- Gates: `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage`, `pnpm lint-lessons` e `pnpm test:e2e`.
- Exemplo vulnerável → Worker → achado → lição → diff → quiz com feedback e resultado.
- `/demo` no build real, navegação entre etapas e chegada ao quiz.
- Landing mobile 360 px sem overflow horizontal, tema escuro e menu.
- PWA: primeira visita completa, recarga com service worker ativo e abertura de biblioteca/demo com rede desativada.
- Cookie: aplicar httpOnly, desfazer, analisar novamente, baixar JSON e reabrir código pelo fragmento comprimido do link.
- ZIP: importar duas fontes, mostrar caminhos no painel e encontrar ambas as famílias de falha sem executar código.
- Projeto Express + React real lido de `examples/`, com árvore/painel de arquivos, doze achados e captura.
- Componentes: filtros/resultados, painel, diff, quiz, criador YAML e nenhum acesso ao endpoint antes do consentimento.
- Stores/utilitários: persistência sem código, progresso, sequência de dias, limites de arquivo/ZIP, schema do core e patch seguro.

Capturas reais geradas por Playwright em [docs/screenshots](../screenshots/README.md). O service worker fica desabilitado no servidor de desenvolvimento para evitar caches antigos durante edição.

## Limites e pendências

- CI, Pages, comentário de PR e code scanning estão configurados, mas não foram executados no GitHub nesta sessão. Nenhum push, deploy público, publicação npm/Marketplace ou submissão ao evento foi feito.
- O front end foi testado em Chromium. Firefox, WebKit, leitor de tela e auditoria manual completa de WCAG ainda precisam de revisão.
- IA real não foi chamada. O adaptador existente tem testes simulados e a UI foi testada até o consentimento. Endpoints precisam permitir CORS; uma base HTTP pode ser bloqueada por uma página HTTPS. Chaves no localStorage não têm criptografia.
- Perguntas extras da IA aparecem com respostas expansíveis; não entram na pontuação do quiz local.
- Metadados são atualizados por rota no navegador. Crawlers sem JavaScript recebem o Open Graph geral da landing; não há prerender por lição.
- O navegador não tem Git: .env importado recebe alerta conservador. Use a CLI para verificar rastreamento/ignore reais.
- O core mantém heurísticas por arquivo, sem resolução completa de escopos e sem fluxo entre arquivos ou banco de CVEs. Auto-fix cobre apenas httpOnly; en é esqueleto.
- Os chunks do editor e da exportação são grandes, mas carregados sob demanda; não fazem parte do JavaScript inicial. Cache PWA completo exige primeira visita bem-sucedida e não atravessa navegador, perfil ou origem.
- A extensão VS Code da etapa anterior compila e gera VSIX, mas sua interface não pôde ser conferida por timeout do controle nativo. Essa pendência não foi apresentada como teste concluído.
- Impacto educacional e precisão em corpus externo ainda não foram medidos.
