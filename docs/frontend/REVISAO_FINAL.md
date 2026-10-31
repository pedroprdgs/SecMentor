# Revisão final do front end

Registro da etapa anterior. A revisão posterior e as evidências atuais estão em [REVISAO_QA.md](../hackathon/REVISAO_QA.md).

Data: 31/10/2026. Evolução de `packages/playground`, consumindo o scanner, as regras e as lições existentes.

## Correções da revisão

- O editor usa cores dos temas e distingue atualizações externas de digitação. Aplicar um patch não dispara uma segunda edição no store.
- O botão de desfazer exige o mesmo arquivo e a mesma revisão da correção. Digitar ou importar outra versão invalida esse botão, preservando as edições posteriores.
- Arquivos arrastados são capturados antes do primeiro `await`, enquanto o navegador ainda permite ler `DataTransfer`. Um teste reproduz a proteção após o primeiro arquivo.
- A sequência de dias deixa de aparecer como ativa depois de um dia completo sem estudo.
- A demonstração pausa quando a preferência de movimento reduzido está ativa.
- Falhas de IA identificam a resposta como lição local. O botão de compartilhar identifica corretamente a cópia do link.
- O logo decorativo não repete o nome da marca para leitores de tela. O lockfile declara as dependências diretas já usadas pelo editor e pelo PWA.
- Lint e formatação ignoram relatórios e traces gerados pelo Playwright e Lighthouse, incluindo artefatos de execuções com falha.

## Validação

Build de produção, lint, typecheck, 118 testes unitários/componentes, cobertura e validação das 12 lições aprovados. Os sete E2Es em Chromium verificam o fluxo de estudo, a demo, responsividade, PWA offline, correção/desfazer, exportação, compartilhamento, ZIP e o projeto Express + React.

O teste da demo aguarda o avanço automático da análise até a explicação, o diff e o quiz. O teste de correção também confirma que editar depois do patch remove o botão de desfazer a correção.

Lighthouse mobile medido: landing 99/100/100 e analisador 93/100/100, respectivamente performance, acessibilidade e boas práticas. Relatório, ambiente, métricas e limites completos em [METRICAS.md](../hackathon/METRICAS.md).

## Limites mantidos explícitos

Nenhum push ou deploy público foi executado. CI e Pages precisam de execução no GitHub. IA real, outros navegadores e auditoria manual completa por leitor de tela permanecem sem validação. Metadados por rota dependem de JavaScript; crawlers sem JavaScript recebem o Open Graph geral. Perguntas extras de IA são exibidas com respostas expansíveis, sem pontuação no quiz local. A correção automática cobre somente `httpOnly`; inglês permanece como esqueleto.
