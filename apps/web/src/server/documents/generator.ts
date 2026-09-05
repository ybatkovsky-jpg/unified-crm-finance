import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import fs from "fs"
import path from "path"

const MONTHS_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
]

/** «05» мая 2026 г. */
export function rusDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0")
  return `«${day}» ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()} г.`
}

/** 05.05.2026 */
export function rusShortDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  return `${dd}.${mm}.${d.getFullYear()}`
}

export function formatRoubles(n: number): string {
  return Math.floor(n).toLocaleString("ru-RU")
}

export function formatKopecks(n: number): string {
  const kop = Math.round((n - Math.floor(n)) * 100)
  return String(kop).padStart(2, "0")
}

// --- Число прописью (до миллиардов) ---
const UNITS = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"]
const TEENS = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"]
const TENS = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"]
const HUNDREDS = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"]

function three(n: number, feminine: boolean): string {
  const parts: string[] = []
  const h = Math.floor(n / 100)
  const t = Math.floor((n % 100) / 10)
  const u = n % 10
  if (h) parts.push(HUNDREDS[h])
  if (t === 1) {
    parts.push(TEENS[u])
  } else {
    if (t) parts.push(TENS[t])
    if (u) {
      if (u === 1) parts.push(feminine ? "одна" : "один")
      else if (u === 2) parts.push(feminine ? "две" : "два")
      else parts.push(UNITS[u])
    }
  }
  return parts.join(" ")
}

function unitWord(n: number, forms: [string, string, string]): string {
  const mod100 = n % 100
  const mod10 = n % 10
  if (mod100 >= 11 && mod100 <= 19) return forms[2]
  if (mod10 === 1) return forms[0]
  if (mod10 >= 2 && mod10 <= 4) return forms[1]
  return forms[2]
}

function numberToWords(n: number): string {
  if (n === 0) return "ноль"
  const res: string[] = []
  const billions = Math.floor(n / 1_000_000_000)
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000)
  const thousands = Math.floor((n % 1_000_000) / 1_000)
  const rest = n % 1_000

  if (billions) res.push(three(billions, false), unitWord(billions, ["миллиард", "миллиарда", "миллиардов"]))
  if (millions) res.push(three(millions, false), unitWord(millions, ["миллион", "миллиона", "миллионов"]))
  if (thousands) res.push(three(thousands, true), unitWord(thousands, ["тысяча", "тысячи", "тысяч"]))
  if (rest) res.push(three(rest, false))
  return res.join(" ")
}

function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Сумма прописью (рубли дописываются в шаблоне) */
export function amountWords(n: number): string {
  const roubles = Math.floor(n)
  const kopecks = Math.round((n - roubles) * 100)
  let out = capitalize(numberToWords(roubles))
  if (kopecks > 0) out += ` ${String(kopecks).padStart(2, "0")}`
  return out
}

const TEMPLATE_DIR = path.resolve(process.cwd(), "src", "server", "templates")

export function renderDocx(templateName: string, context: Record<string, unknown>): Buffer {
  const filePath = path.join(TEMPLATE_DIR, templateName)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Шаблон не найден: ${filePath}`)
  }
  const content = fs.readFileSync(filePath)
  const zip = new PizZip(content)
  const doc = new Docxtemplater(zip, {
    delimiters: { start: "{{", end: "}}" },
    paragraphLoop: false,
    linebreaks: true,
  })
  doc.render(context)
  const buf = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" })
  return Buffer.from(buf)
}

export interface ClientInput {
  type: string
  firstName: string | null
  lastName: string | null
  middleName: string | null
  companyName: string | null
  phone: string | null
  registrationAddress: string | null
  address: string | null
  passportSeries: string | null
  passportNumber: string | null
  passportIssuedBy: string | null
  passportIssuedAt: Date | string | null
  passportCode: string | null
}

/**
 * Плоский контекст: ключи совпадают с текстом тегов в шаблоне
 * (docxtemplater в данной конфигурации резолвит тег как литеральный ключ).
 */
export function buildSaleContractContext(input: {
  number: string
  amount: number
  date: Date | null
  client: ClientInput
}): Record<string, unknown> {
  const { number, amount, date, client } = input
  const d = date ?? new Date()
  const fullName =
    client.type === "company"
      ? (client.companyName ?? "")
      : [client.lastName, client.firstName, client.middleName].filter(Boolean).join(" ")

  return {
    "Doc.saleContract.number": number,
    "Doc.saleContract.date": rusDate(d),
    "Client.fullName": fullName,
    "Client.passport.series": client.passportSeries ?? "",
    "Client.passport.number": client.passportNumber ?? "",
    "Client.passport.issuedBy": client.passportIssuedBy ?? "",
    "Client.passport.issuedAt": client.passportIssuedAt ? rusShortDate(new Date(client.passportIssuedAt)) : "",
    "Client.passport.code": client.passportCode ?? "",
    "Client.regAddress": client.registrationAddress ?? client.address ?? "",
    "Client.phone": client.phone ?? "",
    "Order.amountRoubles": formatRoubles(amount),
    "Order.amountKopecks": formatKopecks(amount),
    "Order.amountWords": amountWords(amount),
    "Order.ndsLabel": "НДС не облагается",
  }
}
