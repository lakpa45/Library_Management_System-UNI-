import bcrypt from 'bcrypt';

const hash = "$2b$10$lOfwHtunoojCw9pYWtveE.A9PnXm.l43AXqFYiv5LJRMc8pkophwq";

bcrypt.compare("elibrary", hash, (err, result) => {
  if (result) {
    console.log("Password matches!");
  } else {
    console.log("Password does not match.");
  }
});
