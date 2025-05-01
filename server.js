// Load environment variables first
require('dotenv').config();

const express = require('express');
const path = require('path');
const fileupload = require('express-fileupload');
const fs = require('fs');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const config = require('./config');

const app = express();

// Enhanced security headers with environment-aware CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'",
        "https://www.gstatic.com",
        "https://*.firebaseapp.com",
        "https://apis.google.com",
        "https://*.googleapis.com",
        `https://${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
        "https://cdnjs.cloudflare.com"
      ],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com",
        "https://www.gstatic.com"
      ],
      styleSrcElem: [
        "'self'", 
        "'unsafe-inline'", 
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com",
        "https://www.gstatic.com"
      ],
      imgSrc: ["'self'", "data:", "https:", "blob:", "*"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      connectSrc: [
        "'self'", 
        "https://*.firebaseio.com",
        "https://*.googleapis.com",
        `https://${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
        `https://${process.env.FIREBASE_STORAGE_BUCKET}`,
        "https://firestore.googleapis.com",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com"
      ],
      frameSrc: ["'self'", "https://*.firebaseapp.com", "https://apis.google.com"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting based on config
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindow,
  max: config.security.rateLimitMax,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// CORS configuration from config
app.use(cors({
  origin: config.cors.origin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression middleware
app.use(compression({
  level: 6,
  threshold: 100 * 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// File upload configuration from config
app.use(fileupload({
  limits: { 
    fileSize: config.security.maxFileSize
  },
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true,
  safeFileNames: true,
  preserveExtension: true,
  abortOnLimit: true,
  debug: config.server.nodeEnv === 'development'
}));

const initialPath = path.join(__dirname, "public");
const uploadsPath = path.join(__dirname, "public", "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Serve static files with proper caching
app.use(express.static(initialPath, {
  maxAge: config.server.nodeEnv === 'production' ? config.cache.staticDuration * 1000 : 0,
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Force no-cache for HTML files in development
    if (config.server.nodeEnv === 'development') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      // Production caching
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', `public, max-age=${config.cache.htmlDuration}`);
      } else if (filePath.match(/\.(jpg|jpeg|png|gif|ico)$/)) {
        res.setHeader('Cache-Control', `public, max-age=${config.cache.imageDuration}`);
      } else if (filePath.match(/\.(css|js)$/)) {
        res.setHeader('Cache-Control', `public, max-age=${config.cache.staticDuration}`);
      }
    }
  }
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), {
  maxAge: config.server.nodeEnv === 'production' ? config.cache.imageDuration * 1000 : 0
}));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(initialPath, "home.html"));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(initialPath, "about.html"));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(initialPath, "login.html"));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(initialPath, "profile.html"));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(initialPath, "dashboard.html"));
});

app.get('/blog/:id', (req, res) => {
  res.sendFile(path.join(initialPath, "blog.html"));
});

app.get('/editor', (req, res) => {
  res.sendFile(path.join(initialPath, "editor.html"));
});

// Upload endpoint
app.post('/upload', async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const file = req.files.image;
    
    if (!config.upload.allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        error: `Invalid file type. Allowed types: ${config.upload.allowedTypes.join(', ')}`
      });
    }

    const date = new Date();
    const imageName = `${date.getTime()}_${file.name}`;
    const uploadPath = path.join(__dirname, config.upload.directory, imageName);
    const uploadDir = path.join(__dirname, config.upload.directory);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await file.mv(uploadPath);
    res.json(`${config.upload.directory.replace('public/', '')}/${imageName}`);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error uploading file' });
  }
});

// Firebase config endpoint
app.get('/api/firebase-config', (req, res) => {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };

  const missingFields = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    console.error('Missing Firebase configuration fields:', missingFields);
    return res.status(500).json({
      error: `Missing required Firebase configuration: ${missingFields.join(', ')}`
    });
  }

  res.json(firebaseConfig);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: config.server.nodeEnv === 'development' ? err.message : 'Something broke!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(initialPath, "404.html"));
});

// Start server
app.listen(config.server.port, () => {
  console.log(`Server is running in ${config.server.nodeEnv} mode on port ${config.server.port}`);
});