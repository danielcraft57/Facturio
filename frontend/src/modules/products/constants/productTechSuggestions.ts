export type ProductTechGroup =
  | 'Langages web & scripting'
  | 'Bas niveau & système'
  | 'Langages & paradigmes'
  | 'Frontend & UI'
  | 'Backend & API'
  | 'Mobile & desktop'
  | 'Bases de données'
  | 'CMS & e-commerce'
  | 'DevOps & cloud'
  | 'Réseau & messaging'
  | 'CI/CD & qualité'
  | 'IA & data science'
  | 'Cybersécurité'
  | 'Jeux & embarqué'
  | 'Outils & build'

/** Classement affiché dans l’autocomplete (tendances marché 2026–2028). */
export type ProductTechPopularityTier =
  | 'Tendance 2026–2028'
  | 'Très demandé'
  | 'Standard professionnel'
  | 'Spécialisé & niche'

export type ProductTechOption = {
  label: string
  group: ProductTechGroup
  tier: ProductTechPopularityTier
  rank: number
  aliases?: string[]
}

type TechSeed = {
  label: string
  group: ProductTechGroup
  aliases?: string[]
}

const TIER_ORDER: ProductTechPopularityTier[] = [
  'Tendance 2026–2028',
  'Très demandé',
  'Standard professionnel',
  'Spécialisé & niche',
]

/** Ordre de popularité estimé 2026–2028 (index = rang dans le palier). */
const TREND_2026_2028: readonly string[] = [
  'TypeScript',
  'Python',
  'React',
  'Next.js',
  'Node.js',
  'Rust',
  'Docker',
  'Kubernetes',
  'PostgreSQL',
  'OpenAI / ChatGPT',
  'Claude / Anthropic',
  'Tailwind CSS',
  'shadcn/ui',
  'Vercel AI SDK',
  'Bun',
  'FastAPI',
  'NestJS',
  'Vue.js',
  'Terraform',
  'AWS',
  'GitHub Copilot',
  'LangChain',
  'MCP (Model Context Protocol)',
  'Ollama',
  'Vite',
  'Turborepo',
  'TanStack Query',
  'Prisma',
  'Supabase',
  'Cloudflare',
  'Go',
  'Hono',
  'Biome',
  'Playwright',
  'Vitest',
  'OpenTelemetry',
  'Deno',
  'HTMX',
  'Astro',
  'Svelte',
  'Gemini / Google AI',
  'Mistral AI',
  'Groq',
  'n8n',
  'Stripe API',
  'Clerk',
  'Neon',
  'Turso / libSQL',
  'ClickHouse',
  'DuckDB',
]

const HIGH_DEMAND: readonly string[] = [
  'JavaScript',
  'HTML',
  'CSS',
  'Java',
  'C#',
  'PHP',
  'Kotlin',
  'Swift',
  'Angular',
  'Spring Boot',
  'Laravel',
  'Django',
  'Flutter',
  'React Native',
  'MongoDB',
  'Redis',
  'MySQL',
  'GraphQL',
  'REST API',
  'Git',
  'GitHub Actions',
  'Microsoft Azure',
  'Google Cloud',
  'Nginx',
  'Linux',
  'Express',
  'Fastify',
  'Symfony',
  'Ruby on Rails',
  'ASP.NET Core',
  'WordPress',
  'Shopify',
  'Figma',
  'Jest',
  'ESLint',
  'Prettier',
  'Socket.IO',
  'Apache Kafka',
  'RabbitMQ',
  'OAuth 2.0',
  'JWT',
  'OWASP',
  'Electron',
  'Expo',
]

const PROFESSIONAL_STANDARD: readonly string[] = [
  'C',
  'C++',
  'SQL',
  'Shell / Bash',
  'PowerShell',
  'Scala',
  'Elixir',
  'Ruby',
  'Dart',
  'Nuxt',
  'Remix',
  'SolidJS',
  'Material UI',
  'Bootstrap',
  'Redux',
  'Zustand',
  'tRPC',
  'gRPC',
  'TypeORM',
  'Sequelize',
  'Hibernate',
  'MariaDB',
  'SQLite',
  'Elasticsearch',
  'Firebase',
  'Strapi',
  'Drupal',
  'PrestaShop',
  'WooCommerce',
  'Ansible',
  'Pulumi',
  'Helm',
  'Argo CD',
  'GitLab CI',
  'Jenkins',
  'SonarQube',
  'Snyk',
  'Cypress',
  'PyTorch',
  'TensorFlow',
  'Hugging Face',
  'Pandas',
  'Apache Spark',
  'Airflow',
  'dbt',
  'Burp Suite',
  'Wireshark',
  'Nmap',
  'HashiCorp Vault',
  'WAF',
  'Postman',
  'Swagger / OpenAPI',
  'Webpack',
  'Storybook',
  'Capacitor',
  'Tauri',
  'Jetpack Compose',
  'SwiftUI',
  'WebSocket',
  'MQTT',
  'Keycloak',
  'DigitalOcean',
  'Railway',
  'Fly.io',
  'Netlify',
  'Vercel',
]

