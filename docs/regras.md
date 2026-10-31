# Regras e limites conhecidos

O scanner é uma ferramenta educativa baseada em padrões. Não prova explorabilidade nem ausência de falhas. AST reduz alertas em comentários e documentação, mas não resolve o programa inteiro.

| ID    | O que reconhece                                                                                                                          | Limite e falso positivo conhecido                                                                                         |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| SM001 | `query`/`execute` com SQL concatenado ou template com interpolação; resolve aliases de variáveis locais                                  | Não rastreia funções ou parâmetros sanitizados; concatenação de identificadores confiáveis pode alertar                   |
| SM002 | atribuição a `innerHTML`, atributo React `dangerouslySetInnerHTML`, `document.write`                                                     | HTML constante ou já sanitizado também alerta; exige revisão de sanitização                                               |
| SM003 | literais de pelo menos quatro caracteres atribuídos a nomes como password, secret, apiKey e accessToken                                  | Tokens com nomes incomuns podem escapar; valores de teste com nomes de credencial podem alertar                           |
| SM004 | `createHash` com MD5/SHA1; senha aparentemente crua em `save/create/insert/update`                                                       | MD5 para checksum não é senha e ainda alerta; bcrypt mal configurado não é detectado                                      |
| SM005 | `.env` e variantes rastreados ou não ignorados pelo Git; poupa example/sample/template                                                   | Não examina histórico nem o provedor remoto; sem Git não confirma proteção                                                |
| SM006 | `eval`, `Function`/`new Function`, timers com strings literais/aliases                                                                   | Bindings locais com os mesmos nomes podem alertar; strings calculadas e APIs indiretas podem escapar                      |
| SM007 | `exec`/`execSync` e formas usuais `child_process.exec`/`cp.exec` com origem req/request/process.argv e aliases locais                    | Não resolve aliases de imports nem fluxo entre funções; entrada validada fora do padrão ainda pode alertar                |
| SM008 | operações de fs com caminho diretamente vindo de entrada externa e aliases locais                                                        | Não prova contenção; chamadas intermediárias como normalize/resolve interrompem o rastreamento e requerem revisão         |
| SM009 | CORS `*`/reflexão com credenciais; cookies sem flags explícitas ou com false                                                             | Cookies não sensíveis podem alertar; spreads/flags dinâmicas não são provados seguros; HTTPS é responsabilidade do app    |
| SM010 | `jwt.decode`; verify sem algoritmos explícitos/`maxAge`, algoritmo inválido, ignoreExpiration; sign sem expiresIn; segredo literal curto | Biblioteca pode verificar exp automaticamente, mas a regra exige política explícita; não analisa claims e origem da chave |
| SM011 | versões `*` ou `latest` em quatro seções do package.json                                                                                 | Não é banco de CVEs; ranges semver e lockfile não são auditados                                                           |
| SM012 | igualdade/desigualdade de identificadores com nomes de token/secret/password/signature                                                   | Comparação não usada para autenticação pode alertar; aliases ou nomes genéricos podem escapar                             |

As correções são exemplos didáticos, não patches universais. `path.normalize` sozinho não garante contenção. A lição de path traversal exige verificar `path.relative` e tratar links simbólicos; ainda há condições de corrida que pedem desenho seguro de acesso a arquivos.

O mapa de variáveis é por arquivo, sem resolução de escopo ou fluxo de controle. Nomes iguais em funções diferentes, reatribuição e desestruturação podem causar falsos positivos ou negativos. Não use o resultado como único gate de segurança.

Para reportar um falso positivo: envie a menor reprodução com dados fictícios, resultado esperado e versão do SecMentor. Nunca publique credenciais reais.
