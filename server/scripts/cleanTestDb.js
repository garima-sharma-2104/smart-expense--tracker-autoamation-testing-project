/**
 * Drops all collections of the TEST database only.
 * Safety: refuses to run unless the database name ends with "-test".
 * Usage (PowerShell):  $env:MONGO_URI="mongodb://127.0.0.1:27017/smart-expense-tracker-test"; npm run test:clean-db
 */
require("dotenv").config({ path: process.env.ENV_FILE || ".env.test" });
const mongoose = require("mongoose");

(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error("MONGO_URI is not set."); process.exit(1); }
  const dbName = uri.split("?")[0].split("/").pop();
  if (!dbName || !dbName.endsWith("-test")) {
    console.error(`Refusing to clean database "${dbName}": name must end with "-test".`);
    process.exit(1);
  }
  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();
  console.log(`Dropped test database "${dbName}".`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
