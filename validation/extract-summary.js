const fs = require('fs');

function pick(obj, path, fallback) {
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== 'object' || !(p in cur)) return fallback;
    cur = cur[p];
  }
  return cur == null ? fallback : cur;
}

function buildSummary(full) {
  const meta = full.meta || {};
  const brandId = meta.brandId || meta.brand_id || '';
  const brandName = meta.brandName || meta.brand_name || '';
  const schemaVersion = meta.schemaVersion || meta.schema_version || '';

  const identity = full.identity || {};
  const narrative = full.narrative || {};
  const voice = full.voice || {};

  const out = {
    meta: {
      brandId: brandId,
      brandName: brandName,
      schemaVersion: schemaVersion,
      schemaType: 'summary',
      canonicalURL: brandId ? ('https://ramoira.com/brands/' + brandId + '/schema.summary.json') : ''
    },
    identity: {
      summary: pick(identity, 'summary', {}),
      distinctiveAssets: {
        visual: {
          primaryColor: pick(identity, 'distinctiveAssets.visual.primaryColor', undefined),
          secondaryColors: pick(identity, 'distinctiveAssets.visual.secondaryColors', []),
          iconography: pick(identity, 'distinctiveAssets.visual.iconography', []),
          photographyStyle: pick(identity, 'distinctiveAssets.visual.photographyStyle', undefined)
        },
        linguistic: {
          ownedWords: pick(identity, 'distinctiveAssets.linguistic.ownedWords', []),
          typographicVoice: pick(identity, 'distinctiveAssets.linguistic.typographicVoice', undefined)
        }
      }
    },
    narrative: {
      semiotic: pick(narrative, 'semiotic', {}),
      myth: {
        mythStatement: pick(narrative, 'myth.mythStatement', ''),
        mythTest: pick(narrative, 'myth.mythTest', '')
      },
      contentTest: pick(narrative, 'contentTest', {})
    },
    voice: {
      base: pick(voice, 'base', {}),
      approvedTones: pick(voice, 'approvedTones', []),
      forbiddenTones: pick(voice, 'forbiddenTones', []),
      examples: pick(voice, 'examples', [])
    }
  };

  if (out.identity.distinctiveAssets.visual.primaryColor === undefined) {
    delete out.identity.distinctiveAssets.visual.primaryColor;
  }
  if (out.identity.distinctiveAssets.visual.photographyStyle === undefined) {
    delete out.identity.distinctiveAssets.visual.photographyStyle;
  }
  if (out.identity.distinctiveAssets.linguistic.typographicVoice === undefined) {
    delete out.identity.distinctiveAssets.linguistic.typographicVoice;
  }

  return out;
}

const targets = [
  {
    in: 'd:/dev-projects/ramoira/brand-schema-spec/examples/little-rituals/brand.schema.json',
    out: 'd:/dev-projects/ramoira/brand-schema-spec/examples/little-rituals/brand.schema.summary.json'
  },
  {
    in: 'd:/dev-projects/ramoira/brand-schema-spec/examples/rolex/brand.schema.json',
    out: 'd:/dev-projects/ramoira/brand-schema-spec/examples/rolex/brand.schema.summary.json'
  }
];

for (const t of targets) {
  const full = JSON.parse(fs.readFileSync(t.in, 'utf8'));
  const summary = buildSummary(full);
  fs.writeFileSync(t.out, JSON.stringify(summary, null, 2) + '\n', 'utf8');
  console.log('wrote', t.out);
}
