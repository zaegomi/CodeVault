const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration - Permissive for development
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] // Replace with your production domain
        : true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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

// OpenAI Integration Class
class OpenAITextGenerator {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.baseURL = 'https://api.openai.com/v1/chat/completions';
    }

    async generateCarrierText(options) {
        const { message, topic, method, style, length } = options;
        
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
        }

        const prompt = this.buildPrompt(message, topic, method, style, length);
        
        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a professional writer creating carrier text for steganographic purposes. Your text should be natural, engaging, and optimized for the specified encoding method while maintaining authenticity.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: this.calculateTokens(length),
                    temperature: 0.7,
                    top_p: 0.9
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            return {
                text: data.choices[0]?.message?.content || '',
                usage: data.usage,
                model: data.model
            };
        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw new Error(`Failed to generate text: ${error.message}`);
        }
    }

    buildPrompt(message, topic, method, style, length) {
        const methodInstructions = {
            'els': `Create text with consistent letter patterns and adequate spacing for Equidistant Letter Sequence encoding. Ensure the text is at least ${message.length * 3} characters long with regular word distribution.`,
            'acrostic': `Write exactly ${message.length} lines of text where each line can naturally start with any letter. Focus on creating meaningful, flowing content that works well when first letters are modified.`,
            'punctuation': `Create text with natural punctuation marks (periods and exclamation points) distributed throughout. Include multiple sentences with varied punctuation patterns to accommodate binary encoding.`,
            'null': `Write text with at least ${message.length} words, ensuring each word can naturally begin with different letters. Focus on creating flowing, natural language that maintains readability when first letters are modified.`
        };

        const styleInstructions = {
            'academic': 'Write in formal academic style with sophisticated vocabulary and complex sentence structures.',
            'casual': 'Use conversational, friendly tone with everyday language and informal expressions.',
            'business': 'Employ professional business language with clear, direct communication.',
            'creative': 'Use imaginative, descriptive language with literary elements and creative expression.',
            'news': 'Write in journalistic style with factual reporting tone and news article structure.'
        };

        return `Create a ${length}-word text about "${topic}" in ${style} style.

Requirements:
- ${methodInstructions[method] || 'Create natural, flowing text suitable for steganographic encoding.'}
- ${styleInstructions[style] || 'Use appropriate writing style.'}
- Make the content engaging and authentic
- Ensure the text flows naturally and maintains reader interest
- Focus on the topic: ${topic}

Do not mention steganography, encoding, or hidden messages. Write only the carrier text content.`;
    }

    calculateTokens(wordCount) {
        // Rough estimation: 1 word ≈ 1.3 tokens
        return Math.min(Math.max(wordCount * 2, 150), 2000);
    }

    // Fallback text generator when OpenAI is unavailable
    generateFallbackText(options) {
        const { message, topic, method, style, length } = options;
        
        const templates = {
            academic: [
                "Recent studies in the field of {{topic}} have demonstrated significant advancements in our understanding.",
                "Researchers continue to explore the implications of {{topic}} on modern society.",
                "The analysis reveals important patterns that contribute to our knowledge base."
            ],
            casual: [
                "Hey there! Let me tell you about {{topic}} and why it's pretty interesting.",
                "So I was thinking about {{topic}} the other day, and it got me wondering.",
                "You know what's cool about {{topic}}? There's so much to discover."
            ],
            business: [
                "Our comprehensive analysis of {{topic}} indicates substantial market opportunities.",
                "The strategic implementation of {{topic}}-related initiatives will drive growth.",
                "Key performance indicators suggest that {{topic}} remains a priority focus area."
            ]
        };

        const selectedTemplates = templates[style] || templates.academic;
        let text = '';
        
        while (text.split(' ').length < length) {
            const template = selectedTemplates[Math.floor(Math.random() * selectedTemplates.length)];
            const sentence = template.replace(/\{\{topic\}\}/g, topic);
            text += sentence + ' ';
        }

        return text.trim().split(' ').slice(0, length).join(' ') + '.';
    }
}

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

// Initialize OpenAI generator
const aiGenerator = new OpenAITextGenerator();

