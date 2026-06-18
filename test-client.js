const { Client } = require("@neondatabase/serverless");
const client = new Client({ connectionString: "postgresql://neondb_owner:password@ep-xxx.us-east-2.aws.neon.tech/v-legal?sslmode=require" });
console.log("Client config:", client.config);
client.connect()
  .then(() => console.log("Connected successfully"))
  .catch(e => console.error("Direct client error:", e));
