const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });


module.exports = async function (context, req) {
  const method = req.method;
  const { user_id, course_id } = req.query;
  const body = req.body;

  try {
    if (method === 'GET') {
      if (!user_id) throw new Error('Missing user_id');
      const result = await pool.query('SELECT * FROM courses WHERE user_id = $1', [user_id]);
      context.res = { status: 200, body: { success: true, courses: result.rows } };
    } else if (method === 'POST') {
      const { user_id, course_id, course_name, semester, status, gpa_letter, credits } = body;
      if (!user_id || !course_id || !course_name || !semester || !status || !credits)
        throw new Error('Missing required fields');
      await pool.query(
        `INSERT INTO courses (user_id, course_id, course_name, semester, status, gpa_letter, credits)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id, course_id) DO UPDATE SET
         course_name = EXCLUDED.course_name,
         semester = EXCLUDED.semester,
         status = EXCLUDED.status,
         gpa_letter = EXCLUDED.gpa_letter,
         credits = EXCLUDED.credits`,
        [user_id, course_id, course_name, semester, status, gpa_letter, credits]
      );
      context.res = { status: 200, body: { success: true } };
    } else if (method === 'DELETE') {
      if (!user_id || !course_id) throw new Error('Missing user_id or course_id');
      await pool.query('DELETE FROM courses WHERE user_id = $1 AND course_id = $2', [user_id, course_id]);
      context.res = { status: 200, body: { success: true } };
    } else {
      context.res = { status: 405, body: { success: false, message: 'Method not allowed' } };
    }
  } catch (err) {
    context.res = { status: 400, body: { success: false, message: err.message } };
  }
};
