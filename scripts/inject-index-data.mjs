// Inject __INDEX_DATA__, config, inline logos/favicon into built HTML
import { readFileSync, writeFileSync, existsSync, cpSync } from 'fs'
import { resolve } from 'path'

const distDir = resolve(import.meta.dirname, '..', 'dist')
const htmlPath = resolve(distDir, 'index.html')
const publicDir = resolve(import.meta.dirname, '..', 'public')
const configSrc = resolve(publicDir, 'config.json')
const indexDataMarker = '<script id="index-data" type="application/json">__INDEX_DATA__</script>'

const defaultConfig = {
  logo_size: '28px',
  logo_text_font_size: '20px',
  view_mode: 'icons',
}

let config
if (existsSync(configSrc)) {
  config = JSON.parse(readFileSync(configSrc, 'utf-8'))
  let merged = false
  for (const key of Object.keys(defaultConfig)) {
    if (!(key in config)) {
      config[key] = defaultConfig[key]
      merged = true
    }
  }
  if (merged) {
    writeFileSync(configSrc, JSON.stringify(config, null, 2), 'utf-8')
    console.log('✓ Merged new fields into config.json')
  }
} else {
  config = { ...defaultConfig }
  writeFileSync(configSrc, JSON.stringify(config, null, 2), 'utf-8')
  console.log('✓ Created default config.json')
}

let html = readFileSync(htmlPath, 'utf-8')

if (!html.includes('__INDEX_DATA__')) {
  html = html.replace('</body>', indexDataMarker + '\n</body>')
  console.log('✓ Injected __INDEX_DATA__ placeholder')
} else {
  console.log('✓ __INDEX_DATA__ placeholder already present')
}

// Inline favicon SVG
const faviconSrc = resolve(publicDir, 'favicon.svg')
let faviconData
if (existsSync(faviconSrc)) {
  faviconData = readFileSync(faviconSrc, 'utf-8')
} else {
  faviconData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="7" fill="#18181b"/><g transform="translate(4,4)"><path d="M8 16h.02" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.21 12.58a2 2 0 00-.21.9V18a2 2 0 002 2h16a2 2 0 002-2v-4.53a2 2 0 00-.21-.9L18.55 6.11A2 2 0 0016.76 5H7.24a2 2 0 00-1.79 1.11z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M21.95 13H2.05" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 16h.02" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`
}
html = html.replace('type="image/x-icon" href="favicon.ico"', `href="data:image/svg+xml,${encodeURIComponent(faviconData)}"`)
console.log('✓ Inlined favicon')

// Inline logo SVGs into runtime config (only if config has logo/dark_logo set)
const logoSrc = resolve(publicDir, 'logo.svg')
const darkLogoSrc = resolve(publicDir, 'logo-dark.svg')
const runtimeConfig = { ...config }
if (config.logo && existsSync(logoSrc)) {
  runtimeConfig._logoData = 'data:image/svg+xml;base64,' + readFileSync(logoSrc).toString('base64')
  console.log('✓ Inlined logo.svg')
}
if (config.dark_logo && existsSync(darkLogoSrc)) {
  runtimeConfig._darkLogoData = 'data:image/svg+xml;base64,' + readFileSync(darkLogoSrc).toString('base64')
  console.log('✓ Inlined logo-dark.svg')
}

// Embed runtime config as default; index.html's XHR can override it at runtime
const configScript = `<script id="dufs-config" type="application/json">${JSON.stringify(runtimeConfig)}</script>`
html = html.replace('<meta name="viewport"', configScript + '\n    <meta name="viewport"')

writeFileSync(htmlPath, html, 'utf-8')

// 离线环境：将 PDF.js cmaps 和 standard_fonts 复制到 dist/ 和 sample-files/
const nodeModules = resolve(import.meta.dirname, '..', 'node_modules')
const cmapsSrc = resolve(nodeModules, 'pdfjs-dist/cmaps')
const fontsSrc = resolve(nodeModules, 'pdfjs-dist/standard_fonts')
const sampleDir = resolve(import.meta.dirname, '..', 'sample-files')
const cmapsDest = resolve(distDir, 'cmaps')
const fontsDest = resolve(distDir, 'standard_fonts')
if (existsSync(cmapsSrc)) { cpSync(cmapsSrc, cmapsDest, { recursive: true }) }
if (existsSync(fontsSrc)) { cpSync(fontsSrc, fontsDest, { recursive: true }) }
console.log('✓ Copied PDF.js cmaps & standard_fonts (for dist/)')

// 提示：PDF 离线预览的 cmaps/standard_fonts 需要手动复制到 serve-path
// 例如: cp -r dist/cmaps sample-files/cmaps
// 否则 PDF 中的 CJK 字符和标准字体可能无法正确渲染