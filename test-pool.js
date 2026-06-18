const { Pool } = require("@neondatabase/serverless");
const pool = new Pool({ connectionString: "postgresql://neondb_owner:password@ep-xxx.us-east-2.aws.neon.tech/v-legal?sslmode=require" });
pool.connect((err, client, release) => {
  if (err) {
    console.error("Pool connect error:", err);
  } else {
    console.log("Pool connect success");
    release();
  }
});
