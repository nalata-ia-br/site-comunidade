# IA na lata

Landing page da comunidade brasileira de IA open source e on-premise. Construída com Astro, TypeScript e Motion, com HTML estático, fontes locais, navegação responsiva e animações que respeitam a preferência por movimento reduzido.

Os textos retomam a apresentação, os princípios e o convite da [página original](https://nalata.ia.br/), preservando o foco em ferramentas abertas, infraestrutura própria e troca técnica. A seção “Do datacenter para grandes ideias” transforma a referência visual original em uma cena de servidor com doze marcas reais que se expandem conforme o scroll.


## Executar localmente

Use Node.js **22.22.0**, definido em `.nvmrc`:

```sh
nvm install
nvm use
npm install
npm run dev
```

## Validar e gerar a versão de produção

```sh
npm run build
npm run test:e2e
```

O build executa a verificação Astro/TypeScript e gera o site em `dist/`. Os testes Playwright iniciam o servidor automaticamente e verificam navegação, FAQ, conteúdo sem JavaScript, leitura da stack por scroll, animações dos cards, pausa global, acessibilidade, metadados, movimento reduzido e diferentes tamanhos de tela. Na cena do servidor, confira também a saída gradual das marcas, a conexão com o rack e a composição estática quando o movimento está desativado.

Se o ambiente não tiver Chromium do Playwright nem Google Chrome, instale o navegador de teste com `npx playwright install chromium`.

Para visualizar o resultado do build: `npm run preview`.

Com o servidor de desenvolvimento na porta 4322, `npm run capture` atualiza as capturas desktop/mobile em `artifacts/` e gera `public/og-image.png` a partir do design do hero. Execute o build novamente após atualizar essa imagem. Use `npm run format` para formatar o código e `npm run format:check` para conferir sua formatação.

`node scripts/capture-motion.mjs` grava uma demonstração do movimento da interface em `artifacts/motion-preview.webm`, útil para revisar as transições dos cards, do servidor e da stack. Para testes e capturas em outra instância (incluindo uma prévia de produção), informe `PLAYWRIGHT_BASE_URL=http://127.0.0.1:PORTA` antes do comando.

O fundo combina auroras em CSS e um campo de partículas em canvas a 20 fps no mobile e 30 fps no desktop. Os cards animam apenas quando visíveis; a stack mantém todos os textos e ferramentas no HTML, com sua ilustração acompanhando a leitura. O controle no canto inferior direito pausa o movimento e preserva a escolha localmente. A preferência do sistema por movimento reduzido também é respeitada.

A cena usa um servidor 2D em vista frontal, construído em HTML e CSS no componente `ServerRack.astro`, com o monograma SVG local da IA na lata. O gabinete fica reto e centralizado, com frente opaca, preenchimentos planos e bordas finas; as conexões ficam atrás dele. Seus cinco módulos representam rede, computação, armazenamento, computação e energia. O scroll controla posição, escala e visibilidade das doze marcas, além do desenho das conexões; LEDs, ventoinhas e placas acrescentam movimento enquanto a seção está visível. Sem JavaScript, com movimento reduzido ou com a pausa ativada, a composição mantém as marcas legíveis. Os logotipos são SVGs servidos localmente; o servidor não depende de imagem raster.

## Publicação

Configure sua hospedagem estática para executar `npm ci && npm run build` com Node 22.22.0 e publicar a pasta `dist/`. O site não depende de um servidor de aplicação.

O domínio canônico é `https://nalata.ia.br`. Caso altere o domínio, atualize `src/data/site.ts`, `astro.config.mjs`, `public/robots.txt` e `public/sitemap.xml` antes de gerar o build.

## Onde editar

| Conteúdo                                             | Arquivo                                                                                       |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Título SEO, descrição, domínio e convite do WhatsApp | `src/data/site.ts`                                                                            |
| Metadados Open Graph/Twitter e dados estruturados    | `src/pages/index.astro`                                                                       |
| Imagem de compartilhamento, 1200 × 630 px            | `public/og-image.png`                                                                         |
| Apresentação principal                               | `src/components/Hero.astro`                                                                   |
| Comunidade e valores                                 | `src/components/About.astro`                                                                  |
| Cena do servidor e expansão das marcas               | `src/components/ServerReveal.astro`, `src/scripts/server-reveal.ts`                           |
| Servidor em HTML/CSS e documentação da cena          | `src/components/ServerRack.astro`, `docs/server-image.md`                                     |
| Marcas da cena, SVGs e atribuições                   | `src/data/server-brands.ts`, `public/brands/`, `docs/brand-assets.md`                         |
| Categorias e tecnologias                             | `src/components/Stack.astro`                                                                  |
| Participação e perguntas frequentes                  | `src/components/Community.astro`                                                              |
| Menu e rodapé                                        | `src/components/Header.astro`, `src/components/Footer.astro`                                  |
| Paleta, tipografia e estilos globais                 | `src/styles/global.css`                                                                       |
| Animações de texto, parallax e menu móvel            | `src/scripts/interactions.ts`                                                                 |
| Fundo e estado global de movimento                   | `src/components/Atmosphere.astro`, `src/scripts/atmosphere.ts`, `src/scripts/motion-state.ts` |
| Cenas animadas dos cards e leitura da stack          | `src/scripts/pillars-motion.ts`, `src/scripts/stack-motion.ts`                                |
| Monograma vetorial da marca                          | `src/components/Logo.astro`, `public/favicon.svg`                                             |

A imagem original, `src/assets/community-original.jpg`, e a tentativa anterior de arte gerada, `src/assets/server-rack-v3.png`, permanecem arquivadas como referência. Nenhuma delas é importada ou renderizada na página atual. A construção do servidor e o comportamento da cena estão descritos em [docs/server-image.md](docs/server-image.md); as fontes e os termos dos logotipos estão em [docs/brand-assets.md](docs/brand-assets.md).

O convite original do WhatsApp também foi preservado. A participação é gratuita, com aprovação de administrador; os botões abrem o convite externo, sem envio de formulários ou armazenamento de dados neste site.
