# Construtor de Treino Pro V2

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
