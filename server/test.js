const pool = require("./db/pool");

async function test() {
  const result = await.pool.query("SELECT 1;");
  console.log(result.rows);
  await.pool.end();
}
test().catch(console.error);
