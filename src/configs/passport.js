import bcrypt from 'bcrypt'
import { Strategy } from "passport-local";
import Users from '../database/models/Users-model.js'

const unauthorizeMessage = {
    code: 401, message: 'NOT OK'
}

export const initializePassport = (passport) => {
    passport.use(new Strategy({usernameField: 'username'}, async (username, password, done) => {
        const user = await Users.findOne({where: {username}, raw: true})
        if(!user) return done({...unauthorizeMessage, description: 'Username tidak terdaftar'}, false)
        if(!(await bcrypt.compare(password, user.password))) return done({...unauthorizeMessage, description: 'Password invalid'}, false)
        done(null, user)
    }))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser( async (id, done) => {
        const user = await Users.findByPk(id, {raw: true})
        if(!user) return done({...unauthorizeMessage, description: 'User invalid'}, false)
        return done(null, user)
    })
}

export const isAuthenticated = (req,res,next) => {
    if(req.isAuthenticated()) return next()
    return res.status(401).json({...unauthorizeMessage, description: 'User is not authenticated'})
}