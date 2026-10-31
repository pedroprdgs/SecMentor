// VULNERÁVEL DE PROPÓSITO. Não renderiza HTML fornecido pelo visitante da demo.
import React from 'react';
export default function App({ bio = '<b>Olá, mundo!</b>' }) {
  return <main><h1>Perfil demonstrativo</h1><article dangerouslySetInnerHTML={{ __html: bio }} /></main>;
}
