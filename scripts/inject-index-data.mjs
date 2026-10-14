// Inject __INDEX_DATA__ placeholder, auto-generate config.json, apply to HTML
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

config = JSON.parse(readFileSync(configSrc, 'utf-8'))
if (config.logo_text) {
  html = html.replace(/<title>.*?<\/title>/, `<title>${config.logo_text}</title>`)
  console.log(`✓ Applied logo_text: ${config.logo_text}`)
}

// Embed config as script tag so React SPA can read it at runtime
const configScript = `<script id="dufs-config" type="application/json">${JSON.stringify(config)}</script>`
html = html.replace(indexDataMarker, indexDataMarker + '\n' + configScript)

writeFileSync(configDst, JSON.stringify(config, null, 2), 'utf-8')
writeFileSync(htmlPath, html, 'utf-8')