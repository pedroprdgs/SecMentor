# Checklist da apresentação

## Antes de começar

- Use Chromium/Chrome, navegador validado nesta revisão. Feche abas com dados pessoais e notificações.
- Terminal na raiz: `pnpm build`, depois `pnpm preview`. Use a porta exibida; mantenha o processo aberto.
- Abra a landing, `/demo`, `/analisar`, `/contribuir` e `/progresso`. Pule o tour antes de apresentar.
- Use zoom de 100%, tema claro ou escuro previamente escolhido e uma janela com pelo menos 1280 px de largura quando possível.
- Deixe a IA desligada. Use apenas exemplos fictícios.
- Aguarde “Aplicativo pronto para uso offline” e confira a demo uma vez sem rede, na mesma origem e no mesmo perfil.
- Abra também o [vídeo local da demo](../assets/demo-release.webm) e deixe-o disponível sem internet. É uma execução gravada em Chromium, sem narração; identifique-o como gravação.

## Ordem exata · cerca de três minutos

1. Landing: “Segurança em português, análise local, doze regras e doze lições”.
2. `/demo`: mostre o achado SQL, pause para explicar, abra “Antes e depois” e avance ao quiz.
3. Escolha **Query parametrizada** pelo texto; a ordem muda. Mostre feedback e resultado.
4. `/analisar`: escolha **Projeto Express + React**, analise e mostre arquivos, doze achados e a linha marcada ao selecionar um resultado.
5. Se quiser mostrar correção automática, carregue **SM009**, confirme a troca do exemplo, analise e selecione o cookie da **linha 2**. Abra o diff, aplique e desfaça. SQL não tem auto-fix.
6. `/contribuir`: mostre o YAML validado e baixe. Não envie uma issue durante a apresentação.
7. `/progresso`: pontos e conquistas locais. Não apague os dados enquanto estiver mostrando o histórico.

Atalhos: `Tab`/`Shift+Tab` movem o foco, `Enter` aciona botões, `Escape` fecha diálogos e setas alternam as abas da lição. `⌘+R` atualiza no Mac. No editor, `Escape` e depois `Tab` permitem sair da indentação por Tab. Os controles da demo permitem pausar e avançar manualmente; movimento reduzido começa pausado.

## Planos B

- **Sem internet:** use a PWA já carregada, no mesmo navegador, perfil e endereço. O cache de uma porta não serve para outra.
- **Deploy indisponível ou antigo:** use o build local. Sem pnpm global: `node packages/playground/node_modules/vite/bin/vite.js preview packages/playground --host 127.0.0.1 --port 4174`. Abra `http://127.0.0.1:4174/demo`.
- **Navegador com problema:** abra o WebM já baixado. Diga que é uma gravação, não uma análise ao vivo. As capturas em `docs/screenshots/` também servem de apoio.
- **Vídeo indisponível:** use a CLI compilada: `node packages/cli/dist/index.js scan examples/`, depois `node packages/cli/dist/index.js explain SM001`. Scan termina com código 1 porque encontra falhas; não encadeie com `&&`.

## Respostas curtas

**Por que não depende de um modelo específico?** A detecção usa regras e AST. Qualquer endpoint compatível pode aprofundar a explicação; a demo não precisa de IA.

**Isso não é só um linter?** O alerta inicia a aula: analogia, exemplo inofensivo, diff, checklist, referência e quiz em português. O criador permite contribuir só com conteúdo.

**Como garante que a IA não erra?** Não garantimos. Ela não detecta falhas nem aplica correções; textos devem ser revisados. As lições locais continuam disponíveis em caso de falha.

**E a privacidade?** Análise e quiz rodam localmente. IA exige ativação e confirmação por envio, recebe lição e pergunta e não recebe o editor automaticamente. Relatórios e links só devem ser compartilhados após revisão.

**O scanner garante que está seguro?** Não. São heurísticas educativas por arquivo, com falsos positivos e negativos. Não substituem revisão de segurança.

## Limites que não devem virar promessa no pitch

Consulte [METRICAS.md](METRICAS.md) e [REVISAO_QA.md](REVISAO_QA.md). Há avisos de dependências pendentes, outros navegadores e auditoria completa de acessibilidade ainda não validados. A versão permanece 0.1.0; tag v1.0.0 e publicação exigem confirmação do mantenedor.
