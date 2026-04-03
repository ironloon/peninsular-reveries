import { writeFileSync } from 'node:fs'
import { renderAttributionsMarkdown } from '../app/data/attributions.js'

writeFileSync('ATTRIBUTIONS.md', renderAttributionsMarkdown(), 'utf-8')
console.log('Synced ATTRIBUTIONS.md from app/data/attributions.ts')