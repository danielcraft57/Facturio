import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faAngular,
  faAws,
  faBootstrap,
  faCss3Alt,
  faDocker,
  faGitlab,
  faGithub,
  faHtml5,
  faJava,
  faJs,
  faLaravel,
  faLinux,
  faNodeJs,
  faNpm,
  faPhp,
  faPython,
  faReact,
  faRust,
  faSass,
  faShopify,
  faSymfony,
  faVuejs,
  faWordpress,
} from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined'
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined'
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined'
import PhoneAndroidOutlinedIcon from '@mui/icons-material/PhoneAndroidOutlined'
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined'
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined'
import WebOutlinedIcon from '@mui/icons-material/WebOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import type { SvgIconComponent } from '@mui/icons-material'
import { Box, alpha } from '@mui/material'
import type { TechAssemblyCategory } from '../../../types/techStack'
import { findTechOption, techGroupColor } from './productTechSuggestions'

const SIMPLE_ICONS_CDN = 'https://cdn.jsdelivr.net/npm/simple-icons@11.14.0/icons'

export type TechCategoryVisual = {
  Icon: SvgIconComponent
  color: string
  label: string
}

/** Catégories du TechStackPicker (onboarding) → couche assemblage produit. */
export const PICKER_CATEGORY_TO_ASSEMBLY: Record<string, TechAssemblyCategory> = {
  languages: 'languages',
  frontend: 'frontend',
  backend: 'backend',
  cms: 'cms',
  databases: 'databases',
  devops: 'devops',
  ai: 'ai',
  mobile: 'mobile',
  security: 'security',
}

export const TECH_CATEGORY_VISUAL: Record<TechAssemblyCategory, TechCategoryVisual> = {
  languages: { Icon: CodeOutlinedIcon, color: '#2563eb', label: 'Langages' },
  frontend: { Icon: WebOutlinedIcon, color: '#0ea5e9', label: 'Frontend' },
  backend: { Icon: StorageOutlinedIcon, color: '#059669', label: 'Backend' },
  cms: { Icon: ArticleOutlinedIcon, color: '#db2777', label: 'CMS' },
  databases: { Icon: StorageOutlinedIcon, color: '#dc2626', label: 'BDD' },
  devops: { Icon: CloudOutlinedIcon, color: '#4f46e5', label: 'DevOps' },
  ai: { Icon: PsychologyOutlinedIcon, color: '#9333ea', label: 'IA' },
  mobile: { Icon: PhoneAndroidOutlinedIcon, color: '#d97706', label: 'Mobile' },
  security: { Icon: SecurityOutlinedIcon, color: '#b45309', label: 'Sécu' },
}

const BRAND_ICONS: Record<string, IconDefinition> = {
  php: faPhp,
  javascript: faJs,
  js: faJs,
  'html / css': faHtml5,
  html: faHtml5,
  css: faCss3Alt,
  react: faReact,
  'react native': faReact,
  vue: faVuejs,
  'vue.js': faVuejs,
  angular: faAngular,
  'node.js': faNodeJs,
  nodejs: faNodeJs,
  wordpress: faWordpress,
  laravel: faLaravel,
  symfony: faSymfony,
  python: faPython,
  java: faJava,
  rust: faRust,
  docker: faDocker,
  aws: faAws,
  shopify: faShopify,
  bootstrap: faBootstrap,
  sass: faSass,
  'sass / scss': faSass,
  scss: faSass,
  npm: faNpm,
  github: faGithub,
  'github actions': faGithub,
  gitlab: faGitlab,
  'gitlab ci': faGitlab,
  linux: faLinux,
  nginx: faLinux,
}

