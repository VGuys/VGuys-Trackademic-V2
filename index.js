const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve index.html from the root folder
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Optional: handle POST if needed later
// app.post('/submit', (req, res) => {
//   console.log(req.body); // data from frontend
//   res.json({ message: 'Data received successfully' });
// });

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
