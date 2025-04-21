const { Pool } = require('pg');

// Neon connection string
const pool = new Pool({
  connectionString: 'postgresql://GPA_db_owner:npg_QLb8omePSN3q@ep-summer-sea-a9aljuqm-pooler.gwc.azure.neon.tech/GPA_db?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};
