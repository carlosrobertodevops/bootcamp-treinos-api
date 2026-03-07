// Import the framework and instantiate it
import 'dotenv/config'

import Fastify from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { z } from 'zod'
const app = Fastify({
  logger: true,
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

// app.get('/', async function handler() {
//   return { hello: 'Hello World' }
// })

app.withTypeProvider<ZodTypeProvider>().route({
  method: 'GET',
  url: '/',

  schema: {
    description: 'Hello World',
    tags: ['hello-world'],
    response: {
      200: z.object({
        message: z.string(),
      }),
    },
  },
  handler: () => {
    return { message: 'Hello World' }
  },
})

try {
  await app.listen({ port: Number(process.env.PORT) || 3000 })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
