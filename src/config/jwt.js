import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()
export function jwtAuth(req, res, next) {
    let token = req.headers.authorization
    token = token && token.split(' ')[1]

    if (!token)
        return res.status(401).json({
            code: 401,
            message: 'NOT OK',
            description: 'membutuhkan token jwt',
        })

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(401).json({
                code: 401,
                message: 'NOT OK',
                description: err.message,
            })
        }
        if (req.user.id !== user.id) {
            return res.status(401).json({
                code: 401,
                message: 'NOT OK',
                description: err.message,
            })
        }

        return next()
    })
}
