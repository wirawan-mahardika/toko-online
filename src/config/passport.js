import bcrypt from 'bcrypt'
import { Strategy } from 'passport-local'
import { prismaClient } from '../database/prisma-client.js'

const unauthorizeMessage = {
    code: 401,
    message: 'NOT OK',
}

export const initializePassport = (passport) => {
    passport.use(
        new Strategy(
            { usernameField: 'username' },
            async (username, password, done) => {
                const user = await prismaClient.users.findFirst({
                    where: {
                        username,
                    },
                })
                if (!user)
                    return done(
                        {
                            ...unauthorizeMessage,
                            description: 'Username tidak terdaftar',
                        },
                        false
                    )
                if (!(await bcrypt.compare(password, user.password)))
                    return done(
                        {
                            ...unauthorizeMessage,
                            description: 'Password invalid',
                        },
                        false
                    )
                done(null, user)
            }
        )
    )
    passport.serializeUser((user, done) => done(null, user.id_user))
    passport.deserializeUser(async (id, done) => {
        const user = await prismaClient.users.findUnique({
            where: {
                id_user: id,
            },
        })
        if (!user) {
            return done(
                { ...unauthorizeMessage, description: 'User invalid' },
                false
            )
        }

        delete user.password
        return done(null, user)
    })
}

export const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next()
    return res
        .status(401)
        .json({
            ...unauthorizeMessage,
            description: 'User is not authenticated',
        })
}

export const ensureAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) return next()
    return res
        .status(401)
        .json({ ...unauthorizeMessage, description: 'Anda sudah login' })
}
