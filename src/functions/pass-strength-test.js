import zxcvbn from "zxcvbn";

export default function passwordStrengthTest(password) {
  const passwordStrength = zxcvbn(password);

  if (passwordStrength.score < 3) {
    return {
      code: 403,
      message: "NOT OK",
      errorAt: "password",
      description: {
        passScore: passwordStrength.score,
        warning: passwordStrength.feedback.warning || "Bad Password",
        suggestions: passwordStrength.feedback.suggestions,
      },
    };
  } else {
    return true;
  }
}
