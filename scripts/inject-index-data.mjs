// Inject __INDEX_DATA__ placeholder and apply config.json to built HTML
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const distDir = resolve(import.meta.dirname, '..', 'dist')
const htmlPath = resolve(distDir, 'index.html')
const configSrc = resolve(import.meta.dirname, '..', 'config.json')
const configDst = resolve(distDir, 'config.json')
const marker = '<script id="index-data" type="application/json">__INDEX_DATA__</script>'

let html = readFileSync(htmlPath, 'utf-8')

if (!html.includes('__INDEX_DATA__')) {
  html = html.replace('</body>', marker + '\n</body>')
  console.log('✓ Injected __INDEX_DATA__ placeholder')
} else {
  console.log('✓ __INDEX_DATA__ placeholder already present')
}

if (existsSync(configSrc)) {
  try {
    const config = JSON.parse(readFileSync(configSrc, 'utf-8'))
    if (config.logo_text) {
      html = html.replace(/<title>.*?<\/title>/, `<title>${config.logo_text}</title>`)
      console.log(`✓ Applied logo_text: ${config.logo_text}`)
    }
    // Copy config to dist for dufs --assets
    writeFileSync(configDst, JSON.stringify(config, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to read config.json:', e.message)
  }
}

writeFileSync(htmlPath, html, 'utf-8')