const config = {
    server: {
        port: process.env.PORT || 3001,
        nodeEnv: process.env.NODE_ENV || 'development'
    },
    security: {
        rateLimitWindow: 30 * 60 * 1000, // 30 minutes
        rateLimitMax: 100, // requests per window
        maxFileSize: 5 * 1024 * 1024 // 5MB
    },
    cors: {
        origin: process.env.NODE_ENV === 'production' ? process.env.ALLOWED_ORIGIN : '*'
    },
    cache: {
        htmlDuration: 3600, // 1 hour
        imageDuration: 86400, // 24 hours
        staticDuration: 2592000 // 30 days
    },
    upload: {
        directory: 'public/uploads',
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    }
};

module.exports = config;