const TECH_SEEDS: TechSeed[] = [
  // Langages web & scripting
  { label: 'HTML', group: 'Langages web & scripting', aliases: ['html5'] },
  { label: 'CSS', group: 'Langages web & scripting', aliases: ['css3', 'scss', 'sass', 'less', 'postcss'] },
  { label: 'JavaScript', group: 'Langages web & scripting', aliases: ['js', 'ecmascript', 'es6', 'es2024'] },
  { label: 'TypeScript', group: 'Langages web & scripting', aliases: ['ts'] },
  { label: 'Python', group: 'Langages web & scripting', aliases: ['py', 'cpython'] },
  { label: 'PHP', group: 'Langages web & scripting' },
  { label: 'Ruby', group: 'Langages web & scripting', aliases: ['rb'] },
  { label: 'Go', group: 'Langages web & scripting', aliases: ['golang'] },
  { label: 'Rust', group: 'Langages web & scripting', aliases: ['rs'] },
  { label: 'Java', group: 'Langages web & scripting' },
  { label: 'Kotlin', group: 'Langages web & scripting', aliases: ['kt'] },
  { label: 'C#', group: 'Langages web & scripting', aliases: ['csharp', 'dotnet', '.net'] },
  { label: 'Swift', group: 'Langages web & scripting' },
  { label: 'Dart', group: 'Langages web & scripting' },
  { label: 'Shell / Bash', group: 'Langages web & scripting', aliases: ['bash', 'sh', 'zsh'] },
  { label: 'PowerShell', group: 'Langages web & scripting', aliases: ['ps1'] },
  { label: 'SQL', group: 'Langages web & scripting', aliases: ['plsql', 'tsql'] },
  { label: 'GraphQL', group: 'Langages web & scripting', aliases: ['gql'] },
  { label: 'Bun', group: 'Langages web & scripting', aliases: ['bunjs'] },
  { label: 'Deno', group: 'Langages web & scripting' },
  { label: 'Mojo', group: 'Langages web & scripting', aliases: ['modular'] },
  { label: 'Gleam', group: 'Langages web & scripting', aliases: ['beam', 'erlang vm'] },

  // Bas niveau & système
  { label: 'C', group: 'Bas niveau & système', aliases: ['ansi c'] },
  { label: 'C++', group: 'Bas niveau & système', aliases: ['cpp', 'c plus plus', 'c++23'] },
  { label: 'Assembly', group: 'Bas niveau & système', aliases: ['asm', 'x86', 'arm assembly', 'aarch64'] },
  { label: 'Objective-C', group: 'Bas niveau & système', aliases: ['objc'] },
  { label: 'Zig', group: 'Bas niveau & système' },
  { label: 'Nim', group: 'Bas niveau & système' },
  { label: 'CUDA', group: 'Bas niveau & système', aliases: ['gpu', 'nvidia', 'cuda c'] },
  { label: 'OpenCL', group: 'Bas niveau & système' },
  { label: 'WebAssembly', group: 'Bas niveau & système', aliases: ['wasm', 'wit'] },
  { label: 'VHDL', group: 'Bas niveau & système', aliases: ['fpga'] },
  { label: 'Verilog', group: 'Bas niveau & système', aliases: ['systemverilog', 'sv'] },
  { label: 'Embedded C', group: 'Bas niveau & système', aliases: ['firmware', 'mcu', 'bare metal'] },
  { label: 'FreeRTOS', group: 'Bas niveau & système', aliases: ['rtos'] },
  { label: 'Zephyr RTOS', group: 'Bas niveau & système', aliases: ['zephyr', 'iot rtos'] },
  { label: 'GLSL', group: 'Bas niveau & système', aliases: ['shader', 'opengl shading'] },
  { label: 'HLSL', group: 'Bas niveau & système', aliases: ['directx shader'] },
  { label: 'Vulkan', group: 'Bas niveau & système', aliases: ['vulkan api', 'gpu'] },
  { label: 'Metal', group: 'Bas niveau & système', aliases: ['apple gpu'] },
  { label: 'DirectX', group: 'Bas niveau & système', aliases: ['dx12', 'direct3d'] },
  { label: 'OpenGL', group: 'Bas niveau & système' },
  { label: 'WebGPU', group: 'Bas niveau & système', aliases: ['wgpu'] },
  { label: 'Carbon', group: 'Bas niveau & système', aliases: ['google carbon'] },
  { label: 'V lang', group: 'Bas niveau & système', aliases: ['vlang'] },

  // Langages & paradigmes
  { label: 'Scala', group: 'Langages & paradigmes' },
  { label: 'Clojure', group: 'Langages & paradigmes', aliases: ['clj'] },
  { label: 'Elixir', group: 'Langages & paradigmes', aliases: ['ex'] },
  { label: 'Erlang', group: 'Langages & paradigmes', aliases: ['beam'] },
  { label: 'Haskell', group: 'Langages & paradigmes', aliases: ['hs'] },
  { label: 'OCaml', group: 'Langages & paradigmes', aliases: ['ml'] },
  { label: 'F#', group: 'Langages & paradigmes', aliases: ['fsharp'] },
  { label: 'Lua', group: 'Langages & paradigmes' },
  { label: 'Perl', group: 'Langages & paradigmes' },
  { label: 'R', group: 'Langages & paradigmes', aliases: ['rstats'] },
  { label: 'MATLAB', group: 'Langages & paradigmes' },
  { label: 'Julia', group: 'Langages & paradigmes' },
  { label: 'Lisp', group: 'Langages & paradigmes', aliases: ['common lisp', 'scheme', 'racket'] },
  { label: 'Prolog', group: 'Langages & paradigmes' },
  { label: 'Fortran', group: 'Langages & paradigmes' },
  { label: 'COBOL', group: 'Langages & paradigmes' },
  { label: 'Ada', group: 'Langages & paradigmes' },
  { label: 'Groovy', group: 'Langages & paradigmes' },
  { label: 'Crystal', group: 'Langages & paradigmes' },
  { label: 'ABAP', group: 'Langages & paradigmes', aliases: ['sap'] },
  { label: 'Delphi', group: 'Langages & paradigmes', aliases: ['pascal', 'object pascal'] },
  { label: 'ColdFusion', group: 'Langages & paradigmes', aliases: ['cfml'] },

  // Frontend & UI
  { label: 'React', group: 'Frontend & UI', aliases: ['reactjs', 'react 19'] },
  { label: 'Next.js', group: 'Frontend & UI', aliases: ['nextjs', 'next 15'] },
  { label: 'Vue.js', group: 'Frontend & UI', aliases: ['vue', 'vue3'] },
  { label: 'Nuxt', group: 'Frontend & UI', aliases: ['nuxtjs', 'nuxt 4'] },
  { label: 'Angular', group: 'Frontend & UI', aliases: ['angular 19'] },
  { label: 'Svelte', group: 'Frontend & UI', aliases: ['sveltekit', 'svelte 5'] },
  { label: 'SolidJS', group: 'Frontend & UI', aliases: ['solid'] },
  { label: 'Remix', group: 'Frontend & UI', aliases: ['react router v7'] },
  { label: 'Astro', group: 'Frontend & UI' },
  { label: 'Gatsby', group: 'Frontend & UI' },
  { label: 'Qwik', group: 'Frontend & UI' },
  { label: 'Ember.js', group: 'Frontend & UI', aliases: ['ember'] },
  { label: 'HTMX', group: 'Frontend & UI', aliases: ['hypermedia'] },
  { label: 'Alpine.js', group: 'Frontend & UI', aliases: ['alpine'] },
  { label: 'Lit', group: 'Frontend & UI', aliases: ['web components'] },
  { label: 'Tailwind CSS', group: 'Frontend & UI', aliases: ['tailwind', 'tailwind v4'] },
  { label: 'Bootstrap', group: 'Frontend & UI' },
  { label: 'Material UI', group: 'Frontend & UI', aliases: ['mui', 'material-ui'] },
  { label: 'Chakra UI', group: 'Frontend & UI' },
  { label: 'shadcn/ui', group: 'Frontend & UI', aliases: ['shadcn', 'radix'] },
  { label: 'Radix UI', group: 'Frontend & UI', aliases: ['radix primitives'] },
  { label: 'Panda CSS', group: 'Frontend & UI', aliases: ['panda'] },
  { label: 'UnoCSS', group: 'Frontend & UI' },
  { label: 'Redux', group: 'Frontend & UI', aliases: ['rtk', 'redux toolkit'] },
  { label: 'Zustand', group: 'Frontend & UI' },
  { label: 'Jotai', group: 'Frontend & UI' },
  { label: 'TanStack Query', group: 'Frontend & UI', aliases: ['react query', 'tanstack'] },
  { label: 'TanStack Router', group: 'Frontend & UI' },
  { label: 'TanStack Start', group: 'Frontend & UI', aliases: ['fullstack react'] },
  { label: 'Three.js', group: 'Frontend & UI', aliases: ['webgl', '3d'] },
  { label: 'D3.js', group: 'Frontend & UI', aliases: ['dataviz'] },
  { label: 'Framer Motion', group: 'Frontend & UI', aliases: ['motion'] },
  { label: 'Storybook', group: 'Frontend & UI' },

  // Backend & API
  { label: 'Node.js', group: 'Backend & API', aliases: ['nodejs', 'node 22'] },
  { label: 'NestJS', group: 'Backend & API', aliases: ['nest'] },
  { label: 'Express', group: 'Backend & API', aliases: ['expressjs'] },
  { label: 'Fastify', group: 'Backend & API' },
  { label: 'Hono', group: 'Backend & API', aliases: ['edge api'] },
  { label: 'Elysia', group: 'Backend & API', aliases: ['bun framework'] },
  { label: 'Django', group: 'Backend & API' },
  { label: 'Flask', group: 'Backend & API' },
  { label: 'FastAPI', group: 'Backend & API' },
  { label: 'Laravel', group: 'Backend & API' },
  { label: 'Symfony', group: 'Backend & API' },
  { label: 'Ruby on Rails', group: 'Backend & API', aliases: ['rails', 'ror'] },
  { label: 'Spring Boot', group: 'Backend & API', aliases: ['spring', 'java spring'] },
  { label: 'ASP.NET Core', group: 'Backend & API', aliases: ['aspnet', 'minimal api'] },
  { label: 'Gin', group: 'Backend & API', aliases: ['go gin'] },
  { label: 'Fiber', group: 'Backend & API', aliases: ['go fiber'] },
  { label: 'Actix', group: 'Backend & API', aliases: ['rust actix'] },
  { label: 'Axum', group: 'Backend & API', aliases: ['rust axum', 'tokio'] },
  { label: 'Rocket', group: 'Backend & API', aliases: ['rust rocket'] },
  { label: 'Phoenix', group: 'Backend & API', aliases: ['elixir phoenix'] },
  { label: 'tRPC', group: 'Backend & API' },
  { label: 'gRPC', group: 'Backend & API' },
  { label: 'REST API', group: 'Backend & API', aliases: ['rest', 'http api'] },
  { label: 'Prisma', group: 'Backend & API', aliases: ['orm'] },
  { label: 'Drizzle ORM', group: 'Backend & API', aliases: ['drizzle'] },
  { label: 'TypeORM', group: 'Backend & API' },
  { label: 'Sequelize', group: 'Backend & API' },
  { label: 'Hibernate', group: 'Backend & API' },
  { label: 'MikroORM', group: 'Backend & API' },
  { label: 'Kysely', group: 'Backend & API', aliases: ['sql builder'] },
  { label: 'Effect-TS', group: 'Backend & API', aliases: ['effect', 'typescript fp'] },
  { label: 'Temporal', group: 'Backend & API', aliases: ['workflow orchestration'] },
  { label: 'Apache Camel', group: 'Backend & API', aliases: ['integration'] },

  // Mobile & desktop
  { label: 'React Native', group: 'Mobile & desktop', aliases: ['rn', 'expo router'] },
  { label: 'Expo', group: 'Mobile & desktop', aliases: ['expo sdk'] },
  { label: 'Flutter', group: 'Mobile & desktop' },
  { label: 'SwiftUI', group: 'Mobile & desktop', aliases: ['ios'] },
  { label: 'UIKit', group: 'Mobile & desktop' },
  { label: 'Jetpack Compose', group: 'Mobile & desktop', aliases: ['android', 'compose multiplatform'] },
  { label: 'Kotlin Multiplatform', group: 'Mobile & desktop', aliases: ['kmp', 'compose mpp'] },
  { label: '.NET MAUI', group: 'Mobile & desktop', aliases: ['maui', 'xamarin successor'] },
  { label: 'Ionic', group: 'Mobile & desktop' },
  { label: 'Capacitor', group: 'Mobile & desktop', aliases: ['capacitor 6'] },
  { label: 'Electron', group: 'Mobile & desktop', aliases: ['desktop'] },
  { label: 'Tauri', group: 'Mobile & desktop', aliases: ['tauri 2'] },
  { label: 'Qt', group: 'Mobile & desktop', aliases: ['qml'] },
  { label: 'WPF', group: 'Mobile & desktop', aliases: ['winforms', 'windows desktop'] },
  { label: 'macOS AppKit', group: 'Mobile & desktop', aliases: ['appkit', 'cocoa'] },

  // Bases de données
  { label: 'PostgreSQL', group: 'Bases de données', aliases: ['postgres', 'pg', 'pgvector'] },
  { label: 'MySQL', group: 'Bases de données' },
  { label: 'MariaDB', group: 'Bases de données' },
  { label: 'SQLite', group: 'Bases de données' },
  { label: 'MongoDB', group: 'Bases de données', aliases: ['mongo'] },
  { label: 'Redis', group: 'Bases de données', aliases: ['valkey'] },
  { label: 'Elasticsearch', group: 'Bases de données', aliases: ['elastic', 'opensearch'] },
  { label: 'Cassandra', group: 'Bases de données' },
  { label: 'DynamoDB', group: 'Bases de données', aliases: ['aws dynamo'] },
  { label: 'CockroachDB', group: 'Bases de données', aliases: ['cockroach'] },
  { label: 'Neo4j', group: 'Bases de données', aliases: ['graph db'] },
  { label: 'InfluxDB', group: 'Bases de données', aliases: ['timeseries'] },
  { label: 'Supabase', group: 'Bases de données', aliases: ['supabase db'] },
  { label: 'Firebase', group: 'Bases de données', aliases: ['firestore'] },
  { label: 'PlanetScale', group: 'Bases de données', aliases: ['vitess'] },
  { label: 'Neon', group: 'Bases de données', aliases: ['serverless postgres'] },
  { label: 'Turso / libSQL', group: 'Bases de données', aliases: ['libsql', 'turso'] },
  { label: 'ClickHouse', group: 'Bases de données', aliases: ['olap'] },
  { label: 'DuckDB', group: 'Bases de données', aliases: ['analytics embedded'] },
  { label: 'Snowflake', group: 'Bases de données', aliases: ['data warehouse'] },
  { label: 'BigQuery', group: 'Bases de données', aliases: ['gcp warehouse'] },
  { label: 'MinIO', group: 'Bases de données', aliases: ['s3 compatible', 'object storage'] },
  { label: 'Qdrant', group: 'Bases de données', aliases: ['vector db'] },
  { label: 'Pinecone', group: 'Bases de données', aliases: ['vector search'] },
  { label: 'Weaviate', group: 'Bases de données', aliases: ['vector'] },
  { label: 'ChromaDB', group: 'Bases de données', aliases: ['embeddings db'] },

  // CMS & e-commerce
  { label: 'WordPress', group: 'CMS & e-commerce', aliases: ['wp', 'gutenberg'] },
  { label: 'Strapi', group: 'CMS & e-commerce', aliases: ['headless cms'] },
  { label: 'Drupal', group: 'CMS & e-commerce' },
  { label: 'Shopify', group: 'CMS & e-commerce', aliases: ['liquid'] },
  { label: 'PrestaShop', group: 'CMS & e-commerce' },
  { label: 'WooCommerce', group: 'CMS & e-commerce', aliases: ['woo'] },
  { label: 'Magento', group: 'CMS & e-commerce', aliases: ['adobe commerce'] },
  { label: 'Webflow', group: 'CMS & e-commerce' },
  { label: 'Contentful', group: 'CMS & e-commerce' },
  { label: 'Sanity', group: 'CMS & e-commerce', aliases: ['sanity studio'] },
  { label: 'Medusa', group: 'CMS & e-commerce', aliases: ['headless commerce'] },
  { label: 'Payload CMS', group: 'CMS & e-commerce', aliases: ['payload'] },
  { label: 'Directus', group: 'CMS & e-commerce' },
  { label: 'Ghost', group: 'CMS & e-commerce', aliases: ['blog cms'] },

  // DevOps & cloud
  { label: 'Docker', group: 'DevOps & cloud', aliases: ['containers', 'docker compose'] },
  { label: 'Kubernetes', group: 'DevOps & cloud', aliases: ['k8s', 'k3s', 'eks', 'gke', 'aks'] },
  { label: 'Terraform', group: 'DevOps & cloud', aliases: ['iac', 'opentofu'] },
  { label: 'OpenTofu', group: 'DevOps & cloud', aliases: ['tofu', 'terraform fork'] },
  { label: 'Ansible', group: 'DevOps & cloud' },
  { label: 'Pulumi', group: 'DevOps & cloud' },
  { label: 'Helm', group: 'DevOps & cloud', aliases: ['kubernetes charts'] },
  { label: 'Argo CD', group: 'DevOps & cloud', aliases: ['gitops', 'argo'] },
  { label: 'Istio', group: 'DevOps & cloud', aliases: ['service mesh'] },
  { label: 'Linkerd', group: 'DevOps & cloud', aliases: ['service mesh'] },
  { label: 'AWS', group: 'DevOps & cloud', aliases: ['amazon', 'ec2', 's3', 'lambda', 'ecs'] },
  { label: 'Google Cloud', group: 'DevOps & cloud', aliases: ['gcp', 'cloud run'] },
  { label: 'Microsoft Azure', group: 'DevOps & cloud', aliases: ['azure'] },
  { label: 'Vercel', group: 'DevOps & cloud' },
  { label: 'Netlify', group: 'DevOps & cloud' },
  { label: 'Cloudflare', group: 'DevOps & cloud', aliases: ['workers', 'cdn', 'r2'] },
  { label: 'DigitalOcean', group: 'DevOps & cloud', aliases: ['do'] },
  { label: 'Heroku', group: 'DevOps & cloud' },
  { label: 'Railway', group: 'DevOps & cloud' },
  { label: 'Fly.io', group: 'DevOps & cloud', aliases: ['flyio'] },
  { label: 'Render', group: 'DevOps & cloud' },
  { label: 'Scaleway', group: 'DevOps & cloud', aliases: ['ovhcloud alt'] },
  { label: 'OVHcloud', group: 'DevOps & cloud', aliases: ['ovh'] },
  { label: 'Hetzner', group: 'DevOps & cloud', aliases: ['hetzner cloud'] },
  { label: 'Nginx', group: 'DevOps & cloud', aliases: ['ingress'] },
  { label: 'Apache HTTP', group: 'DevOps & cloud', aliases: ['apache', 'httpd'] },
  { label: 'Caddy', group: 'DevOps & cloud', aliases: ['reverse proxy'] },
  { label: 'Traefik', group: 'DevOps & cloud' },
  { label: 'Linux', group: 'DevOps & cloud', aliases: ['ubuntu', 'debian', 'rhel', 'alpine'] },
  { label: 'Windows Server', group: 'DevOps & cloud' },
  { label: 'Proxmox', group: 'DevOps & cloud', aliases: ['virtualisation'] },
  { label: 'VMware', group: 'DevOps & cloud', aliases: ['esxi', 'vsphere'] },
  { label: 'Podman', group: 'DevOps & cloud', aliases: ['rootless containers'] },
  { label: 'Nomad', group: 'DevOps & cloud', aliases: ['hashicorp nomad'] },
  { label: 'Consul', group: 'DevOps & cloud', aliases: ['service discovery'] },

  // Réseau & messaging
  { label: 'WebSocket', group: 'Réseau & messaging', aliases: ['ws'] },
  { label: 'Socket.IO', group: 'Réseau & messaging' },
  { label: 'RabbitMQ', group: 'Réseau & messaging', aliases: ['amqp'] },
  { label: 'Apache Kafka', group: 'Réseau & messaging', aliases: ['kafka', 'redpanda'] },
  { label: 'NATS', group: 'Réseau & messaging', aliases: ['nats jetstream'] },
  { label: 'MQTT', group: 'Réseau & messaging', aliases: ['iot', 'mosquitto'] },
  { label: 'OpenVPN', group: 'Réseau & messaging', aliases: ['vpn'] },
  { label: 'WireGuard', group: 'Réseau & messaging' },
  { label: 'TCP/IP', group: 'Réseau & messaging', aliases: ['networking', 'osi'] },
  { label: 'WebRTC', group: 'Réseau & messaging', aliases: ['realtime media'] },
  { label: 'gRPC-Web', group: 'Réseau & messaging' },
  { label: 'ZeroMQ', group: 'Réseau & messaging', aliases: ['zmq'] },
  { label: 'Pulsar', group: 'Réseau & messaging', aliases: ['apache pulsar'] },

  // CI/CD & qualité
  { label: 'Git', group: 'CI/CD & qualité', aliases: ['github', 'gitlab', 'bitbucket'] },
  { label: 'GitHub Actions', group: 'CI/CD & qualité', aliases: ['gh actions', 'ci/cd'] },
  { label: 'GitLab CI', group: 'CI/CD & qualité' },
  { label: 'Jenkins', group: 'CI/CD & qualité' },
  { label: 'CircleCI', group: 'CI/CD & qualité' },
  { label: 'SonarQube', group: 'CI/CD & qualité', aliases: ['sonar', 'sast'] },
  { label: 'Snyk', group: 'CI/CD & qualité', aliases: ['sca', 'dependabot'] },
  { label: 'Jest', group: 'CI/CD & qualité', aliases: ['unit test'] },
  { label: 'Vitest', group: 'CI/CD & qualité' },
  { label: 'Playwright', group: 'CI/CD & qualité', aliases: ['e2e'] },
  { label: 'Cypress', group: 'CI/CD & qualité' },
  { label: 'ESLint', group: 'CI/CD & qualité', aliases: ['oxlint'] },
  { label: 'Prettier', group: 'CI/CD & qualité' },
  { label: 'Biome', group: 'CI/CD & qualité', aliases: ['rome successor'] },
  { label: 'Turborepo', group: 'CI/CD & qualité', aliases: ['monorepo'] },
  { label: 'Nx', group: 'CI/CD & qualité', aliases: ['nrwl'] },
  { label: 'pnpm', group: 'CI/CD & qualité', aliases: ['package manager'] },
  { label: 'OpenTelemetry', group: 'CI/CD & qualité', aliases: ['otel', 'observability'] },
  { label: 'Grafana', group: 'CI/CD & qualité', aliases: ['loki', 'tempo'] },
  { label: 'Prometheus', group: 'CI/CD & qualité', aliases: ['metrics'] },
  { label: 'Datadog', group: 'CI/CD & qualité', aliases: ['apm'] },
  { label: 'Sentry', group: 'CI/CD & qualité', aliases: ['error tracking'] },

  // IA & data science
  { label: 'OpenAI / ChatGPT', group: 'IA & data science', aliases: ['chatgpt', 'gpt-4', 'openai api'] },
  { label: 'Claude / Anthropic', group: 'IA & data science', aliases: ['claude', 'anthropic api'] },
  { label: 'Gemini / Google AI', group: 'IA & data science', aliases: ['gemini', 'vertex ai'] },
  { label: 'Mistral AI', group: 'IA & data science', aliases: ['mistral', 'le chat'] },
  { label: 'Groq', group: 'IA & data science', aliases: ['lpu inference'] },
  { label: 'Vercel AI SDK', group: 'IA & data science', aliases: ['ai sdk', 'streaming llm'] },
  { label: 'LangChain', group: 'IA & data science', aliases: ['llm', 'langgraph'] },
  { label: 'LlamaIndex', group: 'IA & data science', aliases: ['rag'] },
  { label: 'Hugging Face', group: 'IA & data science', aliases: ['transformers', 'hf hub'] },
  { label: 'Ollama', group: 'IA & data science', aliases: ['local llm'] },
  { label: 'LM Studio', group: 'IA & data science', aliases: ['local models'] },
  { label: 'MCP (Model Context Protocol)', group: 'IA & data science', aliases: ['mcp', 'anthropic mcp'] },
  { label: 'GitHub Copilot', group: 'IA & data science', aliases: ['copilot', 'ai pair programming'] },
  { label: 'Cursor', group: 'IA & data science', aliases: ['ai ide'] },
  { label: 'PyTorch', group: 'IA & data science', aliases: ['torch'] },
  { label: 'TensorFlow', group: 'IA & data science', aliases: ['tf', 'keras'] },
  { label: 'JAX', group: 'IA & data science', aliases: ['google jax'] },
  { label: 'scikit-learn', group: 'IA & data science', aliases: ['sklearn'] },
  { label: 'Pandas', group: 'IA & data science' },
  { label: 'Polars', group: 'IA & data science', aliases: ['dataframe rust'] },
  { label: 'Apache Spark', group: 'IA & data science', aliases: ['spark', 'pyspark'] },
  { label: 'dbt', group: 'IA & data science', aliases: ['data build tool'] },
  { label: 'Airflow', group: 'IA & data science', aliases: ['apache airflow', 'dagster'] },
  { label: 'n8n', group: 'IA & data science', aliases: ['automation', 'make', 'zapier'] },
  { label: 'CrewAI', group: 'IA & data science', aliases: ['agents'] },
  { label: 'AutoGen', group: 'IA & data science', aliases: ['microsoft agents'] },
  { label: 'Whisper', group: 'IA & data science', aliases: ['speech to text'] },
  { label: 'Stable Diffusion', group: 'IA & data science', aliases: ['sdxl', 'image gen'] },
  { label: 'ComfyUI', group: 'IA & data science', aliases: ['diffusion workflow'] },

  // Cybersécurité
  { label: 'OWASP', group: 'Cybersécurité', aliases: ['top 10', 'asvs'] },
  { label: 'Pentest', group: 'Cybersécurité', aliases: ['penetration test'] },
  { label: 'Burp Suite', group: 'Cybersécurité', aliases: ['burp'] },
  { label: 'Wireshark', group: 'Cybersécurité', aliases: ['packet analysis'] },
  { label: 'Nmap', group: 'Cybersécurité', aliases: ['port scan'] },
  { label: 'Metasploit', group: 'Cybersécurité' },
  { label: 'Kali Linux', group: 'Cybersécurité', aliases: ['kali'] },
  { label: 'HashiCorp Vault', group: 'Cybersécurité', aliases: ['vault', 'secrets'] },
  { label: 'WAF', group: 'Cybersécurité', aliases: ['web application firewall'] },
  { label: 'SIEM', group: 'Cybersécurité', aliases: ['soc', 'splunk', 'elastic siem'] },
  { label: 'OAuth 2.0', group: 'Cybersécurité', aliases: ['oidc', 'openid'] },
  { label: 'JWT', group: 'Cybersécurité', aliases: ['json web token'] },
  { label: 'Keycloak', group: 'Cybersécurité', aliases: ['iam', 'sso'] },
  { label: 'Auth0', group: 'Cybersécurité', aliases: ['okta auth0'] },
  { label: 'Clerk', group: 'Cybersécurité', aliases: ['auth saas'] },
  { label: 'Passkeys / WebAuthn', group: 'Cybersécurité', aliases: ['fido2', 'passwordless'] },
  { label: 'mTLS', group: 'Cybersécurité', aliases: ['mutual tls'] },
  { label: 'CIS Benchmarks', group: 'Cybersécurité', aliases: ['hardening'] },

  // Jeux & embarqué
  { label: 'Unity', group: 'Jeux & embarqué', aliases: ['game engine', 'c# games'] },
  { label: 'Unreal Engine', group: 'Jeux & embarqué', aliases: ['ue5', 'ue4', 'blueprint'] },
  { label: 'Godot', group: 'Jeux & embarqué', aliases: ['gdscript'] },
  { label: 'Blender', group: 'Jeux & embarqué', aliases: ['3d', 'modeling'] },
  { label: 'Arduino', group: 'Jeux & embarqué', aliases: ['microcontroller'] },
  { label: 'Raspberry Pi', group: 'Jeux & embarqué', aliases: ['rpi', 'iot'] },
  { label: 'ESP32', group: 'Jeux & embarqué', aliases: ['esp8266', 'espressif'] },
  { label: 'STM32', group: 'Jeux & embarqué', aliases: ['arm cortex', 'hal'] },
  { label: 'ROS', group: 'Jeux & embarqué', aliases: ['robotics', 'ros2'] },
  { label: 'Modbus', group: 'Jeux & embarqué', aliases: ['industrial', 'scada'] },
  { label: 'OPC UA', group: 'Jeux & embarqué', aliases: ['industry 4.0'] },

  // Outils & build
  { label: 'Vite', group: 'Outils & build', aliases: ['vitejs', 'vite 6'] },
  { label: 'Webpack', group: 'Outils & build' },
  { label: 'Rollup', group: 'Outils & build' },
  { label: 'esbuild', group: 'Outils & build' },
  { label: 'Turbopack', group: 'Outils & build', aliases: ['next bundler'] },
  { label: 'Rspack', group: 'Outils & build', aliases: ['rust bundler'] },
  { label: 'Figma', group: 'Outils & build', aliases: ['design', 'ui design'] },
  { label: 'Postman', group: 'Outils & build', aliases: ['api testing', 'bruno'] },
  { label: 'Swagger / OpenAPI', group: 'Outils & build', aliases: ['openapi', 'redoc'] },
  { label: 'Jira', group: 'Outils & build', aliases: ['atlassian', 'linear alt'] },
  { label: 'Notion', group: 'Outils & build' },
  { label: 'Stripe API', group: 'Outils & build', aliases: ['stripe', 'payments'] },
  { label: 'Twilio', group: 'Outils & build', aliases: ['sms', 'voice api'] },
  { label: 'SendGrid', group: 'Outils & build', aliases: ['email api'] },
  { label: 'Appwrite', group: 'Outils & build', aliases: ['baas'] },
  { label: 'PocketBase', group: 'Outils & build', aliases: ['self-hosted baas'] },
  { label: 'Salesforce', group: 'Outils & build', aliases: ['apex', 'crm dev'] },
  { label: 'SAP', group: 'Outils & build', aliases: ['erp'] },
]

