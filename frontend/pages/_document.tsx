import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Meta tags */}
        <meta name="facebook-domain-verification" content="your_domain_verification_code" />
        
        {/* Preload Facebook SDK domain for faster loading */}
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
      </Head>
      <body>
        {/* Required div for Facebook SDK */}
        <div id="fb-root"></div>
        
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 