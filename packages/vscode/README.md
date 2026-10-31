# SecMentor para VS Code

Diagnósticos locais em português para JavaScript, TypeScript e JSX. Nenhum código é executado ou enviado.

No monorepo: `pnpm build`, abra a raiz no VS Code e pressione F5 com a configuração **SecMentor: testar extensão**.
Abra `examples/express/app.js`, use a lâmpada sobre um achado e escolha **Explicar com o SecMentor**.
A barra de status mostra a contagem de achados. Apenas `httpOnly: false` tem correção automática deliberadamente limitada.

Para gerar o instalador: `pnpm --filter @secmentor/vscode exec vsce package --no-dependencies --allow-missing-repository`.
Instale o `.vsix` com **Extensions: Install from VSIX**. A extensão ainda não foi publicada no Marketplace.
