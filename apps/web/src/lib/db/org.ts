/**
 * OrgRepository — CRUD орг-структуры компании. PLAT-06.
 *
 * Иерархия: Department → OrgFunction → FunctionAssignment (User с ролью head/responsible).
 * Паттерн как TaskRepository: class-синглтон, FK-валидация, мягкое удаление,
 * ошибки из errors.ts (NotFoundError 404 / ValidationError 400 / ConflictError 409).
 *
 * Назначение: один человек может иметь несколько функций (несколько FunctionAssignment);
 * одна функция может иметь 1 head + N responsible.
 */

import { prisma } from './prisma'
import type { Department, OrgFunction, FunctionAssignment, Prisma } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import { NotFoundError, ValidationError, ConflictError } from './errors'

/** Роль назначения на функцию. */
export const ASSIGNMENT_ROLES = ['head', 'responsible'] as const
export type AssignmentRole = (typeof ASSIGNMENT_ROLES)[number]

export const ASSIGNMENT_ROLE_LABELS: Record<AssignmentRole, string> = {
  head: 'Руководитель',
  responsible: 'Ответственный',
}

/** Include для OrgFunction: отдел + назначения с юзерами. */
const FUNCTION_INCLUDE = {
  Department: { select: { id: true, name: true } },
  FunctionAssignment: {
    include: {
      User: { select: { id: true, name: true, email: true } },
    },
  },
} as const

// ── Department ───────────────────────────────────────────────────────

export class OrgRepository {
  // ===== DEPARTMENT =====

