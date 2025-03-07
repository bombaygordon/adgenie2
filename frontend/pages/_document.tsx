import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* We'll load the Facebook SDK dynamically in our helper instead */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 