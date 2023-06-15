import express from 'express'
import passport from 'passport'
import signupValidate from '../config/signupValidate.js'
import bcrypt from 'bcrypt'
import { prismaClient } from '../database/prisma-client.js'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import isImage from '../functions/mime-type-check.js'
import sharp from 'sharp'
import dotenv from 'dotenv'
import { ensureAuthenticated, isAuthenticated } from '../config/passport.js'
import nodemailer from 'nodemailer'
import { createOTP } from '../functions/create-otp.js'
import passwordStrengthTest from '../functions/pass-strength-test.js'
import { rateLimit } from 'express-rate-limit'

dotenv.config()
const limiter = rateLimit({
    windowMs: 1000 * 60 * 15,
    max: 5,
    message: 'Terlalu banyak melakukan percobaan login, coba lagi nanti',
})
const router = express.Router()

router.post(
    '/login',
    ensureAuthenticated,
    limiter,
    passport.authenticate('local'),
    (err, req, res, next) => {
        if (err) {
            return res.status(401).json(err)
        }
        return next()
    },
    (req, res) => {
        const token = jwt.sign(
            {
                username: req.user.username,
                email: req.user.email,
                id: req.user.id,
            },
            process.env.JWT_SECRET,
            { expiresIn: '30s', algorithm: 'HS512' }
        )

        const resfreshToken = jwt.sign(
            {
                username: req.user.username,
                email: req.user.email,
                id: req.user.id,
            },
            process.env.REFRESH_JWT_SECRET,
            { expiresIn: '7d', algorithm: 'HS512' }
        )

        res.cookie('refresh_token', resfreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            path: '/',
            maxAge: 1000 * 3600 * 24 * 7,
            signed: true,
        })

        return res.status(200).json({
            code: 200,
            message: 'OK',
            description: 'Berhasil Login',
            token,
        })
    }
)

router.post(
    '/signup',
    multer().single('photo_profile'),
    signupValidate,
    async (req, res) => {
        if (!isImage(req.file)) {
            return res.status(403).json({
                code: 403,
                message: 'NOT OK',
                description: 'Ekstensi file image tidak valid',
            })
        }
        const { password, username, email, fullname, phone } = req.body

        const salt = await bcrypt.genSalt(12)
        const hashPassword = await bcrypt.hash(password, salt)

        try {
            sharp(req.file.buffer).toBuffer(async (err, bufferFile) => {
                if (err) {
                    return res.status(403).json({
                        code: 403,
                        message: 'NOT OK',
                        description: 'Tidak berhasil menyimpan file',
                        errorAt: 'Image/photo_profile',
                    })
                }

                // const photo_profile = `data:image/jpeg;base64,${bufferFile.toString(
                //   "base64"
                // )}`;
                const data = {
                    username,
                    fullname,
                    email,
                    phone,
                    password: hashPassword,
                    role: 'CUSTOMER',
                    photo_profile: bufferFile,
                }
                const user = await prismaClient.users.create({
                    data,
                    select: { username: true, email: true, fullname: true },
                })

                return res.status(200).json({
                    code: 200,
                    message: 'Berhasil Signup',
                    data: user,
                })
            })
        } catch (error) {
            return res.status(403).json({
                code: 403,
                message: 'NOT OK',
                description: 'gagal signup',
                errorAt: error.message.includes('Unique constraint')
                    ? 'Input data duplikat'
                    : 'Unknown',
            })
        }
    }
)

router.delete('/logout', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(403).json({
            code: 403,
            message: 'NOT OK',
            description: 'Anda belum pernah login',
        })
    }

    req.logOut((err) => {
        if (err) {
            return res.status(403).json({
                code: 403,
                message: 'NOT OK',
                description: err || 'gagal logout',
            })
        }

        req.session.destroy()
        res.clearCookie('refresh_token')

        return res.status(200).json({
            code: 200,
            message: 'OK',
            description: 'Berhasil Logout',
        })
    })
})

