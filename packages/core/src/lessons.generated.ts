// Gerado por scripts/compile-lessons.ts. Não edite manualmente.
import type { Lesson } from "./types.js";
export const lessons: Lesson[] = [
  {
    "id": "SM001",
    "titulo": "SQL injection",
    "severidade": "alta",
    "resumo": "Consulta SQL não é lugar para colar entrada do usuário.",
    "por_que_e_perigoso": "Uma consulta é como uma ficha de pedido. Concatenar a entrada permite que alguém escreva novas instruções na ficha.",
    "exemplo_vulneravel": "db.query(\"SELECT * FROM users WHERE id = \" + req.query.id);",
    "exemplo_corrigido": "db.query(\"SELECT * FROM users WHERE id = ?\", [req.query.id]);",
    "como_explorar_inofensivo": "Em um banco temporário, imprima a query com id igual a \"1 OR 1=1\". Observe a mudança na instrução, sem acessar dados reais.",
    "erros_comuns_de_iniciante": [
      "Confundir a ausência de aviso com prova de segurança.",
      "Aplicar uma correção sem testar o comportamento e o contexto."
    ],
    "checklist_de_correcao": [
      "Use parâmetros do driver",
      "Valide tipo e limite da entrada",
      "Teste com aspas e entradas inesperadas"
    ],
    "referencias": [
      "https://cwe.mitre.org/data/definitions/89.html"
    ],
    "quiz": [
      {
        "pergunta": "Qual opção separa dados da instrução SQL?",
        "opcoes": [
          "Query parametrizada",
          "Concatenar após remover espaços",
          "Template string"
        ],
        "resposta": 0,
        "explicacao": "O driver trata o parâmetro como dado, sem transformá-lo em instrução."
      }
    ]
  },
  {
    "id": "SM002",
    "titulo": "HTML sem proteção",
    "severidade": "alta",
    "resumo": "Texto vindo de fora pode virar código no navegador.",
    "por_que_e_perigoso": "innerHTML é como entregar a chave da vitrine ao visitante: ele pode mudar o que será mostrado e executado.",
    "exemplo_vulneravel": "element.innerHTML = req.query.message;",
    "exemplo_corrigido": "element.textContent = req.query.message;",
    "como_explorar_inofensivo": "Em uma página local descartável, use <b>teste</b> como entrada. Se aparecer em negrito, houve interpretação de HTML. Não use scripts nem envie links a terceiros.",
    "erros_comuns_de_iniciante": [
      "Confundir a ausência de aviso com prova de segurança.",
      "Aplicar uma correção sem testar o comportamento e o contexto."
    ],
    "checklist_de_correcao": [
      "Prefira textContent para texto",
      "Se HTML for necessário use sanitizador mantido",
      "No React prefira interpolação entre chaves"
    ],
    "referencias": [
      "https://cwe.mitre.org/data/definitions/79.html"
    ],
    "quiz": [
      {
        "pergunta": "Como mostrar uma mensagem como texto?",
        "opcoes": [
          "textContent",
          "innerHTML",
          "document.write"
        ],
        "resposta": 0,
        "explicacao": "textContent mostra os caracteres sem interpretá-los como HTML."
      }
    ]
  },
  {
    "id": "SM003",
    "titulo": "Segredo no código",
    "severidade": "critica",
    "resumo": "Uma credencial no código pode ficar para sempre no histórico.",
    "por_que_e_perigoso": "É como deixar a chave de casa em uma foto pública. Apagar a foto depois não invalida as cópias.",
    "exemplo_vulneravel": "const apiKey = \"sk_demo_1234567890\";",
    "exemplo_corrigido": "const apiKey = process.env.SERVICE_API_KEY;",
    "como_explorar_inofensivo": "Use apenas a chave fictícia deste exemplo. Faça uma busca local por sk_demo e observe como é fácil encontrá-la.",
    "erros_comuns_de_iniciante": [
      "Confundir a ausência de aviso com prova de segurança.",
      "Aplicar uma correção sem testar o comportamento e o contexto."
    ],
    "checklist_de_correcao": [
      "Revogue e troque o segredo exposto",
      "Use variáveis de ambiente ou cofre de segredos",
      "Revise o histórico e os logs"
    ],
    "referencias": [
      "https://cwe.mitre.org/data/definitions/798.html"
    ],
    "quiz": [
      {
        "pergunta": "O que fazer primeiro com uma chave real exposta?",
        "opcoes": [
          "Revogar e substituir a chave",
          "Apenas apagar a linha",
          "Mudar o nome da variável"
        ],
        "resposta": 0,
        "explicacao": "Cópias da chave podem existir; revogar impede seu uso."
      }
    ]
  },
  {
    "id": "SM004",
    "titulo": "Senha sem proteção adequada",
    "severidade": "alta",
    "resumo": "Senhas precisam de hash próprio para senhas, com salt.",
    "por_que_e_perigoso": "MD5 e SHA1 são rápidos demais: alguém pode testar muitos palpites. Um hash de senha deve tornar cada tentativa cara.",
    "exemplo_vulneravel": "const hash = crypto.createHash(\"md5\").update(password).digest(\"hex\");",
    "exemplo_corrigido": "const hash = await argon2.hash(password);",
    "como_explorar_inofensivo": "Em dados fictícios, calcule MD5 da mesma palavra duas vezes. Os resultados iguais mostram a ausência de salt. Não tente quebrar senhas reais.",
    "erros_comuns_de_iniciante": [
      "Confundir a ausência de aviso com prova de segurança.",
      "Aplicar uma correção sem testar o comportamento e o contexto."
    ],
    "checklist_de_correcao": [
      "Use Argon2id ou scrypt com parâmetros atuais",
      "Deixe a biblioteca gerar salt aleatório",
      "Nunca armazene nem registre a senha original"
    ],
    "referencias": [
      "https://cwe.mitre.org/data/definitions/916.html"
    ],
    "quiz": [
      {
        "pergunta": "Qual opção foi feita para guardar senhas?",
        "opcoes": [
          "Argon2id com salt",
          "MD5 sem salt",
          "Base64"
        ],
        "resposta": 0,
        "explicacao": "Um algoritmo de senha torna tentativas mais caras e usa salt por credencial."
      }
    ]
  },
  {
    "id": "SM005",
    "titulo": "Arquivo .env exposto",
    "severidade": "alta",
    "resumo": "O arquivo de ambiente deve ficar fora do Git.",
    "por_que_e_perigoso": "O .env é uma gaveta de chaves. Um repositório pode copiar a gaveta inteira para outras máquinas.",
    "exemplo_vulneravel": "SERVICE_API_KEY=chave_ficticia_local",
    "exemplo_corrigido": "# .gitignore\n.env\n.env.*\n!.env.example",
    "como_explorar_inofensivo": "Crie um .env só com valores fictícios em uma pasta temporária. Execute git check-ignore .env e git ls-files .env para verificar proteção e rastreamento.",
    "erros_comuns_de_iniciante": [
      "Confundir a ausência de aviso com prova de segurança.",
      "Aplicar uma correção sem testar o comportamento e o contexto."
    ],
    "checklist_de_correcao": [
      "Inclua .env e variantes no .gitignore",
      "Remova arquivos já rastreados com git rm --cached",
      "Revogue qualquer segredo já publicado"
    ],
    "referencias": [
      "https://cwe.mitre.org/data/definitions/200.html"
    ],
    "quiz": [
      {
        "pergunta": "Adicionar .env ao .gitignore remove seu histórico?",
        "opcoes": [
          "Não, é preciso remover o rastreamento e revisar o histórico",
          "Sim, imediatamente",
          "Somente após reiniciar"
        ],
        "resposta": 0,
        "explicacao": "O ignore não muda arquivos já rastreados nem apaga o histórico."
      }
    ]
  },
  {
    "id": "SM006",
    "titulo": "Execução dinâmica de código",
    "severidade": "alta",
    "resumo": "Uma string não deve virar um programa.",
    "por_que_e_perigoso": "eval é como ler um bilhete e obedecer a qualquer ordem escrita nele, em vez de apenas entender seus dados.",
    "exemplo_vulneravel": "eval(req.body.expression);",
    "exemplo_corrigido": "const data = JSON.parse(req.body.json);",
    "como_explorar_inofensivo": "Apenas leia o exemplo ou use eval(\"2 + 2\") em um ambiente local descartável. Note que o texto vira instrução. Não execute entradas de outras pessoas.",
    "erros_comuns_de_iniciante": [
      "Confundir a ausência de aviso com prova de segurança.",
      "Aplicar uma correção sem testar o comportamento e o contexto."
    ],
    "checklist_de_correcao": [
      "Troque eval por operações explícitas",
      "Use JSON.parse para dados JSON",
      "Passe funções para setTimeout"
    ],
    "referencias": [
      "https://cwe.mitre.org/data/definitions/95.html"
    ],
    "quiz": [
      {
        "pergunta": "Como agendar uma função?",
        "opcoes": [
          "setTimeout(() => tarefa(), 1000)",
          "setTimeout(\"tarefa()\", 1000)",
          "eval(\"tarefa()\")"
        ],
        "resposta": 0,
        "explicacao": "Uma função dispensa interpretar uma string como código."
      }
    ]
  },
  {
    "id": "SM007",
    "titulo": "Command injection",
    "severidade": "critica",
    "resumo": "Entrada externa não pode compor comandos de shell.",
    "por_que_e_perigoso": "O shell entende separadores de comando. Colar entrada é como permitir novos itens em uma lista de ordens assinada por você.",
    "exemplo_vulneravel": "child_process.exec(\"echo \" + req.query.name);",
    "exemplo_corrigido": "child_process.execFile(\"echo\", [String(req.query.name)]);",
    "como_explorar_inofensivo": "Sem executar o comando, imprima a string formada com a entrada \"amostra; echo teste\". Observe o segundo comando na string.",
    "erros_comuns_de_iniciante": [
      "Confundir a ausência de aviso com prova de segurança.",
      "Aplicar uma correção sem testar o comportamento e o contexto."
    ],
    "checklist_de_correcao": [
      "Prefira execFile ou spawn sem shell",
      "Fixe o executável e valide argumentos",
      "Use lista de opções permitidas"
    ],
    "referencias": [
      "https://cwe.mitre.org/data/definitions/78.html"
    ],
    "quiz": [
      {
        "pergunta": "Qual abordagem evita interpretar metacaracteres do shell?",
        "opcoes": [
          "execFile com argumentos separados e shell desligado",
          "exec com template string",
          "Remover apenas espaços"
        ],
        "resposta": 0,
        "explicacao": "Argumentos separados não viram comandos adicionais de shell."
      }
    ]
  },
  {
    "id": "SM008",
    "titulo": "Path traversal",
    "severidade": "alta",
    "resumo": "O nome pedido pelo usuário pode escapar da pasta permitida.",
    "por_que_e_perigoso": "Um caminho com .. é como um endereço que manda sair do prédio antes de procurar a sala.",
    "exemplo_vulneravel": "fs.readFile(req.query.path, callback);",
    "exemplo_corrigido": "const base = path.resolve(\"./uploads\");\nconst target = path.resolve(base, String(req.query.path));\nconst relative = path.relative(base, target);\nif (relative.startsWith(\"..\") || path.isAbsolute(relative)) throw new Error(\"Caminho inválido\");\n// Verifique também links simbólicos antes de abrir.\nfs.readFile(target, callback);",
    "como_explorar_inofensivo": "Em uma pasta temporária com arquivos fictícios, imprima path.resolve(base, \"../amostra.txt\"). Não abra arquivos do sistema.",
    "erros_comuns_de_iniciante": [
      "Confundir a ausência de aviso com prova de segurança.",
      "Aplicar uma correção sem testar o comportamento e o contexto."
    ],
    "checklist_de_correcao": [
      "Resolva o caminho absoluto",
      "Confira contenção com path.relative",
      "Trate links simbólicos e permissões"
    ],
    "referencias": [
      "https://cwe.mitre.org/data/definitions/22.html"
    ],
    "quiz": [
      {
        "pergunta": "path.normalize sozinho garante contenção?",
        "opcoes": [
          "Não, também é preciso verificar a pasta permitida",
          "Sim, sempre",
          "Somente no Windows"
        ],
        "resposta": 0,
        "explicacao": "Normalizar organiza o caminho, mas não impede sair da pasta base."
      }
    ]
  },
  {
    "id": "SM009",
    "titulo": "CORS e cookies permissivos",
    "severidade": "alta",
    "resumo": "Permissões do navegador precisam de limites explícitos.",
    "por_que_e_perigoso": "CORS é a lista de visitantes; cookies são crachás. Uma lista ampla e crachás sem proteção ampliam riscos. Navegadores bloqueiam * com credenciais, mas a configuração continua incoerente.",
    "exemplo_vulneravel": "cors({ origin: \"*\", credentials: true });\nres.cookie(\"session\", value, { httpOnly: false, secure: false });",
    "exemplo_corrigido": "cors({ origin: \"https://app.example.com\", credentials: true });\nres.cookie(\"session\", value, { httpOnly: true, secure: true, sameSite: \"lax\" });",
    "como_explorar_inofensivo": "Em um servidor local com cookies fictícios, confira as flags no painel de armazenamento do navegador. Não use sessões reais.",
    "erros_comuns_de_iniciante": [
      "Confundir a ausência de aviso com prova de segurança.",
      "Aplicar uma correção sem testar o comportamento e o contexto."
    ],
    "checklist_de_correcao": [
      "Liste origens confiáveis",
      "Ative httpOnly e secure em HTTPS",
      "Defina sameSite e avalie proteção contra CSRF"
    ],
    "referencias": [
      "https://cwe.mitre.org/data/definitions/614.html"
    ],
    "quiz": [
      {
        "pergunta": "O que httpOnly impede?",
        "opcoes": [
          "Leitura do cookie por JavaScript",
          "Todo tipo de CSRF",
          "Envio do cookie por HTTP"
        ],
        "resposta": 0,
        "explicacao": "httpOnly restringe acesso via JavaScript; secure restringe o transporte a HTTPS."
      }
    ]
  },
  {
    "id": "SM010",
    "titulo": "JWT sem verificação robusta",
    "severidade": "alta",
    "resumo": "Ler um token não é verificar sua autenticidade.",
    "por_que_e_perigoso": "decode é como ler um crachá sem conferir a assinatura. É preciso verificar assinatura, algoritmo e prazo.",
    "exemplo_vulneravel": "const user = jwt.decode(token);",
    "exemplo_corrigido": "const user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: [\"HS256\"], maxAge: \"15m\" });",
    "como_explorar_inofensivo": "Crie um token fictício local e apenas decodifique o payload. Note que decodificar não prova quem o criou. Nunca use tokens reais.",
    "erros_comuns_de_iniciante": [
      "Confundir a ausência de aviso com prova de segurança.",
      "Aplicar uma correção sem testar o comportamento e o contexto."
    ],
    "checklist_de_correcao": [
      "Use verify com algoritmos explícitos",
      "Exija exp ou maxAge conforme a biblioteca",
      "Use segredo aleatório forte e valide emissor e público"
    ],
    "referencias": [
      "https://cwe.mitre.org/data/definitions/347.html"
    ],
    "quiz": [
      {
        "pergunta": "jwt.decode comprova assinatura?",
        "opcoes": [
          "Não",
          "Sim",
          "Somente com HTTPS"
        ],
        "resposta": 0,
        "explicacao": "decode lê dados; verify é responsável por verificar assinatura e restrições."
      }
    ]
  },
  {
    "id": "SM011",
    "titulo": "Dependência sem versão previsível",
    "severidade": "media",
    "resumo": "* e latest deixam instalações menos previsíveis.",
    "por_que_e_perigoso": "É como comprar um ingrediente sem dizer qual: o resultado pode mudar entre instalações.",
    "exemplo_vulneravel": "{\"dependencies\":{\"exemplo\":\"*\"}}",
    "exemplo_corrigido": "{\"dependencies\":{\"exemplo\":\"1.2.3\"}}",
    "como_explorar_inofensivo": "Compare dois package.json fictícios. Observe qual especifica a versão. Não instale pacotes desconhecidos para a demonstração.",
    "erros_comuns_de_iniciante": [
      "Confundir a ausência de aviso com prova de segurança.",
      "Aplicar uma correção sem testar o comportamento e o contexto."
    ],
    "checklist_de_correcao": [
      "Escolha versões revisadas",
      "Versione o lockfile",
      "Use instalação com lockfile congelado na CI"
    ],
    "referencias": [
      "https://cwe.mitre.org/data/definitions/1104.html"
    ],
    "quiz": [
      {
        "pergunta": "Qual prática torna a CI reproduzível?",
        "opcoes": [
          "Versões revisadas e lockfile congelado",
          "Usar latest em tudo",
          "Apagar o lockfile"
        ],
        "resposta": 0,
        "explicacao": "O lockfile registra a resolução; a instalação congelada impede mudanças silenciosas."
      }
    ]
  },
  {
    "id": "SM012",
    "titulo": "Comparação de segredos por igualdade",
    "severidade": "media",
    "resumo": "Comparações comuns podem revelar diferenças de tempo.",
    "por_que_e_perigoso": "É como um porteiro que demora mais ao conferir cada letra correta da senha. Tempo pode virar pista, embora exploração dependa do contexto.",
    "exemplo_vulneravel": "if (token == expectedToken) allow();",
    "exemplo_corrigido": "const a = Buffer.from(token);\nconst b = Buffer.from(expectedToken);\nif (a.length === b.length && crypto.timingSafeEqual(a, b)) allow();",
    "como_explorar_inofensivo": "Use tokens fictícios e compare o caminho de execução. Não conclua que uma medida isolada prova exploração por tempo.",
    "erros_comuns_de_iniciante": [
      "Confundir a ausência de aviso com prova de segurança.",
      "Aplicar uma correção sem testar o comportamento e o contexto."
    ],
    "checklist_de_correcao": [
      "Use comparação em tempo constante",
      "Trate comprimentos diferentes",
      "Prefira autenticação de bibliotecas mantidas"
    ],
    "referencias": [
      "https://cwe.mitre.org/data/definitions/208.html"
    ],
    "quiz": [
      {
        "pergunta": "Qual função compara bytes em tempo constante?",
        "opcoes": [
          "crypto.timingSafeEqual",
          "==",
          "startsWith"
        ],
        "resposta": 0,
        "explicacao": "timingSafeEqual compara buffers de mesmo tamanho; trate o tamanho antes da chamada."
      }
    ]
  }
];
