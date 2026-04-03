function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/g, '')
}

export function normalizeBasePath(basePath?: string): string {
  if (!basePath) {
    return ''
  }

  const trimmed = trimTrailingSlashes(basePath.trim())
  if (!trimmed || trimmed === '/') {
    return ''
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export function withBasePath(path: string, basePath = ''): string {
  if (!path.startsWith('/')) {
    throw new Error(`Public path must start with "/": ${path}`)
  }

  const normalizedBasePath = normalizeBasePath(basePath)
  if (!normalizedBasePath) {
    return path
  }

  return path === '/' ? `${normalizedBasePath}/` : `${normalizedBasePath}${path}`
}

export function resolveSiteUrl(siteUrl: string, path: string): string {
  if (!path.startsWith('/')) {
    throw new Error(`Public path must start with "/": ${path}`)
  }

  const rootUrl = `${trimTrailingSlashes(siteUrl)}/`
  const relativePath = path === '/' ? '.' : `.${path}`
  return new URL(relativePath, rootUrl).toString()
}