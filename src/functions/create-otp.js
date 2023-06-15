export function createOTP(id) {
  let otp = "";
  while (otp.length < 6) {
    otp += Math.floor(Math.random() * 10);
  }

  const result = { code: otp, expired: Date.now() + 60000, ownerId: id };
  return result;
}
