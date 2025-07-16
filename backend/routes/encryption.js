const express = require('express');
const router = express.Router();
const { 
    encodeELS, 
    encodeAcrostic, 
    encodePunctuation, 
    encodeNullCipher,
    analyzeELS,
    analyzeAcrostic,
    analyzePunctuation,
    analyzeNullCipher,
    calculateSecurityMetrics 
} = require('../utils/encoders');

// Input validation middleware
const validateEncodeInput = (req, res, next) => {
    const { message, carrierText, method } = req.body;
    
    if (!message || typeof message !== 'string') {
        return res.status(400).json({
            error: 'Invalid input',
            message: 'Message is required and must be a string'
        });
    }
    
    if (!carrierText || typeof carrierText !== 'string') {
        return res.status(400).json({
            error: 'Invalid input',
            message: 'Carrier text is required and must be a string'
        });
    }
    
    if (!method || !['els', 'acrostic', 'punctuation', 'null-cipher'].includes(method)) {
        return res.status(400).json({
            error: 'Invalid input',
            message: 'Method must be one of: els, acrostic, punctuation, null-cipher'
        });
    }
    
    if (message.length > 1000) {
        return res.status(400).json({
            error: 'Invalid input',
            message: 'Message too long (max 1000 characters)'
        });
    }
    
    if (carrierText.length > 100000) {
        return res.status(400).json({
            error: 'Invalid input',
            message: 'Carrier text too long (max 100,000 characters)'
        });
    }
    
    next();
};

const validateDecodeInput = (req, res, next) => {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
        return res.status(400).json({
            error: 'Invalid input',
            message: 'Text is required and must be a string'
        });
    }
    
    if (text.length > 100000) {
        return res.status(400).json({
            error: 'Invalid input',
            message: 'Text too long (max 100,000 characters)'
        });
    }
    
    next();
};