const SIMPLE_ICON_SLUGS: Record<string, string> = {
  typescript: 'typescript',
  nestjs: 'nestjs',
  nextjs: 'nextdotjs',
  'next.js': 'nextdotjs',
  nuxt: 'nuxtdotjs',
  remix: 'remix',
  svelte: 'svelte',
  astro: 'astro',
  htmx: 'htmx',
  vite: 'vite',
  tailwind: 'tailwindcss',
  'tailwind css': 'tailwindcss',
  postgresql: 'postgresql',
  mysql: 'mysql',
  'mysql / mariadb': 'mysql',
  mariadb: 'mariadb',
  mongodb: 'mongodb',
  redis: 'redis',
  sqlite: 'sqlite',
  supabase: 'supabase',
  firebase: 'firebase',
  elasticsearch: 'elasticsearch',
  kubernetes: 'kubernetes',
  vercel: 'vercel',
  netlify: 'netlify',
  terraform: 'terraform',
  jquery: 'jquery',
  django: 'django',
  fastapi: 'fastapi',
  express: 'express',
  '.net': 'dotnet',
  'asp.net': 'dotnet',
  dotnet: 'dotnet',
  csharp: 'csharp',
  'c#': 'csharp',
  go: 'go',
  golang: 'go',
  kotlin: 'kotlin',
  flutter: 'flutter',
  dart: 'dart',
  swift: 'swift',
  strapi: 'strapi',
  drupal: 'drupal',
  prestashop: 'prestashop',
  webflow: 'webflow',
  openai: 'openai',
  'chatgpt / openai': 'openai',
  claude: 'anthropic',
  'claude / anthropic': 'anthropic',
  langchain: 'langchain',
  n8n: 'n8n',
  stripe: 'stripe',
  prisma: 'prisma',
  graphql: 'graphql',
  apache: 'apache',
  perl: 'perl',
  ruby: 'ruby',
  'ruby on rails': 'rubyonrails',
  rails: 'rubyonrails',
  codeigniter: 'codeigniter',
  cakephp: 'cakephp',
  memcached: 'memcached',
  oracle: 'oracle',
  'sql server': 'microsoftsqlserver',
  mssql: 'microsoftsqlserver',
  owasp: 'owasp',
  burp: 'portswigger',
  wireshark: 'wireshark',
  sonarqube: 'sonarqube',
  snyk: 'snyk',
  playwright: 'playwright',
  jest: 'jest',
  vitest: 'vitest',
}

function normalizeTechKey(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ')
}

function resolveBrandIcon(label: string): IconDefinition | null {
  const key = normalizeTechKey(label)
  if (BRAND_ICONS[key]) return BRAND_ICONS[key]
  const opt = findTechOption(label)
  if (opt) {
    const fromLabel = BRAND_ICONS[normalizeTechKey(opt.label)]
    if (fromLabel) return fromLabel
    for (const alias of opt.aliases ?? []) {
      const hit = BRAND_ICONS[normalizeTechKey(alias)]
      if (hit) return hit
    }
  }
  for (const [pattern, icon] of Object.entries(BRAND_ICONS)) {
    if (key.includes(pattern) || pattern.includes(key)) return icon
  }
  return null
}

function resolveSimpleIconSlug(label: string): string | null {
  const key = normalizeTechKey(label)
  if (SIMPLE_ICON_SLUGS[key]) return SIMPLE_ICON_SLUGS[key]
  const opt = findTechOption(label)
  if (opt) {
    const fromLabel = SIMPLE_ICON_SLUGS[normalizeTechKey(opt.label)]
    if (fromLabel) return fromLabel
  }
  const compact = key.replace(/[^a-z0-9]/g, '')
  return SIMPLE_ICON_SLUGS[compact] ?? null
}

export function resolveTechAccentColor(label: string, category?: TechAssemblyCategory): string {
  const opt = findTechOption(label)
  if (opt) return techGroupColor(opt.group)
  if (category) return TECH_CATEGORY_VISUAL[category].color
  return '#64748b'
}

function simpleIconUrl(slug: string): string {
  return `${SIMPLE_ICONS_CDN}/${slug}.svg`
}

type TechStackIconProps = {
  label: string
  category?: TechAssemblyCategory
  size?: number
}

export function TechStackIcon({ label, category, size = 16 }: TechStackIconProps) {
  const color = resolveTechAccentColor(label, category)
  const box = Math.round(size + 6)
  const brand = resolveBrandIcon(label)
  const slug = brand ? null : resolveSimpleIconSlug(label)
  const CategoryIcon = category ? TECH_CATEGORY_VISUAL[category].Icon : CodeOutlinedIcon

  return (
    <Box
      sx={{
        width: box,
        height: box,
        minWidth: box,
        borderRadius: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: alpha(color, 0.12),
        border: '1px solid',
        borderColor: alpha(color, 0.22),
        overflow: 'hidden',
      }}
      aria-hidden
    >
      {brand ? (
        <FontAwesomeIcon icon={brand} style={{ width: size, height: size, color }} />
      ) : slug ? (
        <Box
          component="img"
          src={simpleIconUrl(slug)}
          alt=""
          sx={{
            width: size,
            height: size,
            objectFit: 'contain',
            filter: `brightness(0) saturate(100%)`,
            // teinte via fond coloré
            opacity: 0.85,
          }}
        />
      ) : (
        <CategoryIcon sx={{ fontSize: size, color }} />
      )}
    </Box>
  )
}

export function TechCategoryFieldIcon({ category, size = 18 }: { category: TechAssemblyCategory; size?: number }) {
  const { Icon, color } = TECH_CATEGORY_VISUAL[category]
  return (
    <Box
      sx={{
        width: size + 6,
        height: size + 6,
        borderRadius: 1.25,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: alpha(color, 0.1),
        color,
      }}
      aria-hidden
    >
      <Icon sx={{ fontSize: size }} />
    </Box>
  )
}
