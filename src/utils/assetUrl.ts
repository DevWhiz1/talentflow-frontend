import { apiBaseUrl } from '../services/api'

export function resolveAssetUrl(value?: string | null): string {
  if (!value) {
    return ''
  }

  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value
  }

  const apiRoot = apiBaseUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/api\/?$/, '').replace(/\/$/, '')
  return `${apiRoot}${value.startsWith('/') ? value : `/${value}`}`
}
