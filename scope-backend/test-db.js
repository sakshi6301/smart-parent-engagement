const mongoose = require('mongoose');

const uri = "mongodb://sakshibhudge_db_user:hudge123@ac-0yk0xcy-shard-00-00.2drhgsy.mongodb.net:27017,ac-0yk0xcy-shard-00-01.2drhgsy.mongodb.net:27017,ac-0yk0xcy-shard-00-02.2drhgsy.mongodb.net:27017/scope_db?ssl=true&replicaSet=atlas-12xqc6-shard-0&authSource=admin&retryWrites=true&w=majority";

console.log("Connecting with non-SRV connection string...");
mongoose.connect(uri)
  .then(() => {
    console.log("SUCCESS! Connected to MongoDB successfully.");
    process.exit(0);
  })
  .catch(err => {
    console.error("FAILED to connect:", err);
    process.exit(1);
  });
