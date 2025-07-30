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
        const cleanMessage = message.toLowerCase().replace(/[^a-z]/g, '');
        
        let methodPrompt = '';
        
        switch (method) {
            case 'els':
                // For ELS, we need the letters to appear naturally at intervals
                const letterString = cleanMessage.split('').join(', ');
                methodPrompt = `Write naturally flowing text about "${topic}" that organically contains these letters distributed throughout: ${letterString}. The text should be approximately ${length} words and feel completely natural. Don't force these letters - let them appear as part of normal vocabulary and natural word choices. Focus on quality content about ${topic} while ensuring good letter distribution throughout the text.`;
                break;
                
            case 'acrostic':
                // For acrostic, generate text that naturally starts lines with target letters
                const targetLetters = cleanMessage.split('');
                methodPrompt = `Write a ${cleanMessage.length}-paragraph text about "${topic}" where each paragraph naturally begins with words starting with these letters in order: ${targetLetters.join(', ').toUpperCase()}. Each paragraph should be substantial (3-4 sentences) and flow naturally into the next. The content should focus entirely on ${topic} and read as a cohesive piece. Make the letter choices feel completely natural - choose words that would normally start paragraphs about this topic.`;
                break;
                
            case 'punctuation':
                // For punctuation, we need strategic but natural punctuation use
                const sentenceCount = Math.max(8, Math.floor(message.length / 2));
                methodPrompt = `Write engaging text about "${topic}" using exactly ${sentenceCount} sentences with varied lengths and natural punctuation. Use a mix of declarative sentences (ending with periods) and exciting/emphatic statements (ending with exclamation marks). The punctuation should feel completely natural to the content - use exclamation marks for emphasis, excitement, or strong statements, and periods for regular statements. Focus on creating compelling content about ${topic}.`;
                break;
                
            case 'null':
                // For null cipher, we need exactly the right number of meaningful words
                const wordCount = cleanMessage.length;
                methodPrompt = `Write exactly ${wordCount} words about "${topic}". Each word should be meaningful and substantial (avoid articles like 'a', 'an', 'the' and short prepositions). Create a flowing, descriptive piece where every word counts and contributes to painting a vivid picture of ${topic}. Use strong nouns, vivid adjectives, and powerful verbs. The text should read as polished, professional content despite the word limit.`;
                break;
        }

        const styleInstructions = {
            'academic': 'Use formal academic tone with sophisticated vocabulary, complex sentence structures, and scholarly language.',
            'casual': 'Write in a conversational, friendly tone with everyday language and natural expressions.',
            'business': 'Employ professional business language with clear, direct communication and industry-appropriate terminology.',
            'creative': 'Use imaginative, descriptive language with literary elements, metaphors, and creative expression.',
            'news': 'Write in journalistic style with factual reporting tone, clear structure, and informative content.'
        };

        return `Create compelling content about "${topic}" in ${style} style.

CONTENT REQUIREMENTS:
${methodPrompt}

STYLE REQUIREMENTS:
${styleInstructions[style] || 'Use appropriate professional writing style.'}

QUALITY STANDARDS:
- Make the content genuinely engaging and informative about ${topic}
- Ensure natural flow and readability
- Use varied vocabulary and sentence structures
- The text should feel authentic and professionally written
- Focus on delivering real value to readers interested in ${topic}

Write only the content - no meta-commentary about the writing process.`;
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

