const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });


module.exports = async function (context, req) {
  const { user_id, password } = req.body;
  if (!user_id || !password) {
    context.res = { status: 400, body: { success: false, message: 'Missing fields' } };
    return;
  }
  try {
    await pool.query('INSERT INTO users (user_id, password) VALUES ($1, $2)', [user_id, password]);
    context.res = { status: 200, body: { success: true } };
  } catch (error) {
    context.res = error.code === '23505'
      ? { status: 409, body: { success: false, message: 'User already exists' } }
      : { status: 500, body: { success: false, message: error.message } };
  }
};
