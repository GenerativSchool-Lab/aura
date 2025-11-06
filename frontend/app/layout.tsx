import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hospital Emergency Assistant',
  description: 'Multimodal AI assistant for hospital emergency departments',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

