    // pages/_document.tsx

    import { Html, Head, Main, NextScript } from 'next/document';

    // Custom Document Component
    // Ini memungkinkan Anda untuk memodifikasi tag <html> dan <body> di aplikasi Anda
    // Biasanya digunakan untuk menambahkan tag meta kustom, font, atau script eksternal
    export default function Document() {
      return (
        <Html lang="en">
          <Head>
            {/* Anda bisa menambahkan tag meta kustom, link font, dll. di sini */}
            <meta name="description" content="E-commerce App" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <body>
            <Main /> {/* Tempat di mana aplikasi Next.js Anda dirender */}
            <NextScript /> {/* Script yang diperlukan Next.js untuk berfungsi */}
          </body>
        </Html>
      );
    }
    