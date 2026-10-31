import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  scanSource,
  lessons,
  toJSON,
  toSARIF,
  toTerminal,
  formatLesson,
  lessonSchema,
} from './index.js';

const scan = (content: string, path = 'app.ts') =>
  scanSource({ path, content });
const ids = (content: string) => scan(content).findings.map((f) => f.ruleId);
describe('fixtures de todas as regras', () => {
  for (const lesson of lessons) {
    it(`${lesson.id}: fixture vulnerável, corrigida e falso positivo`, () => {
      const extension =
        lesson.id === 'SM011' ? 'json' : lesson.id === 'SM005' ? 'txt' : 'js';
      const fixture = (name: string, ext = extension) =>
        readFileSync(
          new URL(`../fixtures/${lesson.id}/${name}.${ext}`, import.meta.url),
          'utf8',
        );
      expect(
        scanSource({
          path:
            lesson.id === 'SM011'
              ? 'package.json'
              : lesson.id === 'SM005'
                ? '.env'
                : 'app.js',
          content: fixture('vulnerable'),
          envIgnored: false,
        }).findings.some((f) => f.ruleId === lesson.id),
      ).toBe(true);
      expect(
        scanSource({
          path: lesson.id === 'SM011' ? 'package.json' : 'app.js',
          content: fixture('fixed'),
        }).findings.filter((f) => f.ruleId === lesson.id),
      ).toEqual([]);
      expect(
        lesson.id === 'SM011'
          ? scan(fixture('false-positive', 'json'), 'package.json').findings
          : scan(fixture('false-positive', 'js')).findings,
      ).toEqual([]);
    });
  }
});
describe('limites e variantes de detecção', () => {
  it('SQL por template, variável e concatenação aninhada', () => {
    for (const content of [
      'db.query(`SELECT * FROM users WHERE id = ${input}`)',
      'const sql = "SELECT " + "* FROM users WHERE id = " + id; db.execute(sql)',
      'db["query"]("DELETE FROM t WHERE id=" + input)',
    ])
      expect(ids(content)).toContain('SM001');
    expect(ids('db.query("SELECT " + "* FROM users")')).not.toContain('SM001');
    expect(ids('db.query(`SELECT * FROM users`)')).not.toContain('SM001');
  });
  it('SQL não se confunde com string de documentação', () =>
    expect(ids('const docs = "db.query(SELECT + input)"')).toEqual([]));
  it('JSX, document.write, propriedades computadas e segredo em objeto', () => {
    expect(
      ids(
        'const Profile = () => <div dangerouslySetInnerHTML={{__html: bio}}/>',
      ),
    ).toContain('SM002');
    expect(ids('document.write(input)')).toContain('SM002');
    expect(ids('element["innerHTML"] = input')).toContain('SM002');
    expect(
      ids('const config = { "api_key": "credencial_ficticia" }'),
    ).toContain('SM003');
    expect(
      ids('const apiKey = process.env.KEY; const password = "example";'),
    ).not.toContain('SM003');
  });
  it('detecta token, senha e chave privada literais sem confundir token de linguagem', () => {
    expect(
      ids(
        'const token = "valor_ficticio"; const senha = "senha_ficticia"; const privateKey = "chave_ficticia";',
      ),
    ).toEqual(['SM003', 'SM003', 'SM003']);
    expect(ids('const tokenType = "identifier";')).toEqual([]);
  });
  it('hash fraco e persistência de senha', () => {
    expect(
      ids(
        'crypto.createHash("sha1"); users.create({ password: req.body.password });',
      ),
    ).toEqual(['SM004', 'SM004']);
    expect(ids('users.save({ senha });')).toContain('SM004');
    expect(
      ids('users.save({ password: await argon2.hash(password) });'),
    ).not.toContain('SM004');
  });
  it('execução dinâmica sem confundir funções normais', () => {
    expect(
      ids(
        'new Function("return 2"); const callback = "work()"; setTimeout(callback, 10); setInterval("work()", 1)',
      ),
    ).toEqual(['SM006', 'SM006', 'SM006']);
    expect(ids('setTimeout(() => work(), 10); JSON.parse(input)')).toEqual([]);
  });
  it('propaga entrada externa por aliases, concatenação e template', () => {
    expect(
      ids('const a = req.query.name; const b = a; exec(`echo ${b}`);'),
    ).toContain('SM007');
    expect(
      ids('const file = request.params.file; fs.promises.readFile(file);'),
    ).toContain('SM008');
    expect(ids('const a = b; const b = a; exec(a);')).toEqual([]);
    expect(ids('exec("echo static"); fs.readFile("./safe.txt");')).toEqual([]);
    expect(ids('fs.readFile(path.resolve(base, input));')).toEqual([]); // Limite: contenção requer revisão humana.
  });
  it('CORS e cookies: opções ausentes, spreads e correção exata', () => {
    expect(ids('cors({ origin: true, credentials: true });')).toContain(
      'SM009',
    );
    expect(ids('cors({ origin: "*", credentials: false });')).not.toContain(
      'SM009',
    );
    expect(ids('res.cookie("x", value);')).toContain('SM009');
    expect(ids('res.cookie("x", value, { ...options });')).not.toContain(
      'SM009',
    );
    const code = 'res.cookie("s", value, { httpOnly: false, secure: true });';
    const finding = scan(code).findings[0];
    expect(finding.fix).toBeDefined();
    const fix = finding.fix!;
    const corrected =
      code.slice(0, fix.start) + fix.replacement + code.slice(fix.end);
    expect(scan(corrected).findings).toEqual([]);
  });
  it('JWT: decode, verify sem opções, prazo ignorado e sign', () => {
    for (const code of [
      'jwt.verify(token, key)',
      'jwt.verify(token, key, { algorithms: ["none"], maxAge: "15m" })',
      'jwt.verify(token,key,{ algorithms:["HS256"], maxAge:"1h", ignoreExpiration:true })',
      'jwt.sign(payload, "weak", {expiresIn:"1h"})',
      'jwt.sign(payload, key)',
    ])
      expect(ids(code)).toContain('SM010');
    expect(
      ids('jwt.verify(token, key, {algorithms:["HS256"], maxAge:"15m"})'),
    ).toEqual([]);
    expect(ids('jwt.sign(payload, key, {expiresIn:"15m"})')).toEqual([]);
  });
  it('igualdade comum de tokens, sem marcar null ou tamanho', () => {
    expect(ids('if (token !== expected) deny();')).toContain('SM012');
    expect(
      ids('if (token == null) return; if (token.length === 32) {}'),
    ).toEqual([]);
    expect(ids('crypto.timingSafeEqual(a,b)')).toEqual([]);
  });
  it('.env exige metadados, ignora templates', () => {
    expect(
      scanSource({
        path: '.env',
        content: 'X=x',
        tracked: true,
        envIgnored: true,
      }).findings[0].ruleId,
    ).toBe('SM005');
    expect(
      scanSource({ path: '.env.local', content: 'X=x', envIgnored: false })
        .findings[0].ruleId,
    ).toBe('SM005');
    expect(
      scanSource({ path: '.env', content: 'X=x', envIgnored: true }).findings,
    ).toEqual([]);
    expect(
      scanSource({ path: '.env.example', content: 'X=x', tracked: true })
        .findings,
    ).toEqual([]);
  });
  it('manifesto e sintaxe inválidos geram avisos; formatos não suportados são ignorados', () => {
    expect(scan('{', 'package.json').warnings).toHaveLength(1);
    expect(scan('function {').warnings).toHaveLength(1);
    expect(scan('eval(input)', 'notes.txt').findings).toEqual([]);
    expect(scan('null', 'package.json').findings).toEqual([]);
    expect(
      scan('{"optionalDependencies":{"pkg":"latest"}}', 'package.json')
        .findings,
    ).toHaveLength(1);
  });
  it('filtros preservam posições exatas', () => {
    const content = '\n  eval(input);';
    const result = scan(content);
    expect(result.findings[0]).toMatchObject({
      line: 2,
      column: 3,
      endLine: 2,
      endColumn: 14,
    });
    expect(
      scanSource({ path: 'a.ts', content }, { ignoreRules: ['SM006'] })
        .findings,
    ).toEqual([]);
    expect(
      scanSource({ path: 'a.ts', content }, { minimumSeverity: 'critica' })
        .findings,
    ).toEqual([]);
  });
});
describe('relatórios e schema', () => {
  it('oculta credenciais em JSON e terminal e não exporta código no SARIF', () => {
    const result = scan('const apiKey = "credencial_de_teste";\neval(input);');
    expect(toJSON(result)).not.toContain('credencial_de_teste');
    expect(toTerminal(result)).not.toContain('credencial_de_teste');
    const sarif = JSON.parse(toSARIF(result, 'src/'));
    expect(sarif.version).toBe('2.1.0');
    expect(
      sarif.runs[0].results[0].locations[0].physicalLocation.artifactLocation
        .uri,
    ).toBe('src/app.ts');
    expect(toSARIF(result)).not.toContain('credencial_de_teste');
    expect(toTerminal(result)).toContain('secmentor explain SM003');
  });
  it('SARIF distingue alertas médios e análise incompleta', () => {
    const result = scanSource({
      path: 'package.json',
      content: '{"dependencies":{"demo":"*"}}',
    });
    expect(JSON.parse(toSARIF(result)).runs[0].results[0].level).toBe(
      'warning',
    );
    const broken = scan('{');
    expect(toTerminal(broken)).toContain('AVISO');
    expect(
      JSON.parse(toSARIF(broken)).runs[0].invocations[0].executionSuccessful,
    ).toBe(false);
  });
  it('lição completa e quiz com índice válido', () => {
    expect(formatLesson(lessons[0])).toContain('Experimento inofensivo');
    expect(formatLesson(lessons[0])).toContain('Checklist');
    expect(
      lessonSchema.safeParse({
        ...lessons[0],
        quiz: [{ ...lessons[0].quiz[0], resposta: 99 }],
      }).success,
    ).toBe(false);
  });
});
