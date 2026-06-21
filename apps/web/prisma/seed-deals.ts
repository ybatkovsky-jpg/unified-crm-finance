/**
 * Seed script for Pipeline and DealStage
 *
 * Creates a default pipeline with 8 stages:
 * new -> qualified -> meeting -> proposal -> negotiation -> contract -> won/lost
 *
 * Run: npx tsx prisma/seed-deals.ts
 */

import { prisma } from '../src/lib/db/prisma';

const STAGES = [
  { code: 'new', name: 'Новый', order: 1, probability: 10, color: '#94a3b8' },
  { code: 'qualified', name: 'Квалифицирован', order: 2, probability: 30, color: '#60a5fa' },
  { code: 'meeting', name: 'Встреча назначена', order: 3, probability: 50, color: '#3b82f6' },
  { code: 'proposal', name: 'КП отправлено', order: 4, probability: 60, color: '#8b5cf6' },
  { code: 'negotiation', name: 'Переговоры', order: 5, probability: 70, color: '#f59e0b' },
  { code: 'contract', name: 'Договор', order: 6, probability: 90, color: '#10b981' },
  { code: 'won', name: 'Выиграно', order: 7, probability: 100, color: '#22c55e', isWonStage: true },
  { code: 'lost', name: 'Проиграно', order: 8, probability: 0, color: '#ef4444', isLostStage: true },
];

async function seedDeals() {
  console.log('Seeding Pipeline and DealStage...');

  // Check if default pipeline already exists
  const existing = await prisma.pipeline.findUnique({
    where: { code: 'default' },
  });

  if (existing) {
    console.log('Default pipeline already exists, skipping seed.');
    return;
  }

  // Create default pipeline
  const pipeline = await prisma.pipeline.create({
    data: {
      id: 'default-pipeline-id',
      code: 'default',
      name: 'Основная воронка',
      description: 'Стандартная воронка продаж',
      isActive: true,
      createdAt: new Date(),
    },
  });

  console.log(`Created pipeline: ${pipeline.code} - ${pipeline.name}`);

  // Create stages
  for (const stage of STAGES) {
    await prisma.dealStage.create({
      data: {
        id: `${pipeline.code}-${stage.code}-stage-id`,
        pipelineId: pipeline.id,
        code: stage.code,
        name: stage.name,
        order: stage.order,
        probability: stage.probability,
        color: stage.color,
        isWonStage: stage.isWonStage ?? false,
        isLostStage: stage.isLostStage ?? false,
      },
    });
    console.log(`  Created stage: ${stage.order}. ${stage.name} (${stage.code})`);
  }

  console.log('Seed completed successfully!');
}

seedDeals()
  .catch((error) => {
    console.error('Error seeding deals:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
