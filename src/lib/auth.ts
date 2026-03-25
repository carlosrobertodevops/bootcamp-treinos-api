import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { openAPI } from 'better-auth/plugins'

import { prisma } from './db.js'

const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL

if (!BETTER_AUTH_URL) {
  throw new Error('BETTER_AUTH_URL environment variable is not defined')
}

export const auth = betterAuth({
  trustedOrigins: [BETTER_AUTH_URL],
  emailAndPassword: {
    enabled: true,
  },
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  plugins: [openAPI()],
})
