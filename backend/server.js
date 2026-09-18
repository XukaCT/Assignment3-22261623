// server.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const db = require('./db');
const authenticateToken = require('./authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Trust Render's reverse proxy for Secure cookies over HTTPS
app.set('trust proxy', 1);

// Determine base URL dynamically (Render automatically sets RENDER_EXTERNAL_URL)
const BASE_URL = process.env.RENDER_EXTERNAL_URL || process.env.BASE_URL || `http://localhost:${PORT}`;
const CLIENT_URL = process.env.CLIENT_URL || BASE_URL;

// Middleware
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Serve static frontend files built by Vite
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// ==========================================
// PUBLIC HEALTH CHECK
// ==========================================
app.get('/api/health', (req, res) => {
    res.json({ status: "ok" });
});

// ==========================================
// OAUTH & AUTHENTICATION ROUTES
// ==========================================
app.get('/login', (req, res) => {
    if (!process.env.GITHUB_CLIENT_ID) {
        return res.status(500).send("Error: GITHUB_CLIENT_ID is not configured.");
    }
    
    // Dynamic callback URL matching your deployed domain or localhost
    const redirectUri = `${BASE_URL}/auth/github/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    res.redirect(githubAuthUrl);
});

app.get('/auth/github/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: "No authorization code returned from GitHub." });
    }

    try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code: code
            })
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            console.error("GitHub Token Exchange Failed:", tokenData);
            return res.status(401).json({ error: "Failed to exchange code for GitHub token", details: tokenData });
        }

        const userResponse = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const userData = await userResponse.json();
        const userId = userData.id ? userData.id.toString() : null;

        if (!userId) {
            return res.status(401).json({ error: "Failed to fetch GitHub user ID." });
        }

        // Sign application JWT
        const token = jwt.sign({ user_id: userId }, process.env.JWT_SECRET, { expiresIn: '2h' });

        // Store JWT in Secure, HttpOnly cookie named token
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7200000 // 2 hours
        });

        res.redirect(`${CLIENT_URL}/dashboard`);
    } catch (error) {
        console.error("OAuth Error:", error);
        res.status(500).json({ error: "Authentication failed" });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: "Logged out successfully" });
});

// ==========================================
// PROTECTED CRUD ROUTES (/api/capsules)
// ==========================================

// 1. READ: Get own records
app.get('/api/capsules', authenticateToken, (req, res) => {
    const userId = req.user.user_id;
    const sql = `SELECT * FROM capsules WHERE user_id = ? ORDER BY created_at DESC`;

    db.all(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// 2. CREATE: Add record assigned to req.user.user_id
app.post('/api/capsules', authenticateToken, (req, res) => {
    const userId = req.user.user_id;
    const {
        project_name,
        prompt_title,
        prompt_version,
        prompt_text,
        response_summary,
        category,
        usefulness,
        reviewed,
        improved,
        screenshot_url,
        notes
    } = req.body;

    if (!project_name || !prompt_title || !prompt_text) {
        return res.status(400).json({ error: "project_name, prompt_title, and prompt_text are required." });
    }

    const sql = `INSERT INTO capsules (
        user_id, project_name, prompt_title, prompt_version, prompt_text,
        response_summary, category, usefulness, reviewed, improved,
        screenshot_url, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        userId,
        project_name,
        prompt_title,
        prompt_version || 'v1',
        prompt_text,
        response_summary || null,
        category || null,
        usefulness || null,
        reviewed ? 1 : 0,
        improved ? 1 : 0,
        screenshot_url || null,
        notes || null
    ];

    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, message: "Capsule created successfully" });
    });
});

// 3. UPDATE: Change an existing record only if owned by req.user.user_id
app.put('/api/capsules/:id', authenticateToken, (req, res) => {
    const userId = req.user.user_id;
    const capsuleId = req.params.id;
    const {
        project_name,
        prompt_title,
        prompt_version,
        prompt_text,
        response_summary,
        category,
        usefulness,
        reviewed,
        improved,
        screenshot_url,
        notes
    } = req.body;

    const sql = `UPDATE capsules SET 
        project_name = COALESCE(?, project_name),
        prompt_title = COALESCE(?, prompt_title),
        prompt_version = COALESCE(?, prompt_version),
        prompt_text = COALESCE(?, prompt_text),
        response_summary = COALESCE(?, response_summary),
        category = COALESCE(?, category),
        usefulness = COALESCE(?, usefulness),
        reviewed = COALESCE(?, reviewed),
        improved = COALESCE(?, improved),
        screenshot_url = COALESCE(?, screenshot_url),
        notes = COALESCE(?, notes)
    WHERE id = ? AND user_id = ?`;

    const params = [
        project_name || null,
        prompt_title || null,
        prompt_version || null,
        prompt_text || null,
        response_summary || null,
        category || null,
        usefulness || null,
        reviewed !== undefined ? (reviewed ? 1 : 0) : null,
        improved !== undefined ? (improved ? 1 : 0) : null,
        screenshot_url || null,
        notes || null,
        capsuleId,
        userId
    ];

    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Capsule not found or unauthorized to edit" });
        }
        res.json({ message: "Capsule updated successfully" });
    });
});

// 4. DELETE: Remove record only if owned by req.user.user_id
app.delete('/api/capsules/:id', authenticateToken, (req, res) => {
    const userId = req.user.user_id;
    const capsuleId = req.params.id;
    const sql = `DELETE FROM capsules WHERE id = ? AND user_id = ?`;

    db.run(sql, [capsuleId, userId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Capsule not found or unauthorized to delete" });
        }
        res.json({ message: "Capsule deleted successfully" });
    });
});

// ==========================================
// SPA CLIENT ROUTING FALLBACK
// ==========================================
// Any request that isn't an API route or callback is served the React app
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/auth')) {
        res.sendFile(path.join(clientDistPath, 'index.html'));
    } else {
        res.status(404).json({ error: "Route not found" });
    }
});

// Start Server once
app.listen(PORT, () => {
    console.log(`AI Capsule server running on port ${PORT}`);
});

