import { ScrollViewStyleReset } from 'expo-router/html'
import { APP_DESCRIPTION, APP_NAME, BRAND } from '../src/constants/appMetadata'

/** Document HTML pour `expo start --web` (titre, favicon, theme-color). */
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>{APP_NAME}</title>
        <meta name="description" content={APP_DESCRIPTION} />
        <meta name="application-name" content={APP_NAME} />
        <meta name="theme-color" content={BRAND.primary} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
        <link rel="icon" href="/favicon.ico" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root { height: 100%; margin: 0; background: #f1f5f9; }
              body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
