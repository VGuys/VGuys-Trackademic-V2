const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

module.exports = async function (context, req) {
  const { user_id, password } = req.body;
  if (!user_id || !password) {
    context.res = { status: 400, body: { success: false, message: 'Missing fields' } };
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1 AND password = $2', [user_id, password]);
    context.res = result.rowCount > 0
      ? { status: 200, body: { success: true, user_id } }
      : { status: 401, body: { success: false, message: 'Invalid credentials' } };
  } catch (error) {
    context.res = { status: 500, body: { success: false, message: error.message } };
  }
};