function resolvePopularity(label: string): { tier: ProductTechPopularityTier; rank: number } {
  const trendIdx = TREND_2026_2028.indexOf(label)
  if (trendIdx >= 0) return { tier: 'Tendance 2026–2028', rank: trendIdx + 1 }

  const highIdx = HIGH_DEMAND.indexOf(label)
  if (highIdx >= 0) return { tier: 'Très demandé', rank: highIdx + 1 }

  const stdIdx = PROFESSIONAL_STANDARD.indexOf(label)
  if (stdIdx >= 0) return { tier: 'Standard professionnel', rank: stdIdx + 1 }

  return { tier: 'Spécialisé & niche', rank: 500 }
}

function sortByPopularity(a: ProductTechOption, b: ProductTechOption): number {
  const tierDiff = TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)
  if (tierDiff !== 0) return tierDiff
  if (a.rank !== b.rank) return a.rank - b.rank
  return a.label.localeCompare(b.label, 'fr')
}

function enrichSeed(seed: TechSeed): ProductTechOption {
  const { tier, rank } = resolvePopularity(seed.label)
  return { ...seed, tier, rank }
}

/** Liste complète triée par popularité 2026–2028. */
export const PRODUCT_TECH_SUGGESTIONS: ProductTechOption[] = TECH_SEEDS.map(enrichSeed).sort(sortByPopularity)

