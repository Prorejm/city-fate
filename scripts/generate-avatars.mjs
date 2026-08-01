// 生成 10 张 NPC 风格化头像（暗黑都市 noir 风格 SVG）
// 输出到 public/avatars/*.svg
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../public/avatars')
mkdirSync(OUT, { recursive: true })

const C = {
  void: '#14161c', voidSoft: '#1e2129', ash: '#8a8f98', ashLight: '#c3c7cf',
  gold: '#c09a3f', blood: '#a01f1f', skin: '#d9b48f', skinPale: '#cbb3a8', skinOld: '#b89876',
}

function canvas({ glow, accent }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
<defs>
  <radialGradient id="bg" cx="50%" cy="38%" r="75%">
    <stop offset="0%" stop-color="${glow}"/>
    <stop offset="55%" stop-color="${C.voidSoft}"/>
    <stop offset="100%" stop-color="${C.void}"/>
  </radialGradient>
  <radialGradient id="rim" cx="50%" cy="30%" r="60%">
    <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
    <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="256" height="256" fill="url(#bg)"/>
<rect width="256" height="256" fill="url(#rim)"/>
<g opacity="0.5">
  <circle cx="46" cy="60" r="1.5" fill="${C.ash}"/><circle cx="210" cy="90" r="1.2" fill="${C.ash}"/>
  <circle cx="30" cy="170" r="1" fill="${C.ash}"/><circle cx="228" cy="180" r="1.4" fill="${C.ash}"/>
  <circle cx="120" cy="28" r="1" fill="${C.ash}"/><circle cx="180" cy="220" r="1.1" fill="${C.ash}"/>
</g>`
}

function body({ skin, jacket, shirt, hair, hairStyle, ear }) {
  const hairBack = hairStyle === 'bald' ? '' : `<path d="M96 132 Q96 62 128 54 Q160 62 160 132 Z" fill="${hair}"/>`
  return `
<g>
  <path d="M58 256 Q58 200 96 178 L160 178 Q198 200 198 256 Z" fill="${jacket}"/>
  <path d="M96 178 Q96 164 128 162 Q160 164 160 178 L160 210 Q128 220 96 210 Z" fill="${shirt}"/>
  <path d="M118 150 L138 150 L138 176 L118 176 Z" fill="${skin}"/>
  <rect x="106" y="128" width="44" height="34" rx="20" fill="${skin}"/>
  <circle cx="106" cy="150" r="9" fill="${skin}"/>
  <circle cx="150" cy="150" r="9" fill="${skin}"/>
  ${ear === 'ring' ? '<circle cx="150" cy="152" r="3" fill="none" stroke="#c09a3f" stroke-width="1.6"/><circle cx="150" cy="154" r="1.4" fill="#c09a3f"/>' : ''}
  ${hairBack}
</g>`
}

function face({ hair, hairStyle, hairAccent, browL, browR, eyes, scar, glasses, wrinkles, beard, beardStyle, mouth, mole }) {
  const hairPaths = {
    bob: `<path d="M96 128 Q92 74 128 66 Q164 74 160 128 L160 96 Q168 92 170 100 Q174 116 168 128 Z" fill="${hair}"/><path d="M96 128 L94 96 Q92 90 96 92 Q102 96 104 108 L106 122 Z" fill="${hair}"/>`,
    bun: `<path d="M98 126 Q94 76 128 68 Q162 76 158 126 L158 90 Q152 72 128 66 Q104 72 98 90 Z" fill="${hair}"/><circle cx="128" cy="56" r="17" fill="${hair}"/>`,
    long: `<path d="M96 128 Q90 66 128 60 Q166 66 160 128 L164 118 Q170 104 172 112 Q176 128 166 136 L158 140 Q150 132 152 120 L154 100 Q160 92 158 84 Q150 74 140 76 L134 92 Q132 106 130 128 Z" fill="${hair}"/><path d="M96 128 L92 92 Q90 80 96 76 Q100 78 102 92 L104 110 Z" fill="${hair}"/>`,
    ponytail: `<path d="M98 126 Q94 72 128 64 Q162 72 158 126 L156 88 Q160 70 168 74 Q176 82 172 96 L162 116 Q160 128 158 130 Z" fill="${hair}"/><path d="M96 128 L88 160 Q80 196 96 208 Q104 210 108 204 Q112 196 108 176 L104 140 Z" fill="${hair}"/>`,
    short: `<path d="M96 128 Q92 84 118 72 Q128 68 138 72 Q164 84 160 128 L156 96 Q158 88 152 86 Q150 94 146 100 L146 82 Q140 72 128 68 Q116 72 110 82 L110 100 Q106 94 104 88 Q98 90 100 98 Z" fill="${hair}"/>`,
    flat: `<path d="M94 128 Q92 86 112 74 Q128 66 144 74 Q164 86 162 128 L162 100 Q166 94 168 100 Q172 112 166 128 Z" fill="${hair}"/><path d="M94 128 L92 104 Q90 96 94 98 Q98 102 100 112 L102 124 Z" fill="${hair}"/>`,
    buzz: `<path d="M92 128 Q90 90 112 78 Q128 72 144 78 Q166 90 164 128 L164 108 Q166 100 168 106 Q170 118 164 128 Z" fill="${hair}"/>`,
  }
  const beardPaths = {
    full: `<path d="M104 162 Q104 148 110 146 L128 150 L146 146 Q152 148 152 162 Q148 184 128 188 Q108 184 104 162 Z" fill="${beard}"/>`,
    goatee: `<path d="M120 168 L136 168 L136 178 Q128 184 120 178 Z" fill="${beard}"/>`,
    stubble: `<path d="M104 158 Q116 152 128 152 Q140 152 152 158 Q152 168 128 172 Q104 168 104 158 Z" fill="${beard}" opacity="0.55"/>`,
  }
  const eyesSvg = eyes.map((e, i) => `<ellipse cx="${i === 0 ? 114 : 142}" cy="138" rx="4.4" ry="3" fill="${e}"/><circle cx="${i === 0 ? 114 : 142}" cy="137" r="1.1" fill="#14161c"/>`).join('')
  return `
<g>
  ${hairPaths[hairStyle] ?? ''}
  ${hairAccent ? `<path d="M118 96 Q128 88 138 96 Q136 104 128 108 Q120 104 118 96 Z" fill="${hairAccent}" opacity="0.8"/>` : ''}
  <path d="M104 132 Q108 120 128 118 Q148 120 152 132 Q150 138 142 140 Q132 142 122 140 Q110 138 104 132 Z" fill="#efe3d0"/>
  ${eyesSvg}
  ${browL}
  ${browR}
  <path d="M122 154 Q128 159 134 154" fill="none" stroke="${mouth}" stroke-width="2" stroke-linecap="round"/>
  ${glasses === 'round' ? `<circle cx="114" cy="138" r="9" fill="none" stroke="${C.ashLight}" stroke-width="1.6"/><circle cx="142" cy="138" r="9" fill="none" stroke="${C.ashLight}" stroke-width="1.6"/><path d="M123 136 L133 136" stroke="${C.ashLight}" stroke-width="1.6"/>` : ''}
  ${glasses === 'half' ? `<path d="M104 140 L150 140" stroke="${C.ashLight}" stroke-width="1.6"/><rect x="105" y="132" width="18" height="12" rx="3" fill="none" stroke="${C.ashLight}" stroke-width="1.4"/><rect x="133" y="132" width="18" height="12" rx="3" fill="none" stroke="${C.ashLight}" stroke-width="1.4"/>` : ''}
  ${wrinkles ? `<path d="M106 146 Q112 148 118 146" fill="none" stroke="${C.void}" opacity="0.25" stroke-width="1.2"/><path d="M138 146 Q144 148 150 146" fill="none" stroke="${C.void}" opacity="0.25" stroke-width="1.2"/><path d="M122 144 Q128 145 134 144" fill="none" stroke="${C.void}" opacity="0.2" stroke-width="1"/>` : ''}
  ${scar ? `<path d="M138 128 L146 142" stroke="${C.skinPale}" stroke-width="2.4" stroke-linecap="round" opacity="0.9"/><path d="M136 126 L144 140" stroke="#c98f8f" stroke-width="1" opacity="0.6"/>` : ''}
  ${beardPaths[beardStyle] ?? ''}
  ${mole ? `<circle cx="150" cy="146" r="1.6" fill="#5c4632"/>` : ''}
</g>`
}

function collar({ type, color }) {
  const m = {
    none: '',
    high: `<path d="M104 176 L104 164 Q116 158 128 158 Q140 158 152 164 L152 176 Q140 170 128 170 Q116 170 104 176 Z" fill="${color}"/>`,
    tie: `<path d="M112 168 L128 164 L144 168 L128 208 Z" fill="${color}"/><rect x="112" y="160" width="32" height="8" rx="2" fill="#2b2f3a"/>`,
    collar: `<path d="M104 174 L116 162 L120 176 Z" fill="#e6e2da"/><path d="M152 174 L140 162 L136 176 Z" fill="#e6e2da"/><path d="M118 176 L138 176 L138 186 L118 186 Z" fill="${color}"/>`,
    scarf: `<path d="M96 170 Q112 158 128 158 Q144 158 160 170 L160 182 Q144 174 128 174 Q112 174 96 182 Z" fill="${color}"/><path d="M96 176 L88 200 L100 204 L106 182 Z" fill="${color}"/>`,
    robe: `<path d="M96 172 Q112 158 128 156 Q144 158 160 172 L160 190 Q144 178 128 178 Q112 178 96 190 Z" fill="${color}"/><path d="M116 164 L140 164 L136 172 L120 172 Z" fill="#0f1013"/>`,
  }
  return m[type] ?? ''
}

function aura({ type, color }) {
  const m = {
    none: '',
    smoke: `<path d="M84 210 Q76 196 82 184 Q88 174 84 162" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" opacity="0.18"/><path d="M176 214 Q182 202 178 192" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" opacity="0.14"/>`,
    glow: `<circle cx="128" cy="120" r="52" fill="${color}" opacity="0.10"/><circle cx="196" cy="96" r="26" fill="${color}" opacity="0.08"/><circle cx="62" cy="70" r="18" fill="${color}" opacity="0.10"/>`,
    ember: `<circle cx="168" cy="150" r="2" fill="${color}" opacity="0.9"/><circle cx="176" cy="138" r="1.4" fill="${color}" opacity="0.7"/><circle cx="160" cy="162" r="1.6" fill="${color}" opacity="0.6"/><circle cx="86" cy="96" r="1.8" fill="${color}" opacity="0.5"/>`,
    blood: `<path d="M128 196 Q136 212 128 226" stroke="${color}" stroke-width="3" opacity="0.35"/><path d="M120 200 Q112 210 118 222" stroke="${color}" stroke-width="2" opacity="0.25"/>`,
  }
  return m[type] ?? ''
}

const BROW_SLANT = {
  l: '<path d="M107 128 Q113 123 119 126" stroke="#1a1410" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
  r: '<path d="M137 126 Q143 123 149 128" stroke="#1a1410" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
  straight: '<path d="M106 127 Q113 122 120 125" stroke="#3a3128" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
  sharp: '<path d="M108 126 Q114 121 120 124" stroke="#1a1410" stroke-width="2" fill="none" stroke-linecap="round"/>',
  heavy: '<path d="M105 127 Q113 120 121 125" stroke="#1a0f0a" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
  soft: '<path d="M108 127 Q114 122 119 125" stroke="#5a4a42" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  thick: '<path d="M106 127 Q113 122 120 126" stroke="#1a1410" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  thin: '<path d="M107 126 Q113 121 119 124" stroke="#2a1410" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  aged: '<path d="M105 126 Q112 120 120 124" stroke="#4a3a28" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
}

function npcSvg(npc) {
  const b = { ...npc, browL: BROW_SLANT[npc.brows], browR: BROW_SLANT[npc.brows] }
  return `${canvas(b)}${body(b)}${face(b)}${collar(b)}${aura(b)}</svg>`
}

const npcs = [
  { id: 'ali', skin: C.skin, jacket: '#20343b', shirt: '#d8c9a8', hair: '#2b2320', hairStyle: 'bun', hairAccent: '#8a8f98', brows: 'l', eyes: ['#3a2a1a', '#3a2a1a'], scar: false, glasses: '', wrinkles: false, beard: '', beardStyle: 'none', mouth: '#7a4a3a', mole: true, collarType: 'collar', collarColor: '#d8c9a8', auraType: 'glow', auraColor: '#c09a3f', glow: '#3a4a45', accent: '#c09a3f', ear: false },
  { id: 'old-zhou', skin: C.skinOld, jacket: '#3a3f45', shirt: '#6e5a4a', hair: '#7a7d82', hairStyle: 'flat', hairAccent: '', brows: 'straight', eyes: ['#4a3a28', '#4a3a28'], scar: true, glasses: '', wrinkles: true, beard: '#7a7d82', beardStyle: 'full', mouth: '#5a463a', mole: false, collarType: 'high', collarColor: '#4a4f56', auraType: 'smoke', auraColor: '#8a8f98', glow: '#4a4a50', accent: '#8a8f98', ear: false },
  { id: 'bai-lan', skin: '#e8c9b0', jacket: '#14161c', shirt: '#f0ece4', hair: '#191512', hairStyle: 'bob', hairAccent: '', brows: 'sharp', eyes: ['#2a2e38', '#2a2e38'], scar: false, glasses: '', wrinkles: false, beard: '', beardStyle: 'none', mouth: '#b04a5a', mole: false, collarType: 'tie', collarColor: '#a01f1f', auraType: 'glow', auraColor: '#3f7ac0', glow: '#2a3a4a', accent: '#3f7ac0', ear: false },
  { id: 'ling-zero', skin: '#d8c4ba', jacket: '#e8e6e0', shirt: '#f4f2ec', hair: '#c8c9cc', hairStyle: 'long', hairAccent: '#7aa8c8', brows: 'soft', eyes: ['#4a7aa8', '#4a7aa8'], scar: false, glasses: '', wrinkles: false, beard: '', beardStyle: 'none', mouth: '#c08a8a', mole: false, collarType: 'none', collarColor: '', auraType: 'glow', auraColor: '#6aa8e0', glow: '#5a7a8a', accent: '#6aa8e0', ear: false },
  { id: 'butcher-kai', skin: '#c89b76', jacket: '#2a1718', shirt: '#8a2a2a', hair: '#1a1512', hairStyle: 'buzz', hairAccent: '', brows: 'heavy', eyes: ['#3a2418', '#3a2418'], scar: true, glasses: '', wrinkles: false, beard: '#2a1f18', beardStyle: 'stubble', mouth: '#5a2a22', mole: false, collarType: 'none', collarColor: '', auraType: 'smoke', auraColor: '#c05a3a', glow: '#3a1f1a', accent: '#c05a3a', ear: false },
  { id: 'blood-mother', skin: '#d8bcb0', jacket: '#2a1216', shirt: '#6e1620', hair: '#1a1012', hairStyle: 'bun', hairAccent: '#a01f1f', brows: 'sharp', eyes: ['#7a1620', '#7a1620'], scar: false, glasses: '', wrinkles: false, beard: '', beardStyle: 'none', mouth: '#8a2030', mole: true, collarType: 'robe', collarColor: '#6e1620', auraType: 'blood', auraColor: '#a01f1f', glow: '#4a1a1f', accent: '#a01f1f', ear: true },
  { id: 'gu-doctor', skin: '#c8a888', jacket: '#4a4a42', shirt: '#e8e4dc', hair: '#6a6258', hairStyle: 'flat', hairAccent: '', brows: 'straight', eyes: ['#3a3a2a', '#3a3a2a'], scar: false, glasses: 'round', wrinkles: true, beard: '#6a6258', beardStyle: 'goatee', mouth: '#6a4a3a', mole: false, collarType: 'collar', collarColor: '#4a7a5a', auraType: 'glow', auraColor: '#4a7a8a', glow: '#3a4a42', accent: '#5a8a8a', ear: false },
  { id: 'du-mute', skin: '#b8906e', jacket: '#2e2a24', shirt: '#4a3f33', hair: '#2a241e', hairStyle: 'short', hairAccent: '', brows: 'thick', eyes: ['#2a241e', '#2a241e'], scar: false, glasses: 'half', wrinkles: true, beard: '#2a241e', beardStyle: 'full', mouth: '#4a3328', mole: false, collarType: 'high', collarColor: '#4a3f33', auraType: 'ember', auraColor: '#e08a3a', glow: '#4a3320', accent: '#e08a3a', ear: false },
  { id: 'ya-night', skin: '#e8c0a8', jacket: '#3a0f14', shirt: '#8a1f2a', hair: '#241218', hairStyle: 'ponytail', hairAccent: '#a01f1f', brows: 'thin', eyes: ['#5a2a3a', '#5a2a3a'], scar: false, glasses: '', wrinkles: false, beard: '', beardStyle: 'none', mouth: '#a04a4a', mole: true, collarType: 'scarf', collarColor: '#6e1620', auraType: 'glow', auraColor: '#e0a05a', glow: '#5a2a2a', accent: '#e0a05a', ear: true },
  { id: 'old-beggar', skin: '#a88462', jacket: '#3a342c', shirt: '#4a443c', hair: '#b8b0a4', hairStyle: 'bald', hairAccent: '', brows: 'aged', eyes: ['#5a4a30', '#5a4a30'], scar: false, glasses: '', wrinkles: true, beard: '#c8c0b4', beardStyle: 'full', mouth: '#4a3628', mole: false, collarType: 'scarf', collarColor: '#3a342c', auraType: 'smoke', auraColor: '#8a9ab0', glow: '#3a3a44', accent: '#8a9ab0', ear: false },
  // ---- 文学 NPC ----
  { id: 'jane-eyre', skin: '#e0c0a8', jacket: '#3a4a56', shirt: '#e8e2d8', hair: '#4a3028', hairStyle: 'bun', hairAccent: '', brows: 'straight', eyes: ['#3a2a20', '#3a2a20'], scar: false, glasses: '', wrinkles: false, beard: '', beardStyle: 'none', mouth: '#8a5a4a', mole: false, collarType: 'collar', collarColor: '#e8e2d8', auraType: 'glow', auraColor: '#c9b28a', glow: '#4a4a56', accent: '#c9b28a', ear: false },
  { id: 'winston', skin: '#d0b8a0', jacket: '#5a5e66', shirt: '#8a8e94', hair: '#3a342e', hairStyle: 'flat', hairAccent: '', brows: 'straight', eyes: ['#4a4a3a', '#4a4a3a'], scar: false, glasses: 'round', wrinkles: false, beard: '', beardStyle: 'none', mouth: '#7a6a5a', mole: false, collarType: 'high', collarColor: '#5a5e66', auraType: 'smoke', auraColor: '#8a9ab0', glow: '#4a4e56', accent: '#8a9ab0', ear: false },
  { id: 'obrien', skin: '#dcc0a8', jacket: '#24262e', shirt: '#e0ded8', hair: '#2a2622', hairStyle: 'short', hairAccent: '', brows: 'sharp', eyes: ['#2e2e3a', '#2e2e3a'], scar: false, glasses: '', wrinkles: false, beard: '', beardStyle: 'none', mouth: '#9a6a5a', mole: false, collarType: 'tie', collarColor: '#6a2a2a', auraType: 'glow', auraColor: '#c0a060', glow: '#3a3a44', accent: '#c0a060', ear: false },
  { id: 'valjean', skin: '#b89876', jacket: '#4a443c', shirt: '#6a5e50', hair: '#b8b0a4', hairStyle: 'flat', hairAccent: '', brows: 'aged', eyes: ['#3a2e22', '#3a2e22'], scar: false, glasses: '', wrinkles: true, beard: '#c0b8a8', beardStyle: 'full', mouth: '#5a4636', mole: false, collarType: 'scarf', collarColor: '#6a5e50', auraType: 'smoke', auraColor: '#9a8a76', glow: '#4a4238', accent: '#9a8a76', ear: false },
  { id: 'dr-jekyll', skin: '#d4b8a0', jacket: '#3a3a46', shirt: '#e8e4dc', hair: '#2e2a28', hairStyle: 'short', hairAccent: '', brows: 'sharp', eyes: ['#3a5a5a', '#3a5a5a'], scar: false, glasses: 'half', wrinkles: false, beard: '#4a3a32', beardStyle: 'goatee', mouth: '#7a5a4a', mole: false, collarType: 'collar', collarColor: '#3a7a6a', auraType: 'glow', auraColor: '#5ac0b0', glow: '#3a4a4a', accent: '#5ac0b0', ear: false },
  { id: 'holmes', skin: '#d0b49a', jacket: '#3a3630', shirt: '#d8d2c8', hair: '#2e2822', hairStyle: 'flat', hairAccent: '', brows: 'straight', eyes: ['#2e2e38', '#2e2e38'], scar: false, glasses: '', wrinkles: false, beard: '', beardStyle: 'none', mouth: '#6a4a3a', mole: false, collarType: 'collar', collarColor: '#d8d2c8', auraType: 'ember', auraColor: '#c08a3a', glow: '#3a3830', accent: '#c08a3a', ear: false },
  { id: 'monte-cristo', skin: '#dcc4ac', jacket: '#1e1c22', shirt: '#f0ece2', hair: '#1a1614', hairStyle: 'short', hairAccent: '', brows: 'l', eyes: ['#3a2a1a', '#3a2a1a'], scar: true, glasses: '', wrinkles: false, beard: '#2a241e', beardStyle: 'goatee', mouth: '#8a5a3a', mole: false, collarType: 'tie', collarColor: '#a01f1f', auraType: 'glow', auraColor: '#e0c060', glow: '#2e2a26', accent: '#e0c060', ear: false },
  { id: 'santiago', skin: '#a88462', jacket: '#4a4a44', shirt: '#6a645c', hair: '#c8c0b0', hairStyle: 'bald', hairAccent: '', brows: 'aged', eyes: ['#4a3a2a', '#4a3a2a'], scar: false, glasses: '', wrinkles: true, beard: '#d0c8b8', beardStyle: 'full', mouth: '#5a4636', mole: false, collarType: 'scarf', collarColor: '#4a4a44', auraType: 'smoke', auraColor: '#7a9ab0', glow: '#3a3e44', accent: '#7a9ab0', ear: false },
]

for (const npc of npcs) {
  const file = resolve(OUT, `${npc.id}.svg`)
  writeFileSync(file, npcSvg(npc), 'utf8')
  console.log('generated', npc.id)
}
console.log('done →', OUT)
