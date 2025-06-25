import bcrypt from "bcrypt"

export const doHash = async (password, saltRounds) => {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

export const doHashValidation = async (providedPassword, dbPassword) => {
    const hashedPasswordValidate = await bcrypt.compare(providedPassword, dbPassword);
    return hashedPasswordValidate;
}