// Text optimization function (define before using it)
function optimizeTextForMethod(text, method, message) {
    const cleanMessage = message.toLowerCase().replace(/[^a-z]/g, '');
    
    switch (method) {
        case 'acrostic':
            // Split into paragraphs and ensure we have enough
            let paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
            
            // If we have paragraph breaks, use those; otherwise try sentence breaks
            if (paragraphs.length < cleanMessage.length) {
                paragraphs = text.split(/\.(?:\s+[A-Z])/);
                if (paragraphs.length > 1) {
                    // Reconstruct sentences properly
                    for (let i = 0; i < paragraphs.length - 1; i++) {
                        paragraphs[i] += '.';
                    }
                }
            }
            
            // Ensure we have enough content blocks
            while (paragraphs.length < cleanMessage.length) {
                const contextualSentences = [
                    'Additionally, this perspective offers valuable insights into the subject matter.',
                    'Furthermore, experts continue to explore new dimensions of this field.',
                    'Moreover, recent developments have enhanced our understanding significantly.',
                    'Therefore, continued research remains essential for progress.',
                    'Consequently, these findings contribute to broader knowledge.',
                    'Subsequently, new opportunities emerge for further investigation.',
                    'Nevertheless, challenges persist that require innovative solutions.',
                    'Ultimately, these advances benefit society in meaningful ways.',
                    'Indeed, the implications extend far beyond initial expectations.',
                    'Obviously, such developments warrant careful consideration and study.'
                ];
                
                const randomSentence = contextualSentences[paragraphs.length % contextualSentences.length];
                paragraphs.push(randomSentence);
            }
            
            return paragraphs.slice(0, cleanMessage.length).join('\n\n');
            
        case 'null':
            // For null cipher, ensure exactly the right number of quality words
            const words = text.split(/\s+/).filter(word => word.length > 0);
            const neededWords = cleanMessage.length;
            
            if (words.length < neededWords) {
                // Add sophisticated filler words that fit the context
                const contextualWords = [
                    'innovation', 'development', 'advancement', 'progress', 'achievement',
                    'excellence', 'quality', 'effectiveness', 'efficiency', 'optimization',
                    'enhancement', 'improvement', 'refinement', 'sophistication', 'integration',
                    'collaboration', 'partnership', 'synergy', 'methodology', 'framework'
                ];
                
                while (words.length < neededWords) {
                    words.push(contextualWords[words.length % contextualWords.length]);
                }
            }
            
            // Ensure we have exactly the needed number of words
            const finalWords = words.slice(0, neededWords);
            return finalWords.join(' ') + '.';
            
        case 'punctuation':
            // For punctuation method, ensure natural but adequate punctuation
            let modifiedText = text;
            
            // Count existing punctuation
            const existingPunct = (modifiedText.match(/[.!]/g) || []).length;
            const needed = Math.max(message.length * 8, 32); // Minimum reasonable amount
            
            if (existingPunct < needed) {
                // Add some natural exclamation points for emphasis
                modifiedText = modifiedText.replace(/\. (This|These|It|They|Such|What|How)/g, '! $1');
                modifiedText = modifiedText.replace(/\. (Clearly|Obviously|Certainly|Indeed|Absolutely)/g, '! $1');
            }
            
            return modifiedText;
            
        default:
            return text;
    }
}

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
            
            // Post-process the AI generated text for better encoding compatibility
            result.text = optimizeTextForMethod(result.text, options.method, options.message);
            
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

// Text optimization function
app.optimizeTextForMethod = function(text, method, message) {
    const cleanMessage = message.toLowerCase().replace(/[^a-z]/g, '');
    
    switch (method) {
        case 'acrostic':
            // Ensure we have enough lines and they start with letters
            const lines = text.split('\n').filter(line => line.trim().length > 0);
            const neededLines = cleanMessage.length;
            
            if (lines.length < neededLines) {
                // Add additional lines
                const additionalLines = [
                    'Furthermore, this analysis reveals important insights.',
                    'Additionally, we can observe significant patterns.',
                    'Moreover, these findings suggest compelling conclusions.',
                    'Therefore, the evidence supports our understanding.',
                    'Consequently, we gain valuable perspective.',
                    'Subsequently, the implications become clear.',
                    'Nevertheless, further investigation remains valuable.',
                    'Ultimately, these discoveries enhance our knowledge.'
                ];
                
                while (lines.length < neededLines) {
                    lines.push(additionalLines[lines.length % additionalLines.length]);
                }
            }
            
            return lines.slice(0, neededLines).join('\n');
            
        case 'null':
            // Ensure we have enough words
            const words = text.split(/\s+/).filter(word => word.length > 0);
            const neededWords = cleanMessage.length;
            
            if (words.length < neededWords) {
                // Add quality filler words
                const fillerWords = [
                    'additionally', 'furthermore', 'moreover', 'therefore', 'consequently',
                    'subsequently', 'nevertheless', 'however', 'meanwhile', 'ultimately',
                    'specifically', 'particularly', 'especially', 'notably', 'significantly'
                ];
                
                while (words.length < neededWords) {
                    words.push(fillerWords[words.length % fillerWords.length]);
                }
            }
            
            return words.slice(0, neededWords).join(' ');
            
        default:
            return text;
    }
};

