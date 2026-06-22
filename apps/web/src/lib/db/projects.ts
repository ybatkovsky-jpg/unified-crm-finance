/**
 * ProjectRepository - CRUD operations for Project model
 *
 * Provides typed methods for Project queries with soft-delete support.
 * Handles Project stage transitions and member management.
 */

import { prisma } from './prisma';
import type {
  Project,
  ProjectMember,
  ProjectStage,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';

/**
 * Project creation input type
 */
export type ProjectCreateInput = Omit<Prisma.ProjectUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Project update input type
 */
export type ProjectUpdateInput = Prisma.ProjectUncheckedUpdateInput;

/**
 * Project findMany params type
 */
export type ProjectFindManyParams = {
  where?: Prisma.ProjectWhereInput;
  orderBy?: Prisma.ProjectOrderByWithRelationInput;
  skip?: number;
  take?: number;
  include?: Prisma.ProjectInclude;
};

/**
 * Repository for Project CRUD operations
 */
export class ProjectRepository {
  /**
   * Find many projects with optional filtering
   * Automatically filters out soft-deleted records
   */
  async findMany(params?: ProjectFindManyParams): Promise<Project[]> {
    const { where, ...rest } = params ?? {};

    return prisma.project.findMany({
      ...rest,
      where: {
        ...where,
        deletedAt: null, // Always exclude soft-deleted
      },
    });
  }

  /**
   * Find a single project by ID
   * Returns null if not found or soft-deleted
   */
  async findUnique(
    id: string,
    include?: Prisma.ProjectInclude
  ): Promise<Project | null> {
    return prisma.project.findFirst({
      where: { id, deletedAt: null },
      include,
    });
  }

  /**
   * Find projects by status
   */
  async findByStatus(status: string): Promise<Project[]> {
    return this.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find projects by manager (owner)
   */
  async findByManager(managerId: string): Promise<Project[]> {
    return this.findMany({
      where: { managerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find projects by contact
   */
  async findByContact(contactId: string): Promise<Project[]> {
    return this.findMany({
      where: { contactId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find projects by deal
   */
  async findByDeal(dealId: string): Promise<Project[]> {
    return this.findMany({
      where: { dealId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new project
   * Generates UUID and timestamps if not provided
   */
  async create(data: ProjectCreateInput): Promise<Project> {
    const now = new Date();

    return prisma.project.create({
      data: {
        ...data,
        id: data.id ?? randomUUID(),
        externalNumber: data.externalNumber ?? this.generateExternalNumber(),
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
      },
    });
  }

  /**
   * Generate external project number in format PRJ-YYYY-NNNNN
   */
  private generateExternalNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    return `PRJ-${year}-${random}`;
  }

  /**
   * Update an existing project
   * Throws Error if project doesn't exist or is soft-deleted
   */
  async update(
    id: string,
    data: ProjectUpdateInput
  ): Promise<Project> {
    // Verify project exists and not deleted
    const existing = await this.findUnique(id);
    if (!existing) {
      throw new Error(`Project with id ${id} not found`);
    }

    return prisma.project.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete a project by setting deletedAt timestamp
   * Does NOT actually delete the record from database
   */
  async softDelete(id: string): Promise<Project> {
    // Verify project exists and not already deleted
    const existing = await this.findUnique(id);
    if (!existing) {
      throw new Error(`Project with id ${id} not found`);
    }

    return prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Count projects matching criteria (excluding soft-deleted)
   */
  async count(where?: Prisma.ProjectWhereInput): Promise<number> {
    return prisma.project.count({
      where: {
        ...where,
        deletedAt: null,
      },
    });
  }

  /**
   * Create a project stage
   */
  async createStage(
    projectId: string,
    data: Omit<Prisma.ProjectStageUncheckedCreateInput, 'id' | 'projectId'>
  ): Promise<ProjectStage> {
    return prisma.projectStage.create({
      data: {
        ...data,
        id: randomUUID(),
        projectId,
      },
    });
  }

  /**
   * Update a project stage
   */
  async updateStage(
    stageId: string,
    data: Prisma.ProjectStageUncheckedUpdateInput
  ): Promise<ProjectStage> {
    return prisma.projectStage.update({
      where: { id: stageId },
      data,
    });
  }

  /**
   * Find stages for a project
   */
  async findStages(projectId: string): Promise<ProjectStage[]> {
    return prisma.projectStage.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Add a member to a project
   */
  async addMember(
    projectId: string,
    userId: string,
    role: string = 'member'
  ): Promise<ProjectMember> {
    return prisma.projectMember.create({
      data: {
        id: randomUUID(),
        projectId,
        userId,
        role,
        joinedAt: new Date(),
      },
    });
  }

  /**
   * Remove a member from a project (sets leftAt timestamp)
   */
  async removeMember(projectId: string, userId: string): Promise<ProjectMember> {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!member) {
      throw new Error(`Member ${userId} not found in project ${projectId}`);
    }

    return prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { leftAt: new Date() },
    });
  }

  /**
   * Find members for a project
   */
  async findMembers(projectId: string): Promise<ProjectMember[]> {
    return prisma.projectMember.findMany({
      where: {
        projectId,
        leftAt: null, // Only active members
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}

/**
 * Singleton instance for use across the application
 */
export const projects = new ProjectRepository();

export default projects;
