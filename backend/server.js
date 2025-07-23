const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] // Replace with your production domain
        : ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// File upload configuration
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/plain') {
            cb(null, true);
        } else {
            cb(new Error('Only text files are allowed'), false);
        }
    }
});

// CodeVault Steganography Engine (Server-side implementation)
class CodeVaultServer {
    // Equidistant Letter Sequence (ELS) Encoding
    static encodeELS(message, carrierText) {
        const cleanMessage = message.toLowerCase().replace(/[^a-z]/g, '');
        const cleanCarrier = carrierText.toLowerCase().replace(/[^a-z]/g, '');
        
        if (cleanMessage.length === 0) {
            throw new Error('Secret message must contain at least one letter');
        }

        if (cleanCarrier.length < cleanMessage.length * 2) {
            throw new Error('Carrier text too short for ELS encoding. Need at least ' + (cleanMessage.length * 2) + ' letters.');
        }

        const skipDistance = Math.floor(cleanCarrier.length / cleanMessage.length);
        
        if (skipDistance < 2) {
            throw new Error('Carrier text too short for secure ELS encoding');
        }

        let encodedText = carrierText;
        let positions = [];
        let currentPos = 0;

        for (let i = 0; i < cleanMessage.length; i++) {
            const targetChar = cleanMessage[i];
            let placed = false;
            
            for (let j = 0; j < skipDistance && !placed; j++) {
                const pos = currentPos + j;
                if (pos < encodedText.length) {
                    const originalChar = encodedText[pos].toLowerCase();
                    if (originalChar.match(/[a-z]/)) {
                        const isUpperCase = encodedText[pos] === encodedText[pos].toUpperCase();
                        encodedText = encodedText.substring(0, pos) + 
                                     (isUpperCase ? targetChar.toUpperCase() : targetChar) + 
                                     encodedText.substring(pos + 1);
                        positions.push(pos);
                        placed = true;
                    }
                }
            }
            currentPos += skipDistance;
        }

        const securityScore = this.calculateSecurityScore(cleanMessage.length, cleanCarrier.length, 'els');

        return {
            encodedText: encodedText,
            method: 'Equidistant Letter Sequence',
            skipDistance: skipDistance,
            positions: positions,
            securityScore: securityScore,
            instructions: {
                method: 'ELS',
                skipDistance: skipDistance,
                startPosition: positions[0] || 0,
                messageLength: cleanMessage.length
            }
        };
    }

    // Acrostic Method Encoding
    static encodeAcrostic(message, carrierText) {
        const cleanMessage = message.toLowerCase().replace(/[^a-z]/g, '');
        const lines = carrierText.split('\n');
        
        if (cleanMessage.length === 0) {
            throw new Error('Secret message must contain at least one letter');
        }

        let encodedLines = [...lines];
        
        while (encodedLines.length < cleanMessage.length) {
            encodedLines.push('Additional line needed for encoding.');
        }

        for (let i = 0; i < cleanMessage.length; i++) {
            const targetChar = cleanMessage[i];
            let line = encodedLines[i] || '';
            
            if (line.length === 0) {
                encodedLines[i] = targetChar.toUpperCase() + 'dditional content for steganography.';
            } else {
                const firstLetterMatch = line.match(/[a-zA-Z]/);
                if (firstLetterMatch) {
                    const firstLetterIndex = line.indexOf(firstLetterMatch[0]);
                    const isUpperCase = firstLetterMatch[0] === firstLetterMatch[0].toUpperCase();
                    encodedLines[i] = line.substring(0, firstLetterIndex) + 
                                    (isUpperCase ? targetChar.toUpperCase() : targetChar) + 
                                    line.substring(firstLetterIndex + 1);
                } else {
                    encodedLines[i] = targetChar.toUpperCase() + line;
                }
            }
        }

        const securityScore = this.calculateSecurityScore(cleanMessage.length, carrierText.length, 'acrostic');

        return {
            encodedText: encodedLines.join('\n'),
            method: 'Acrostic Method',
            linesUsed: cleanMessage.length,
            securityScore: securityScore,
            instructions: {
                method: 'Acrostic',
                readFirstLetters: true,
                numberOfLines: cleanMessage.length
            }
        };
    }

    // Punctuation Pattern Encoding
    static encodePunctuation(message, carrierText) {
        const binaryMessage = message.split('').map(char => 
            char.charCodeAt(0).toString(2).padStart(8, '0')
        ).join('');
        
        let encodedText = carrierText;
        let binaryIndex = 0;
        let modifications = [];

        for (let i = 0; i < encodedText.length && binaryIndex < binaryMessage.length; i++) {
            const char = encodedText[i];
            if (char === '.' || char === '!') {
                const binaryDigit = binaryMessage[binaryIndex];
                const newChar = binaryDigit === '0' ? '.' : '!';
                
                if (char !== newChar) {
                    encodedText = encodedText.substring(0, i) + newChar + encodedText.substring(i + 1);
                    modifications.push({position: i, original: char, new: newChar});
                }
                binaryIndex++;
            }
        }

        if (binaryIndex < binaryMessage.length) {
            const remainingBinary = binaryMessage.substring(binaryIndex);
            encodedText += ' ';
            for (let i = 0; i < remainingBinary.length; i++) {
                encodedText += remainingBinary[i] === '0' ? '.' : '!';
            }
        }

        const securityScore = this.calculateSecurityScore(message.length, carrierText.length, 'punctuation');

        return {
            encodedText: encodedText,
            method: 'Punctuation Pattern',
            binaryLength: binaryMessage.length,
            modifications: modifications.length,
            securityScore: securityScore,
            instructions: {
                method: 'Punctuation',
                pattern: 'Periods (.) = 0, Exclamation marks (!) = 1',
                binaryLength: binaryMessage.length
            }
        };
    }

