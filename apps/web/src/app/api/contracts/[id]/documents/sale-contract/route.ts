import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { renderDocx, buildSaleContractContext } from "@/server/documents/generator"

export const dynamic = "force-dynamic"

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/contracts/[id]/documents/sale-contract
 * Генерирует Договор купли-продажи (.docx) по данным договора и контакта.
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { id } = await params

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { Contact: true },
    })

    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found", message: `Contract with id ${id} not found` },
        { status: 404 },
      )
    }

    const amount = Number(contract.amount)
    const context = buildSaleContractContext({
      number: contract.number,
      amount,
      date: contract.startDate ?? contract.createdAt,
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
        registrationAddress: contract.Contact.registrationAddress,
        address: contract.Contact.address,
        passportSeries: contract.Contact.passportSeries,
        passportNumber: contract.Contact.passportNumber,
        passportIssuedBy: contract.Contact.passportIssuedBy,
        passportIssuedAt: contract.Contact.passportIssuedAt,
        passportCode: contract.Contact.passportCode,
      },
    })

    const buffer = renderDocx("sale_contract_2026.docx", context)

    const filename = `Договор_${contract.number}.docx`
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch (error) {
    console.error("Failed to generate sale contract:", error)
    return NextResponse.json(
      { error: "Failed to generate document", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