router.get('/refresh-token', isAuthenticated, (req, res) => {
    const refreshToken = req.signedCookies['refresh_token']
    const otp = req.session.otp
    if (otp && otp.expired < Date.now()) {
        delete req.session.otp
    }

    jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET, (err, user) => {
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

        const token = jwt.sign(
            { username: user.username, email: user.email, id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '30s', algorithm: 'HS512' }
        )

        return res.status(200).json({
            code: 200,
            message: 'OK',
            description: 'Token refreshed',
            token,
        })
    })
})

router.post('/forget-password/:id_user', async (req, res) => {
    const { username, email } = req.body
    const user = await prismaClient.users.findFirst({
        where: { email, username },
    })

    if (!user) {
        return res.status(403).json({
            code: 403,
            message: 'NOT OK',
            desciption: `User yang memiliki username ${username} dan email ${email} tidak ditemukan`,
        })
    }

    const otp = createOTP(req.params.id_user)
    req.session.otp = otp

    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: 'miguel80@ethereal.email',
            pass: 'kuBzBV9nBB5QKj32E1',
        },
    })

    transporter.sendMail({
        from: 'wirawan@gmail.com',
        to: user.email,
        subject: 'OTP for password change by HyperBeast',
        html: `
      <p>This is your otp code, please dont share to anyone else</p>
      <h1>${otp.code}</h1>
    `,
    })

    return res.status(200).json({
        code: 200,
        message: 'OK',
        description: 'Kode otp sudah dikirimkan ke email anda',
    })
})

router.post('/validate-otp/:id_user', async (req, res) => {
    const { code } = req.body

    const otp = req.session.otp

    if (otp.ownerId !== req.params.id_user) {
        return res.status(401).json({
            code: 401,
            message: 'NOT OK',
            descrption: 'pengguna tidak cocok',
        })
    }

    if (otp.expired < Date.now()) {
        return res.status(401).json({
            code: 401,
            message: 'NOT OK',
            descrption: 'OTP code expired',
        })
    }

    if (otp.code !== code) {
        return res.status(401).json({
            code: 401,
            message: 'NOT OK',
            descrption: 'otp tidak cocok',
        })
    }

    delete req.session.otp
    req.session.changePassAccessGranted = {
        status: true,
        expired: Date.now() + 120000,
    }

    return res.status(200).json({
        code: 200,
        message: 'OK',
        description: 'Access granted, silahkan mengganti password yang baru',
    })
})

router.post('/change-password/:id_user', async (req, res) => {
    const { password, confPassword } = req.body
    const accessGrant = req.session.changePassAccessGranted

    if (
        !accessGrant ||
        !accessGrant.status ||
        accessGrant.expired < Date.now()
    ) {
        return res.status(401).json({
            code: 401,
            message: 'NOT OK',
            description:
                accessGrant.expired < Date.now()
                    ? 'access expired'
                    : 'Access Denied',
        })
    }

    if (password !== confPassword) {
        return res.status(403).json({
            code: 403,
            message: 'NOT OK',
            description: 'Password dan konfirmasi password tidak cocok',
        })
    }

    const passwordStrengthTestResult = passwordStrengthTest(password)
    if (passwordStrengthTestResult !== true) {
        return res.status(403).json(passwordStrengthTestResult)
    }

    delete req.session.changePassAccessGranted

    try {
        const salt = await bcrypt.genSalt(12)
        const hashPassword = await bcrypt.hash(password, salt)

        await prismaClient.users.update({
            where: {
                id_user: req.params.id_user,
            },
            data: {
                password: hashPassword,
            },
        })

        req.session.destroy()

        return res.status(200).json({
            code: 200,
            message: 'OK',
            description: 'Berhasil mengubah password',
        })
    } catch (error) {
        console.log(error)
        res.send('gagal ubah password')
    }
})

export default router
