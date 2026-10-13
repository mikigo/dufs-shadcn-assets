// Inject __INDEX_DATA__ placeholder into built HTML for dufs runtime replacement
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const htmlPath = resolve(import.meta.dirname, '..', 'dist/index.html')
const marker = '<script id="index-data" type="application/json">__INDEX_DATA__</script>'

let html = readFileSync(htmlPath, 'utf-8')
if (!html.includes('__INDEX_DATA__')) {
  html = html.replace('</body>', marker + '\n</body>')
  writeFileSync(htmlPath, html, 'utf-8')
  console.log('✓ Injected __INDEX_DATA__ placeholder')
} else {
  console.log('✓ __INDEX_DATA__ placeholder already present')
}