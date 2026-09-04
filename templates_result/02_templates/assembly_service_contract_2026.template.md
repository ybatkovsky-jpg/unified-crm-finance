# Шаблон: «Договор возмездного оказания услуг по сборке и установке мебели»

**Файл-источник:** `documents\assembly_service_contract_2026.docx`
**Логическое место в пакете:** Приложение № 3 к ДКП; включается в пакет только при `Order.hasAssembly` = true.
**Метод конвертации:** замена заглушек в копии исходного .docx; статика — без изменений.
**Используемые плейсхолдеры:** № 1, 2, 3, 4, 13, 15, 16, 17–23, 25–39, 43, 59, 62, 66–73, 69; статика С1–С5, С9.

---

## Текст шаблона (динамические места)

### Шапка (P1, таблица T1)

```
ДОГОВОР № {{ Doc.serviceContract.number }} возмездного оказания услуг по сборке и установке мебели
| г. Хабаровск | {{ Doc.serviceContract.date|rus_date }} |
```

### Введение (P3) — условный блок «Заказчик»

```
…и
{% if Client.type == 'legal' or Client.type == 'ip' %}
{{ Client.legal.shortName }} ({{ Client.legal.fullName }}), в лице {{ Client.legal.signatoryPosition }}
{{ Client.legal.signatoryName }}, действующего на основании {{ Client.legal.signatoryBasis }},
именуемое в дальнейшем «Заказчик», с другой стороны,
{% else %}
{{ Client.fullName }}, именуем{% if Client.gender == 'm' %}ый{% else %}ая{% endif %}
в дальнейшем «Заказчик», с другой стороны,
{% endif %}
```

### Пункт 1.1 (P5) — ссылка на ДКП и адрес

Оригинал: `…по Договору купли-продажи № ______ от «___» __________ 20__ г. … по адресу: ___<подчёркивание>___`

```
…по Договору купли-продажи № {{ Doc.saleContract.number }} от {{ Doc.saleContract.date|rus_date }} … по адресу: {{ Order.deliveryAddress }}
```

### Пункты 1.2–1.3, разделы 2–3 (P6–P22) — статика

Без изменений (С4, С5). Исключение — п. 2.1 (см. ниже).

### Пункт 2.1 (P9) — срок оказания услуг (два варианта из оригинала)

Оригинал: `Срок оказания Услуг: «___» ______________ 20__ г. / в течение ______ рабочих дней с даты ________________________ (нужное указать).`

```
Срок оказания Услуг:
{% if Order.installOption == 'date' %}
{{ Order.installDate|rus_date }}
{% elif Order.installOption == 'within' %}
в течение {{ Order.installWithinDays }} рабочих дней с даты {{ Order.installDateNote|rus_date }}
{% else %}
«___» ______________ 20__ г.  ← для ручного заполнения (плановая дата неизвестна)
{% endif %}
```

### Пункт 4.1 (P24) — цена договора (стоимость услуг)

Оригинал: `…составляет ________________ (___________________) рублей __ копеек, НДС не облагается / в том числе НДС (нужное указать).`

```
…составляет {{ Order.servicesTotal|fmt_roubles }} ({{ Order.servicesTotal|sum_words }}) рублей
{{ Order.servicesTotal|fmt_kopeks }} копеек, {% if Order.nds %}в том числе НДС{% else %}НДС не облагается{% endif %}.
```

### Пункты 4.2–4.4, разделы 5–7 (P25–P41) — статика

Без изменений (С4, С5).

### Раздел 8. Реквизиты и подписи (P42, таблица T2) — условный блок «Заказчик»

Левая колонка — статика (С1, С2). Правая колонка (в оригинале блок физлица) заменяется:

```
{% if Client.type == 'legal' or Client.type == 'ip' %}
Наименование: {{ Client.legal.shortName }}
{% if Client.legal.fullName %}Полное наименование: {{ Client.legal.fullName }}{% endif %}
ИНН/КПП: {{ Client.legal.inn }} / {{ Client.legal.kpp or '—' }}
ОГРН: {{ Client.legal.ogrn or Client.legal.ogrnip }}
Юридический адрес: {{ Client.legal.legalAddress }}
Банковские реквизиты: р/с {{ Client.legal.bankAccount }} в {{ Client.legal.bankName }}
БИК {{ Client.legal.bankBik }}, к/с {{ Client.legal.bankCorrAccount }}
Тел.: {{ Client.phone }}
{% else %}
Ф.И.О.: {{ Client.fullName }}
Паспорт: серия {{ Client.passport.series }} № {{ Client.passport.number }}
Выдан: {{ Client.passport.issuedBy }}
Дата выдачи: {{ Client.passport.issueDate|rus_full_date }} Код подразделения: {{ Client.passport.departmentCode }}
Адрес: {{ Client.regAddress }}
Тел.: {{ Client.phone }}
{% endif %}
```

Строки подписей (T2 R4–R6):

```
| Генеральный директор | Заказчик |
| _________________ / Батьковский Ю.С. / | _________________ / {% if Client.type in ('legal','ip') %}{{ Client.legal.signatoryName }}{% endif %} / |
| {{ Doc.serviceContract.date|rus_date }} | {{ Doc.serviceContract.date|rus_date }} |
```

---

## Карта замен

| Место в оригинале | Заглушка | Замена |
|---|---|---|
| P1 (шапка) | `№ ______` | `{{ Doc.serviceContract.number }}` |
| T1 R1 (дата) | `«___» ____________ 2026 г.` | `{{ Doc.serviceContract.date|rus_date }}` |
| P3 | пустая строка + «именуемый(ая)» | условный блок «Заказчик» |
| P5 (1.1) | `№ ______ от «___» … 20__ г.` | `№ {{ Doc.saleContract.number }} от {{ Doc.saleContract.date|rus_date }}` |
| P5 (1.1) | подчёркивание после «по адресу:» | `{{ Order.deliveryAddress }}` |
| P9 (2.1) | вариант ««___»…/в течение…» | условный блок по `Order.installOption` |
| P24 (4.1) | числа+пропись+копейки, пара НДС | плейсхолдеры + `{% if Order.nds %}` |
| T2 R2 правая колонка | блок «Ф.И.О.: …» | условный блок физлицо/юрлицо |
| T2 R5 правая колонка | `____ /` | ФИО подписанта для ЮЛ, пусто для ФЛ |
| T2 R6 | `«___» ______________ 2026 г.` ×2 | `{{ Doc.serviceContract.date|rus_date }}` |

**Сверка с реестром:** № 1–4, 15–23, 25–39, 43, 62, 66–73 — все есть в 01; лишних нет.
