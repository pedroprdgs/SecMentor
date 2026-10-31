# Demo reproduzível

## Preparação antes do evento

1. Instale Node 20 e pnpm 9.15.9. Na raiz, execute `pnpm install --frozen-lockfile` e `pnpm build`.
2. Execute `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage` e `pnpm lint-lessons`. Os gates devem passar.
3. Abra o repositório no VS Code, escolha **SecMentor: testar extensão** e pressione F5. No novo editor, abra `examples/express/app.js`. Confirme os avisos e a ação **Explicar com o SecMentor** antes de gravar.
4. Rode `pnpm dev` e abra a URL local impressa. O servidor deve continuar aberto durante a demo. Confira tema e zoom legível.
5. Não instale nem execute os apps vulneráveis. O scanner só precisa dos arquivos. Desative qualquer gravação de credenciais no terminal.

## Sequência ao vivo · sem IA

```sh
node packages/cli/dist/index.js rules
node packages/cli/dist/index.js scan examples/
```

O scan termina com **1**, pois encontrou falhas. Isso é esperado. Não encadeie com `&&` se quiser executar outro comando após o scan.

```sh
node packages/cli/dist/index.js explain SM001
node packages/cli/dist/index.js quiz SM001
```

Leia as opções: elas são embaralhadas. Responda com o número de **Query parametrizada**. Mostre o feedback, pontuação e caminho do progresso. Para não misturar com seu progresso pessoal, configure `SECMENTOR_HOME` para uma pasta temporária antes do quiz.

No playground: carregue API Express, clique em SQL injection, abra Antes e depois, depois Teste o que aprendeu. Responda e confira Meu progresso. Edite o código, observe “Alterações não analisadas” e clique em Analisar código.

No VS Code: use a lâmpada sobre a query e escolha Explicar. Em `httpOnly: false`, confira a ação de correção. Se aplicar, use desfazer para restaurar o exemplo.

Para demonstrar fix sem alterar exemplos, crie um arquivo temporário contendo `res.cookie("s", value, { httpOnly: false, secure: true });`. Rode `node packages/cli/dist/index.js fix /caminho/temporario.js`, mostre o diff e digite `sim` apenas para esse arquivo descartável.

## IA opcional

Prepare o endpoint antes do evento. Configure `SECMENTOR_LLM_BASE_URL`, `SECMENTOR_LLM_MODEL` e a chave somente se necessária. Use `explain SM001 --ia --pergunta 'Por que usar parâmetros?'`. Não exiba a chave na gravação. Falha retorna a lição local em até oito segundos por chamada.

## Plano B sem internet, IA ou servidor web

Depois de instalar e compilar, desligue a internet e use `node packages/cli/dist/index.js scan examples/`, `explain SM001` e `quiz SM001`. Eles não dependem de rede. Não tente reinstalar dependências durante a apresentação.

Para o navegador, sirva o build já pronto com `pnpm --filter @secmentor/playground exec vite preview --host 127.0.0.1`. Se não houver navegador disponível, mostre `docs/assets/demo.png` como captura previamente realizada e continue a demo real no terminal.

Se houver falha na extensão, explique o limite e use CLI/playground; não afirme que a extensão foi testada ao vivo. Veja METRICAS.md para a validação feita nesta entrega.
