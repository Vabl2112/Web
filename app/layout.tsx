import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ApiNotices } from '@/components/api-notices'
import './globals.css'

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'EGG — витрины творческих людей',
  description: 'Находите создателей, смотрите их работы и пишите им напрямую.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

/** Web analytics belong to the demo on Vercel only (OD-24): the build for the VM never loads the package. */
async function analytics() {
  if (process.env.VERCEL !== '1') return null
  const { Analytics } = await import('@vercel/analytics/next')
  return <Analytics />
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${geist.className} ${geistMono.className}`}>
      <body className="font-sans antialiased">
        {children}
        <ApiNotices />
        {await analytics()}
      </body>
    </html>
  )
}
