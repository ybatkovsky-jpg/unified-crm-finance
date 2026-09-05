import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { prisma } from "@/lib/db/prisma"
import {
  buildPackageContext,
  renderDocumentPackage,
  zipFiles,
  fillOrderForm,
  fillSpecification,
} from "@/server/documents/generator"

export const dynamic = "force-dynamic"

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/contracts/[id]/documents/package
 * Генерирует ZIP-пакет документов (docx заполняются из БД, xlsx — бланки-образцы).
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { id } = await params

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { Contact: true, Deal: true },
    })

    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found", message: `Contract with id ${id} not found` },
        { status: 404 },
      )
    }

    const context = buildPackageContext({
      number: contract.number,
      amount: Number(contract.amount),
      date: contract.startDate ?? contract.createdAt,
      objectAddress: contract.Deal?.objectAddress ?? null,
      client: {
        type: contract.Contact.type,
        firstName: contract.Contact.firstName,
        lastName: contract.Contact.lastName,
        middleName: contract.Contact.middleName,
        companyName: contract.Contact.companyName,
        inn: contract.Contact.inn,
        kpp: contract.Contact.kpp,
        ogrn: contract.Contact.ogrn,
        phone: contract.Contact.phone,
        email: contract.Contact.email,
        registrationAddress: contract.Contact.registrationAddress,
        address: contract.Contact.address,
        passportSeries: contract.Contact.passportSeries,
        passportNumber: contract.Contact.passportNumber,
        passportIssuedBy: contract.Contact.passportIssuedBy,
        passportIssuedAt: contract.Contact.passportIssuedAt,
        passportCode: contract.Contact.passportCode,
      },
    })

    const files = renderDocumentPackage(context)

    // xlsx-бланки заполняются по карте ячеек
    const docsDir = path.resolve(process.cwd(), "..", "..", "documents")
    const orderFormPath = path.join(docsDir, "order_form_2026.xlsx")
    const specPath = path.join(docsDir, "specification_2026.xlsx")
    if (fs.existsSync(orderFormPath)) {
      files.push({
        filename: "Бланк-заказа.xlsx",
        buffer: fillOrderForm(fs.readFileSync(orderFormPath), context),
      })
    }
    if (fs.existsSync(specPath)) {
      files.push({
        filename: "Спецификация.xlsx",
        buffer: fillSpecification(fs.readFileSync(specPath), context),
      })
    }

    const zip = zipFiles(files)
    const filename = `Документы_${contract.number}.zip`

    return new Response(new Uint8Array(zip), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch (error) {
    console.error("Failed to generate document package:", error)
    return NextResponse.json(
      { error: "Failed to generate package", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
