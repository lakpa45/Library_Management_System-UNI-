// hash.mjs
import bcrypt from "bcrypt";

const text = process.argv[2] || "elibrary";   // input text
const saltRounds = 10;                           // cost factor

const hashText = async () => {
  try {
    const hash = await bcrypt.hash(text, saltRounds);
    console.log("Hashed text:", hash);
  } catch (err) {
    console.error("Error hashing text:", err);
  }
};

hashText();
