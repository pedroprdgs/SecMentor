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
      const bindings = new Map<string, t.Node>();
      walk(ast, node => { if (t.isVariableDeclarator(node) && t.isIdentifier(node.id) && node.init) bindings.set(node.id.name, node.init); });
      function resolve(node: t.Node | null | undefined, seen = new Set<string>()): t.Node | null | undefined {
        if (!t.isIdentifier(node) || seen.has(node.name) || !bindings.has(node.name)) return node;
        seen.add(node.name); return resolve(bindings.get(node.name), seen);
      }
      function external(node: t.Node | null | undefined, seen = new Set<string>()): boolean {
        if (!node) return false;
        if (/^(req|request)\.(query|body|params|headers)(\.|$)/.test(name(node)) || /^process\.argv/.test(name(node))) return true;
        if (t.isIdentifier(node) && !seen.has(node.name)) { seen.add(node.name); return external(bindings.get(node.name), seen); }
        if (t.isBinaryExpression(node)) return external(node.left, new Set(seen)) || external(node.right, new Set(seen));
        if (t.isTemplateLiteral(node)) return node.expressions.some(n => external(n, new Set(seen)));
        return false;
      }
      walk(ast, node => {
        if (t.isCallExpression(node) && /(?:^|\.)(query|execute)$/.test(name(node.callee)) && dynamicSql(resolve(node.arguments[0]))) report('SM001', node, 'A consulta mistura SQL e valores variáveis. Use parâmetros.');
        if (t.isAssignmentExpression(node) && t.isMemberExpression(node.left) && property(node.left) === 'innerHTML') report('SM002', node, 'HTML inserido diretamente pode executar conteúdo não confiável.');
        if (t.isJSXAttribute(node) && t.isJSXIdentifier(node.name, { name: 'dangerouslySetInnerHTML' })) report('SM002', node, 'HTML bruto no React exige sanitização confiável.');
        if (t.isCallExpression(node) && name(node.callee) === 'document.write') report('SM002', node, 'document.write interpreta a entrada como HTML.');
        if (t.isVariableDeclarator(node) && t.isIdentifier(node.id) && secretKey(node.id.name) && hardcoded(node.init)) report('SM003', node, 'Segredo literal no código. Remova e revogue a credencial exposta.');
        if (t.isObjectProperty(node) && secretKey(keyName(node)) && hardcoded(node.value)) report('SM003', node, 'Credencial escrita no código pode entrar no histórico do Git.');
        if (t.isCallExpression(node) && /(?:^|\.)createHash$/.test(name(node.callee)) && t.isStringLiteral(node.arguments[0]) && /^(md5|sha-?1)$/i.test(node.arguments[0].value)) report('SM004', node, 'Hash rápido não protege senhas. Use Argon2id ou scrypt com salt.');
        if (t.isCallExpression(node) && /(?:^|\.)(save|create|insert|update)$/.test(name(node.callee))) {
          for (const arg of node.arguments) if (t.isObjectExpression(arg)) for (const prop of arg.properties) if (t.isObjectProperty(prop) && /^(password|senha)$/i.test(keyName(prop)) && (external(prop.value) || /^(password|senha)$/.test(name(prop.value)))) report('SM004', prop, 'Senha parece ser persistida sem hash específico para senhas.');
        }
        if ((t.isCallExpression(node) || t.isNewExpression(node)) && (name(node.callee) === 'eval' || name(node.callee) === 'Function' || (['setTimeout', 'setInterval'].includes(name(node.callee)) && t.isStringLiteral(resolve(node.arguments[0]))))) report('SM006', node, 'Evite transformar strings em código executável.');
        if (t.isCallExpression(node) && /^(exec|execSync|child_process\.exec|child_process\.execSync|cp\.exec|cp\.execSync)$/.test(name(node.callee)) && external(node.arguments[0])) report('SM007', node, 'Entrada externa chega ao shell. Use executável fixo e argumentos separados.');
        if (t.isCallExpression(node) && /^(?:(?:fs|fs\.promises)\.)?(readFile|readFileSync|writeFile|writeFileSync|createReadStream|unlink|unlinkSync)$/.test(name(node.callee)) && external(node.arguments[0])) report('SM008', node, 'Caminho externo sem verificação de contenção na pasta permitida.');
        if (t.isCallExpression(node) && name(node.callee) === 'cors' && t.isObjectExpression(node.arguments[0])) {
          const props = node.arguments[0].properties.filter(t.isObjectProperty);
          if (props.some(p => keyName(p) === 'origin' && (t.isStringLiteral(p.value, { value: '*' }) || t.isBooleanLiteral(p.value, { value: true }))) && props.some(p => keyName(p) === 'credentials' && t.isBooleanLiteral(p.value, { value: true }))) report('SM009', node, 'CORS amplo com credenciais: defina uma lista explícita de origens.');
        }
        if (t.isCallExpression(node) && /\.cookie$/.test(name(node.callee))) {
          const config = resolve(node.arguments[2]);
          const props = t.isObjectExpression(config) ? config.properties.filter(t.isObjectProperty) : [];
          const hasSpread = t.isObjectExpression(config) && config.properties.some(t.isSpreadElement);
          const missing = ['httpOnly', 'secure'].filter(key => {
            const prop = props.find(p => keyName(p) === key);
            return prop ? t.isBooleanLiteral(prop.value, { value: false }) : !hasSpread;
          });
          if (missing.length) {
            const prop = props.find(p => keyName(p) === 'httpOnly' && t.isBooleanLiteral(p.value, { value: false }));
            const fix = prop ? { start: prop.value.start!, end: prop.value.end!, replacement: 'true', description: 'Ativar httpOnly; teste novamente o fluxo de sessão.' } : undefined;
            report('SM009', node, `Cookie sem proteção: ${missing.join(', ')}. Confira também sameSite.`, fix);
          }
        }
        if (t.isCallExpression(node) && /^(jwt|jsonwebtoken)\.(decode|verify|sign)$/.test(name(node.callee))) {
          const method = name(node.callee).split('.').at(-1);
          if (method === 'decode') report('SM010', node, 'Decodificar um JWT não verifica sua assinatura.');
          if (method === 'verify' || method === 'sign') {
            const config = resolve(node.arguments[2]);
            const props = t.isObjectExpression(config) ? config.properties.filter(t.isObjectProperty) : [];
            const has = (key: string) => props.some(p => keyName(p) === key);
            const disabled = props.some(p => keyName(p) === 'ignoreExpiration' && t.isBooleanLiteral(p.value, { value: true }));
            const secret = resolve(node.arguments[1]);
            const weak = t.isStringLiteral(secret) && secret.value.length < 32;
            if (weak || disabled || (method === 'verify' && (!has('algorithms') || !has('maxAge'))) || (method === 'sign' && !has('expiresIn'))) report('SM010', node, 'Revise segredo, algoritmos permitidos e prazo de validade do JWT.');
          }
        }
        if (t.isBinaryExpression(node) && ['==', '===', '!=', '!=='].includes(node.operator) && /(?:token|secret|apiKey|password|signature)/i.test(name(node.left) + ' ' + name(node.right)) && !t.isNullLiteral(node.left) && !t.isNullLiteral(node.right) && !t.isUnaryExpression(node.right) && !t.isNumericLiteral(node.right)) report('SM012', node, 'Compare segredos com função de tempo constante e valide os tamanhos.');
      });
    } catch {
      warnings.push({ file: source.path, message: 'Não foi possível interpretar o código. Corrija a sintaxe; este arquivo não foi analisado.' });
    }
  }
  if (/(?:^|\/)\.env(?:\..+)?$/.test(source.path) && !/\.env\.(example|sample|template)$/.test(source.path) && (source.tracked || source.envIgnored === false)) emit('SM005', 0, Math.min(source.content.length, lines[0]?.length ?? 0), source.tracked ? '.env rastreado pelo Git. Remova do índice e revogue segredos expostos.' : '.env fora da proteção do .gitignore.');
  if (/(?:^|\/)package\.json$/.test(source.path)) {
    try {
      const manifest: unknown = JSON.parse(source.content);
      if (manifest && typeof manifest === 'object') for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
        const deps = (manifest as Record<string, unknown>)[section];
        if (deps && typeof deps === 'object') for (const [dep, version] of Object.entries(deps)) if (version === '*' || version === 'latest') {
          const marker = JSON.stringify(dep);
          const offset = source.content.indexOf(marker, source.content.indexOf(JSON.stringify(section)));
          emit('SM011', Math.max(0, offset), Math.max(0, offset) + marker.length, `Dependência ${dep} usa ${version}. Fixe versão revisada e mantenha lockfile.`);
        }
      }
    } catch { warnings.push({ file: source.path, message: 'package.json inválido; dependências não analisadas.' }); }
  }
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
