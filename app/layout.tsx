import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bijo AI - The Stinkiest Chatbot',
  description: 'Chat with Bijo, the most revolting AI assistant you\'ll ever meet',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="stinky-body">{children}</body>
    </html>
  )
}