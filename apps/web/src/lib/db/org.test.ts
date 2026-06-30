/**
 * OrgRepository tests — CRUD отделов/функций/назначений. PLAT-06.
 *
 * node:test + tsx, реальная БД (dev.db). Фикстуры по префиксу TEST, cleanup в before.
 * Запуск: npx tsx --test src/lib/db/org.test.ts
 */

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { org } from './org.js'
import { prisma } from './prisma.js'
import { NotFoundError, ConflictError, ValidationError } from './errors.js'

const TEST = 't-org-'

describe('OrgRepository', { concurrency: false }, () => {
  let deptId: string
  let fnId: string
  let userId: string
  let userId2: string

  before(async () => {
    // Cleanup leftover test data.
    await prisma.functionAssignment.deleteMany({ where: { userId: { startsWith: TEST } } })
    await prisma.taskTemplate.deleteMany({ where: { createdBy: { startsWith: TEST } } })
    await prisma.orgFunction.deleteMany({ where: { name: { startsWith: TEST } } })
    await prisma.department.deleteMany({ where: { name: { startsWith: TEST } } })
    await prisma.user.deleteMany({ where: { id: { startsWith: TEST } } })

    // Test users.
    userId = `${TEST}user1`
    userId2 = `${TEST}user2`
    await prisma.user.createMany({
      data: [
        { id: userId, email: `${TEST}u1@local`, name: 'Тест Юзер 1', passwordHash: 'x', updatedAt: new Date() },
        { id: userId2, email: `${TEST}u2@local`, name: 'Тест Юзер 2', passwordHash: 'x', updatedAt: new Date() },
      ],
    })

    // Готовые фикстуры отдела и функции для тестов назначений (надёжнее, чем
    // полагаться на порядок выполнения вложенных describe-блоков).
    const d = await org.createDepartment({ name: `${TEST}Маркетинг`, description: 'Тест' })
    deptId = d.id
    const f = await org.createFunction({ departmentId: deptId, name: `${TEST}Реклама` })
    fnId = f.id
  })

  after(async () => {
    await prisma.functionAssignment.deleteMany({ where: { userId: { startsWith: TEST } } })
    await prisma.taskTemplate.deleteMany({ where: { createdBy: { startsWith: TEST } } })
    await prisma.orgFunction.deleteMany({ where: { name: { startsWith: TEST } } })
    await prisma.department.deleteMany({ where: { name: { startsWith: TEST } } })
    await prisma.user.deleteMany({ where: { id: { startsWith: TEST } } })
  })

  describe('Department', () => {
    it('создаёт отдел', async () => {
      const d = await org.createDepartment({ name: `${TEST}Продажи`, description: 'Тест' })
      assert.ok(d.id)
      assert.strictEqual(d.name, `${TEST}Продажи`)
    })

    it('запрещает дубликат имени отдела', async () => {
      // ${TEST}Маркетинг уже создан в before.
      await assert.rejects(
        () => org.createDepartment({ name: `${TEST}Маркетинг` }),
        (e: any) => e instanceof ConflictError
      )
    })

    it('валидирует пустое имя', async () => {
      await assert.rejects(
        () => org.createDepartment({ name: '  ' }),
        (e: any) => e instanceof ValidationError
      )
    })

    it('обновляет отдел', async () => {
      const d = await org.updateDepartment(deptId, { name: `${TEST}Маркетинг Про`, description: 'Обновлено' })
      assert.strictEqual(d.name, `${TEST}Маркетинг Про`)
      assert.strictEqual(d.description, 'Обновлено')
    })

    it('удаляет отдел (мягко)', async () => {
      const id = (await org.createDepartment({ name: `${TEST}Удалить` })).id
      await org.deleteDepartment(id)
      const d = await org.findDepartmentById(id)
      assert.ok(d?.deletedAt)
    })

    it('NotFoundError при обновлении несуществующего', async () => {
      await assert.rejects(
        () => org.updateDepartment('несуществует', { name: 'x' }),
        (e: any) => e instanceof NotFoundError
      )
    })
  })

  describe('OrgFunction', () => {
    it('создаёт функцию в отделе', async () => {
      const f = await org.createFunction({ departmentId: deptId, name: `${TEST}SMM` })
      assert.ok(f.id)
      assert.strictEqual(f.departmentId, deptId)
    })

    it('запрещает дубликат имени функции в отделе', async () => {
      // ${TEST}Реклама уже создан в before.
      await assert.rejects(
        () => org.createFunction({ departmentId: deptId, name: `${TEST}Реклама` }),
        (e: any) => e instanceof ConflictError
      )
    })

    it('NotFoundError при несуществующем отделе', async () => {
      await assert.rejects(
        () => org.createFunction({ departmentId: 'несуществует', name: `${TEST}x` }),
        (e: any) => e instanceof NotFoundError
      )
    })

    it('обновляет и удаляет функцию', async () => {
      const f = await org.createFunction({ departmentId: deptId, name: `${TEST}Старая` })
      const upd = await org.updateFunction(f.id, { name: `${TEST}Новая` })
      assert.strictEqual(upd.name, `${TEST}Новая`)
      await org.deleteFunction(f.id)
      const after = await prisma.orgFunction.findUnique({ where: { id: f.id } })
      assert.ok(after?.deletedAt)
    })
  })

  describe('FunctionAssignment', () => {
    it('назначает responsible на функцию', async () => {
      const a = await org.assignUser({ functionId: fnId, userId, role: 'responsible' })
      assert.strictEqual(a.userId, userId)
      assert.strictEqual(a.role, 'responsible')
    })

    it('назначает head на функцию (единственный)', async () => {
      // userId — уже responsible (из предыдущего теста). Назначаем его же head.
      const a1 = await org.assignUser({ functionId: fnId, userId, role: 'head' })
      assert.strictEqual(a1.role, 'head')
      // Назначаем userId2 как head — userId должен сняться (head единственный).
      const a2 = await org.assignUser({ functionId: fnId, userId: userId2, role: 'head' })
      assert.strictEqual(a2.userId, userId2)
      const heads = await prisma.functionAssignment.findMany({ where: { functionId: fnId, role: 'head' } })
      assert.strictEqual(heads.length, 1)
      assert.strictEqual(heads[0].userId, userId2)
    })

    it('запрещает дубликат responsible-назначения', async () => {
      // userId2 — новый responsible. Первое назначение ок, второе — конфликт.
      await org.assignUser({ functionId: fnId, userId: userId2, role: 'responsible' })
      await assert.rejects(
        () => org.assignUser({ functionId: fnId, userId: userId2, role: 'responsible' }),
        (e: any) => e instanceof ConflictError
      )
    })

    it('findFunctionsForUser возвращает роли пользователя', async () => {
      const fns = await org.findFunctionsForUser(userId2)
      assert.ok(fns.some((f) => f.functionId === fnId && f.role === 'head'))
    })

    it('снимает назначение', async () => {
      const a = await prisma.functionAssignment.findFirst({ where: { userId, role: 'responsible' } })
      assert.ok(a)
      await org.unassign(a!.id)
      const after = await prisma.functionAssignment.findUnique({ where: { id: a!.id } })
      assert.strictEqual(after, null)
    })
  })
})