// Helper function to validate generated text
function validateTextForMethod(text, method, message) {
    const validation = {
        suitable: true,
        warnings: [],
        recommendations: [],
        score: 0
    };

    const cleanMessage = message.toLowerCase().replace(/[^a-z]/g, '');

    switch (method) {
        case 'els':
            const letters = text.replace(/[^a-zA-Z]/g, '').length;
            const required = cleanMessage.length * 5; // More conservative requirement
            if (letters < required) {
                validation.suitable = false;
                validation.warnings.push(`Text has ${letters} letters but needs ${required} for secure ELS encoding`);
                validation.score = Math.max(0, (letters / required) * 100);
            } else {
                validation.score = Math.min(100, (letters / required) * 100);
                if (letters > required * 2) {
                    validation.score = 95; // Very good
                    validation.recommendations.push('Excellent letter density for ELS encoding');
                }
            }
            break;
            
        case 'acrostic':
            const lines = text.split('\n').filter(line => line.trim().length > 0);
            if (lines.length < cleanMessage.length) {
                validation.suitable = false;
                validation.warnings.push(`Text has ${lines.length} lines but needs ${cleanMessage.length} for acrostic method`);
                validation.score = (lines.length / cleanMessage.length) * 100;
            } else {
                validation.score = 100;
                // Check if first letters can be easily modified
                let modifiableLines = 0;
                for (let i = 0; i < Math.min(lines.length, cleanMessage.length); i++) {
                    const firstLetter = lines[i].match(/[a-zA-Z]/);
                    if (firstLetter) modifiableLines++;
                }
                validation.score = (modifiableLines / cleanMessage.length) * 100;
                if (validation.score === 100) {
                    validation.recommendations.push('Perfect acrostic structure');
                }
            }
            break;
            
        case 'punctuation':
            const punctuation = (text.match(/[.!]/g) || []).length;
            const bitsNeeded = cleanMessage.length * 8;
            if (punctuation < bitsNeeded / 2) {
                validation.warnings.push(`Text has ${punctuation} punctuation marks but may need up to ${bitsNeeded} for binary encoding`);
                validation.score = (punctuation / (bitsNeeded / 2)) * 100;
            } else {
                validation.score = Math.min(100, (punctuation / bitsNeeded) * 100);
                if (punctuation >= bitsNeeded) {
                    validation.recommendations.push('Excellent punctuation density for binary encoding');
                }
            }
            break;
            
        case 'null':
            const words = text.split(/\s+/).filter(word => word.length > 0);
            if (words.length < cleanMessage.length) {
                validation.suitable = false;
                validation.warnings.push(`Text has ${words.length} words but needs ${cleanMessage.length} for null cipher`);
                validation.score = (words.length / cleanMessage.length) * 100;
            } else {
                validation.score = 100;
                // Check word quality
                let qualityWords = 0;
                for (let i = 0; i < Math.min(words.length, cleanMessage.length); i++) {
                    const word = words[i];
                    if (word.length > 2 && word.match(/[a-zA-Z]/)) {
                        qualityWords++;
                    }
                }
                validation.score = (qualityWords / cleanMessage.length) * 100;
                if (validation.score > 90) {
                    validation.recommendations.push('High-quality words suitable for null cipher');
                }
            }
            break;
    }

    validation.score = Math.round(validation.score);
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