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

// Inline favicon SVG
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="7" fill="#18181b"/>
  <rect x="4" y="7" width="24" height="18" rx="3" fill="#3b82f6"/>
  <rect x="6" y="9" width="20" height="8" rx="1" fill="#60a5fa" opacity="0.5"/>
  <circle cx="16" cy="19" r="3.5" fill="#18181b"/>
  <circle cx="16" cy="19" r="1.5" fill="#60a5fa"/>
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