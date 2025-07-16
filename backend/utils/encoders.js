// CodeVault Backend - Encoding/Decoding Utilities
// Contains all steganographic algorithms and analysis functions

/**
 * ELS (Equidistant Letter Sequence) Encoding
 * Hides message by placing letters at regular intervals
 */
async function encodeELS(message, carrierText, securityLevel = 'medium') {
    const cleanMessage = message.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanCarrier = carrierText.replace(/[^A-Za-z]/g, '');
    
    if (cleanCarrier.length < cleanMessage.length * 3) {
        throw new Error('Carrier text too short for ELS encoding. Need at least 3x message length.');
    }

    // Calculate skip distance based on security level
    let baseSkip = Math.floor(cleanCarrier.length / cleanMessage.length);
    const securityMultiplier = { light: 1, medium: 1.5, heavy: 2.5 };
    const skipDistance = Math.max(2, Math.floor(baseSkip * securityMultiplier[securityLevel]));

    let encodedText = carrierText.split('');
    let carrierIndex = 0;
    let messageIndex = 0;
    let positions = [];

    // Replace letters at calculated intervals
    for (let i = 0; i < encodedText.length && messageIndex < cleanMessage.length; i++) {
        if (/[A-Za-z]/.test(encodedText[i])) {
            if (carrierIndex % skipDistance === 0 && messageIndex < cleanMessage.length) {
                const originalChar = encodedText[i];
                const newChar = encodedText[i].match(/[A-Z]/) ? 
                    cleanMessage[messageIndex] : cleanMessage[messageIndex].toLowerCase();
                
                encodedText[i] = newChar;
                positions.push({ 
                    position: i, 
                    original: originalChar, 
                    encoded: newChar,
                    letterIndex: carrierIndex,
                    messageIndex: messageIndex
                });
                messageIndex++;
            }
            carrierIndex++;
        }
    }

    if (messageIndex < cleanMessage.length) {
        throw new Error(`Could only encode ${messageIndex}/${cleanMessage.length} characters. Use longer carrier text.`);
    }

    return {
        encodedText: encodedText.join(''),
        method: 'Equidistant Letter Sequence (ELS)',
        skipDistance: skipDistance,
        messageLength: cleanMessage.length,
        startPosition: 0,
        positions: positions,
        originalMessage: message,
        encodingEfficiency: (messageIndex / cleanMessage.length * 100).toFixed(1) + '%'
    };
}

/**
 * Acrostic Encoding
 * Uses first letters of lines to spell message
 */
async function encodeAcrostic(message, carrierText, securityLevel = 'medium') {
    const cleanMessage = message.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let lines = carrierText.split('\n').filter(line => line.trim().length > 0);
    
    // Generate additional lines if needed
    const fillerLines = [
        'The art of communication is the language of leadership.',
        'Every moment is a fresh beginning.',
        'Success is not final, failure is not fatal.',
        'Innovation distinguishes between a leader and a follower.',
        'The journey of a thousand miles begins with one step.',
        'Quality is not an act, it is a habit.',
        'Believe you can and you are halfway there.',
        'The only way to do great work is to love what you do.',
        'Life is what happens to you while you are busy making other plans.',
        'The future belongs to those who believe in the beauty of their dreams.',
        'It is during our darkest moments that we must focus to see the light.',
        'The way to get started is to quit talking and begin doing.',
        'Your time is limited, so do not waste it living someone else\'s life.',
        'If life were predictable it would cease to be life, and be without flavor.',
        'If you look at what you have in life, you will always have more.',
        'If you set your goals ridiculously high and it is a failure, you will fail above everyone else\'s success.',
        'Life is really simple, but we insist on making it complicated.',
        'This above all: to thine own self be true.',
        'Be yourself; everyone else is already taken.',
        'Two things are infinite: the universe and human stupidity; and I am not sure about the universe.'
    ];
    
    // Add lines if needed
    while (lines.length < cleanMessage.length) {
        const randomLine = fillerLines[Math.floor(Math.random() * fillerLines.length)];
        lines.push(randomLine);
    }

    const encodedLines = lines.map((line, index) => {
        if (index < cleanMessage.length && line.trim().length > 0) {
            const firstChar = cleanMessage[index];
            const restOfLine = line.substring(1);
            return firstChar + restOfLine;
        }
        return line;
    });

    const positions = cleanMessage.split('').map((char, index) => ({
        line: index,
        character: char,
        position: 0,
        originalFirstChar: lines[index] ? lines[index][0] : ''
    }));

    return {
        encodedText: encodedLines.join('\n'),
        method: 'Acrostic (First Letters)',
        messageLength: cleanMessage.length,
        linesUsed: cleanMessage.length,
        linesAdded: Math.max(0, cleanMessage.length - lines.length),
        positions: positions,
        originalMessage: message
    };
}

