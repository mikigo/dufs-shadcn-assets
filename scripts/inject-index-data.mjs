// Inject __INDEX_DATA__ placeholder, auto-generate config.json, inline favicon, apply to HTML
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const distDir = resolve(import.meta.dirname, '..', 'dist')
const htmlPath = resolve(distDir, 'index.html')
const configSrc = resolve(import.meta.dirname, '..', 'config.json')
const configDst = resolve(distDir, 'config.json')
const indexDataMarker = '<script id="index-data" type="application/json">__INDEX_DATA__</script>'

const defaultConfig = {
  logo_text: 'dufs-shadcn-assets',
  logo: './logo.svg',
  dark_logo: './dark_logo.svg',
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

// Generate minimal SVG favicon matching project style
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="6" fill="#1c2333"/>
  <path d="M7 9a2 2 0 012-2h6l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" fill="#4f6bf6"/>
  <path d="M7 13h18v3a2 2 0 01-2 2H9a2 2 0 01-2-2v-3z" fill="#8b9cff" opacity="0.6"/>
</svg>`
const faviconUri = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`
html = html.replace('type="image/x-icon" href="favicon.ico"', `href="${faviconUri}"`)

// Embed config as script tag so React SPA can read it at runtime
const configScript = `<script id="dufs-config" type="application/json">${JSON.stringify(config)}</script>`
html = html.replace(indexDataMarker, indexDataMarker + '\n' + configScript)

writeFileSync(configDst, JSON.stringify(config, null, 2), 'utf-8')
writeFileSync(htmlPath, html, 'utf-8')