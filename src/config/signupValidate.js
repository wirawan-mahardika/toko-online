import zxcvbn from "zxcvbn";
import emailValidator from "email-validator";
import passwordStrengthTest from "../functions/pass-strength-test.js";

export default function (req, res, next) {
  const { password, username, email } = req.body;

  if (username.length < 6) {
    return res.status(403).json({
      code: 403,
      message: "NOT OK",
      description: "Username harus memiliki minimal 6 karakter",
    });
  }

  if (username.length > 20) {
    return res.status(403).json({
      code: 403,
      message: "NOT OK",
      description: "Username harus memiliki maksimal 20 karakter",
      errorAt: "username",
    });
  }

  if (!emailValidator.validate(email)) {
    return res.status(403).json({
      code: 403,
      message: "NOT OK",
      description: "Email invalid",
      errorAt: "email",
    });
  }

  const passwordStrengthTestResult = passwordStrengthTest(password);
  if (passwordStrengthTestResult !== true) {
    return res.status(403).json(passwordStrengthTestResult);
  }

  return next();
}
