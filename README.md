# Construtor de Treino Pro V2.1

Construtor pessoal de fichas de musculação, responsivo e sem login. A versão V2 substitui o antigo `index.html` diretamente na branch `main`.

## Recursos
- Biblioteca fotográfica pesquisável com 800+ exercícios, filtro por grupo muscular e carregamento progressivo.
- Divisões AB, ABC, ABCD, ABCDE, PPL e Full Body; dias adicionais personalizados.
- Adicionar, remover e reorganizar exercícios; editar séries, repetições, descanso e observações.
- Salvar, reabrir, duplicar e excluir fichas no armazenamento local do navegador.
- Exportar/importar fichas JSON; exportar JPG e imprimir/salvar PDF.

## Como testar
Abra `index.html` no navegador com internet para carregar a biblioteca de exercícios. Para usar por link público, habilite GitHub Pages em **Settings → Pages → Deploy from a branch → main / (root)**. O repositório precisa estar publicado no Pages para a URL funcionar.

## Imagens e dados
Fonte: [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db), dataset em JSON e fotos JPG. O dataset declara **Unlicense**. Imagens carregadas sob demanda de `raw.githubusercontent.com`; não são copiadas para este repositório. Algumas traduções de nomes estão embutidas na interface; os demais aparecem em inglês. Antes de redistribuição comercial, revisar a procedência e os direitos de cada mídia.

## Limitações conhecidas
- O catálogo e as imagens dependem da internet na primeira carga; o catálogo JSON é armazenado em cache no `localStorage` quando houver espaço.
- Fichas salvas no `localStorage` pertencem àquele navegador/dispositivo; limpar dados do site pode apagá-las. Faça backups JSON.
- A exportação PDF utiliza a caixa de impressão do navegador. O JPG usa html2canvas carregado de CDN e pode falhar em algumas imagens remotas por CORS; PDF é alternativa.
- Ainda não há PWA/offline completo, nem testes automatizados cross-browser.
- A biblioteca externa usa nomes majoritariamente em inglês; traduções abrangem alguns exercícios populares.

## Histórico
O projeto original (Construtor de Treino Pro, outubro de 2025) permanece recuperável pelo histórico de commits Git.

## Correções V2.1 (27/10/2026)
- Biblioteca agora é o seletor único de exercícios: possui busca, filtro por grupo muscular e botão **Adicionar**.
- Tela **Minha montagem** separada, com edição de séries, repetições, descanso, observações e ordem. O contador mostra quantos exercícios foram selecionados.
- Seleção do dia de treino dentro da biblioteca.
- JPG gerado por Canvas nativo, sem html2canvas e sem depender de imagens externas; exporta ficha textual organizada.
- PDF gerado por jsPDF e compartilhado pelo menu nativo quando disponível no iOS; não utiliza a visualização de impressão que mostrava folha em branco.
- **Limite atual:** PDF/JPG são fichas textuais, sem fotografias incorporadas. A biblioteca visual continua usando imagens remotas. O PDF exige internet para carregar jsPDF inicialmente. Testar no Safari/iOS após atualização do Pages.