// POST /api/encryption/encode
router.post('/encode', validateEncodeInput, async (req, res) => {
    try {
        const { message, carrierText, method, securityLevel = 'medium' } = req.body;
        
        console.log(`Encoding request: ${method} method, message length: ${message.length}, carrier length: ${carrierText.length}`);
        
        let result;
        
        switch (method) {
            case 'els':
                result = await encodeELS(message, carrierText, securityLevel);
                break;
            case 'acrostic':
                result = await encodeAcrostic(message, carrierText, securityLevel);
                break;
            case 'punctuation':
                result = await encodePunctuation(message, carrierText, securityLevel);
                break;
            case 'null-cipher':
                result = await encodeNullCipher(message, carrierText, securityLevel);
                break;
            default:
                return res.status(400).json({
                    error: 'Invalid method',
                    message: 'Unsupported encoding method'
                });
        }
        
        // Add security analysis
        result.security = calculateSecurityMetrics(message, carrierText, method, result.positions || []);
        
        res.json({
            success: true,
            result: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Encoding error:', error);
        res.status(500).json({
            error: 'Encoding failed',
            message: error.message
        });
    }
});

// POST /api/encryption/decode
router.post('/decode', validateDecodeInput, async (req, res) => {
    try {
        const { text, method, parameters = {} } = req.body;
        
        console.log(`Decoding request: ${method || 'auto'} method, text length: ${text.length}`);
        
        let results = [];
        
        if (method === 'auto' || !method) {
            // Try all methods
            const [elsResults, acrosticResults, punctuationResults, nullResults] = await Promise.all([
                analyzeELS(text, parameters.skipDistance, parameters.startPosition),
                analyzeAcrostic(text),
                analyzePunctuation(text),
                analyzeNullCipher(text)
            ]);
            
            results = [...elsResults, ...acrosticResults, ...punctuationResults, ...nullResults];
        } else {
            // Use specific method
            switch (method) {
                case 'els':
                    results = await analyzeELS(text, parameters.skipDistance, parameters.startPosition);
                    break;
                case 'acrostic':
                    results = await analyzeAcrostic(text);
                    break;
                case 'punctuation':
                    results = await analyzePunctuation(text);
                    break;
                case 'null-cipher':
                    results = await analyzeNullCipher(text);
                    break;
                default:
                    return res.status(400).json({
                        error: 'Invalid method',
                        message: 'Unsupported decoding method'
                    });
            }
        }
        
        // Sort by confidence and limit results
        results.sort((a, b) => b.confidence - a.confidence);
        results = results.slice(0, 20); // Limit to top 20 results
        
        res.json({
            success: true,
            results: results,
            totalFound: results.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Decoding error:', error);
        res.status(500).json({
            error: 'Decoding failed',
            message: error.message
        });
    }
});

// POST /api/encryption/analyze
router.post('/analyze', validateDecodeInput, async (req, res) => {
    try {
        const { text } = req.body;
        
        console.log(`Analysis request: text length: ${text.length}`);
        
        // Text statistics
        const stats = {
            characters: text.length,
            charactersNoSpaces: text.replace(/\s/g, '').length,
            words: text.split(/\s+/).filter(word => word.length > 0).length,
            sentences: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
            paragraphs: text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
            lines: text.split('\n').length,
            letters: text.replace(/[^A-Za-z]/g, '').length,
            punctuation: (text.match(/[.!?,:;]/g) || []).length
        };
        
        // Encoding capacity estimates
        const capacity = {
            els: Math.floor(stats.letters / 10), // Conservative estimate
            acrostic: Math.min(stats.lines, stats.sentences),
            punctuation: Math.floor(stats.punctuation / 8), // 8 bits per character
            nullCipher: Math.min(stats.words, 100) // Limit for readability
        };
        
        // Language detection (basic)
        const letterFreq = {};
        const letters = text.toUpperCase().replace(/[^A-Z]/g, '');
        for (const letter of letters) {
            letterFreq[letter] = (letterFreq[letter] || 0) + 1;
        }
        
        // Calculate letter frequency percentages
        const totalLetters = letters.length;
        for (const letter in letterFreq) {
            letterFreq[letter] = (letterFreq[letter] / totalLetters * 100).toFixed(1);
        }
        
        res.json({
            success: true,
            analysis: {
                statistics: stats,
                capacity: capacity,
                letterFrequency: letterFreq,
                recommendations: generateRecommendations(stats, capacity)
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            error: 'Analysis failed',
            message: error.message
        });
    }
});

// GET /api/encryption/methods
router.get('/methods', (req, res) => {
    res.json({
        success: true,
        methods: {
            'els': {
                name: 'Equidistant Letter Sequence',
                description: 'Hides messages by placing letters at regular intervals',
                minCarrierLength: 100,
                maxMessageLength: 500,
                securityLevel: 'High'
            },
            'acrostic': {
                name: 'Acrostic Method',
                description: 'Uses first letters of lines to spell message',
                minCarrierLength: 50,
                maxMessageLength: 100,
                securityLevel: 'Medium'
            },
            'punctuation': {
                name: 'Punctuation Pattern',
                description: 'Encodes messages in punctuation marks',
                minCarrierLength: 200,
                maxMessageLength: 100,
                securityLevel: 'Low'
            },
            'null-cipher': {
                name: 'Null Cipher',
                description: 'Hides messages in first letters of words',
                minCarrierLength: 100,
                maxMessageLength: 200,
                securityLevel: 'Medium'
            }
        }
    });
});

// GET /api/encryption/status
router.get('/status', (req, res) => {
    res.json({
        success: true,
        status: 'operational',
        features: {
            encoding: true,
            decoding: true,
            analysis: true,
            multipleMethodsㅅ: true,
            securityAnalysis: true
        },
        limits: {
            maxMessageLength: 1000,
            maxCarrierLength: 100000,
            maxResultsReturned: 20
        },
        version: '1.0.0'
    });
});

// Helper function to generate recommendations
function generateRecommendations(stats, capacity) {
    const recommendations = [];
    
    if (stats.characters < 500) {
        recommendations.push('Text is quite short. Consider using longer carrier text for better security.');
    }
    
    if (capacity.els < 10) {
        recommendations.push('Limited ELS capacity. Add more text for longer messages.');
    }
    
    if (capacity.punctuation < 5) {
        recommendations.push('Low punctuation count. Add more sentences for punctuation-based encoding.');
    }
    
    if (stats.lines < 10) {
        recommendations.push('Few lines available. Break text into more lines for acrostic method.');
    }
    
    if (stats.words < 50) {
        recommendations.push('Limited word count. Add more text for null cipher method.');
    }
    
    // Suggest best method
    const bestMethod = Object.keys(capacity).reduce((a, b) => 
        capacity[a] > capacity[b] ? a : b
    );
    
    recommendations.push(`Recommended method: ${bestMethod} (capacity: ${capacity[bestMethod]} characters)`);
    
    return recommendations;
}

module.exports = router;