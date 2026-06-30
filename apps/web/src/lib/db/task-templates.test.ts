/**
 * TaskTemplateRepository tests — материализация инстансов. PLAT-06.
 *
 * node:test + tsx, реальная БД. Главное: идемпотентность материализации (повторный
 * вызов не дублирует инстансы), резолв assignee по стратегии, горизонт (только <= now),
 * разовый шаблон → один инстанс.
 * Запуск: npx tsx --test src/lib/db/task-templates.test.ts
 */

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { taskTemplates } from './task-templates.js'
import { prisma } from './prisma.js'
import { ValidationError } from './errors.js'

const TEST = 't-tpl-'

describe('TaskTemplateRepository', { concurrency: false }, () => {
  let userId: string
  let functionId: string

  before(async () => {
    // Cleanup.
    await prisma.task.deleteMany({ where: { title: { startsWith: TEST } } })
    await prisma.taskTemplate.deleteMany({ where: { title: { startsWith: TEST } } })
    await prisma.functionAssignment.deleteMany({ where: { userId: { startsWith: TEST } } })
    await prisma.orgFunction.deleteMany({ where: { name: { startsWith: TEST } } })
    await prisma.department.deleteMany({ where: { name: { startsWith: TEST } } })
    await prisma.user.deleteMany({ where: { id: { startsWith: TEST } } })

    // User + department + function + responsible-assignment.
    userId = `${TEST}user`
    await prisma.user.create({
      data: { id: userId, email: `${TEST}u@local`, name: 'Тест Ответственный', passwordHash: 'x', updatedAt: new Date() },
    })
    const dept = await prisma.department.create({
      data: { id: `${TEST}dept`, name: `${TEST}Финансы`, updatedAt: new Date() },
    })
    const fn = await prisma.orgFunction.create({
      data: { id: `${TEST}fn`, departmentId: dept.id, name: `${TEST}Налоги`, updatedAt: new Date() },
    })
    functionId = fn.id
    await prisma.functionAssignment.create({
      data: { id: `${TEST}fa`, functionId, userId, role: 'responsible' },
    })
  })

  after(async () => {
    await prisma.task.deleteMany({ where: { title: { startsWith: TEST } } })
    await prisma.taskTemplate.deleteMany({ where: { title: { startsWith: TEST } } })
    await prisma.functionAssignment.deleteMany({ where: { userId: { startsWith: TEST } } })
    await prisma.orgFunction.deleteMany({ where: { name: { startsWith: TEST } } })
    await prisma.department.deleteMany({ where: { name: { startsWith: TEST } } })
    await prisma.user.deleteMany({ where: { id: { startsWith: TEST } } })
  })

  it('создаёт валидный повторяющийся шаблон', async () => {
    const t = await taskTemplates.create({
      functionId,
      title: `${TEST}Шаблон 1`,
      rrule: 'FREQ=MONTHLY;BYMONTHDAY=25',
      dtStart: new Date('2020-01-25'),
      createdBy: userId,
    })
    assert.ok(t.id)
    assert.strictEqual(t.assigneeStrategy, 'function_responsible')
  })

  it('отклоняет невалидный RRULE', async () => {
    await assert.rejects(
      () => taskTemplates.create({
        functionId,
        title: `${TEST}Плохой`,
        rrule: 'GARBAGE',
        dtStart: new Date('2020-01-25'),
        createdBy: userId,
      }),
      (e: any) => e instanceof ValidationError
    )
  })

  it('требует fixedAssigneeId при strategy=fixed', async () => {
    await assert.rejects(
      () => taskTemplates.create({
        functionId,
        title: `${TEST}Без исполнителя`,
        rrule: 'FREQ=MONTHLY',
        dtStart: new Date('2020-01-25'),
        assigneeStrategy: 'fixed',
        createdBy: userId,
      }),
      (e: any) => e instanceof ValidationError
    )
  })

  it('материализует инстансы за прошлые даты (<= now)', async () => {
    // Шаблон: каждый месяц с 2020-01-25. К now (2026) — десятки инстансов.
    const t = await taskTemplates.create({
      functionId,
      title: `${TEST}Налоги ежемесячно`,
      rrule: 'FREQ=MONTHLY;BYMONTHDAY=25',
      dtStart: new Date('2020-01-25'),
      createdBy: userId,
    })

    const created1 = await taskTemplates.materializeInstances()
    assert.ok(created1 > 0, `expected >0 instances, got ${created1}`)

    // Все инстансы этого шаблона.
    const instances = await prisma.task.findMany({ where: { templateId: t.id } })
    assert.ok(instances.length > 0)
    // Все имеют type='org' и assignee = responsible функции.
    assert.ok(instances.every((i) => i.type === 'org'))
    assert.ok(instances.every((i) => i.assigneeId === userId))
    // Все plannedDate <= now.
    const now = Date.now()
    assert.ok(instances.every((i) => i.plannedDate!.getTime() <= now + 1000))
  })

  it('идемпотентен: повторная материализация не дублирует', async () => {
    const t = await taskTemplates.create({
      functionId,
      title: `${TEST}Аренда`,
      rrule: 'FREQ=MONTHLY;BYMONTHDAY=1',
      dtStart: new Date('2020-01-01'),
      createdBy: userId,
    })
    const c1 = await taskTemplates.materializeInstances()
    const after1 = await prisma.task.count({ where: { templateId: t.id } })

    const c2 = await taskTemplates.materializeInstances()
    const after2 = await prisma.task.count({ where: { templateId: t.id } })

    // Второй вызов не должен был создать новых инстансов этого шаблона.
    assert.strictEqual(after2, after1)
    // c2 может быть >0 из-за ДРУГИХ шаблонов в этом тесте, но для t — стабильно.
  })

  it('не материализует будущие инстансы (горизонт = now)', async () => {
    // dtStart в будущем — инстансов пока нет.
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)
    const t = await taskTemplates.create({
      functionId,
      title: `${TEST}Будущее`,
      rrule: 'FREQ=MONTHLY;BYMONTHDAY=15',
      dtStart: future,
      createdBy: userId,
    })
    await taskTemplates.materializeInstances()
    const instances = await prisma.task.count({ where: { templateId: t.id } })
    assert.strictEqual(instances, 0, 'future template must not materialize')
  })

  it('разовый шаблон создаёт один инстанс', async () => {
    const t = await taskTemplates.create({
      functionId,
      title: `${TEST}Разовая задача`,
      rrule: null,
      dtStart: new Date('2020-06-01'),
      createdBy: userId,
    })
    await taskTemplates.createOneTimeInstance(t.id)
    const instances = await prisma.task.findMany({ where: { templateId: t.id } })
    assert.strictEqual(instances.length, 1)
    assert.strictEqual(instances[0].type, 'org')
    assert.strictEqual(instances[0].assigneeId, userId)
  })

  it('мягко удаляет шаблон', async () => {
    const t = await taskTemplates.create({
      functionId,
      title: `${TEST}Удалить шаблон`,
      rrule: 'FREQ=YEARLY',
      dtStart: new Date('2020-01-01'),
      createdBy: userId,
    })
    await taskTemplates.softDelete(t.id)
    const after = await prisma.taskTemplate.findUnique({ where: { id: t.id } })
    assert.ok(after?.deletedAt)
  })
})
