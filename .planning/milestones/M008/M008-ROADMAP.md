# M008: Уведомления

**Vision:** Email, in-app, и webhook уведомления для критичных бизнес-событий.

## Slices

- [ ] **S01: Notification Model + Infrastructure** `risk:medium`
  > Модель Notification, API для создания/отправки, базовые шаблоны

- [ ] **S02: Email Notifications** `risk:medium` `depends:[S01]`
  > Email-отправка через SMTP/Resend, шаблоны писем

- [ ] **S03: In-App Notifications** `risk:low` `depends:[S01]`
  > In-app уведомления: колокольчик, список, mark-as-read

- [ ] **S04: Webhook Dispatch** `risk:medium` `depends:[S01]`
  > Webhook-подписки, retry logic, delivery logs

- [ ] **S05: Notification Preferences** `risk:low` `depends:[S02,S03]`
  > Настройки уведомлений per-user: каналы, частота, типы