/**
 * Punctuation Pattern Encoding
 * Encodes message in punctuation marks using binary representation
 */
async function encodePunctuation(message, carrierText, securityLevel = 'medium') {
    // Convert message to binary
    const binaryMessage = message.split('').map(char => 
        char.charCodeAt(0).toString(2).padStart(8, '0')
    ).join('');
    
    let encodedText = carrierText;
    let binaryIndex = 0;
    let positions = [];
    let replacements = 0;
    
    // Map punctuation based on security level
    const punctuationMaps = {
        light: { '0': '.', '1': '!' },
        medium: { '0': '.', '1': '!' },
        heavy: { '0': '.', '1': '?', '2': '!' } // Could extend for more complex encoding
    };
    
    const punctMap = punctuationMaps[securityLevel] || punctuationMaps.medium;
    
    // Replace punctuation based on binary
    encodedText = encodedText.replace(/[.!?,:;]/g, (match, offset) => {
        if (binaryIndex < binaryMessage.length) {
            const bit = binaryMessage[binaryIndex++];
            const newPunct = punctMap[bit] || match;
            positions.push({ 
                position: offset, 
                original: match, 
                encoded: newPunct, 
                bit: bit,
                charIndex: Math.floor((binaryIndex - 1) / 8),
                bitIndex: (binaryIndex - 1) % 8
            });
            replacements++;
            return newPunct;
        }
        return match;
    });

    const encodingComplete = binaryIndex >= binaryMessage.length;
    
    if (!encodingComplete) {
        throw new Error(`Insufficient punctuation marks. Encoded ${binaryIndex}/${binaryMessage.length} bits. Add more sentences.`);
    }

    return {
        encodedText: encodedText,
        method: 'Punctuation Pattern',
        messageLength: message.length,
        bitsEncoded: binaryIndex,
        binaryLength: binaryMessage.length,
        replacements: replacements,
        positions: positions,
        originalMessage: message,
        encodingComplete: encodingComplete
    };
}

/**
 * Null Cipher Encoding
 * Hides message in first letters of words
 */
async function encodeNullCipher(message, carrierText, securityLevel = 'medium') {
    const words = carrierText.split(/\s+/).filter(word => word.length > 0);
    const cleanMessage = message.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (words.length < cleanMessage.length) {
        throw new Error(`Not enough words in carrier text. Need ${cleanMessage.length} words, have ${words.length}.`);
    }

    const encodedWords = words.map((word, index) => {
        if (index < cleanMessage.length) {
            const firstChar = cleanMessage[index];
            const restOfWord = word.substring(1);
            return firstChar + restOfWord;
        }
        return word;
    });

    const positions = cleanMessage.split('').map((char, index) => ({
        word: index,
        character: char,
        position: 0,
        originalWord: words[index],
        modifiedWord: encodedWords[index]
    }));

    return {
        encodedText: encodedWords.join(' '),
        method: 'Null Cipher (Word Method)',
        messageLength: cleanMessage.length,
        wordsModified: cleanMessage.length,
        totalWords: words.length,
        positions: positions,
        originalMessage: message
    };
}

/**
 * ELS Analysis for Decoding
 * Searches text for potential ELS patterns
 */
