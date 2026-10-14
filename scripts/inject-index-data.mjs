// Inject __INDEX_DATA__, config, inline logo SVGs and favicon into built HTML
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const distDir = resolve(import.meta.dirname, '..', 'dist')
const htmlPath = resolve(distDir, 'index.html')
const configSrc = resolve(import.meta.dirname, '..', 'config.json')
const configDst = resolve(distDir, 'config.json')
const publicDir = resolve(import.meta.dirname, '..', 'public')
const indexDataMarker = '<script id="index-data" type="application/json">__INDEX_DATA__</script>'

const defaultConfig = {
  logo_text: 'dufs-shadcn-assets',
  logo: './logo.svg',
  dark_logo: './dark-logo.svg',
  logo_size: '28px',
  logo_text_font_size: '14px',
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

if (config.logo_text) {
  html = html.replace(/<title>.*?<\/title>/, `<title>${config.logo_text}</title>`)
  console.log(`✓ Applied logo_text: ${config.logo_text}`)
}

// Inline favicon SVG — matching HardDrive logo style
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="7" fill="#18181b"/>
  <path d="M8 16h.02" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2.21 12.58a2 2 0 00-.21.9V18a2 2 0 002 2h16a2 2 0 002-2v-4.53a2 2 0 00-.21-.9L18.55 6.11A2 2 0 0016.76 5H7.24a2 2 0 00-1.79 1.11z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M21.95 13H2.05" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6 16h.02" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
html = html.replace('type="image/x-icon" href="favicon.ico"', `href="data:image/svg+xml,${encodeURIComponent(faviconSvg)}"`)
console.log('✓ Inlined favicon')

// Inline logo SVGs into runtime config (for Sidebar), clean config saved to dist
const logoSrc = resolve(publicDir, 'logo.svg')
const darkLogoSrc = resolve(publicDir, 'logo-dark.svg')
const runtimeConfig = { ...config }
if (existsSync(logoSrc)) {
  runtimeConfig._logoData = 'data:image/svg+xml;base64,' + readFileSync(logoSrc).toString('base64')
  console.log('✓ Inlined logo.svg')
}
if (existsSync(darkLogoSrc)) {
  runtimeConfig._darkLogoData = 'data:image/svg+xml;base64,' + readFileSync(darkLogoSrc).toString('base64')
  console.log('✓ Inlined logo-dark.svg')
}

// Embed runtime config into HTML
const configScript = `<script id="dufs-config" type="application/json">${JSON.stringify(runtimeConfig)}</script>`
html = html.replace(indexDataMarker, indexDataMarker + '\n' + configScript)

writeFileSync(configDst, JSON.stringify(config, null, 2), 'utf-8')
writeFileSync(htmlPath, html, 'utf-8')