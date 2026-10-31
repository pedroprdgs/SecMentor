import * as vscode from 'vscode';
import { scanSource, lessons, type Finding } from '@secmentor/core';

export function activate(context: vscode.ExtensionContext) {
  const diagnostics = vscode.languages.createDiagnosticCollection('secmentor');
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 20);
  const cache = new Map<string, { version: number; findings: Finding[] }>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const supported = (document: vscode.TextDocument) => ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(document.languageId);
  function update(document: vscode.TextDocument) {
    if (!supported(document)) return;
    if (document.getText().length > 1_048_576) { diagnostics.delete(document.uri); return; }
    const result = scanSource({ path: document.fileName, content: document.getText() });
    cache.set(document.uri.toString(), { version: document.version, findings: result.findings });
    diagnostics.set(document.uri, result.findings.map(f => {
      const range = new vscode.Range(f.line - 1, f.column - 1, f.endLine - 1, f.endColumn - 1);
      const d = new vscode.Diagnostic(range, `${f.title}: ${f.message}`, ['alta', 'critica'].includes(f.severity) ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Information);
      d.source = 'SecMentor'; d.code = f.ruleId; return d;
    }));
    if (vscode.window.activeTextEditor?.document === document) {
      status.text = `$(shield) SecMentor: ${result.findings.length} achado(s)`;
      status.tooltip = result.warnings.length ? result.warnings[0].message : 'Análise local por regras. Sem envio de código.';
      status.show();
    }
  }
  context.subscriptions.push(diagnostics, status, vscode.workspace.onDidChangeTextDocument(e => {
    const key = e.document.uri.toString(); const timer = timers.get(key); if (timer) clearTimeout(timer);
    timers.set(key, setTimeout(() => { timers.delete(key); update(e.document); }, 300));
  }), vscode.workspace.onDidSaveTextDocument(update), vscode.window.onDidChangeActiveTextEditor(editor => { if (editor && supported(editor.document)) update(editor.document); else status.hide(); }), vscode.workspace.onDidCloseTextDocument(document => {
    const key = document.uri.toString(); const timer = timers.get(key); if (timer) clearTimeout(timer); timers.delete(key); cache.delete(key); diagnostics.delete(document.uri);
  }), { dispose: () => { for (const timer of timers.values()) clearTimeout(timer); } });
  context.subscriptions.push(vscode.commands.registerCommand('secmentor.explain', async (id?: string) => {
    if (!id) { const choice = await vscode.window.showQuickPick(lessons.map(l => ({ label: `${l.id} · ${l.titulo}`, id: l.id })), { placeHolder: 'Qual lição você quer aprender?' }); id = choice?.id; }
    const lesson = lessons.find(l => l.id === id); if (!lesson) return;
    const panel = vscode.window.createWebviewPanel('secmentor.lesson', `${lesson.id} · ${lesson.titulo}`, vscode.ViewColumn.Beside, { enableScripts: false, localResourceRoots: [] });
    panel.webview.html = `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:var(--vscode-font-family);padding:24px;line-height:1.8;max-width:800px}h1{line-height:1.3}h2{margin-top:30px;font-size:18px}pre{background:var(--vscode-textCodeBlock-background);padding:16px;white-space:pre-wrap;overflow-wrap:anywhere}a{color:var(--vscode-textLink-foreground)}summary{cursor:pointer}li{margin-bottom:8px}</style></head><body><small>SECMENTOR · LOCAL · ${lesson.severidade.toUpperCase()}</small><h1>${escape(lesson.titulo)}</h1><p>${escape(lesson.resumo)}</p><h2>Por que é perigoso</h2><p>${escape(lesson.por_que_e_perigoso)}</p><h2>Antes</h2><pre>${escape(lesson.exemplo_vulneravel)}</pre><h2>Depois · adapte ao seu contexto</h2><pre>${escape(lesson.exemplo_corrigido)}</pre><h2>Experimento inofensivo</h2><p>${escape(lesson.como_explorar_inofensivo)}</p><h2>Erros comuns</h2><ul>${lesson.erros_comuns_de_iniciante.map(s => `<li>${escape(s)}</li>`).join('')}</ul><h2>Checklist</h2><ul>${lesson.checklist_de_correcao.map(s => `<li>${escape(s)}</li>`).join('')}</ul><h2>Teste o que aprendeu</h2>${lesson.quiz.map(q => `<p>${escape(q.pergunta)}</p><ol>${q.opcoes.map(o => `<li>${escape(o)}</li>`).join('')}</ol><details><summary>Conferir resposta</summary><p>${escape(q.opcoes[q.resposta])}. ${escape(q.explicacao)}</p></details>`).join('')}<h2>Referências</h2>${lesson.referencias.filter(url => url.startsWith('https://')).map(url => `<p><a href="${escape(url)}">${escape(url)}</a></p>`).join('')}<p>Heurísticas educativas. Ausência de avisos não garante segurança.</p></body></html>`;
  }));
  context.subscriptions.push(vscode.languages.registerCodeActionsProvider([{ language: 'javascript' }, { language: 'typescript' }, { language: 'javascriptreact' }, { language: 'typescriptreact' }], {
    provideCodeActions(document, range) {
      if (cache.get(document.uri.toString())?.version !== document.version) update(document);
      const findings = cache.get(document.uri.toString())?.findings ?? [];
      return findings.filter(f => f.line - 1 <= range.end.line && f.endLine - 1 >= range.start.line).flatMap(f => {
        const explain = new vscode.CodeAction('Explicar com o SecMentor', vscode.CodeActionKind.QuickFix);
        explain.command = { command: 'secmentor.explain', title: 'Explicar com o SecMentor', arguments: [f.lessonId] };
        const actions = [explain];
        if (f.fix) { const fix = new vscode.CodeAction('Aplicar correção sugerida: ativar httpOnly', vscode.CodeActionKind.QuickFix); fix.edit = new vscode.WorkspaceEdit(); fix.edit.replace(document.uri, new vscode.Range(document.positionAt(f.fix.start), document.positionAt(f.fix.end)), f.fix.replacement); actions.push(fix); }
        return actions;
      });
    },
  }, { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }));
  for (const document of vscode.workspace.textDocuments) update(document);
}
function escape(text: string) { return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!); }
