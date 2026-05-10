import bcrypt from "bcryptjs";
import crypto from "crypto";

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, 10);

export const verifyPassword = (plain: string, hashed: string): Promise<boolean> =>
  bcrypt.compare(plain, hashed);

export const sha256 = (input: string): string =>
  crypto.createHash("sha256").update(input).digest("hex");
