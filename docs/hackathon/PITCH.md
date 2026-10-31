# Pitch · SecMentor

## Versão curta (430 caracteres, limite de 500)

SecMentor transforma falhas de código em lições práticas de segurança em português. Detecta 12 famílias de problemas por regras e AST, explica riscos com analogias, mostra correções e ensina com quizzes. CLI, playground e VS Code funcionam localmente, sem enviar código. IA é opcional e nunca detecta falhas. Open source, feito para quem está aprendendo — porque entender o próximo commit importa tanto quanto corrigir o anterior.

## Versão longa

### Problema

Quase todo material de segurança de código está em inglês e é pensado para profissionais. Essa percepção motivou o projeto; não é uma proporção que medimos. Para quem começa em português, um alerta técnico sem contexto pode virar mais uma barreira. Corrigir por copiar e colar não ensina a reconhecer o próximo erro.

### Solução

O SecMentor é um mentor de segurança que explica o que encontrou, por que é perigoso, como observar o risco sem causar dano e como corrigir. Cada achado leva a uma lição acolhedora, com analogia, antes/depois, checklist, referência e quiz. O aluno não precisa enviar seu código para nenhum serviço.

### Como funciona

Um núcleo TypeScript usa AST Babel e regras explícitas para detectar 12 famílias de falhas em JavaScript, TypeScript, JSX e configurações. Lições YAML validadas por Zod entram no bundle. CLI, playground React e extensão VS Code compartilham o mesmo motor. O GitHub recebe SARIF e um resumo educativo quando a integração é habilitada.

A IA está desligada por padrão. Se o aluno habilitar um endpoint compatível, ela só explica um achado já detectado, responde dúvidas e gera perguntas validadas. Se falhar, a aula continua. Nem o arquivo nem o trecho detectado são enviados automaticamente ao modelo.

### Diferencial

Nossa unidade de valor não é apenas o alerta: é a explicação compreendida. Português completo, operação local e contribuição só em conteúdo tornam o produto acessível a alunos, professores e pessoas que não trabalham com segurança. O quiz transforma a correção em prática, e o progresso oferece continuidade. O criador de lições valida YAML pelo mesmo schema do scanner e permite contribuir sem escrever um detector. O modo demonstração e a PWA mantêm a apresentação acessível mesmo sem rede.

### Impacto esperado e como medir

Queremos reduzir a barreira de idioma e desenvolver autonomia. Ainda não há estudo com usuários. Mediremos entendimento antes/depois, proporção de correções corretas, tempo até explicar o risco com palavras próprias, falsos positivos e uso com internet desligada. Não confundimos cobertura de testes com precisão de detecção.

### O que aprendemos

Privacidade funciona melhor quando é uma fronteira de arquitetura: o adaptador de IA sequer recebe o código. Também aprendemos que um build pode passar e o navegador falhar por diferenças entre Node e browser, por isso fizemos validação da interface. Finalmente, ensinar uma correção exige explicitar seus limites: normalizar um caminho não prova contenção, e decodificar um token não verifica assinatura.

### Estado atual e convite

O repositório entrega 12 regras e lições, três superfícies de uso e integração de CI. As métricas reproduzíveis estão em METRICAS.md. Correções automáticas permanecem restritas ao caso revisável de httpOnly; análise entre arquivos, publicação de pacotes e estudo com alunos são próximos passos. Contribua com uma fixture, uma explicação melhor ou uma tradução: ensinar segurança também é construir software seguro.
