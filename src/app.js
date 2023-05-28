import express from 'express'
import cors from 'cors'
import passport from 'passport'
import session from 'express-session'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import dotenv from 'dotenv'
import sessionStore from './configs/session-store'
import  { initializePassport } from './configs/passport'

const app = express()
const limiter = rateLimit({
    windowMs: 1000 * 60 * 10,
    max: 300,
    message: 'Terlalu banyak melakukan permintaan, coba lagi nanti',
})
dotenv.config()

app.use(limiter)
app.use(helmet())
app.use(express.json())
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['POST','DELETE','PATCH','PUT'],
    credentials: true
}))
app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    store: sessionStore(session)
}))
app.use(passport.initialize())
app.use(passport.session())
initializePassport(passport)

app.use('/api/users', usersRoutes)

export default app