import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Unified CRM Finance',
  description:
    'Единая CRM-система: контакты, сделки, договоры, проекты, закупки и управленческий учёт',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
