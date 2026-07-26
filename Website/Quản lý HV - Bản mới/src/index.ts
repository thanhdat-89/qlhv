import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import authRoutes from './routes/auth'
import studentRoutes from './routes/students'
import parentRoutes from './routes/parents'
import subjectRoutes from './routes/subjects'
import classRoutes from './routes/classes'
import scheduleRoutes from './routes/schedules'
import sessionRoutes from './routes/sessions'
import attendanceRoutes from './routes/attendance'
import tuitionRoutes from './routes/tuition'
import teacherRoutes from './routes/teachers'
import dashboardRoutes from './routes/dashboard'
import { notificationRouter, webhookRouter } from './routes/notifications'

import { errorHandler, notFound } from './middleware/errorHandler'

const app = express()
const PORT = process.env.PORT || 3000

// ─── Middleware ────────────────────────────────────────────────
app.use(helmet())
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth',       authRoutes)
app.use('/api/dashboard',  dashboardRoutes)
app.use('/api/students',   studentRoutes)
app.use('/api/parents',    parentRoutes)
app.use('/api/subjects',   subjectRoutes)
app.use('/api/classes',    classRoutes)
app.use('/api/schedules',  scheduleRoutes)
app.use('/api/sessions',   sessionRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/tuition',    tuitionRoutes)
app.use('/api/teachers',       teacherRoutes)
app.use('/api/notifications',  notificationRouter)
app.use('/api/zalo',           webhookRouter)

// ─── Error handlers ───────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// Chỉ listen khi chạy local (không phải Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại http://localhost:${PORT}`)
  })
}

export default app
