/**
 * CommercialOfferRepository — CRUD для коммерческих предложений (КП).
 */
import { prisma } from './prisma'
import type { CommercialOffer, Prisma } from '@prisma/client'
import { randomUUID } from 'node:crypto'

export type CommercialOfferCreateInput = Omit<
  Prisma.CommercialOfferUncheckedCreateInput,
  'id' | 'updatedAt'
> &
  Partial<Pick<Prisma.CommercialOfferUncheckedCreateInput, 'id' | 'updatedAt'>>

export type CommercialOfferUpdateInput = Prisma.CommercialOfferUncheckedUpdateInput

export class CommercialOfferRepository {
  async findByDeal(dealId: string): Promise<CommercialOffer[]> {
    return prisma.commercialOffer.findMany({
      where: { dealId },
      orderBy: [{ version: 'desc' }],
    })
  }

  async findById(id: string): Promise<CommercialOffer | null> {
    return prisma.commercialOffer.findUnique({ where: { id } })
  }

  async create(data: CommercialOfferCreateInput): Promise<CommercialOffer> {
    return prisma.commercialOffer.create({
      data: { ...data, id: data.id ?? randomUUID(), updatedAt: data.updatedAt ?? new Date() },
    })
  }

  async update(id: string, data: CommercialOfferUpdateInput): Promise<CommercialOffer> {
    const existing = await this.findById(id)
    if (!existing) throw new Error(`CommercialOffer with id ${id} not found`)
    return prisma.commercialOffer.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    })
  }

  async delete(id: string): Promise<CommercialOffer> {
    const existing = await this.findById(id)
    if (!existing) throw new Error(`CommercialOffer with id ${id} not found`)
    return prisma.commercialOffer.delete({ where: { id } })
  }
}

export const offers = new CommercialOfferRepository()
export default offers