    // Null Cipher Encoding
    static encodeNullCipher(message, carrierText) {
        const cleanMessage = message.toLowerCase().replace(/[^a-z]/g, '');
        const words = carrierText.split(/\s+/);
        
        if (cleanMessage.length === 0) {
            throw new Error('Secret message must contain at least one letter');
        }

        if (words.length < cleanMessage.length) {
            throw new Error('Carrier text needs at least ' + cleanMessage.length + ' words for null cipher encoding');
        }

        let encodedWords = [...words];
        
        for (let i = 0; i < cleanMessage.length; i++) {
            const targetChar = cleanMessage[i];
            let word = encodedWords[i];
            
            if (word && word.length > 0) {
                const firstLetterMatch = word.match(/[a-zA-Z]/);
                if (firstLetterMatch) {
                    const firstLetterIndex = word.indexOf(firstLetterMatch[0]);
                    const isUpperCase = firstLetterMatch[0] === firstLetterMatch[0].toUpperCase();
                    encodedWords[i] = word.substring(0, firstLetterIndex) + 
                                    (isUpperCase ? targetChar.toUpperCase() : targetChar) + 
                                    word.substring(firstLetterIndex + 1);
                }
            }
        }

        const securityScore = this.calculateSecurityScore(cleanMessage.length, carrierText.length, 'null');

        return {
            encodedText: encodedWords.join(' '),
            method: 'Null Cipher',
            wordsModified: cleanMessage.length,
            securityScore: securityScore,
            instructions: {
                method: 'Null Cipher',
                readFirstLetters: true,
                numberOfWords: cleanMessage.length
            }
        };
    }

    static calculateSecurityScore(messageLength, carrierLength, method) {
        let baseScore = 50;
        
        const ratio = messageLength / carrierLength;
        if (ratio < 0.01) baseScore += 30;
        else if (ratio < 0.05) baseScore += 20;
        else if (ratio < 0.1) baseScore += 10;
        else baseScore -= 10;
        
        switch (method) {
            case 'els': baseScore += 20; break;
            case 'punctuation': baseScore += 15; break;
            case 'null': baseScore += 10; break;
            case 'acrostic': baseScore += 5; break;
        }
        
        return Math.max(0, Math.min(100, Math.round(baseScore)));
    }
}

// API Routes
app.get('/', (req, res) => {
    res.json({
        message: 'CodeVault Backend Server',
        version: '1.0.0',
        status: 'Running',
        endpoints: [
            'POST /api/encode - Encode a message using steganography',
            'POST /api/decode - Decode a hidden message',
            'GET /api/health - Health check'
        ]
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.post('/api/encode', (req, res) => {
    try {
        const { message, carrierText, method } = req.body;

        if (!message || !carrierText || !method) {
            return res.status(400).json({
                error: 'Missing required fields: message, carrierText, method'
            });
        }

        if (message.length > 1000) {
            return res.status(400).json({
                error: 'Message too long. Maximum 1000 characters allowed.'
            });
        }

        let result;
        switch (method) {
            case 'els':
                result = CodeVaultServer.encodeELS(message, carrierText);
                break;
            case 'acrostic':
                result = CodeVaultServer.encodeAcrostic(message, carrierText);
                break;
            case 'punctuation':
                result = CodeVaultServer.encodePunctuation(message, carrierText);
                break;
            case 'null':
                result = CodeVaultServer.encodeNullCipher(message, carrierText);
                break;
            default:
                return res.status(400).json({
                    error: 'Invalid encoding method. Supported: els, acrostic, punctuation, null'
                });
        }

        res.json({
            success: true,
            result: result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.post('/api/decode', (req, res) => {
    try {
        const { encodedText, instructions } = req.body;

        if (!encodedText || !instructions) {
            return res.status(400).json({
                error: 'Missing required fields: encodedText, instructions'
            });
        }

        // Implement decoding logic here based on instructions
        // This would mirror the frontend decoding methods

        res.json({
            success: true,
            decodedMessage: 'Decoding feature coming soon',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// File upload endpoint
app.post('/api/upload', upload.single('textFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded'
            });
        }

        const fs = require('fs');
        const fileContent = fs.readFileSync(req.file.path, 'utf8');
        
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            content: fileContent,
            filename: req.file.originalname,
            size: req.file.size
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large. Maximum size is 5MB.'
            });
        }
    }
    
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET /',
            'GET /api/health',
            'POST /api/encode',
            'POST /api/decode',
            'POST /api/upload'
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`CodeVault Backend Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('Available endpoints:');
    console.log('  GET  / - Server info');
    console.log('  GET  /api/health - Health check');
    console.log('  POST /api/encode - Encode messages');
    console.log('  POST /api/decode - Decode messages');
    console.log('  POST /api/upload - Upload text files');
});

module.exports = app;