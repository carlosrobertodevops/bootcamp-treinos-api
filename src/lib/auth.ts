import { PrismaPg } from '@prisma/adapter-pg'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { openAPI } from 'better-auth/plugins'
import { PrismaClient } from './../generated/prisma/client.js'

const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined')
}

if (!BETTER_AUTH_URL) {
  throw new Error('BETTER_AUTH_URL environment variable is not defined')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

export const auth = betterAuth({
  trustedOrigins: [BETTER_AUTH_URL],
  emailAndPassword: {
    enabled: true,
  },
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  plugins: [openAPI()],
})
