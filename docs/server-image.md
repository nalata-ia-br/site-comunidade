# Cena e animação do servidor

A seção “Do datacenter para grandes ideias” adapta a referência visual original
da comunidade ao design atual da IA na lata. O servidor 2D tem vista frontal e é
construído em HTML e CSS, com o monograma SVG local da marca. Doze logotipos
independentes saem visualmente do rack conforme a pessoa rola a página,
mantendo seus nomes no HTML.

## Componentes e camadas

`src/components/ServerRack.astro` desenha apenas a frente plana do gabinete,
reta e centralizada. Os preenchimentos opacos e as bordas finas definem cinco
módulos, nesta ordem: network, compute, storage, compute e power. LEDs e
ventoinhas permanecem animados. A identidade do gabinete reutiliza o vetor
local de `src/components/Logo.astro`.

A composição frontal não usa topo, lateral, perspectiva, inclinação ou pés.
O fundo opaco impede que as conexões apareçam através do gabinete.

`src/components/ServerReveal.astro` posiciona o servidor, as marcas, as conexões
SVG e os elementos de atmosfera. Os caminhos e a iluminação ficam atrás do
gabinete; as placas das marcas ocupam uma camada própria ao redor dele. O
gabinete é apresentado diretamente sobre o fundo da seção. O rack não importa
PNG nem usa o componente `Image` do Astro: sua aparência é definida
pelo HTML e pelo CSS e acompanha o tamanho disponível em desktop e mobile.

As doze marcas usam SVGs reais servidos a partir de `public/brands/`. Seus nomes,
caminhos e cores ficam em `src/data/server-brands.ts`. As fontes, licenças e
atribuições estão em [brand-assets.md](brand-assets.md).

## Movimento e leitura

`src/scripts/server-reveal.ts` transforma a posição do scroll em progresso da
cena. Cada marca tem um pequeno intervalo de entrada e sai do centro do rack
até sua posição final, ajustando translação, escala, rotação e opacidade. Os
caminhos SVG acompanham essa abertura. Animações CSS movimentam os LEDs, as
ventoinhas, as placas e os sinais das conexões enquanto a seção está visível.
O mobile usa posições próprias para distribuir as marcas nas laterais do servidor.

O HTML e o CSS apresentam a composição final por padrão. Sem JavaScript, os
doze nomes e logotipos permanecem disponíveis e distribuídos ao redor do rack.
A preferência de movimento reduzido e o controle global de pausa também
mantêm a cena completa e estática, sem exigir scroll para revelar as marcas.
O estado global é compartilhado por `src/scripts/motion-state.ts`.

## Validação e captura

Execute `npm run build` para verificar Astro/TypeScript e gerar o site estático.
Execute `npm run test:e2e` para os testes da página. Na revisão visual, confira
a expansão progressiva das marcas, a frente plana e opaca do rack, as conexões
atrás do gabinete e a legibilidade dos nomes em desktop e mobile. Confira
também a composição completa sem JavaScript, com movimento reduzido e com a
pausa manual ativada.

Com uma instância local em execução, `node scripts/capture-motion.mjs` grava a
demonstração em `artifacts/motion-preview.webm`. Para uma instância em outra porta,
defina `PLAYWRIGHT_BASE_URL` antes de executar o comando. As capturas desktop e
mobile podem ser atualizadas com `npm run capture`.

## Referências arquivadas

`src/assets/community-original.jpg` preserva a imagem da página original.
Uma tentativa anterior gerou o rack em `src/assets/server-rack-v3.png` com a
ferramenta `image_gen`, usando essa referência e iluminação azul, violeta e
LEDs verdes. A versão tinha fundo sólido `#060C1A` e foi substituída pelo
servidor em HTML/CSS. Os dois arquivos permanecem apenas como referência:
não são importados nem renderizados na página atual.
