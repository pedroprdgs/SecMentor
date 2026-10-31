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
  }
];
