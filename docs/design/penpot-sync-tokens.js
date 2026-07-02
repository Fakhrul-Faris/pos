/**
 * Penpot MCP — token & library sync script
 *
 * Run via Penpot MCP `execute_code` after plugin is connected.
 * Source of truth: docs/platform/design-system/tokens.json (v2 — Notion-influenced structure, POS green brand)
 *
 * Last verified: 30 Jun 2026 (Penpot remote MCP)
 */

async function syncTokensToPenpot() {
  const catalog = penpot.library.local.tokens;
  const results = { sets: [], tokens: { added: [], updated: [], skipped: [] }, colors: [], typographies: [] };

  function getOrCreateSet(name) {
    let set = catalog.sets.find((s) => s.name === name);
    if (!set) set = catalog.addSet({ name });
    if (!set.active) set.toggleActive();
    return set;
  }

  function upsertToken(set, type, name, value) {
    const existing = set.tokens.find((t) => t.name === name);
    if (existing) {
      if (existing.value !== value) {
        existing.value = value;
        results.tokens.updated.push(name);
      } else {
        results.tokens.skipped.push(name);
      }
      return name;
    }
    set.addToken({ type, name, value });
    results.tokens.added.push(name);
    return name;
  }

  function upsertLibColor(libName, hex) {
    let libColor = penpot.library.local.colors.find((c) => c.name === libName);
    if (!libColor) {
      libColor = penpot.library.local.createColor();
      libColor.name = libName;
      results.colors.push(`+ ${libName}`);
    }
    if (libColor.color !== hex) {
      libColor.color = hex;
      if (!results.colors.includes(libName)) results.colors.push(libName);
    }
  }

  const primitiveColor = getOrCreateSet('primitive/color');
  const primitiveSpacing = getOrCreateSet('primitive/spacing');
  const primitiveRadius = getOrCreateSet('primitive/radius');
  const primitiveTypography = getOrCreateSet('primitive/typography');
  const semanticColor = getOrCreateSet('semantic/color');
  const componentSet = getOrCreateSet('component');

  const colors = [
  // Green scale
    ['green.100', '#F0FAF5'],
    ['green.200', '#E8F9F0'],
    ['green.300', '#A8E8C8'],
    ['green.400', '#6DD9A8'],
    ['green.500', '#38CE87'],
    ['green.600', '#2FB876'],
    ['green.700', '#1A7A4C'],
    ['green.800', '#145C38'],
    ['green.900', '#0D3D26'],
  // Warm neutrals (Notion-inspired)
    ['neutral.50', '#F9F9F8'],
    ['neutral.100', '#F6F5F4'],
    ['neutral.200', '#DFDCD9'],
    ['neutral.300', '#A39E98'],
    ['neutral.400', '#78736F'],
    ['neutral.ink', '#1C1C1C'],
    ['neutral.muted', '#6B6B6B'],
    ['neutral.border', '#E6E6E6'],
    ['neutral.border-subtle', '#F2F2F2'],
    ['neutral.surface', '#F9F9F8'],
    ['neutral.white', '#FFFFFF'],
  // Alpha text (hex approximations — Penpot rejects 8-digit hex / rgb alpha)
    ['alpha.text-strong', '#1A1A1A'],
    ['alpha.text-normal', '#262626'],
    ['alpha.text-muted', '#757575'],
    ['alpha.text-disabled', '#B3B3B3'],
  // Status
    ['status.success', '#14832B'],
    ['status.warning', '#FF6D00'],
    ['status.error', '#F64932'],
  ];

  for (const [name, value] of colors) {
    upsertToken(primitiveColor, 'color', name, value);
    upsertLibColor(name.replace(/\./g, ' / '), value);
  }

  for (const [name, value] of [
    ['1', '4'], ['2', '8'], ['3', '12'], ['4', '16'], ['5', '20'], ['6', '24'],
    ['7', '28'], ['8', '32'], ['10', '40'], ['12', '48'], ['14', '56'], ['16', '64'],
    ['20', '80'], ['24', '96'],
  ]) {
    upsertToken(primitiveSpacing, 'spacing', name, value);
  }

  for (const [name, value] of [
    ['sm', '4'], ['md', '8'], ['lg', '12'], ['xl', '16'], ['full', '9999'],
  ]) {
    upsertToken(primitiveRadius, 'borderRadius', name, value);
  }

  for (const [name, value] of [
    ['size.xs', '12'], ['size.sm', '14'], ['size.base', '16'], ['size.lg', '18'],
    ['size.xl', '20'], ['size.2xl', '22'], ['size.3xl', '32'], ['size.4xl', '42'],
    ['size.5xl', '54'], ['size.6xl', '60'], ['size.7xl', '76'],
    ['weight.regular', '400'], ['weight.medium', '500'], ['weight.semibold', '600'], ['weight.bold', '700'],
    ['tracking.tight-sm', '-0.25'], ['tracking.tight-md', '-0.75'], ['tracking.tight-lg', '-3.4'],
  ]) {
    const type = name.startsWith('weight') || name.startsWith('tracking') ? 'number' : 'fontSizes';
    upsertToken(primitiveTypography, type, name, value);
  }

  for (const [name, value] of [
    ['background.page', '{neutral.surface}'],
    ['background.elevated', '{neutral.white}'],
    ['background.subtle', '{neutral.100}'],
    ['background.inverse', '{neutral.ink}'],
    ['background.brand-muted', '{green.100}'],
    ['background.brand-soft', '{green.200}'],
    ['text.primary', '{alpha.text-strong}'],
    ['text.secondary', '{alpha.text-muted}'],
    ['text.brand', '{green.500}'],
    ['text.link', '{green.600}'],
    ['interactive.primary-bg', '{green.500}'],
    ['interactive.primary-bg-hover', '{green.600}'],
    ['interactive.secondary-bg', '{green.200}'],
    ['interactive.secondary-text', '{green.700}'],
    ['border.default', '{neutral.border}'],
    ['border.subtle', '{neutral.border-subtle}'],
    ['badge.available-bg', '{green.200}'],
    ['badge.available-text', '{green.700}'],
    ['badge.coming-soon-bg', '{neutral.100}'],
    ['badge.coming-soon-text', '{alpha.text-muted}'],
  ]) {
    upsertToken(semanticColor, 'color', name, value);
  }

  for (const [name, type, value] of [
    ['logo.dot-size', 'dimension', '12'],
    ['logo.dot-color', 'color', '{green.500}'],
    ['button.primary-radius', 'borderRadius', '{md}'],
    ['button.primary-padding-x', 'spacing', '15'],
    ['button.primary-padding-y', 'spacing', '6'],
    ['button.secondary-radius', 'borderRadius', '{md}'],
    ['card.radius', 'borderRadius', '{md}'],
    ['card.padding', 'spacing', '16'],
    ['card.border', 'color', '#F2F2F2'],
    ['card.gap', 'spacing', '24'],
    ['layout.nav-height', 'spacing', '64'],
    ['layout.grid-gutter', 'spacing', '28'],
    ['layout.max-width', 'dimension', '1252'],
    ['promo-banner.bg', 'color', '{neutral.ink}'],
    ['promo-banner.accent', 'color', '{green.500}'],
  ]) {
    upsertToken(componentSet, type, name, value);
  }

  if (!catalog.themes.find((t) => t.name === 'light')) {
    catalog.addTheme({ group: 'mode', name: 'light' });
  }

  const fallbackFont = penpot.fonts.findByName('sourcesanspro') || penpot.fonts.all[0];
  const typoSpecs = [
    { name: 'Display / XL', size: '76', weight: '600', lineHeight: '1.06' },
    { name: 'Display / LG', size: '60', weight: '600', lineHeight: '1.06' },
    { name: 'Heading / H1', size: '54', weight: '600', lineHeight: '1.25' },
    { name: 'Heading / H2', size: '32', weight: '700', lineHeight: '1.25' },
    { name: 'Heading / H3', size: '22', weight: '700', lineHeight: '1.27' },
    { name: 'Body / MD', size: '16', weight: '400', lineHeight: '1.5' },
    { name: 'Body / SM', size: '14', weight: '400', lineHeight: '1.5' },
  ];

  for (const spec of typoSpecs) {
    let typo = penpot.library.local.typographies.find((t) => t.name === spec.name);
    if (!typo) {
      typo = penpot.library.local.createTypography();
      typo.name = spec.name;
      results.typographies.push(`+ ${spec.name}`);
    }
    typo.fontFamilies = fallbackFont ? fallbackFont.name : 'sourcesanspro';
    typo.fontSize = spec.size;
    typo.fontWeight = spec.weight;
    typo.lineHeight = spec.lineHeight;
    if (!results.typographies.includes(spec.name)) results.typographies.push(spec.name);
  }

  // Tokens reference page
  let tokensPage = penpotUtils.getPageByName('Tokens');
  if (!tokensPage) {
    tokensPage = penpot.createPage();
    tokensPage.name = 'Tokens';
  }
  penpot.openPage(tokensPage);

  const swatchBoardName = 'POS / Color Swatches';
  let swatchBoard = penpotUtils.findShape((s) => s.name === swatchBoardName, tokensPage.root);
  if (swatchBoard) swatchBoard.remove();

  swatchBoard = penpot.createBoard();
  swatchBoard.name = swatchBoardName;
  swatchBoard.x = 64;
  swatchBoard.y = 64;
  swatchBoard.fills = [{ fillColor: '#F9F9F8', fillOpacity: 1 }];
  penpotUtils.addFlexLayout(swatchBoard, 'row');
  swatchBoard.flex.rowGap = 16;
  swatchBoard.flex.columnGap = 16;
  swatchBoard.flex.topPadding = 24;
  swatchBoard.flex.leftPadding = 24;
  swatchBoard.flex.rightPadding = 24;
  swatchBoard.flex.bottomPadding = 24;
  swatchBoard.flex.verticalSizing = 'auto';
  swatchBoard.flex.horizontalSizing = 'auto';
  swatchBoard.flex.wrap = 'wrap';

  const title = penpot.createText('POS Design Tokens v2 — Notion structure, green brand');
  title.fontSize = '18';
  title.fontWeight = '400';
  title.growType = 'auto-width';
  swatchBoard.appendChild(title);

  for (const [name, value] of colors) {
    const card = penpot.createBoard();
    card.name = `swatch / ${name}`;
    card.fills = [{ fillColor: '#FFFFFF', fillOpacity: 1 }];
    card.borderRadius = 8;
    card.strokes = [{ strokeColor: '#E6E6E6', strokeWidth: 1 }];
    penpotUtils.addFlexLayout(card, 'column');
    card.flex.rowGap = 8;
    card.flex.topPadding = 12;
    card.flex.leftPadding = 12;
    card.flex.rightPadding = 12;
    card.flex.bottomPadding = 12;
    card.flex.verticalSizing = 'auto';
    card.flex.horizontalSizing = 'fix';
    card.resize(120, 100);

    const swatch = penpot.createRectangle();
    swatch.resize(96, 40);
    swatch.borderRadius = 6;
    swatch.fills = [{ fillColor: value.length === 9 ? value : value, fillOpacity: 1 }];
    card.appendChild(swatch);

    const label = penpot.createText(name);
    label.fontSize = '11';
    label.resize(96, 16);
    label.growType = 'auto-height';
    card.appendChild(label);

    const hex = penpot.createText(value);
    hex.fontSize = '10';
    hex.fills = [{ fillColor: '#0000008A', fillOpacity: 1 }];
    hex.resize(96, 14);
    hex.growType = 'auto-height';
    card.appendChild(hex);

    swatchBoard.appendChild(card);
  }
  results.swatchBoard = 'rebuilt';

  results.sets = catalog.sets.map((s) => ({
    name: s.name,
    active: s.active,
    count: s.tokens.length,
  }));
  results.tokenOverview = penpotUtils.tokenOverview();
  results.page = tokensPage.name;
  return results;
}

return await syncTokensToPenpot();
