# UBF Team Gestão — PWA Mobile-First

Sistema de Gestão da Academia de Artes Marciais **UBF Team Parque Indiano**, liderada pelo **Mestre Uarlei Silva**.
Desenvolvido como Web App Progressivo (PWA) em React + TypeScript + Tailwind CSS, otimizado para iPhone (iOS Safari) e qualquer dispositivo móvel.

## Características

- **100% Local (IndexedDB)**: Sem necessidade de servidor, login ou banco externo. Todos os dados permanecem estritamente no dispositivo do mestre.
- **Instalável no iPhone (PWA)**: Ícone na tela de início, sem barras de navegação do navegador, suporte offline via Service Worker e respeito à área segura (notch).
- **Exportação & Importação de Backup**: Exportação em arquivo JSON compatível com o compartilhamento nativo do iOS (AirDrop, WhatsApp, Arquivos/iCloud) e alerta na tela inicial se o último backup tiver mais de 7 dias.
- **PIN de Segurança Opcional**: Bloqueio por senha de 4 dígitos para proteger os dados pessoais e de menores de idade (LGPD).
- **Funções do Dia a Dia**:
  - Cadastro de Alunos (com responsável legal para menores, faixa/graduação e data de nascimento).
  - Turmas e Grade de Horários (com chamada rápida em 1 toque: Presente / Falta).
  - Controle de Mensalidades (Pagas, A Vencer, Atrasadas e botão "Cobrar no WhatsApp").
  - Caixa e Fluxo Financeiro (Entradas automáticas de mensalidades, despesas avulsas e saldo do mês).
  - Aulas Experimentais com botão "Transformar em aluno".
  - Aniversariantes da semana na tela inicial.
