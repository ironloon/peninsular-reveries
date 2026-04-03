import { normalizeBasePath } from './site-paths.js'

const DEFAULT_SITE_ORIGIN = 'http://localhost:3000'

export function getSiteBasePath(): string {
  return normalizeBasePath(process.env.SITE_BASE_PATH)
}

export function getSiteOrigin(): string {
  return (process.env.SITE_ORIGIN || DEFAULT_SITE_ORIGIN).replace(/\/+$/g, '')
}

export function getSiteUrl(): string {
  return `${getSiteOrigin()}${getSiteBasePath()}`
}