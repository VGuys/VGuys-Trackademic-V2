const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const db = require('./db'); // PostgreSQL connection

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    console.log(`Received ${req.method} request for ${pathname}`);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Serve static HTML files
    if (pathname === '/' || pathname === '/login') {
        serveFile(res, 'html/login.html');
        return;
    }

    if (pathname === '/signup') {
        serveFile(res, 'html/signup.html');
        return;
    }

    if (pathname === '/home') {
        serveFile(res, 'html/index.html');
        return;
    }

    // Handle API endpoints
    // Login endpoint
    if (pathname === '/api/login' && req.method === 'POST') {
        handleJsonRequest(req, res, async (data) => {
            try {
                console.log("Login attempt for user:", data.user_id);
                const query = 'SELECT * FROM users WHERE user_id = $1 AND password = $2';
                const result = await db.query(query, [data.user_id, data.password]);
                
                if (result.rows.length > 0) {
                    console.log("Login successful for user:", data.user_id);
                    return { success: true };
                } else {
                    console.log("Login failed for user:", data.user_id);
                    return { success: false, message: 'Invalid credentials' };
                }
            } catch (err) {
                console.error("Database error during login:", err);
                throw new Error('Database error during login');
            }
        });
        return;
    }

    // Signup endpoint
    if (pathname === '/api/signup' && req.method === 'POST') {
        handleJsonRequest(req, res, async (data) => {
            try {
                console.log("Signup attempt for user:", data.user_id);
                
                // Check if user already exists
                const checkQuery = 'SELECT * FROM users WHERE user_id = $1';
                const checkResult = await db.query(checkQuery, [data.user_id]);
                
                if (checkResult.rows.length > 0) {
                    return { success: false, message: 'User ID already exists' };
                }
                
                // Create new user
                const insertQuery = 'INSERT INTO users (user_id, password) VALUES ($1, $2)';
                await db.query(insertQuery, [data.user_id, data.password]);
                console.log("User created successfully:", data.user_id);
                return { success: true };
            } catch (err) {
                console.error("Database error during signup:", err);
                throw new Error('Database error during signup');
            }
        });
        return;
    }

    // Add course endpoint (you'll need this for your GPA tracker)
    if (pathname === '/api/courses' && req.method === 'POST') {
        handleJsonRequest(req, res, async (data) => {
            try {
                // Validate the required fields
                if (!data.user_id || !data.code || !data.name || !data.semester || !data.status) {
                    return { success: false, message: 'Missing required fields' };
                }
                
                const query = `
                    INSERT INTO courses (user_id, code, name, semester, status, gpa) 
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `;
                
                const gpa = data.status === 'completed' ? data.gpa : null;
                const result = await db.query(query, [
                    data.user_id, data.code, data.name, data.semester, data.status, gpa
                ]);
                
                return { success: true, course: result.rows[0] };
            } catch (err) {
                console.error("Error adding course:", err);
                throw new Error('Database error when adding course');
            }
        });
        return;
    }

    // Get courses endpoint
    if (pathname === '/api/courses' && req.method === 'GET') {
        const userId = parsedUrl.query.user_id;
        
        if (!userId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'User ID is required' }));
            return;
        }
        
        try {
            db.query('SELECT * FROM courses WHERE user_id = $1', [userId])
                .then(result => {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, courses: result.rows }));
                })
                .catch(err => {
                    console.error("Error fetching courses:", err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Server error' }));
                });
        } catch (err) {
            console.error("Exception when fetching courses:", err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Server error' }));
        }
        return;
    }

    // If no routes match, return 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

// Helper function to serve files
function serveFile(res, filename) {
    fs.readFile(path.join(__dirname, filename), (err, data) => {
        if (err) {
            console.error(`Error reading file ${filename}:`, err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
            return;
        }
        
        // Set the content type based on file extension
        const ext = path.extname(filename);
        let contentType = 'text/html';
        
        if (ext === '.css') contentType = 'text/css';
        else if (ext === '.js') contentType = 'application/javascript';
        else if (ext === '.json') contentType = 'application/json';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

// Helper function to handle JSON API requests
function handleJsonRequest(req, res, handler) {
    let body = '';
    
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', async () => {
        try {
            // Parse the request body
            let data;
            try {
                data = JSON.parse(body);
            } catch (e) {
                console.error("Invalid JSON received:", body);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
                return;
            }
            
            // Call the handler function with the parsed data
            const result = await handler(data);
            
            // Send the response
            res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (err) {
            console.error("Error handling request:", err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Server error' }));
        }
    });
    
    req.on('error', err => {
        console.error("Request error:", err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Server error' }));
    });
}

const PORT = process.env.PORT || 1337;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
