const fs = require('node:fs');
module.exports = async ({ github, context, core }) => {
  const sarif = JSON.parse(fs.readFileSync(process.env.SARIF_PATH, 'utf8'));
  const findings = sarif.runs[0].results;
  const escaped = (text) => String(text).replace(/[<>`|\r\n]/g, ' ');
  const body = `<!-- secmentor-report -->\n## SecMentor · segurança se aprende\n\n${findings.length} achado(s). Análise por regras, sem IA.\n\n` +
    findings.slice(0, 30).map(f => {
      const location = f.locations[0].physicalLocation;
      return `- **${f.ruleId}** · ${escaped(location.artifactLocation.uri)}:${location.region.startLine} — ${escaped(f.message.text)}`;
    }).join('\n') + '\n\nCada achado tem uma lição em português: `secmentor explain <id>`. Ausência de achados não garante segurança. Nenhum trecho do código é incluído neste resumo.';
  await core.summary.addRaw(body).write();
  const pull = context.payload.pull_request;
  if (process.env.COMMENT !== 'true' || !pull || pull.head.repo.full_name !== context.repo.owner + '/' + context.repo.repo) return;
  try {
    const comments = await github.paginate(github.rest.issues.listComments, { ...context.repo, issue_number: pull.number, per_page: 100 });
    const previous = comments.find(c => c.user?.type === 'Bot' && c.body?.includes('<!-- secmentor-report -->'));
    if (previous) await github.rest.issues.updateComment({ ...context.repo, comment_id: previous.id, body });
    else await github.rest.issues.createComment({ ...context.repo, issue_number: pull.number, body });
  } catch { core.warning('Sem permissão para comentar neste PR. O resumo do job continua disponível.'); }
};