// API Routes
app.get('/', (req, res) => {
    res.json({
        message: 'CodeVault Backend Server',
        version: '2.0.0',
        status: 'Running',
        features: ['AI Text Generation', 'Steganography Encoding', 'Security Analysis'],
        endpoints: [
            'POST /api/generate-carrier-text - Generate AI-powered carrier text',
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
        uptime: process.uptime(),
        openai_configured: !!process.env.OPENAI_API_KEY
    });
});

// NEW: AI Text Generation Endpoint
app.post('/api/generate-carrier-text', async (req, res) => {
    try {
        const { message, topic, method, style, length } = req.body;

        // Validation
        if (!message || !topic || !method) {
            return res.status(400).json({
                error: 'Missing required fields: message, topic, method'
            });
        }

        if (message.length > 500) {
            return res.status(400).json({
                error: 'Message too long. Maximum 500 characters allowed.'
            });
        }

        const validMethods = ['els', 'acrostic', 'punctuation', 'null'];
        if (!validMethods.includes(method)) {
            return res.status(400).json({
                error: 'Invalid method. Must be one of: ' + validMethods.join(', ')
            });
        }

        // Set defaults
        const options = {
            message,
            topic: topic || 'general discussion',
            method,
            style: style || 'casual',
            length: Math.max(length || 200, message.length * 5) // Ensure adequate length
        };

        let result;
        try {
            // Try OpenAI first
            result = await aiGenerator.generateCarrierText(options);
            result.source = 'openai';
        } catch (error) {
            console.warn('OpenAI generation failed, using fallback:', error.message);
            // Fall back to template-based generation
            result = {
                text: aiGenerator.generateFallbackText(options),
                source: 'fallback',
                usage: null,
                model: 'template-based'
            };
        }

        // Validate generated text is suitable for the chosen method
        const validation = validateTextForMethod(result.text, method, message);
        
        res.json({
            success: true,
            carrierText: result.text,
            metadata: {
                topic: options.topic,
                method: options.method,
                style: options.style,
                requestedLength: options.length,
                actualWordCount: result.text.split(' ').length,
                source: result.source,
                model: result.model,
                usage: result.usage,
                validation: validation
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Text generation error:', error);
        res.status(500).json({
            error: 'Failed to generate carrier text',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Helper function to validate generated text
function validateTextForMethod(text, method, message) {
    const validation = {
        suitable: true,
        warnings: [],
        recommendations: []
    };

    switch (method) {
        case 'els':
            const letters = text.replace(/[^a-zA-Z]/g, '').length;
            const required = message.length * 3;
            if (letters < required) {
                validation.suitable = false;
                validation.warnings.push(`Text has ${letters} letters but needs ${required} for secure ELS encoding`);
            }
            break;
            
        case 'acrostic':
            const lines = text.split('\n').length;
            if (lines < message.length) {
                validation.warnings.push(`Text has ${lines} lines but needs ${message.length} for acrostic method`);
                validation.recommendations.push('Consider splitting sentences into separate lines');
            }
            break;
            
        case 'punctuation':
            const punctuation = (text.match(/[.!]/g) || []).length;
            const bitsNeeded = message.length * 8;
            if (punctuation < bitsNeeded / 2) {
                validation.warnings.push('Text may need more punctuation marks for binary encoding');
            }
            break;
            
        case 'null':
            const words = text.split(/\s+/).length;
            if (words < message.length) {
                validation.suitable = false;
                validation.warnings.push(`Text has ${words} words but needs ${message.length} for null cipher`);
            }
            break;
    }

    return validation;
}

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
            'POST /api/generate-carrier-text',
            'POST /api/encode',
            'POST /api/decode',
            'POST /api/upload'
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`CodeVault Backend Server v2.0 running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`OpenAI API: ${process.env.OPENAI_API_KEY ? '✓ Configured' : '✗ Not configured'}`);
    console.log('Available endpoints:');
    console.log('  GET  / - Server info');
    console.log('  GET  /api/health - Health check');
    console.log('  POST /api/generate-carrier-text - AI text generation');
    console.log('  POST /api/encode - Encode messages');
    console.log('  POST /api/decode - Decode messages');
    console.log('  POST /api/upload - Upload text files');
});

module.exports = app;