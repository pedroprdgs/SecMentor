# App Express vulnerável de propósito

O scanner não precisa instalar nem executar este app: `pnpm secmentor scan examples/express`.
O pacote fictício em devDependencies é uma fixture de SM011. Não rode `npm install` nesta pasta.

Para servir apenas a rota demonstrativa, sem instalar o pacote fictício:

```sh
npm install --omit=dev --package-lock=false --ignore-scripts
SECMENTOR_RUN_UNSAFE_DEMO=sim npm start
```

A aplicação só escuta em `127.0.0.1`. A query é simulada e não usa banco. As outras funções existem para análise estática.
Mesmo assim, nunca publique este exemplo nem use credenciais ou dados reais.
