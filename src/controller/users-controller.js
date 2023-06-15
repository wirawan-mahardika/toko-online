import bcrypt from "bcrypt";
import { prismaClient } from "../database/prisma-client.js";
import jwt from "jsonwebtoken";
import isImage from "../functions/mime-type-check.js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { createOTP } from "../functions/create-otp.js";
import passwordStrengthTest from "../functions/pass-strength-test.js";
import sendMessageByEmail from "../functions/nodemailer.js";

dotenv.config();

export const loginRoute = (req, res) => {
  const token = jwt.sign(
    { username: req.user.username, email: req.user.email, id: req.user.id },
    process.env.JWT_SECRET,
    { expiresIn: "30s", algorithm: "HS512" }
  );

  const resfreshToken = jwt.sign(
    { username: req.user.username, email: req.user.email, id: req.user.id },
    process.env.REFRESH_JWT_SECRET,
    { expiresIn: "7d", algorithm: "HS512" }
  );

  res.cookie("refresh_token", resfreshToken, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 1000 * 3600 * 24 * 7,
    signed: true,
  });

  return res.status(200).json({
    code: 200,
    message: "OK",
    description: "Berhasil Login",
    token,
  });
};

export const signupRoute = async (req, res) => {
  const { password, username, email, fullname } = req.body;
  const salt = await bcrypt.genSalt(12);
  const hashPassword = await bcrypt.hash(password, salt);

  const data = {
    username,
    fullname,
    email,
    password: hashPassword,
    role: "CUSTOMER",
  };

  const token = jwt.sign(data, process.env.JWT_EMAIL_VALIDATE_KEY, {
    expiresIn: "1m",
    algorithm: "HS256",
  });

  const emailMessage = {
    to: email,
    subject: "validate email by HyperBeast",
    html: `
        <p>klik url dibawah untuk melanjutkan aksi</p>
        <a href="${process.env.SERVER_URL}/api/users/validate-email/${token}">Click here to continue</a>
        `,
  };

  sendMessageByEmail(emailMessage);

  return res.status(200).json({
    code: 200,
    message: "OK",
    description:
      "Kami perlu mengidentifikasi email anda apakah aktif atau tidak\nsilahkan periksa email anda dan ikuti instruktsinya",
  });
};

export const validateEmail = (req, res) => {
  const token = req.params.token;

  jwt.verify(token, process.env.JWT_EMAIL_VALIDATE_KEY, async (err, data) => {
    if (err) {
      return res
        .status(401)
        .json({ code: 403, message: "NOT OK", description: err.message });
    }

    const { password, username, email, fullname } = data;
    try {
      const user = await prismaClient.users.create({
        data: {
          username,
          fullname,
          email,
          password,
          role: "CUSTOMER",
        },
        select: { username: true, email: true, fullname: true },
      });
      return res.render("success", {
        data: user,
        client_url: "http://127.0.0.1:5500" || process.env.CLIENT_URL,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        code: 403,
        message: "NOT OK",
        description:
          "gagal melakukan validasi, kemungkinan data yang digunakan sudah terdaftar",
      });
    }
  });
};

export const addPhotoProfile = async (req, res) => {
  if (!isImage(req.file)) {
    return res.status(403).json({
      code: 403,
      message: "NOT OK",
      description: "file ekstensi dari image invalid",
    });
  }
  await prismaClient.users.update({
    where: {
      id_user: req.user.id_user,
    },
    data: {
      photo_profile: req.file.buffer,
    },
  });
  return res.status(200).json({
    code: 200,
    message: "NOT OK",
    description: "Berhasil menyimpan mengatur photo profile",
  });
};

export const logoutRoute = (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(403).json({
      code: 403,
      message: "NOT OK",
      description: "Anda belum pernah login",
    });
  }

  req.logOut((err) => {
    if (err) {
      return res.status(403).json({
        code: 403,
        message: "NOT OK",
        description: err || "gagal logout",
      });
    }

    req.session.destroy();
    res.clearCookie("refresh_token");

    return res.status(200).json({
      code: 200,
      message: "OK",
      description: "Berhasil Logout",
    });
  });
};

