# Cardápio Digital — Sorveteria Bamboline

Cardápio digital estático da Sorveteria Bamboline, em Ariquemes – RO, com visual de aplicativo de delivery. O cliente busca e filtra os produtos, personaliza os itens, monta o carrinho, escolhe o setor de entrega, confere o total e finaliza o pedido pelo WhatsApp da loja.

O projeto não usa banco de dados, backend, framework de front-end ou dependências de execução. O carrinho fica no `localStorage` do navegador.

## Como executar

Requisitos: Node.js 20 ou superior.

```bash
npm start
```

Abra `http://127.0.0.1:4173`.

Também é possível servir a pasta com qualquer servidor estático. Abrir o `index.html` diretamente no navegador funciona na maioria dos casos, mas um servidor local é recomendado.

## Como testar

```bash
npm test
```

Os testes verificam tabela de preços, sabores, taxas de entrega, soma do carrinho, persistência, mensagem do WhatsApp, codificação da URL, validações do núcleo e status de aberto/fechado no fuso de Ariquemes.

## Exibição atual do cardápio

No cardápio estão visíveis o **Copo de sorvete**, os potes de **1 litro** e **1,5 litro**, o **Milk-shake** e as **Bebidas** (sem Bananinha). Taça, Casquinha, Cascão, Bananinha e toda a linha Açaí/Leitinho estão ocultos da exibição, mas continuam preservados nos dados, no carrinho e no checkout.

Os potes oferecem **Morango e Leite Condensado** ou **Morango e Baunilha**. O limite de sabores continua configurável por produto em `maxFlavors`.

A lista do que aparece no menu fica em `HIDDEN_FROM_MENU`, no início de `js/app.js`. Categorias sem produtos visíveis são ocultadas automaticamente.

## Organização dos produtos e sabores

Cada produto aparece uma única vez no cardápio. Tamanhos e sabores são escolhidos no painel de personalização, e os cards usam o nome completo do produto para diferenciar as linhas tradicional e açaí/leitinho.

O limite de sabores é individual e fica no campo `maxFlavors` de cada produto em `js/data.js`. Todos os produtos com sabor estão configurados atualmente com **1 sabor**, preservando a regra existente. O seletor, o carrinho, o `localStorage` e a mensagem do WhatsApp já suportam múltiplos sabores quando esse valor for maior que 1.

**A confirmar com a loja:**

- Quantidade máxima de sabores por produto (copos, taças, casquinhas, cascões e milk-shakes).
- Se combinações podem misturar sabores tradicionais com açaí/leitinho. Hoje cada categoria mantém seus próprios sabores.
- Se combinações de sabores terão algum acréscimo de preço. Nenhuma cobrança adicional foi criada; o preço continua sendo definido apenas pelo produto e tamanho.

Para liberar combinações em um produto, altere apenas o respectivo `maxFlavors` (por exemplo, `maxFlavors: 2`). O painel passa a exibir caixas de seleção com o limite configurado.

## Onde alterar

- `js/data.js`: produtos, tamanhos, preços, sabores, setores e taxas, horários, endereço, Instagram e números de WhatsApp.
- `js/cart.js`: regras de carrinho, totais, formatação de moeda, status da loja e geração da mensagem do WhatsApp.
- `js/art.js`: ilustrações vetoriais dos produtos e paletas por sabor.
- `js/app.js`: renderização do cardápio, busca, filtros, painéis, carrinho, checkout e interações.
- `index.html`: estrutura do cardápio e conteúdo de apoio.
- `css/style.css`: base visual, carrinho, painéis e checkout.
- `css/catalog.css`: cabeçalho compacto, busca, filtros, grade de produtos e rodapé.
- `tests/core.test.js`: testes automatizados do núcleo.

O WhatsApp principal fica em `js/data.js`, em `store.whatsapp.primary.digits`, no formato internacional. A mensagem é montada a partir do carrinho e do checkout pela função `buildWhatsAppMessage`, e a taxa é calculada em um único ponto (`computeTotals` / `getDeliveryFee`).

## Imagens dos produtos

O avatar circular do cabeçalho usa `assets/avatar-bamboline.jpg`, um recorte de `fotoprincipal.jpg`. Para trocar a imagem do topo, substitua `assets/avatar-bamboline.jpg` por outra foto quadrada ou gere um novo recorte a partir da foto original.

O **Copo de sorvete** exibe as fotos `assets/copo-sorvete-1.jpg` e `assets/copo-sorvete-2.jpg` lado a lado no mesmo card, criadas a partir dos arquivos `copo` e `copo2`. O **Milk-shake** usa o mesmo formato com `assets/milkshake-1.jpg` e `assets/milkshake-2.jpg`, a partir de `mikeshake.jpeg` e `mikeshake2.jpeg`.

Os potes usam `assets/pote-1l-produto.jpg` e `assets/pote-1-5l-produto.jpg`, a partir de `llitro.jpeg` e `1litroemeio.jpeg`.

Os demais produtos com foto são: **Taça**, **Casquinha** e **Cascão** tradicionais (`assets/taca-produto.jpg`, `assets/casquinha-produto.jpg`, `assets/cascao-produto.jpg`), **Copo de açaí e leitinho** (`assets/acai-leitinho-produto.jpg`), **Taça de açaí e leitinho** (`assets/acai-taca-produto.jpg`), **Água** (`assets/agua-produto.jpg`, a partir de `agua.png`), **Água com gás** (`assets/agua-com-gas-produto.jpg`, a partir de `aguacomgas.png`), **Coca-Cola lata** (`assets/coca-lata-produto.jpg`, a partir de `cocalata.png`), **Coca-Cola 600 ml** (`assets/coca-600-produto.jpg`, a partir de `coca600ml.png`), **Coca-Cola 1 litro** (`assets/coca-1l-produto.jpg`, a partir de `coca1litro.png`) e **Coca-Cola 2 litros** (`assets/coca-2l-produto.jpg`, a partir de `coca2litros.png`). Itens sem foto usam ilustrações SVG locais. Para usar fotos reais em outros itens, adicione ao produto em `js/data.js`:

```js
image: 'assets/produtos/copo-300ml.jpg',
imageAlt: 'Copo de sorvete de 300 ml'
```

Quando `image` existe, o cardápio, o painel do produto e o carrinho passam a usar a foto automaticamente.

## Publicação na Vercel

O projeto é 100% estático. O comando `npm run build` copia `index.html`, `css/`, `js/` e `assets/` para `public/`. O `vercel.json` já define esse build e a pasta de saída.

Na Vercel, o projeto deve usar:

- **Framework Preset:** Other
- **Root Directory:** a raiz do repositório
- **Build Command:** `npm run build`
- **Output Directory:** `public`

Depois de conferir, faça um novo deploy. Não há variáveis de ambiente nem segredos.

## Observações

- O pedido não é enviado automaticamente. O site abre o WhatsApp com a mensagem pronta e o cliente precisa tocar em enviar.
- O carrinho não é apagado após abrir o WhatsApp.
- Nenhum pagamento é processado no site.
- Fora do horário de funcionamento, o cardápio continua disponível e o checkout avisa que a confirmação depende do atendimento.
- A taxa de entrega é calculada pelo setor selecionado, sem geolocalização, e cobrada uma única vez por pedido.
