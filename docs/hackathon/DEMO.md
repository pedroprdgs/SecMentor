# Demo visual reproduzível

## Preparar antes do evento

1. Node 20+, pnpm 9.15.9 e dependências instaladas. Rode `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage`, `pnpm lint-lessons` e `pnpm test:e2e`.
2. Sirva o build com `pnpm preview`. Abra a URL impressa, normalmente **http://127.0.0.1:4173/demo**. O build de produção tem PWA; `pnpm dev` é útil para desenvolvimento, mas não registra o service worker.
3. Aguarde “Aplicativo pronto para uso offline”. Confira `/demo`, `/licoes` e `/analisar` antes de desligar a internet.
4. Se o pnpm global estiver indisponível, use `node packages/playground/node_modules/vite/bin/vite.js preview packages/playground --host 127.0.0.1`. Isso não exige sudo.
5. Não execute os apps vulneráveis. O scanner só lê o texto. Use apenas dados fictícios e mantenha a IA desligada na apresentação principal.

## Sequência principal · 2 a 3 minutos

1. **Início (`/`)**: proposta, contadores reais, mini demo pausável e privacidade. Clique em “Ver uma demonstração”.
2. **Demo (`/demo`)**: a primeira etapa executa o Worker de verdade. O fluxo abre a lição, passa ao diff e chega ao quiz. As etapas têm controles manuais e botão de pausa. Com movimento reduzido, avance manualmente.
3. **Quiz**: escolha “Query parametrizada” pelo texto, pois a ordem é embaralhada. Mostre feedback e resultado.
4. **Analisador (`/analisar`)**: pule o tour se já estiver apresentando. Abra a galeria, escolha “Projeto Express + React” e analise. Se houver código aberto, confirme a substituição somente quando ele for descartável. Mostre árvore, progresso e filtros.
5. Clique em um achado SQL: o editor rola e marca a linha. Abra “Antes e depois”. Os exemplos são didáticos e devem ser adaptados ao projeto.
6. **Contribuir (`/contribuir`)**: mostre formulário e preview YAML. Altere o número da resposta para 99 e mostre o erro do Zod; restaure antes de baixar o YAML. Não clique em publicar durante a demo.
7. **Meu progresso (`/progresso`)**: pontos, conquistas e histórico sem código. Feche com o convite para melhorar uma explicação.

Para mostrar correção segura: carregue SM009, analise, selecione o achado da linha do cookie, abra o diff e aplique httpOnly. Mostre “Desfazer última correção”. Essa ação não torna o projeto inteiro seguro e não corrige automaticamente secure/CORS.

Para relatórios, use Exportar JSON/SARIF no fim da análise. A impressão tem explicações e não inclui o código privado do editor; usa exemplos didáticos das lições. O compartilhamento inclui o código no fragmento do link: use apenas um exemplo fictício e mostre o aviso antes de gerar.

## IA opcional

Em `/configuracoes`, informe base URL, modelo e chave se necessária; salve e habilite. O endpoint precisa aceitar CORS e pode ser bloqueado por conteúdo misto HTTPS/HTTP. Cada envio mostra consentimento: somente lição e pergunta são enviadas, nunca o editor automaticamente. Não insira dados privados na pergunta. Se falhar, a lição local continua disponível. A demo principal não depende desse recurso.

## Plano B offline

Após instalar e compilar, e após o cache PWA terminar, desligue a internet. `/demo` e `/licoes` continuam funcionando no mesmo navegador/origem. O teste E2E cobre esse caminho. Se trocar porta, navegador ou perfil, o cache anterior não é compartilhado; mantenha o servidor local e use o build já pronto.

Sem navegador, use os comandos abaixo em terminais separados ou um de cada vez:

```sh
node packages/cli/dist/index.js scan examples/
node packages/cli/dist/index.js explain SM001
node packages/cli/dist/index.js quiz SM001
```

O scan termina com código **1** por encontrar falhas. Não encadeie com `&&`. A CLI e as lições não precisam de internet. Capturas reais em `docs/screenshots/` servem como material de apoio identificado, nunca como falsa execução ao vivo.

A extensão VS Code permanece disponível, mas sua inspeção visual não foi concluída nesta sessão. Não dependa dela no vídeo antes de validá-la manualmente.