async function analyzeELS(text, specificSkip = null, specificStart = 0) {
    const cleanText = text.replace(/[^A-Za-z]/g, '');
    const results = [];
    
    if (cleanText.length < 10) return results;
    
    const skipDistances = specificSkip ? [specificSkip] : [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 20, 25, 30];
    const startPositions = specificSkip ? [specificStart] : [0, 1, 2, 3, 4];
    
    for (const skip of skipDistances) {
        for (const start of startPositions) {
            if (start >= skip) continue;
            
            let sequence = '';
            let positions = [];
            
            for (let i = start; i < cleanText.length; i += skip) {
                sequence += cleanText[i].toUpperCase();
                positions.push(i);
                
                // Check for meaningful sequences
                if (sequence.length >= 3 && sequence.length <= 50) {
                    const confidence = calculateSequenceConfidence(sequence);
                    if (confidence > 25) {
                        // Check if we already have this sequence
                        const existing = results.find(r => 
                            r.message === sequence && 
                            r.skipDistance === skip && 
                            r.startPosition === start
                        );
                        
                        if (!existing) {
                            results.push({
                                message: sequence,
                                method: 'ELS',
                                confidence: confidence,
                                details: `Skip: ${skip}, Start: ${start}, Length: ${sequence.length}`,
                                positions: [...positions],
                                skipDistance: skip,
                                startPosition: start,
                                sequenceLength: sequence.length
                            });
                        }
                    }
                }
            }
        }
    }
    
    // Sort by confidence and return top results
    return results.sort((a, b) => b.confidence - a.confidence).slice(0, 15);
}

/**
 * Acrostic Analysis for Decoding
 */
async function analyzeAcrostic(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const results = [];
    
    if (lines.length < 3) return results;
    
    // Analyze first letters of lines
    let acrosticMessage = '';
    let positions = [];
    
    for (let i = 0; i < Math.min(lines.length, 100); i++) {
        const line = lines[i].trim();
        if (line.length > 0) {
            const firstChar = line[0];
            if (/[A-Za-z]/.test(firstChar)) {
                acrosticMessage += firstChar.toUpperCase();
                positions.push({ line: i, character: firstChar, lineText: line.substring(0, 50) + '...' });
            }
        }
    }
    
    if (acrosticMessage.length >= 3) {
        const confidence = calculateSequenceConfidence(acrosticMessage);
        if (confidence > 20) {
            results.push({
                message: acrosticMessage,
                method: 'Acrostic',
                confidence: confidence,
                details: `Lines analyzed: ${lines.length}, Message length: ${acrosticMessage.length}`,
                positions: positions,
                linesAnalyzed: lines.length,
                messageLength: acrosticMessage.length
            });
        }
    }
    
    return results;
}

/**
 * Punctuation Analysis for Decoding
 */
async function analyzePunctuation(text) {
    const results = [];
    const punctuationMarks = text.match(/[.!?]/g);
    
    if (!punctuationMarks || punctuationMarks.length < 8) return results;
    
    // Convert punctuation to binary (. = 0, ! and ? = 1)
    let binary = '';
    let positions = [];
    
    punctuationMarks.forEach((punct, index) => {
        const bit = punct === '.' ? '0' : '1';
        binary += bit;
        positions.push({ index, punctuation: punct, bit });
    });
    
    // Try to decode as ASCII if we have complete bytes
    if (binary.length >= 8) {
        const completeBytes = Math.floor(binary.length / 8);
        let decodedMessage = '';
        let validChars = 0;
        
        for (let i = 0; i < completeBytes; i++) {
            const byte = binary.slice(i * 8, (i + 1) * 8);
            const charCode = parseInt(byte, 2);
            
            if (charCode >= 32 && charCode <= 126) { // Printable ASCII
                decodedMessage += String.fromCharCode(charCode);
                validChars++;
            } else if (charCode === 0) {
                break; // Null terminator
            } else {
                // Invalid character, might not be intentional encoding
                if (i > 0) break; // Allow some invalid chars if we've already found valid ones
                decodedMessage = ''; // Reset if first char is invalid
                break;
            }
        }
        
        if (decodedMessage.length >= 2 && validChars >= 2) {
            const confidence = Math.min(calculateSequenceConfidence(decodedMessage) * 0.8, 85);
            results.push({
                message: decodedMessage,
                method: 'Punctuation Pattern',
                confidence: confidence,
                details: `Binary: ${binary.length} bits, Decoded: ${decodedMessage.length} chars, Valid: ${validChars}`,
                positions: positions.slice(0, decodedMessage.length * 8),
                binaryString: binary.slice(0, decodedMessage.length * 8),
                totalPunctuation: punctuationMarks.length
            });
        }
    }
    
    return results;
}

