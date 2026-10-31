import { parse } from '@babel/parser';
import * as t from '@babel/types';
import { lessons } from './lessons.generated.js';
import { severityRank, type Finding, type ScanResult, type Severity, type SourceFile, type Fix } from './types.js';

export const rules = lessons.map(({ id, titulo, severidade }) => ({ id, title: titulo, severity: severidade }));
export interface ScanOptions { minimumSeverity?: Severity; ignoreRules?: string[] }
export function scanSource(source: SourceFile, options: ScanOptions = {}): ScanResult {
  const start = performance.now();
  const findings: Finding[] = [];
  const warnings: ScanResult['warnings'] = [];
  const lines = source.content.split('\n');
  function emit(id: string, offset: number, end: number, message: string, fix?: Fix) {
    const rule = rules.find(r => r.id === id);
    if (!rule || options.ignoreRules?.includes(id) || severityRank[rule.severity] < severityRank[options.minimumSeverity ?? 'baixa']) return;
    const prefix = source.content.slice(0, offset).split('\n');
    const suffix = source.content.slice(0, end).split('\n');
    const line = prefix.length;
    if (findings.some(f => f.ruleId === id && f.line === line && f.column === prefix.at(-1)!.length + 1)) return;
    findings.push({ ruleId: id, title: rule.title, severity: rule.severity, file: source.path, line, column: prefix.at(-1)!.length + 1, endLine: suffix.length, endColumn: suffix.at(-1)!.length + 1, message, snippet: lines[line - 1] ?? '', lessonId: id, ...(fix ? { fix } : {}) });
  }
  const report = (id: string, node: t.Node, message: string, fix?: Fix) => emit(id, node.start ?? 0, node.end ?? 1, message, fix);
  if (/\.(?:[cm]?[jt]sx?)$/.test(source.path)) {
    try {
      const ast = parse(source.content, { sourceType: 'unambiguous', plugins: ['typescript', 'jsx'], errorRecovery: false });
      walk(ast, node => {
        if (t.isCallExpression(node) && /(?:^|\.)(query|execute)$/.test(name(node.callee)) && dynamicSql(node.arguments[0])) report('SM001', node, 'A consulta mistura SQL e valores variáveis. Use parâmetros.');
        if (t.isAssignmentExpression(node) && t.isMemberExpression(node.left) && property(node.left) === 'innerHTML') report('SM002', node, 'HTML inserido diretamente pode executar conteúdo não confiável.');
        if (t.isJSXAttribute(node) && t.isJSXIdentifier(node.name, { name: 'dangerouslySetInnerHTML' })) report('SM002', node, 'HTML bruto no React exige sanitização confiável.');
        if (t.isCallExpression(node) && name(node.callee) === 'document.write') report('SM002', node, 'document.write interpreta a entrada como HTML.');
        if (t.isVariableDeclarator(node) && t.isIdentifier(node.id) && secretKey(node.id.name) && hardcoded(node.init)) report('SM003', node, 'Segredo literal no código. Remova e revogue a credencial exposta.');
        if (t.isObjectProperty(node) && secretKey(keyName(node)) && hardcoded(node.value)) report('SM003', node, 'Credencial escrita no código pode entrar no histórico do Git.');
        // MORE_RULES
      });
    } catch {
      warnings.push({ file: source.path, message: 'Não foi possível interpretar o código. Corrija a sintaxe; este arquivo não foi analisado.' });
    }
  }
  // CONFIG_RULES
  return { findings: findings.sort((a, b) => a.line - b.line || a.column - b.column), warnings, filesScanned: 1, durationMs: performance.now() - start };
}

function walk(node: t.Node, visit: (node: t.Node) => void) {
  visit(node);
  for (const key of t.VISITOR_KEYS[node.type] ?? []) {
    const value = (node as unknown as Record<string, unknown>)[key];
    if (Array.isArray(value)) { for (const child of value) if (t.isNode(child)) walk(child, visit); }
    else if (t.isNode(value)) walk(value, visit);
  }
}
function property(node: t.MemberExpression | t.OptionalMemberExpression): string {
  return t.isIdentifier(node.property) && !node.computed ? node.property.name : t.isStringLiteral(node.property) ? node.property.value : '';
}
function name(node: t.Node | null | undefined): string {
  if (t.isIdentifier(node)) return node.name;
  if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) return `${name(node.object)}.${property(node)}`;
  return '';
}
function keyName(node: t.ObjectProperty): string { return t.isIdentifier(node.key) ? node.key.name : t.isStringLiteral(node.key) ? node.key.value : ''; }
function secretKey(key: string) { return /(?:password|passwd|secret|api[_-]?key|access[_-]?token|database[_-]?url)/i.test(key); }
function hardcoded(node: t.Node | null | undefined) { return t.isStringLiteral(node) && node.value.length >= 4 && !/^(?:exemplo|example|placeholder|changeme|\*+|\$\{|process\.env)/i.test(node.value); }
function dynamicSql(node: t.Node | null | undefined): boolean {
  if (t.isTemplateLiteral(node)) return node.expressions.length > 0 && /\b(select|insert|update|delete|where)\b/i.test(node.quasis.map(q => q.value.raw).join(' '));
  if (t.isBinaryExpression(node, { operator: '+' })) return /\b(select|insert|update|delete|where)\b/i.test(sqlText(node)) && !staticString(node);
  return false;
}
function sqlText(node: t.Node): string { return t.isStringLiteral(node) ? node.value : t.isBinaryExpression(node) ? sqlText(node.left) + sqlText(node.right) : ''; }
function staticString(node: t.Node): boolean { return t.isStringLiteral(node) || (t.isBinaryExpression(node, { operator: '+' }) && staticString(node.left) && staticString(node.right)); }
