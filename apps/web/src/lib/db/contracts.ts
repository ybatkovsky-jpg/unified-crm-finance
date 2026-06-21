/**
 * ContractRepository - CRUD operations for Contract model
 *
 * Provides typed methods for Contract queries with soft-delete support.
 * Handles contract versions and signers.
 */

import { prisma } from './prisma';
import type {
  Contract,
  ContractVersion,
  ContractSigner,
  Prisma,
  Deal,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';

/**
 * Contract creation input type
 */
export type ContractCreateInput = Omit<Prisma.ContractUncheckedCreateInput, 'id' | 'number' | 'createdAt' | 'updatedAt'>;

/**
 * Contract update input type
 */
export type ContractUpdateInput = Prisma.ContractUncheckedUpdateInput;

/**
 * Contract findMany params type
 */
export type ContractFindManyParams = {
  where?: Prisma.ContractWhereInput;
  orderBy?: Prisma.ContractOrderByWithRelationInput;
  skip?: number;
  take?: number;
  include?: Prisma.ContractInclude;
};

/**
 * Repository for Contract CRUD operations
 */
export class ContractRepository {
  /**
   * Generate contract number in format Д-YYYY-NNNNN
   */
  private generateNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    return `Д-${year}-${random}`;
  }

  /**
   * Find many contracts with optional filtering
   * Automatically filters out soft-deleted records
   */
  async findMany(params?: ContractFindManyParams): Promise<Contract[]> {
    const { where, ...rest } = params ?? {};

    return prisma.contract.findMany({
      ...rest,
      where: {
        ...where,
        deletedAt: null, // Always exclude soft-deleted
      },
    });
  }

  /**
   * Find a single contract by ID
   * Returns null if not found or soft-deleted
   */
  async findUnique(
    id: string,
    include?: Prisma.ContractInclude
  ): Promise<Contract | null> {
    return prisma.contract.findFirst({
      where: { id, deletedAt: null },
      include,
    });
  }

  /**
   * Find contracts by contact
   */
  async findByContact(contactId: string): Promise<Contract[]> {
    return this.findMany({
      where: { contactId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find contract by deal ID
   */
  async findByDeal(dealId: string): Promise<Contract | null> {
    return prisma.contract.findFirst({
      where: { dealId, deletedAt: null },
    });
  }

  /**
   * Create a new contract
   * Generates UUID, number, and timestamps if not provided
   */
  async create(data: ContractCreateInput): Promise<Contract> {
    const now = new Date();

    return prisma.contract.create({
      data: {
        ...data,
        id: data.id ?? randomUUID(),
        number: data.number ?? this.generateNumber(),
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
      },
    });
  }

  /**
   * Update an existing contract
   * Throws RecordNotFound if contract doesn't exist or is soft-deleted
   */
  async update(
    id: string,
    data: ContractUpdateInput
  ): Promise<Contract> {
    // Verify contract exists and not deleted
    const existing = await this.findUnique(id);
    if (!existing) {
      throw new Error(`Contract with id ${id} not found`);
    }

    return prisma.contract.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete a contract by setting deletedAt timestamp
   */
  async softDelete(id: string): Promise<Contract> {
    const existing = await this.findUnique(id);
    if (!existing) {
      throw new Error(`Contract with id ${id} not found`);
    }

    return prisma.contract.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Count contracts matching criteria (excluding soft-deleted)
   */
  async count(where?: Prisma.ContractWhereInput): Promise<number> {
    return prisma.contract.count({
      where: {
        ...where,
        deletedAt: null,
      },
    });
  }

  /**
   * Add a version to a contract
   */
  async addVersion(
    contractId: string,
    contentMd: string,
    createdBy: string,
    generatedPdfFileId?: string
  ): Promise<ContractVersion> {
    // Get next version number
    const latestVersion = await prisma.contractVersion.findFirst({
      where: { contractId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (latestVersion?.version ?? 0) + 1;

    return prisma.contractVersion.create({
      data: {
        id: randomUUID(),
        contractId,
        version: nextVersion,
        contentMd,
        generatedPdfFileId,
        createdBy,
        createdAt: new Date(),
      },
    });
  }

  /**
   * Get all versions of a contract
   */
  async getVersions(contractId: string): Promise<ContractVersion[]> {
    return prisma.contractVersion.findMany({
      where: { contractId },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * Add a signer to a contract
   */
  async addSigner(
    contractId: string,
    name: string,
    position?: string,
    signatureFileId?: string
  ): Promise<ContractSigner> {
    return prisma.contractSigner.create({
      data: {
        id: randomUUID(),
        contractId,
        name,
        position,
        signatureFileId,
      },
    });
  }

  /**
   * Get all signers of a contract
   */
  async getSigners(contractId: string): Promise<ContractSigner[]> {
    return prisma.contractSigner.findMany({
      where: { contractId },
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Convert a deal to a contract
   * Creates a contract from deal data and links them
   */
  async convertFromDeal(
    dealId: string,
    additionalData?: Partial<ContractCreateInput>
  ): Promise<Contract> {
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, deletedAt: null },
      include: { contact: true },
    });

    if (!deal) {
      throw new Error(`Deal with id ${dealId} not found`);
    }

    // Check if contract already exists
    const existing = await this.findByDeal(dealId);
    if (existing) {
      throw new Error(`Contract already exists for deal ${dealId}`);
    }

    // Create contract from deal
    const contract = await this.create({
      dealId,
      contactId: deal.contactId || undefined,
      title: `Договор: ${deal.title}`,
      amount: deal.amount,
      currency: deal.currency,
      description: deal.description || undefined,
      status: 'draft',
      ...additionalData,
    });

    // Update deal with contractId
    await prisma.deal.update({
      where: { id: dealId },
      data: { contractId: contract.id },
    });

    return contract;
  }
}

/**
 * Singleton instance for use across the application
 */
export const contracts = new ContractRepository();

export default contracts;