/**
 * Null Cipher Analysis for Decoding
 */
async function analyzeNullCipher(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const results = [];
    
    if (words.length < 5) return results;
    
    // Analyze first letters of words
    let nullMessage = '';
    let positions = [];
    
    for (let i = 0; i < Math.min(words.length, 200); i++) {
        const word = words[i];
        if (word.length > 0) {
            const firstChar = word[0];
            if (/[A-Za-z]/.test(firstChar)) {
                nullMessage += firstChar.toUpperCase();
                positions.push({ 
                    wordIndex: i, 
                    character: firstChar, 
                    word: word.length > 20 ? word.substring(0, 20) + '...' : word 
                });
            }
        }
    }
    
    if (nullMessage.length >= 3) {
        const confidence = calculateSequenceConfidence(nullMessage) * 0.7; // Lower confidence for null cipher
        if (confidence > 15) {
            results.push({
                message: nullMessage,
                method: 'Null Cipher',
                confidence: confidence,
                details: `Words analyzed: ${words.length}, Message length: ${nullMessage.length}`,
                positions: positions,
                wordsAnalyzed: words.length,
                messageLength: nullMessage.length
            });
        }
    }
    
    return results;
}

/**
 * Calculate confidence score for discovered sequences
 */
function calculateSequenceConfidence(sequence) {
    if (sequence.length < 2) return 0;
    
    let score = 0;
    const upperSeq = sequence.toUpperCase();
    
    // Common English words database
    const commonWords = new Set([
        'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR',
        'HAD', 'BY', 'WORD', 'OIL', 'ITS', 'NOW', 'FIND', 'LONG', 'DOWN', 'WAY', 'BEEN', 'CALL',
        'WHO', 'DID', 'GET', 'COME', 'MADE', 'MAY', 'PART', 'OVER', 'NEW', 'SOUND', 'TAKE', 'ONLY',
        'LITTLE', 'WORK', 'KNOW', 'PLACE', 'YEAR', 'LIVE', 'BACK', 'GIVE', 'MOST', 'VERY',
        'AFTER', 'THING', 'NAME', 'GOOD', 'SENTENCE', 'MAN', 'THINK', 'SAY', 'GREAT', 'WHERE',
        'HELP', 'THROUGH', 'MUCH', 'BEFORE', 'LINE', 'RIGHT', 'TOO', 'MEANS', 'OLD', 'ANY',
        'SAME', 'TELL', 'BOY', 'FOLLOW', 'CAME', 'WANT', 'SHOW', 'ALSO', 'AROUND',
        'FORM', 'THREE', 'SMALL', 'SET', 'PUT', 'END', 'WHY', 'AGAIN', 'TURN', 'HERE', 'OFF',
        'WENT', 'NUMBER', 'NO', 'WAY', 'COULD', 'PEOPLE', 'MY', 'THAN', 'FIRST', 'WATER',
        'MEET', 'HELP', 'CALL', 'STOP', 'WAIT', 'GO', 'YES', 'NO', 'OK', 'HI', 'BYE', 'LOVE',
        'HATE', 'LIKE', 'WANT', 'NEED', 'HAVE', 'WILL', 'CAN', 'MUST', 'SHOULD', 'WOULD',
        'COULD', 'MIGHT', 'SHALL', 'MAY', 'DO', 'DOES', 'DID', 'DONE', 'MAKE', 'MAKES', 'MADE',
        'SEE', 'SEES', 'SAW', 'SEEN', 'LOOK', 'LOOKS', 'LOOKED', 'COME', 'COMES', 'CAME',
        'TIME', 'HOUSE', 'HAND', 'EYE', 'LIFE', 'HEAD', 'SIDE', 'NIGHT', 'WORLD', 'FIND',
        'TELL', 'ASK', 'WORK', 'SEEM', 'FEEL', 'TRY', 'LEAVE', 'MOVE', 'LIVE', 'BELIEVE',
        'BRING', 'HAPPEN', 'WRITE', 'SIT', 'STAND', 'LOSE', 'PAY', 'MEET', 'INCLUDE',
        'CONTINUE', 'SET', 'LEARN', 'CHANGE', 'LEAD', 'UNDERSTAND', 'WATCH', 'FOLLOW',
        'STOP', 'CREATE', 'SPEAK', 'READ', 'ALLOW', 'ADD', 'SPEND', 'GROW', 'OPEN', 'WALK',
        'WIN', 'OFFER', 'REMEMBER', 'LOVE', 'CONSIDER', 'APPEAR', 'BUY', 'WAIT', 'SERVE',
        'DIE', 'SEND', 'EXPECT', 'BUILD', 'STAY', 'FALL', 'CUT', 'REACH', 'KILL', 'REMAIN'
    ]);
    
    // Check for exact word matches
    if (commonWords.has(upperSeq)) {
        score += 95;
    }
    
    // Check for partial matches and substrings
    let partialMatch = false;
    for (const word of commonWords) {
        if (word.includes(upperSeq) && upperSeq.length >= 3) {
            score += 75;
            partialMatch = true;
            break;
        }
        if (upperSeq.includes(word) && word.length >= 3) {
            score += 65;
            partialMatch = true;
            break;
        }
    }
    
    // English letter frequency analysis
    const englishFreq = {
        'E': 12.7, 'T': 9.1, 'A': 8.2, 'O': 7.5, 'I': 7.0, 'N': 6.7, 'S': 6.3, 'H': 6.1,
        'R': 6.0, 'D': 4.3, 'L': 4.0, 'C': 2.8, 'U': 2.8, 'M': 2.4, 'W': 2.4, 'F': 2.2,
        'G': 2.0, 'Y': 2.0, 'P': 1.9, 'B': 1.3, 'V': 1.0, 'K': 0.8, 'J': 0.15, 'X': 0.15,
        'Q': 0.10, 'Z': 0.07
    };
    
    // Calculate frequency score
    let freqScore = 0;
    for (const char of upperSeq) {
        if (englishFreq[char]) {
            freqScore += englishFreq[char];
        }
    }
    freqScore = (freqScore / upperSeq.length) * 3; // Normalize and weight
    score += Math.min(freqScore, 35);
    
    // Vowel-consonant ratio analysis
    const vowels = 'AEIOU';
    let vowelCount = 0;
    for (const char of upperSeq) {
        if (vowels.includes(char)) vowelCount++;
    }
    const vowelRatio = vowelCount / upperSeq.length;
    
    // English typically has 35-45% vowels
    if (vowelRatio >= 0.25 && vowelRatio <= 0.55) {
        score += 25;
    } else if (vowelRatio >= 0.15 && vowelRatio <= 0.65) {
        score += 15;
    }
    
    // Length considerations
    if (upperSeq.length >= 4 && upperSeq.length <= 12) {
        score += 15; // Sweet spot for meaningful words
    } else if (upperSeq.length >= 3) {
        score += 10;
    }
    
    // Penalize very long sequences without clear word boundaries
    if (upperSeq.length > 25) {
        score -= 30;
    } else if (upperSeq.length > 15) {
        score -= 15;
    }
    
    // Common bigrams and trigrams
    const commonBigrams = new Set([
        'TH', 'HE', 'IN', 'ER', 'AN', 'RE', 'ED', 'ND', 'ON', 'EN', 'AT', 'OU', 'IT', 'IS',
        'OR', 'TI', 'HI', 'ST', 'AR', 'NE', 'TE', 'HA', 'AS', 'TO', 'LL', 'LE', 'VE', 'CO'
    ]);
    
    const commonTrigrams = new Set([
        'THE', 'AND', 'ING', 'HER', 'HAT', 'HIS', 'THA', 'ERE', 'FOR', 'ENT', 'ION', 'TER',
        'WAS', 'YOU', 'ITH', 'VER', 'ALL', 'WIT', 'THI', 'TIO'
    ]);
    
    // Check bigrams
    for (let i = 0; i < upperSeq.length - 1; i++) {
        const bigram = upperSeq.slice(i, i + 2);
        if (commonBigrams.has(bigram)) {
            score += 8;
        }
    }
    
    // Check trigrams
    for (let i = 0; i < upperSeq.length - 2; i++) {
        const trigram = upperSeq.slice(i, i + 3);
        if (commonTrigrams.has(trigram)) {
            score += 12;
        }
    }
    
    // Pattern analysis - look for repeated letters (common in English)
    const letterCounts = {};
    for (const char of upperSeq) {
        letterCounts[char] = (letterCounts[char] || 0) + 1;
    }
    
    // Some repetition is normal, too much or too little is suspicious
    const uniqueLetters = Object.keys(letterCounts).length;
    const repetitionRatio = uniqueLetters / upperSeq.length;
    
    if (repetitionRatio >= 0.5 && repetitionRatio <= 0.85) {
        score += 10; // Good variety
    }
    
    // Check for common word patterns
    const commonPatterns = [
        /^[AEIOU]/,     // Starts with vowel
        /[AEIOU]$/,     // Ends with vowel
        /^[BCDFGHJKLMNPQRSTVWXYZ][AEIOU]/,  // Consonant-vowel start
        /ING$/,         // Common ending
        /ED$/,          // Past tense
        /ER$/,          // Comparative
        /LY$/,          // Adverb
        /ION$/          // Noun ending
    ];
    
    for (const pattern of commonPatterns) {
        if (pattern.test(upperSeq)) {
            score += 5;
        }
    }
    
    // Penalize sequences with unusual letter combinations
    const unusualCombos = ['QU', 'XZ', 'ZX', 'QW', 'ZQ', 'XQ'];
    for (const combo of unusualCombos) {
        if (upperSeq.includes(combo)) {
            score -= 20;
        }
    }
    
    // Bonus for sequences that look like common words or names
    if (/^[A-Z][a-z]*$/.test(sequence)) {
        score += 10; // Proper capitalization
    }
    
    return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate security metrics for encoded messages
 */
function calculateSecurityMetrics(message, carrierText, method, positions) {
    const metrics = {
        detectionRisk: 'Low',
        statisticalSecurity: 85,
        recommendations: []
    };

    const messageRatio = message.length / carrierText.length;
    const cleanCarrier = carrierText.replace(/[^A-Za-z]/g, '');
    
    // Base analysis on message-to-carrier ratio
    if (messageRatio > 0.15) {
        metrics.detectionRisk = 'Critical';
        metrics.statisticalSecurity = 25;
        metrics.recommendations.push('Message is too long relative to carrier text - very high detection risk');
    } else if (messageRatio > 0.08) {
        metrics.detectionRisk = 'High';
        metrics.statisticalSecurity = 45;
        metrics.recommendations.push('Consider using longer carrier text for better security');
    } else if (messageRatio > 0.04) {
        metrics.detectionRisk = 'Medium';
        metrics.statisticalSecurity = 65;
        metrics.recommendations.push('Reasonable security, but longer carrier text would be safer');
    } else {
        metrics.detectionRisk = 'Low';
        metrics.statisticalSecurity = 85;
    }

    // Method-specific analysis
    switch (method) {
        case 'els':
            if (positions && positions.length > 0) {
                // Calculate actual skip distance
                const avgSkip = positions.length > 1 ? 
                    Math.round((positions[positions.length - 1].letterIndex - positions[0].letterIndex) / (positions.length - 1)) : 
                    Math.floor(cleanCarrier.length / message.length);
                
                if (avgSkip < 5) {
                    metrics.recommendations.push('Skip distance is very low - easily detectable');
                    metrics.statisticalSecurity = Math.max(metrics.statisticalSecurity - 20, 20);
                } else if (avgSkip < 10) {
                    metrics.recommendations.push('Skip distance could be higher for better security');
                    metrics.statisticalSecurity = Math.max(metrics.statisticalSecurity - 10, 30);
                }
                
                // Check for regular patterns
                if (avgSkip === Math.floor(cleanCarrier.length / message.length)) {
                    metrics.recommendations.push('Consider using irregular skip patterns for advanced security');
                }
            }
            break;
            
        case 'acrostic':
            metrics.detectionRisk = metrics.detectionRisk === 'Low' ? 'Medium' : metrics.detectionRisk;
            metrics.statisticalSecurity = Math.max(metrics.statisticalSecurity - 15, 25);
            metrics.recommendations.push('Acrostic method is easily detectable by pattern analysis');
            metrics.recommendations.push('Best used for short messages or in combination with other methods');
            break;
            
        case 'punctuation':
            const punctCount = (carrierText.match(/[.!?]/g) || []).length;
            const bitsNeeded = message.length * 8;
            
            if (punctCount < bitsNeeded) {
                metrics.recommendations.push('Insufficient punctuation marks for complete encoding');
                metrics.statisticalSecurity = Math.max(metrics.statisticalSecurity - 25, 20);
            } else if (punctCount < bitsNeeded * 1.5) {
                metrics.recommendations.push('Limited punctuation - consider adding more sentences');
                metrics.statisticalSecurity = Math.max(metrics.statisticalSecurity - 10, 40);
            }
            
            // Punctuation patterns are somewhat detectable
            metrics.recommendations.push('Punctuation patterns can be detected by frequency analysis');
            break;
            
        case 'null-cipher':
            const wordCount = carrierText.split(/\s+/).length;
            if (wordCount < message.length * 2) {
                metrics.recommendations.push('Limited word count - message may be too dense');
                metrics.statisticalSecurity = Math.max(metrics.statisticalSecurity - 15, 30);
            }
            
            metrics.recommendations.push('Null cipher is moderately secure but can be detected by first-letter analysis');
            break;
    }

    // General recommendations
    if (carrierText.length < 1000) {
        metrics.recommendations.push('Short carrier text reduces security - use longer documents when possible');
    }
    
    if (message.length > 100) {
        metrics.recommendations.push('Long messages are harder to hide securely - consider splitting into multiple carriers');
    }
    
    // Final security score adjustment
    if (metrics.recommendations.length > 5) {
        metrics.statisticalSecurity = Math.max(metrics.statisticalSecurity - 10, 15);
    }
    
    return metrics;
}

/**
 * Utility function to clean and validate text input
 */
function cleanText(text, preserveCase = false) {
    if (typeof text !== 'string') {
        throw new Error('Input must be a string');
    }
    
    // Remove null bytes and control characters except newlines and tabs
    let cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    if (!preserveCase) {
        cleaned = cleaned.toUpperCase();
    }
    
    return cleaned;
}

/**
 * Generate random filler text for padding
 */
function generateFillerText(targetLength, style = 'lorem') {
    const loremWords = [
        'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
        'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
        'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
        'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
        'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
        'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
        'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
        'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
    ];
    
    let filler = '';
    while (filler.length < targetLength) {
        const word = loremWords[Math.floor(Math.random() * loremWords.length)];
        filler += (filler.length > 0 ? ' ' : '') + word;
        
        // Add punctuation occasionally
        if (Math.random() < 0.1) {
            filler += Math.random() < 0.5 ? '.' : ',';
        }
        
        // Add line breaks occasionally
        if (Math.random() < 0.05 && filler.length > 50) {
            filler += '\n';
        }
    }
    
    return filler.substring(0, targetLength);
}

module.exports = {
    encodeELS,
    encodeAcrostic,
    encodePunctuation,
    encodeNullCipher,
    analyzeELS,
    analyzeAcrostic,
    analyzePunctuation,
    analyzeNullCipher,
    calculateSequenceConfidence,
    calculateSecurityMetrics,
    cleanText,
    generateFillerText
};