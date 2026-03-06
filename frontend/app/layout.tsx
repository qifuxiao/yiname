import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'YiName - 易名云 | AI周易起名',
  description: 'AI-powered Chinese naming application with Zhouyi (周易) analysis. Generate meaningful names based on BaZi (八字) and Five Elements (五行).',
  keywords: '周易起名, 宝宝起名, 八字起名, AI起名, 五行分析, 姓名学',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
