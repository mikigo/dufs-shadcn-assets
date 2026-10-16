// Inject __INDEX_DATA__, config, inline logos/favicon into built HTML
import { readFileSync, writeFileSync, existsSync, cpSync } from 'fs'
import { resolve } from 'path'

const distDir = resolve(import.meta.dirname, '..', 'dist')
const htmlPath = resolve(distDir, 'index.html')
const publicDir = resolve(import.meta.dirname, '..', 'public')
const configDir = '.dufs_shadcn_assets'
const configSrc = resolve(publicDir, configDir, 'config.json')
const indexDataMarker = '<script id="index-data" type="application/json">__INDEX_DATA__</script>'

const defaultConfig = {
  logo_size: '28px',
  logo_text_font_size: '20px',
  view_mode: 'icons',
  theme: 'light',
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
    console.log('✓ Merged new fields into ' + configDir + '/config.json')
  }
} else {
  config = { ...defaultConfig }
}

let html = readFileSync(htmlPath, 'utf-8')

if (!html.includes('__INDEX_DATA__')) {
  html = html.replace('</body>', indexDataMarker + '\n</body>')
  console.log('✓ Injected __INDEX_DATA__ placeholder')
} else {
  console.log('✓ __INDEX_DATA__ placeholder already present')
}

html = html.replace('type="image/x-icon" href="favicon.ico"',
  `href="/.dufs_shadcn_assets/favicon.svg" type="image/svg+xml"`)

// Embed runtime config as default (no base64 logos — served via HTTP from config dir)
const runtimeConfig = { ...config }
delete runtimeConfig._logoData
delete runtimeConfig._darkLogoData
const configScript = `<script id="dufs-config" type="application/json">${JSON.stringify(runtimeConfig)}</script>`
html = html.replace('<meta name="viewport"', configScript + '\n    <meta name="viewport"')

writeFileSync(htmlPath, html, 'utf-8')

// Copy entire config directory to sample-files/ for dufs HTTP serving
const sampleDir = resolve(import.meta.dirname, '..', 'sample-files')
const configDirSrc = resolve(publicDir, configDir)
const configDirSampleDest = resolve(sampleDir, configDir)
if (existsSync(configDirSrc)) {
  cpSync(configDirSrc, configDirSampleDest, { recursive: true })
  console.log('✓ Copied ' + configDir + '/ to sample-files/')
}

// Copy PDF.js cmaps and standard_fonts to dist/
const nodeModules = resolve(import.meta.dirname, '..', 'node_modules')
const cmapsSrc = resolve(nodeModules, 'pdfjs-dist/cmaps')
const fontsSrc = resolve(nodeModules, 'pdfjs-dist/standard_fonts')
const cmapsDest = resolve(distDir, 'cmaps')
const fontsDest = resolve(distDir, 'standard_fonts')
if (existsSync(cmapsSrc)) { cpSync(cmapsSrc, cmapsDest, { recursive: true }) }
if (existsSync(fontsSrc)) { cpSync(fontsSrc, fontsDest, { recursive: true }) }
console.log('✓ Copied PDF.js cmaps & standard_fonts (for dist/)')