export const PRODUCT_TECH_POPULAR = TREND_2026_2028.slice(0, 16)

export const PRODUCT_TECH_TIER_ORDER = TIER_ORDER

const labelIndex = new Map<string, ProductTechOption>()
for (const opt of PRODUCT_TECH_SUGGESTIONS) {
  labelIndex.set(opt.label.toLowerCase(), opt)
  for (const alias of opt.aliases ?? []) {
    labelIndex.set(alias.toLowerCase(), opt)
  }
}

export function findTechOption(label: string): ProductTechOption | undefined {
  return labelIndex.get(label.trim().toLowerCase())
}

export function normalizeTechLabel(raw: string): string {
  const hit = findTechOption(raw)
  return hit?.label ?? raw.trim()
}

function popularityBoost(opt: ProductTechOption): number {
  const tierBoost = (TIER_ORDER.length - TIER_ORDER.indexOf(opt.tier)) * 40
  return tierBoost + Math.max(0, 120 - opt.rank / 2)
}

export function scoreTechOption(opt: ProductTechOption, query: string): number {
  const q = query.trim().toLowerCase()
  if (!q) return popularityBoost(opt)
  const label = opt.label.toLowerCase()
  const aliases = (opt.aliases ?? []).map((a) => a.toLowerCase())
  let textScore = -1
  if (label === q) textScore = 120
  else if (label.startsWith(q)) textScore = 90
  else if (label.includes(q)) textScore = 65
  else if (aliases.some((a) => a === q || a.startsWith(q))) textScore = 75
  else if (aliases.some((a) => a.includes(q))) textScore = 50
  else if (`${label} ${aliases.join(' ')}`.includes(q)) textScore = 35
  if (textScore < 0) return -1
  return textScore + popularityBoost(opt) * 0.35
}

