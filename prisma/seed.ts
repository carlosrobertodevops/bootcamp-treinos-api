import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient, WeekDay } from '../src/generated/prisma/client'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL não definida.')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.workoutSession.deleteMany()
  await prisma.workoutExercise.deleteMany()
  await prisma.workoutDay.deleteMany()
  await prisma.workoutPlan.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.verification.deleteMany()
  await prisma.user.deleteMany()

  const user = await prisma.user.create({
    data: {
      id: 'user_01',
      name: 'Carlos Roberto',
      email: 'carlos@example.com',
      emailVerified: true,
      image: 'https://via.placeholder.com/300x300.png?text=Carlos',
      weightInGrams: 82500,
      heightInCentimeters: 178,
      age: 32,
      bodyFatPercentage: 18,
      accounts: {
        create: [
          {
            id: 'account_01',
            accountId: 'google-account-id-01',
            providerId: 'google',
            accessToken: 'mock_access_token',
            refreshToken: 'mock_refresh_token',
            scope: 'openid profile email',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
      sessions: {
        create: [
          {
            id: 'session_01',
            token: 'session-token-01',
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
            ipAddress: '127.0.0.1',
            userAgent: 'seed-script',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
      workoutPlans: {
        create: [
          {
            id: 'plan_01',
            name: 'Plano Hipertrofia A/B',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            workoutDays: {
              create: [
                {
                  id: 'day_01',
                  name: 'Treino A - Peito e Tríceps',
                  isRest: false,
                  weekDay: WeekDay.MONDAY,
                  estimatedDurationInSeconds: 3600,
                  coverImageUrl:
                    'https://via.placeholder.com/1200x630.png?text=Treino+A',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  exercises: {
                    create: [
                      {
                        id: 'exercise_01',
                        name: 'Supino reto com barra',
                        order: 1,
                        sets: 4,
                        reps: 10,
                        restTimeInSeconds: 90,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      },
                      {
                        id: 'exercise_02',
                        name: 'Supino inclinado com halteres',
                        order: 2,
                        sets: 4,
                        reps: 12,
                        restTimeInSeconds: 90,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      },
                    ],
                  },
                  sessions: {
                    create: [
                      {
                        id: 'workout_session_01',
                        startedAt: new Date('2026-03-10T18:00:00.000Z'),
                        completedAt: new Date('2026-03-10T19:00:00.000Z'),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      },
                    ],
                  },
                },
                {
                  id: 'day_02',
                  name: 'Treino B - Costas e Bíceps',
                  isRest: false,
                  weekDay: WeekDay.WEDNESDAY,
                  estimatedDurationInSeconds: 3900,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  exercises: {
                    create: [
                      {
                        id: 'exercise_03',
                        name: 'Puxada frontal',
                        order: 1,
                        sets: 4,
                        reps: 10,
                        restTimeInSeconds: 90,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  })

  await prisma.verification.create({
    data: {
      id: 'verification_01',
      identifier: user.email,
      value: '123456',
      expiresAt: new Date(Date.now() + 1000 * 60 * 15),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  console.log('Seed executado com sucesso.')
}

main()
  .catch((error) => {
    console.error('Erro ao executar seed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
