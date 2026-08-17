import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import router from './router'

const app = new Hono()

// Middleware pour logger les requêtes
app.use('*', logger())

// Middleware pour sécuriser les en-têtes HTTP
app.use('*', secureHeaders())

// Middleware pour gérer le CORS
app.use('*', cors({
  origin: "*",
  credentials: true, 
}))

app.route('api/v1', router)

app.get('/ping', (c) => {
  return c.json({ 
    ok: true,
    message: 'pong!' })
})

export default app
