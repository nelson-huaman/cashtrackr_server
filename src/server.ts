import express from 'express'
import morgan from 'morgan'
import { connectDB } from './config/db'
import budgetRouter from './routes/budgetRouter'
import authRouter from './routes/authRouter'

connectDB()

const app = express()

app.use(morgan('dev'))

app.use(express.json())

app.use('/api/budgets', budgetRouter)
app.use('/api/auth', authRouter)

export default app

// 943089766 =< noiemi lopez