  /** Все отделы (с функциями), кроме удалённых. */
  async findDepartments(): Promise<(Department & { OrgFunction: (OrgFunction & {
    FunctionAssignment: FunctionAssignment[]
  })[] })[]> {
    return prisma.department.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        OrgFunction: {
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
          include: { FunctionAssignment: true },
        },
      },
    }) as any
  }

  async findDepartmentById(id: string): Promise<Department | null> {
    return prisma.department.findUnique({ where: { id } })
  }

  /** Создать отдел. name уникально (globally). */
  async createDepartment(data: { name: string; description?: string }): Promise<Department> {
    if (!data.name?.trim()) throw new ValidationError('Department name is required')
    const existing = await prisma.department.findUnique({ where: { name: data.name.trim() } })
    if (existing) throw new ConflictError(`Department "${data.name}" already exists`)
    return prisma.department.create({
      data: {
        id: randomUUID(),
        name: data.name.trim(),
        description: data.description ?? null,
        updatedAt: new Date(),
      },
    })
  }

  async updateDepartment(id: string, data: { name?: string; description?: string }): Promise<Department> {
    const dept = await prisma.department.findUnique({ where: { id } })
    if (!dept || dept.deletedAt) throw new NotFoundError(`Department ${id} not found`)

    if (data.name && data.name.trim() !== dept.name) {
      const dup = await prisma.department.findUnique({ where: { name: data.name.trim() } })
      if (dup && dup.id !== id) throw new ConflictError(`Department "${data.name}" already exists`)
    }

    return prisma.department.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description }),
        updatedAt: new Date(),
      },
    })
  }

  async deleteDepartment(id: string): Promise<void> {
    const dept = await prisma.department.findUnique({ where: { id } })
    if (!dept || dept.deletedAt) throw new NotFoundError(`Department ${id} not found`)
    // Мягкое удаление отдела + каскадно функций.
    await prisma.$transaction([
      prisma.department.update({ where: { id }, data: { deletedAt: new Date(), updatedAt: new Date() } }),
      prisma.orgFunction.updateMany({
        where: { departmentId: id, deletedAt: null },
        data: { deletedAt: new Date(), updatedAt: new Date() },
      }),
    ])
  }

  // ===== ORGFUNCTION =====

  /** Все функции (с отделом и назначениями), кроме удалённых. */
  async findFunctions(): Promise<(OrgFunction & {
    Department: { id: string; name: string }
    FunctionAssignment: (FunctionAssignment & { User: { id: string; name: string; email: string } })[]
  })[]> {
    const args: Prisma.OrgFunctionFindManyArgs = {
      where: { deletedAt: null },
      orderBy: [{ Department: { name: 'asc' } }, { name: 'asc' }],
      include: FUNCTION_INCLUDE,
    }
    return prisma.orgFunction.findMany(args) as any
  }

  async findFunctionById(id: string): Promise<any> {
    const args: Prisma.OrgFunctionFindUniqueArgs = {
      where: { id },
      include: FUNCTION_INCLUDE,
    }
    return prisma.orgFunction.findUnique(args)
  }

  /** Создать функцию в отделе. */
  async createFunction(data: {
    departmentId: string
    name: string
    description?: string
  }): Promise<OrgFunction> {
    if (!data.name?.trim()) throw new ValidationError('Function name is required')
    const dept = await prisma.department.findUnique({ where: { id: data.departmentId } })
    if (!dept || dept.deletedAt) throw new NotFoundError(`Department ${data.departmentId} not found`)

    // Уникальность имени в рамках отдела.
    const dup = await prisma.orgFunction.findUnique({
      where: { departmentId_name: { departmentId: data.departmentId, name: data.name.trim() } },
    })
    if (dup && !dup.deletedAt) {
      throw new ConflictError(`Function "${data.name}" already exists in department`)
    }

    return prisma.orgFunction.create({
      data: {
        id: randomUUID(),
        departmentId: data.departmentId,
        name: data.name.trim(),
        description: data.description ?? null,
        updatedAt: new Date(),
      },
    })
  }

  async updateFunction(id: string, data: { name?: string; description?: string }): Promise<OrgFunction> {
    const fn = await prisma.orgFunction.findUnique({ where: { id } })
    if (!fn || fn.deletedAt) throw new NotFoundError(`Function ${id} not found`)

    if (data.name && data.name.trim() !== fn.name) {
      const dup = await prisma.orgFunction.findUnique({
        where: { departmentId_name: { departmentId: fn.departmentId, name: data.name.trim() } },
      })
      if (dup && dup.id !== id) throw new ConflictError(`Function "${data.name}" already exists in department`)
    }

    return prisma.orgFunction.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description }),
        updatedAt: new Date(),
      },
    })
  }

  async deleteFunction(id: string): Promise<void> {
    const fn = await prisma.orgFunction.findUnique({ where: { id } })
    if (!fn || fn.deletedAt) throw new NotFoundError(`Function ${id} not found`)
    await prisma.orgFunction.update({
      where: { id },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    })
  }

  // ===== FUNCTIONASSIGNMENT =====

  /**
   * Назначить пользователя на функцию.
   * role: head (руководитель, видит все задачи функции) или responsible (исполнитель).
   * head — единственный на функцию (при назначении нового head старый снимается).
   */
  async assignUser(data: {
    functionId: string
    userId: string
    role: AssignmentRole
  }): Promise<FunctionAssignment> {
    if (!ASSIGNMENT_ROLES.includes(data.role)) {
      throw new ValidationError(`Invalid assignment role: ${data.role}`)
    }
    const fn = await prisma.orgFunction.findUnique({ where: { id: data.functionId } })
    if (!fn || fn.deletedAt) throw new NotFoundError(`Function ${data.functionId} not found`)
    const user = await prisma.user.findUnique({ where: { id: data.userId } })
    if (!user || user.deletedAt) throw new NotFoundError(`User ${data.userId} not found`)

    // head — единственный: снять предыдущего head.
    if (data.role === 'head') {
      await prisma.functionAssignment.deleteMany({
        where: { functionId: data.functionId, role: 'head' },
      })
    }

    // Если responsible-назначение этого юзера уже есть — конфликт (no-op не делаем, явная ошибка).
    const existing = await prisma.functionAssignment.findUnique({
      where: {
        functionId_userId_role: {
          functionId: data.functionId,
          userId: data.userId,
          role: data.role,
        },
      },
    })
    if (existing) {
      throw new ConflictError(`${user.name} already assigned as ${data.role} to this function`)
    }

    return prisma.functionAssignment.create({
      data: {
        id: randomUUID(),
        functionId: data.functionId,
        userId: data.userId,
        role: data.role,
      },
      include: { User: { select: { id: true, name: true, email: true } } },
    })
  }

  /** Снять назначение. */
  async unassign(id: string): Promise<void> {
    const a = await prisma.functionAssignment.findUnique({ where: { id } })
    if (!a) throw new NotFoundError(`Assignment ${id} not found`)
    await prisma.functionAssignment.delete({ where: { id } })
  }

  /**
   * Функции, в которых участвует пользователь (для RBAC-видимости задач).
   * Возвращает массив functionId с указанием роли.
   */
  async findFunctionsForUser(userId: string): Promise<{ functionId: string; role: AssignmentRole }[]> {
    const rows = await prisma.functionAssignment.findMany({
      where: { userId },
      select: { functionId: true, role: true },
    })
    return rows as { functionId: string; role: AssignmentRole }[]
  }
}

/** Singleton instance */
export const org = new OrgRepository()
export default org
