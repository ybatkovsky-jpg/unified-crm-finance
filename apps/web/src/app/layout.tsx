import type { Metadata } from "next"
import "./globals.css"
import { NavBar } from "@/components/nav-bar"

export const metadata: Metadata = {
  title: "Единая CRM",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <NavBar />
        {children}
      </body>
    </html>
  )
}
