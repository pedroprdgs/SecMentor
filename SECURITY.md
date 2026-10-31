# Política de segurança

Versão em desenvolvimento: 0.1.x. O SecMentor ajuda a ensinar, mas não substitui auditoria, modelagem de ameaças ou ferramentas de análise mais completas. As limitações das regras são documentadas.

Não publique uma vulnerabilidade real, segredo ou payload destrutivo em uma issue aberta. Se este repositório tiver **Security → Report a vulnerability** habilitado, use esse canal privado. Se ainda não estiver habilitado, contate os mantenedores por um canal privado listado no perfil do repositório. A configuração do canal deve ser concluída antes de uma release pública; não há SLA de resposta definido nesta entrega.

Inclua versão, menor reprodução com dados fictícios, resultado esperado e impacto possível. Não envie credenciais de produção nem código de terceiros sem autorização.

O adaptador de IA é opt-in. Endpoints remotos recebem lição e dúvida, nunca o arquivo automaticamente. Não inclua segredos nas perguntas. Os relatórios podem conter caminhos ou trechos; revise antes de compartilhar. Exemplos vulneráveis não devem ser publicados como serviço.

O painel da extensão escapa conteúdo e desabilita scripts. YAML externo passa por Zod e não executa código. Alterações nessas fronteiras precisam de revisão de segurança.
