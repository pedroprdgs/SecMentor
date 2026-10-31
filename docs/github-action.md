# GitHub Action e pre-commit

Depois de publicar este repositório, use sua referência real. No próprio repositório, uma Action local funciona assim:

```yaml
name: Segurança que ensina
on: [pull_request]
permissions:
  contents: read
  security-events: write
  pull-requests: write
jobs:
  secmentor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./
        id: scan
        with:
          path: src
          minimum-severity: media
          upload-sarif: 'true'
          comment: 'true'
      - name: Bloquear achados pela política do projeto
        if: steps.scan.outputs.exit-code == '1'
        run: exit 1
```

Em outro projeto, substitua `uses: ./` pelo endereço real deste repositório e um SHA revisado. A Action precisa do código do scanner no seu próprio `github.action_path`, não apenas do código a analisar.

**Não use `pull_request_target` para fazer checkout e executar código não confiável.** O scanner não executa os arquivos inspecionados. PRs de forks não recebem comentário; o resumo do job continua disponível. As políticas de token do GitHub podem impedir SARIF em certos contextos. Se não houver code scanning, use `upload-sarif: 'false'` e consuma o output `sarif` com upload de artifact.

Achados (saída 1) não falham a Action por padrão; o exemplo acima escolhe bloquear. Saída 2 indica análise incompleta e falha ao final. O relatório fica em `$RUNNER_TEMP/secmentor.sarif`. O resumo contém no máximo 30 achados, sem trechos de código. Caminhos ainda podem ser privados. Comentários existentes do bot são atualizados, evitando spam em execuções posteriores.

Para pre-commit, compile o projeto e rode `pnpm secmentor init --hook`, ou use `secmentor init --hook` com a CLI instalada. O hook referencia o Node e a CLI compilada por caminho absoluto; atualize se mover a instalação. Um hook existente nunca é sobrescrito. A análise cobre a árvore de trabalho inteira, não só arquivos staged. Falhas e achados acima de `alta` bloqueiam o commit.

O workflow Pages incluído é independente do scanner. Habilite Pages usando GitHub Actions e execute-o no GitHub. Sem repositório remoto publicado/configurado, não há URL pública a entregar.
