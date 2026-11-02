# Atlas Treino V4.1 — implementação, QA e checkpoint

**Status de desenvolvimento:** branch `feature/atlas-v4-1-ux` — integração na `main` somente após o CI final.

**Base estável/rollback:** commit `939e1eeab2d6ade2bf1ab8ead974e81ac88e256d` (Atlas V4 validada).
**Produto:** https://leothaylor.github.io/Treino-teste/

## Arquitetura e licenças

- O `index.html` original foi preservado. As únicas alterações no arquivo base são referências aos assets da V4.1 e atualização da identificação de versão.
- Novos arquivos de produção: `assets/atlas-ux.js` e `assets/atlas-ux.css`. A lógica fica isolada em melhorias progressivas sobre as funções originais.
- HTML, CSS e JavaScript nativos, sem instalação do React e sem dependências de animação.
- Inspiração em padrões de feedback, transições, seleção e estados da biblioteca [React Bits](https://github.com/DavidHDev/react-bits). **Não houve cópia dos componentes React Bits**, mas qualquer reutilização direta futura deve respeitar a licença MIT + Commons Clause e seus avisos.
- LocalStorage continua na chave `construtor-treino-v2-plans`. JSON antigo não sofre migração.

## Matriz do checklist

| Etapa | Implementação | Evidência |
|---|---|---|
| 0 — Proteção | Branch dedicada, commit V4 preservado e três fichas JSON de teste | `tests/fixtures/atlas-v4-1-fixtures.json` |
| 1 — Feedback | Toast não intrusivo com estado, duração, fechamento e ação Desfazer | `assets/atlas-ux.js`, `assets/atlas-ux.css` |
| 2 — Seleção | Sessão ativa identificada, contexto por card, adição confirmada, prevenção de clique duplo e reversão da ocorrência exata | `card()` e `renderPickDays()` aprimorados |
| 3 — Busca e leitura | Estado sem resultados, rótulos ARIA, carregamento e catálogo progressivo preservados | `renderLibrary()` aprimorado |
| 4 — Montagem | Edição ao digitar, transição FLIP na mudança de ordem, foco e Desfazer remoção sem perder propriedades | `renderChosen()` aprimorado |
| 5 — Movimento | Duas fotografias V3.2 mantidas; músculo/equipamento, carregamento e botão de nova tentativa em falhas | `openMotion()` aprimorado |
| 6 — Fichas | Cards V4 preservados, spotlight sutil opcional, duplicação com confirmação e exclusão com Desfazer | `renderSaved()` aprimorado |
| 7 — Exportação | Estados de preparação e resultado sem alterar geradores JPG/PDF/ZIP/JSON | Encapsulamento dos handlers originais |
| 8 — Acessibilidade | Foco visível, rótulos acessíveis, eventos de teclado originais, movimentos reduzidos, feedback em contexto e CSS leve | CSS/JS nativos |
| 9 — Regressão | Teste Playwright automatizado com mock remoto, cenários reais de ficha e capturas em 5 viewports | `tests/atlas-v4-1-browser.mjs`, workflow de CI |
| 10 — Entrega | PR, revisão do diff, merge e publicação apenas com checks aprovados; verificar URL pública e manter rollback documentado | GitHub PR e GitHub Pages |

## Testes automatizados previstos

A suíte cobre:
1. Carregamento do aplicativo com ficha pré-existente, sem migração.
2. Filtro por nome, sessão de destino, adição, contador e Desfazer.
3. Inclusão intencional repetida.
4. Dados de observação preservados após reordenação.
5. Remoção e restauração na posição original.
6. Salvamento e reabertura com dados intactos.
7. Resultado de busca vazio.
8. Visualizador, metadados, pausa, avanço e Escape.
9. Três downloads JPG separados no desktop.
10. Exportação PDF.
11. Duplicação de ficha e Desfazer exclusão.
12. Capturas responsivas 360, 390, 768, 1024 e 1440 px.
13. Capturas da Montagem e Catálogo em 390 e 1440 px.
14. Comparação visual com o `index.html` original da V4.
15. Sessão longa com arquivos `parte-N`.
16. Compartilhamento múltiplo via Web Share **simulado** no celular.
17. Fallback ZIP **simulado** no celular.
18. Preferência de movimento reduzido sem autoplay.
19. Ausência de exceções JavaScript não tratadas.

### Limites da evidência

- Testes do CI executam no Chromium/Linux hospedado pelo GitHub.
- A configuração de dispositivo móvel e a API de compartilhamento móvel são **simuladas**; não substituem teste físico em Safari/iOS e Chrome/Android.
- Capturas são evidência de renderização no Chromium, não prova automática de qualidade visual ou de compatibilidade universal.
- A entrega de downloads para armazenamento e compartilhamentos externos deve ser confirmada no próprio dispositivo.
- As imagens remotas do catálogo são substituídas por fotos sintéticas nas verificações, para não depender de disponibilidade externa.

## Critérios para merge e rollback

**Condições de merge:** CI verde no commit final; verificação dos elementos originais; arquivos JPG separados, PDF e visualizador sem regressão; responsividade revisada com screenshots; código restrito ao escopo do checklist.

**Rollback:** se surgir problema em produção, reverter o PR V4.1 preservando o commit V4 `939e1ee` como referência.

## Próximos pontos não incluídos

- Tradução editorial e revisão técnica de instruções de execução (evita conteúdo biomecânico não validado).
- Conversão do projeto para React ou inclusão de efeitos gráficos WebGL (sem benefício proporcional neste estágio).
- Mudança de banco de dados ou sincronização remota entre dispositivos (fora do escopo).
- Testes físicos de iOS e Android dependem de dispositivos reais.