export const refreshToken = (req, res) => {
  const refreshToken = req.signedCookies["refresh_token"];
  const otp = req.session.otp;
  if (otp && otp.expired < Date.now()) {
    delete req.session.otp;
  }

  jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({
        code: 401,
        message: "NOT OK",
        description: err.message,
      });
    }

    if (req.user.id !== user.id) {
      return res.status(401).json({
        code: 401,
        message: "NOT OK",
        description: err.message,
      });
    }

    const token = jwt.sign(
      { username: user.username, email: user.email, id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "30s", algorithm: "HS512" }
    );

    return res.status(200).json({
      code: 200,
      message: "OK",
      description: "Token refreshed",
      token,
    });
  });
};

export const changePassword = async (req, res) => {
  const { password, confPassword } = req.body;
  const accessGrant = req.session.changePassAccessGranted;

  if (!accessGrant || !accessGrant.status || accessGrant.expired < Date.now()) {
    return res.status(401).json({
      code: 401,
      message: "NOT OK",
      description: accessGrant
        ? accessGrant.expired < Date.now()
          ? "access expired"
          : "Access Denied"
        : "access denied",
    });
  }

  if (password !== confPassword) {
    return res.status(403).json({
      code: 403,
      message: "NOT OK",
      description: "Password dan konfirmasi password tidak cocok",
    });
  }

  const passwordStrengthTestResult = passwordStrengthTest(password);
  if (passwordStrengthTestResult !== true) {
    return res.status(403).json(passwordStrengthTestResult);
  }

  delete req.session.changePassAccessGranted;

  try {
    const salt = await bcrypt.genSalt(12);
    const hashPassword = await bcrypt.hash(password, salt);

    await prismaClient.users.update({
      where: {
        id_user: req.params.id_user,
      },
      data: {
        password: hashPassword,
      },
    });

    req.session.destroy();

    return res.status(200).json({
      code: 200,
      message: "OK",
      description: "Berhasil mengubah password",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: 500,
      message: "NOT OK",
      description:
        "Tidak berhasil mengubah password, terjadi kesalahan pada server",
    });
  }
};

export const validateOtp = async (req, res) => {
  const { code } = req.body;

  const otp = req.session.otp;

  if (!otp.ownerId) {
    return res.status(401).json({
      code: 401,
      message: "NOT OK",
      description: "Anda tidak memiliki izin",
    });
  }

  if (otp.ownerId !== req.params.id_user) {
    return res.status(401).json({
      code: 401,
      message: "NOT OK",
      descrption: "pengguna tidak cocok",
    });
  }

  if (otp.expired < Date.now()) {
    return res.status(401).json({
      code: 401,
      message: "NOT OK",
      descrption: "OTP code expired",
    });
  }

  if (otp.code !== code) {
    return res.status(401).json({
      code: 401,
      message: "NOT OK",
      descrption: "otp tidak cocok",
    });
  }

  delete req.session.otp;
  req.session.changePassAccessGranted = {
    status: true,
    expired: Date.now() + 120000,
  };

  return res.status(200).json({
    code: 200,
    message: "OK",
    description: "Access granted, silahkan mengganti password yang baru",
  });
};

export const forgetPassword = async (req, res) => {
  const { username, email } = req.body;
  const id_user = req.params.id_user;

  if (!id_user) {
    return res.status(403).json({
      code: 403,
      message: "NOT OK",
      description: "id user dibutuhkan",
    });
  }

  const user = await prismaClient.users.findFirst({
    where: { email, username },
  });

  if (!user) {
    return res.status(403).json({
      code: 403,
      message: "NOT OK",
      desciption: `User yang memiliki username ${username} dan email ${email} tidak ditemukan`,
    });
  }

  const otp = createOTP(id_user);
  req.session.otp = otp;

  const emailMessage = {
    to: user.email,
    subject: "OTP for password change by HyperBeast",
    html: `
    <p>This is your otp code, please dont share to anyone else</p>
    <h1>${otp.code}</h1>
  `,
  };
  sendMessageByEmail(emailMessage);

  // const transporter = nodemailer.createTransport({
  //   host: "smtp.ethereal.email",
  //   port: 587,
  //   auth: {
  //     user: "preston.wiegand24@ethereal.email",
  //     pass: "yYqgpYGfANj4F2UFUk",
  //   },
  // });

  // transporter.sendMail({
  //   from: "wirawanmahardika10@gmail.com",
  //   to: user.email,
  //   subject: "OTP for password change by HyperBeast",
  //   html: `
  //       <p>This is your otp code, please dont share to anyone else</p>
  //       <h1>${otp.code}</h1>
  //     `,
  // });

  return res.status(200).json({
    code: 200,
    message: "OK",
    description: "Kode otp sudah dikirimkan ke email anda",
  });
};
