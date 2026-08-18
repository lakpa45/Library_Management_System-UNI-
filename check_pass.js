import bcrypt from 'bcrypt';

const hash = "$2b$10$bs8x7FGcZT7WC1LgqZ18HufbZ9f0riu.Lqoqy1YiT9rg/hH2p7s26";

bcrypt.compare("admin", hash, (err, result) => {
  if (result) {
    console.log("Password matches!");
  } else {
    console.log("Password does not match.");
  }
});
