import { seoForRoute } from './seoForRoute'

export { getSiteBrandName, getAppName } from '../config/seo'
export { formatPageTitle } from './applySeo'

export function titleForPath(pathname: string): string {
  return seoForRoute(pathname).title
}
