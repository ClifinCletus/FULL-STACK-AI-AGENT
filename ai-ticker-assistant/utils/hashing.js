import bcrypt from "bcrypt";

export const doHash = async (password, saltRounds) => {
  console.log("hash1hash");
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  console.log("hash2");
  return hashedPassword;
};

export const doHashValidation = async (providedPassword, dbPassword) => {
  const hashedPasswordValidate = await bcrypt.compare(
    providedPassword,
    dbPassword
  );
  return hashedPasswordValidate;
};