export function filterTechSuggestions(query: string, limit = 56): ProductTechOption[] {
  const q = query.trim()
  if (!q) {
    return PRODUCT_TECH_SUGGESTIONS.slice(0, limit)
  }
  return PRODUCT_TECH_SUGGESTIONS
    .map((opt) => ({ opt, score: scoreTechOption(opt, q) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score || sortByPopularity(a.opt, b.opt))
    .slice(0, limit)
    .map((x) => x.opt)
}

const GROUP_COLORS: Record<ProductTechGroup, string> = {
  'Langages web & scripting': '#2563eb',
  'Bas niveau & système': '#7c3aed',
  'Langages & paradigmes': '#0891b2',
  'Frontend & UI': '#0ea5e9',
  'Backend & API': '#059669',
  'Mobile & desktop': '#d97706',
  'Bases de données': '#dc2626',
  'CMS & e-commerce': '#db2777',
  'DevOps & cloud': '#4f46e5',
  'Réseau & messaging': '#64748b',
  'CI/CD & qualité': '#16a34a',
  'IA & data science': '#9333ea',
  'Cybersécurité': '#b45309',
  'Jeux & embarqué': '#ea580c',
  'Outils & build': '#475569',
}

const TIER_COLORS: Record<ProductTechPopularityTier, string> = {
  'Tendance 2026–2028': '#2563eb',
  'Très demandé': '#059669',
  'Standard professionnel': '#64748b',
  'Spécialisé & niche': '#94a3b8',
}

export function techGroupColor(group: ProductTechGroup | string): string {
  return GROUP_COLORS[group as ProductTechGroup] ?? '#64748b'
}

export function techTierColor(tier: ProductTechPopularityTier | string): string {
  return TIER_COLORS[tier as ProductTechPopularityTier] ?? '#64748b'
}

export const PRODUCT_TECH_GROUP_ORDER = [
  'Langages web & scripting',
  'Bas niveau & système',
  'Langages & paradigmes',
  'Frontend & UI',
  'Backend & API',
  'Mobile & desktop',
  'Bases de données',
  'CMS & e-commerce',
  'DevOps & cloud',
  'Réseau & messaging',
  'CI/CD & qualité',
  'IA & data science',
  'Cybersécurité',
  'Jeux & embarqué',
  'Outils & build',
] as const satisfies readonly ProductTechGroup[]
