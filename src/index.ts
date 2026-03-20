import 'dotenv/config'

import fastifyCors from '@fastify/cors'
import { fastifySwagger } from '@fastify/swagger'
import fastifyApiReference from '@scalar/fastify-api-reference'
import Fastify from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'

import { auth } from './lib/auth.js'

const app = Fastify({
  logger: true,
})

const SERVER_URL = process.env.SERVER_URL
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL

if (!SERVER_URL) {
  throw new Error('SERVER_URL environment variable is not defined')
}

await app.register(fastifySwagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Bootcamp Treinos API',
      description: 'API para o Bootcamp Treinos do FSC',
      version: '1.0.0',
    },
    servers: [
      {
        url: SERVER_URL,
        description: 'Localhost server',
      },
    ],
  },
  transform: jsonSchemaTransform,
})

// await app.register(fastifySwaggerUi, {
//   routePrefix: '/docs',
// })

await app.register(fastifyApiReference, {
  routePrefix: '/docs',
  configuration: {
    sources: [
      {
        title: 'Bootcamp Treinos API',
        slug: 'bootcamp-treinos-api',
        url: '/swagger.json',
      },
      {
        title: 'Auth API',
        slug: 'auth-api',
        url: '/api/auth/open-api/generate-schema',
      },
    ],
  },
})

if (!BETTER_AUTH_URL) {
  throw new Error('BETTER_AUTH_URL environment variable is not defined')
}

await app.register(fastifyCors, {
  origin: [BETTER_AUTH_URL],
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.withTypeProvider<ZodTypeProvider>().route({
  method: 'GET',
  url: '/swagger.json',
  schema: {
    hide: true,
  },
  handler: async () => {
    return app.swagger()
  },
})

app.route({
  method: ['GET', 'POST'],
  url: '/api/auth/*',
  async handler(request, reply) {
    try {
      // Construct request URL
      const url = new URL(request.url, `http://${request.headers.host}`)

      // Convert Fastify headers to standard Headers object
      const headers = new Headers()
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) headers.append(key, value.toString())
      })
      // Create Fetch API-compatible request
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      })
      // Process authentication request
      const response = await auth.handler(req)
      // Forward response to client
      reply.status(response.status)
      response.headers.forEach((value, key) => reply.header(key, value))
      reply.send(response.body ? await response.text() : null)
    } catch (error) {
      app.log.error(error)
      reply.status(500).send({
        error: 'Internal authentication error',
        code: 'AUTH_FAILURE',
      })
    }
  },
})

try {
  await app.listen({ port: Number(process.env.PORT) || 3000 })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
