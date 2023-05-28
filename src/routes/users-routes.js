import express from 'express'
import passport from 'passport'

const router = express.Router()

router.post('/login', passport.authenticate('local'), (err,req,res,next) => {
    if(err) return res.status(401).json({
        code: 401,
        message: "NOT OK",
        description: err
    })
}, (req,res) => {
    return res.status(200).json({
        code: 200,
        message: "OK",
        description: 'Berhasil Login'
    })
})

export default router