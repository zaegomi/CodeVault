// CodeVault - Main JavaScript File
// Text Steganography Platform

// Global variables
let currentMode = 'encode';
let encodingResult = null;
let decodeResults = [];

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateCharacterCounts();
});

// Initialize application
function initializeApp() {
    console.log('CodeVault initialized');
    showMode('encode');
    updateMethodInfo();
}

// Set up event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = e.target.dataset.mode;
            switchMode(mode);
        });
    });

    // Character counting
    document.getElementById('secretMessage').addEventListener('input', updateCharacterCounts);
    document.getElementById('carrierText').addEventListener('input', updateCarrierTextAnalysis);
    document.getElementById('decodeText').addEventListener('input', updateCharacterCounts);

    // Method info display
    document.getElementById('encryptionType').addEventListener('change', updateMethodInfo);

    // Analysis mode toggle
    document.querySelectorAll('input[name="analysisMode"]').forEach(radio => {
        radio.addEventListener('change', toggleAnalysisMode);
    });

    // Decode input options
    document.querySelectorAll('.input-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            toggleDecodeInputOption(e.target.dataset.option);
        });
    });

    // Security level info
    document.querySelectorAll('input[name="security"]').forEach(radio => {
        radio.addEventListener('change', updateSecurityInfo);
    });
}

// Mode switching
function switchMode(mode) {
    currentMode = mode;
    
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    // Show appropriate section
    showMode(mode);
}

function showMode(mode) {
    document.querySelectorAll('.mode-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${mode}-mode`).classList.add('active');
}

// Character counting and text analysis
function updateCharacterCounts() {
    const secretMessage = document.getElementById('secretMessage');
    const carrierText = document.getElementById('carrierText');
    const decodeText = document.getElementById('decodeText');
    
    if (secretMessage) {
        document.getElementById('messageCharCount').textContent = secretMessage.value.length;
    }
    
    if (carrierText) {
        document.getElementById('carrierCharCount').textContent = carrierText.value.length;
    }
}

function updateCarrierTextAnalysis() {
    const carrierText = document.getElementById('carrierText').value;
    const analysisDiv = document.getElementById('textAnalysis');
    
    if (carrierText.length > 100) {
        const words = carrierText.split(/\s+/).filter(word => word.length > 0).length;
        const sentences = carrierText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        const capacity = Math.floor(carrierText.replace(/[^A-Za-z]/g, '').length / 10);
        
        document.getElementById('wordCount').textContent = words;
        document.getElementById('sentenceCount').textContent = sentences;
        document.getElementById('messageCapacity').textContent = capacity;
        
        analysisDiv.style.display = 'block';
    } else {
        analysisDiv.style.display = 'none';
    }
    
    updateCharacterCounts();
}

// Method information display
function updateMethodInfo() {
    const method = document.getElementById('encryptionType').value;
    const infoDiv = document.getElementById('methodInfo');
    
    const methodDescriptions = {
        'els': 'Equidistant Letter Sequence: Hides your message by placing letters at regular intervals throughout the text. Most secure for longer texts.',
        'acrostic': 'Acrostic Method: Uses the first letter of each line to spell your message. Requires at least as many lines as message characters.',
        'punctuation': 'Punctuation Pattern: Encodes your message in punctuation marks. Works best with texts that have varied punctuation.',
        'null-cipher': 'Null Cipher: Hides message in the first letters of words. Natural-looking but requires careful word selection.'
    };
    
    if (method && methodDescriptions[method]) {
        infoDiv.textContent = methodDescriptions[method];
        infoDiv.classList.add('show');
    } else {
        infoDiv.classList.remove('show');
    }
}

// Security level information
function updateSecurityInfo() {
    const level = document.querySelector('input[name="security"]:checked').value;
    console.log(`Security level changed to: ${level}`);
}

// File upload handling
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const validTypes = ['text/plain', 'text/markdown', 'application/rtf'];
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt')) {
        alert('Please select a valid text file (.txt, .md, .rtf)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('carrierText').value = e.target.result;
        document.getElementById('fileInfo').textContent = `Loaded: ${file.name} (${file.size} bytes)`;
        updateCarrierTextAnalysis();
    };
    reader.onerror = function() {
        alert('Error reading file. Please try again.');
    };
    reader.readAsText(file);
}

function handleDecodeFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('decodeText').value = e.target.result;
    };
    reader.readAsText(file);
}

// Decode input options
function toggleDecodeInputOption(option) {
    document.querySelectorAll('.input-option').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-option="${option}"]`).classList.add('active');
    
    const textArea = document.getElementById('decodeText');
    const fileInput = document.getElementById('decodeFileInput');
    
    if (option === 'upload') {
        fileInput.style.display = 'block';
        textArea.style.display = 'none';
        fileInput.click();
    } else {
        fileInput.style.display = 'none';
        textArea.style.display = 'block';
    }
}

// Analysis mode toggle
function toggleAnalysisMode() {
    const mode = document.querySelector('input[name="analysisMode"]:checked').value;
    const manualOptions = document.getElementById('manualOptions');
    
    if (mode === 'manual') {
        manualOptions.style.display = 'grid';
    } else {
        manualOptions.style.display = 'none';
    }
}

// Loading overlay
function showLoading(text = 'Processing...') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Main encoding function
async function startEncryption() {
    const secretMessage = document.getElementById('secretMessage').value.trim();
    const carrierText = document.getElementById('carrierText').value.trim();
    const encryptionType = document.getElementById('encryptionType').value;
    const securityLevel = document.querySelector('input[name="security"]:checked').value;

    // Validation
    if (!secretMessage) {
        alert('Please enter a secret message');
        return;
    }
    if (!carrierText) {
        alert('Please enter or upload carrier text');
        return;
    }
    if (!encryptionType) {
        alert('Please select an encryption method');
        return;
    }
    if (carrierText.length < secretMessage.length * 5) {
        alert('Carrier text should be at least 5 times longer than the secret message for basic security');
        return;
    }

    showLoading('Encoding your message...');

    try {
        // Simulate processing delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let result;
        switch(encryptionType) {
            case 'els':
                result = await encodeELS(secretMessage, carrierText, securityLevel);
                break;
            case 'acrostic':
                result = await encodeAcrostic(secretMessage, carrierText, securityLevel);
                break;
            case 'punctuation':
                result = await encodePunctuation(secretMessage, carrierText, securityLevel);
                break;
            case 'null-cipher':
                result = await encodeNullCipher(secretMessage, carrierText, securityLevel);
                break;
            default:
                throw new Error('Invalid encryption method selected');
        }

        encodingResult = result;
        displayEncodingResults(result);
        
    } catch (error) {
        console.error('Encoding error:', error);
        alert(`Error during encoding: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// Encoding algorithms
async function encodeELS(message, carrier, securityLevel) {
    const cleanMessage = message.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanCarrier = carrier.replace(/[^A-Za-z]/g, '');
    
    if (cleanCarrier.length < cleanMessage.length * 3) {
        throw new Error('Carrier text too short for ELS encoding');
    }

    // Calculate skip distance based on security level
    let baseSkip = Math.floor(cleanCarrier.length / cleanMessage.length);
    const securityMultiplier = { light: 1, medium: 1.5, heavy: 2 };
    const skipDistance = Math.max(2, Math.floor(baseSkip * securityMultiplier[securityLevel]));

    let encodedText = carrier.split('');
    let carrierIndex = 0;
    let messageIndex = 0;
    let positions = [];

    // Find letter positions and replace
    for (let i = 0; i < encodedText.length && messageIndex < cleanMessage.length; i++) {
        if (/[A-Za-z]/.test(encodedText[i])) {
            if (carrierIndex % skipDistance === 0 && messageIndex < cleanMessage.length) {
                const originalChar = encodedText[i];
                const newChar = encodedText[i].match(/[A-Z]/) ? 
                    cleanMessage[messageIndex] : cleanMessage[messageIndex].toLowerCase();
                
                encodedText[i] = newChar;
                positions.push({ position: i, original: originalChar, encoded: newChar });
                messageIndex++;
            }
            carrierIndex++;
        }
    }

    // Calculate security metrics
    const security = calculateSecurityMetrics(cleanMessage, carrier, 'els', positions);

    return {
        encodedText: encodedText.join(''),
        method: 'Equidistant Letter Sequence (ELS)',
        skipDistance: skipDistance,
        messageLength: cleanMessage.length,
        startPosition: 0,
        positions: positions,
        security: security,
        originalMessage: message
    };
}

async function encodeAcrostic(message, carrier, securityLevel) {
    const cleanMessage = message.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let lines = carrier.split('\n').filter(line => line.trim().length > 0);
    
    // Add lines if needed
    while (lines.length < cleanMessage.length) {
        const fillerLines = [
            'The quick brown fox jumps over the lazy dog.',
            'Every moment is a fresh beginning.',
            'Success is not final, failure is not fatal.',
            'Innovation distinguishes between a leader and a follower.',
            'The journey of a thousand miles begins with one step.'
        ];
        lines.push(fillerLines[Math.floor(Math.random() * fillerLines.length)]);
    }

    const encodedLines = lines.map((line, index) => {
        if (index < cleanMessage.length && line.length > 0) {
            const firstChar = cleanMessage[index];
            const restOfLine = line.slice(1);
            return firstChar + restOfLine;
        }
        return line;
    });

    const positions = cleanMessage.split('').map((char, index) => ({
        line: index,
        character: char,
        position: 0
    }));

    const security = calculateSecurityMetrics(cleanMessage, carrier, 'acrostic', positions);

    return {
        encodedText: encodedLines.join('\n'),
        method: 'Acrostic (First Letters)',
        messageLength: cleanMessage.length,
        linesUsed: cleanMessage.length,
        positions: positions,
        security: security,
        originalMessage: message
    };
}

async function encodePunctuation(message, carrier, securityLevel) {
    // Convert message to binary
    const binaryMessage = message.split('').map(char => 
        char.charCodeAt(0).toString(2).padStart(8, '0')
    ).join('');
    
    let encodedText = carrier;
    let binaryIndex = 0;
    let positions = [];
    
    // Replace punctuation based on binary
    encodedText = encodedText.replace(/[.!?]/g, (match, offset) => {
        if (binaryIndex < binaryMessage.length) {
            const bit = binaryMessage[binaryIndex++];
            const newPunct = bit === '0' ? '.' : '!';
            positions.push({ position: offset, original: match, encoded: newPunct, bit: bit });
            return newPunct;
        }
        return match;
    });

    const security = calculateSecurityMetrics(message, carrier, 'punctuation', positions);

    return {
        encodedText: encodedText,
        method: 'Punctuation Pattern',
        messageLength: message.length,
        bitsEncoded: binaryIndex,
        binaryLength: binaryMessage.length,
        positions: positions,
        security: security,
        originalMessage: message
    };
}

async function encodeNullCipher(message, carrier, securityLevel) {
    const words = carrier.split(/\s+/).filter(word => word.length > 0);
    const cleanMessage = message.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (words.length < cleanMessage.length) {
        throw new Error('Not enough words in carrier text for null cipher');
    }

    const encodedWords = words.map((word, index) => {
        if (index < cleanMessage.length) {
            const firstChar = cleanMessage[index];
            const restOfWord = word.slice(1);
            return firstChar + restOfWord;
        }
        return word;
    });

    const positions = cleanMessage.split('').map((char, index) => ({
        word: index,
        character: char,
        position: 0
    }));

    const security = calculateSecurityMetrics(cleanMessage, carrier, 'null-cipher', positions);

    return {
        encodedText: encodedWords.join(' '),
        method: 'Null Cipher (Word Method)',
        messageLength: cleanMessage.length,
        wordsModified: cleanMessage.length,
        positions: positions,
        security: security,
        originalMessage: message
    };
}

// Security analysis
function calculateSecurityMetrics(message, carrier, method, positions) {
    const metrics = {
        detectionRisk: 'Low',
        statisticalSecurity: 85,
        recommendations: []
    };

    // Calculate detection risk based on method and text properties
    const messageRatio = message.length / carrier.length;
    
    if (messageRatio > 0.1) {
        metrics.detectionRisk = 'High';
        metrics.statisticalSecurity = 45;
        metrics.recommendations.push('Use longer carrier text for better security');
    } else if (messageRatio > 0.05) {
        metrics.detectionRisk = 'Medium';
        metrics.statisticalSecurity = 65;
        metrics.recommendations.push('Consider using a longer carrier text');
    }

    // Method-specific analysis
    switch (method) {
        case 'els':
            if (positions.length > 0) {
                const avgSkip = positions.length > 1 ? 
                    (positions[positions.length - 1].position - positions[0].position) / positions.length : 
                    carrier.length / message.length;
                
                if (avgSkip < 5) {
                    metrics.recommendations.push('Skip distance is low - consider longer carrier text');
                }
            }
            break;
        case 'acrostic':
            metrics.recommendations.push('Acrostic method is easily detectable - use sparingly');
            break;
        case 'punctuation':
            const punctCount = (carrier.match(/[.!?]/g) || []).length;
            if (punctCount < message.length * 8) {
                metrics.recommendations.push('Insufficient punctuation for full message encoding');
            }
            break;
    }

    return metrics;
}

// Display results
function displayEncodingResults(result) {
    document.getElementById('resultsTitle').textContent = 'Encoding Results';
    document.getElementById('encodedResult').textContent = result.encodedText;
    
    // Build details string
    let details = `Method: ${result.method}\n`;
    details += `Original Message: "${result.originalMessage}"\n`;
    details += `Message Length: ${result.messageLength} characters\n`;
    
    if (result.skipDistance) details += `Skip Distance: ${result.skipDistance}\n`;
    if (result.linesUsed) details += `Lines Used: ${result.linesUsed}\n`;
    if (result.bitsEncoded) details += `Bits Encoded: ${result.bitsEncoded}/${result.binaryLength}\n`;
    if (result.wordsModified) details += `Words Modified: ${result.wordsModified}\n`;
    
    details += `\nPositions Modified: ${result.positions.length}`;
    
    document.getElementById('encodingDetails').textContent = details;
    
    // Security analysis
    const security = result.security;
    let securityHTML = `<div class="security-metric">
        <strong>Detection Risk:</strong> <span class="risk-${security.detectionRisk.toLowerCase()}">${security.detectionRisk}</span>
    </div>`;
    securityHTML += `<div class="security-metric">
        <strong>Statistical Security:</strong> ${security.statisticalSecurity}%
    </div>`;
    
    if (security.recommendations.length > 0) {
        securityHTML += '<div class="security-recommendations"><strong>Recommendations:</strong><ul>';
        security.recommendations.forEach(rec => {
            securityHTML += `<li>${rec}</li>`;
        });
        securityHTML += '</ul></div>';
    }
    
    document.getElementById('securityStats').innerHTML = securityHTML;
    
    // Show results section
    document.getElementById('resultsSection').style.display = 'block';
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

// Decoding function
async function startDecoding() {
    const text = document.getElementById('decodeText').value.trim();
    const analysisMode = document.querySelector('input[name="analysisMode"]:checked').value;
    
    if (!text) {
        alert('Please enter or upload text to analyze');
        return;
    }
    
    showLoading('Analyzing text for hidden messages...');
    
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        let results = [];
        
        if (analysisMode === 'auto') {
            // Try all methods
            results = await analyzeAllMethods(text);
        } else {
            // Use manual parameters
            const method = document.getElementById('decodeMethod').value;
            const skipDistance = parseInt(document.getElementById('skipDistance').value) || null;
            const startPosition = parseInt(document.getElementById('startPosition').value) || 0;
            
            results = await analyzeWithMethod(text, method, { skipDistance, startPosition });
        }
        
        decodeResults = results;
        displayDecodeResults(results);
        
    } catch (error) {
        console.error('Decoding error:', error);
        alert(`Error during analysis: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// Analysis functions
async function analyzeAllMethods(text) {
    const results = [];
    
    // ELS Analysis
    const elsResults = await analyzeELS(text);
    results.push(...elsResults);
    
    // Acrostic Analysis
    const acrosticResults = await analyzeAcrostic(text);
    results.push(...acrosticResults);
    
    // Punctuation Analysis
    const punctuationResults = await analyzePunctuation(text);
    results.push(...punctuationResults);
    
    // Null Cipher Analysis
    const nullResults = await analyzeNullCipher(text);
    results.push(...nullResults);
    
    // Sort by confidence
    return results.sort((a, b) => b.confidence - a.confidence);
}

async function analyzeELS(text, skipDistance = null, startPosition = 0) {
    const cleanText = text.replace(/[^A-Za-z]/g, '');
    const results = [];
    
    const maxSkip = skipDistance ? [skipDistance] : [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20];
    
    for (const skip of maxSkip) {
        for (let start = startPosition; start < Math.min(skip, 10); start++) {
            let sequence = '';
            let positions = [];
            
            for (let i = start; i < cleanText.length; i += skip) {
                sequence += cleanText[i];
                positions.push(i);
                
                // Check if we have a meaningful sequence
                if (sequence.length >= 3) {
                    const confidence = calculateSequenceConfidence(sequence);
                    if (confidence > 30) {
                        // Only add if we haven't found this exact sequence
                        const existing = results.find(r => r.message === sequence && r.method === 'ELS');
                        if (!existing && sequence.length >= 3) {
                            results.push({
                                message: sequence,
                                method: 'ELS',
                                confidence: confidence,
                                details: `Skip: ${skip}, Start: ${start}, Length: ${sequence.length}`,
                                positions: [...positions],
                                skipDistance: skip,
                                startPosition: start
                            });
                        }
                    }
                }
                
                // Limit sequence length to prevent infinite processing
                if (sequence.length > 50) break;
            }
        }
    }
    
    return results.slice(0, 10); // Return top 10 results
}

async function analyzeAcrostic(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const results = [];
    
    if (lines.length < 3) return results;
    
    // Get first letters of each line
    let acrosticMessage = '';
    let positions = [];
    
    for (let i = 0; i < Math.min(lines.length, 50); i++) {
        const firstChar = lines[i].trim()[0];
        if (firstChar && /[A-Za-z]/.test(firstChar)) {
            acrosticMessage += firstChar.toUpperCase();
            positions.push(i);
        }
    }
    
    if (acrosticMessage.length >= 3) {
        const confidence = calculateSequenceConfidence(acrosticMessage);
        if (confidence > 25) {
            results.push({
                message: acrosticMessage,
                method: 'Acrostic',
                confidence: confidence,
                details: `Lines: ${lines.length}, Message length: ${acrosticMessage.length}`,
                positions: positions,
                linesUsed: acrosticMessage.length
            });
        }
    }
    
    return results;
}

async function analyzePunctuation(text) {
    const results = [];
    const punctuation = text.match(/[.!?]/g);
    
    if (!punctuation || punctuation.length < 8) return results;
    
    // Convert punctuation to binary (. = 0, ! = 1, ? = 1)
    let binary = '';
    punctuation.forEach(p => {
        binary += p === '.' ? '0' : '1';
    });
    
    // Try to decode as ASCII
    if (binary.length >= 8 && binary.length % 8 === 0) {
        let message = '';
        for (let i = 0; i < binary.length; i += 8) {
            const byte = binary.slice(i, i + 8);
            const charCode = parseInt(byte, 2);
            if (charCode >= 32 && charCode <= 126) { // Printable ASCII
                message += String.fromCharCode(charCode);
            } else {
                break; // Stop if we hit non-printable character
            }
        }
        
        if (message.length >= 2) {
            const confidence = calculateSequenceConfidence(message) * 0.8; // Lower confidence for punctuation
            results.push({
                message: message,
                method: 'Punctuation Pattern',
                confidence: confidence,
                details: `Binary length: ${binary.length}, Characters decoded: ${message.length}`,
                positions: Array.from({length: punctuation.length}, (_, i) => i),
                binaryString: binary
            });
        }
    }
    
    return results;
}

async function analyzeNullCipher(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const results = [];
    
    if (words.length < 3) return results;
    
    // Get first letter of each word
    let nullMessage = '';
    let positions = [];
    
    for (let i = 0; i < Math.min(words.length, 100); i++) {
        const firstChar = words[i][0];
        if (firstChar && /[A-Za-z]/.test(firstChar)) {
            nullMessage += firstChar.toUpperCase();
            positions.push(i);
        }
    }
    
    if (nullMessage.length >= 3) {
        const confidence = calculateSequenceConfidence(nullMessage) * 0.7; // Lower confidence for null cipher
        if (confidence > 20) {
            results.push({
                message: nullMessage,
                method: 'Null Cipher',
                confidence: confidence,
                details: `Words: ${words.length}, Message length: ${nullMessage.length}`,
                positions: positions,
                wordsUsed: nullMessage.length
            });
        }
    }
    
    return results;
}

async function analyzeWithMethod(text, method, params) {
    switch (method) {
        case 'els':
            return await analyzeELS(text, params.skipDistance, params.startPosition);
        case 'acrostic':
            return await analyzeAcrostic(text);
        case 'punctuation':
            return await analyzePunctuation(text);
        case 'null-cipher':
            return await analyzeNullCipher(text);
        default:
            return [];
    }
}

// Confidence calculation
function calculateSequenceConfidence(sequence) {
    if (sequence.length < 2) return 0;
    
    let score = 0;
    const upperSeq = sequence.toUpperCase();
    
    // Dictionary of common English words and phrases
    const commonWords = [
        'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR',
        'HAD', 'BY', 'WORD', 'OIL', 'ITS', 'NOW', 'FIND', 'LONG', 'DOWN', 'WAY', 'BEEN', 'CALL',
        'WHO', 'DID', 'GET', 'COME', 'MADE', 'MAY', 'PART', 'OVER', 'NEW', 'SOUND', 'TAKE', 'ONLY',
        'LITTLE', 'WORK', 'KNOW', 'PLACE', 'YEAR', 'LIVE', 'ME', 'BACK', 'GIVE', 'MOST', 'VERY',
        'AFTER', 'THING', 'NAME', 'GOOD', 'SENTENCE', 'MAN', 'THINK', 'SAY', 'GREAT', 'WHERE',
        'HELP', 'THROUGH', 'MUCH', 'BEFORE', 'LINE', 'RIGHT', 'TOO', 'MEANS', 'OLD', 'ANY',
        'SAME', 'TELL', 'BOY', 'FOLLOW', 'CAME', 'WANT', 'SHOW', 'ALSO', 'AROUND', 'FORM',
        'THREE', 'SMALL', 'SET', 'PUT', 'END', 'WHY', 'AGAIN', 'TURN', 'HERE', 'OFF', 'WENT',
        'OLD', 'NUMBER', 'NO', 'WAY', 'COULD', 'PEOPLE', 'MY', 'THAN', 'FIRST', 'WATER', 'BEEN',
        'CALL', 'WHO', 'OIL', 'ITS', 'NOW', 'FIND', 'LONG', 'DOWN', 'DAY', 'DID', 'GET', 'COME',
        'MEET', 'HELP', 'CALL', 'STOP', 'WAIT', 'GO', 'YES', 'NO', 'OK', 'HI', 'BYE', 'LOVE',
        'HATE', 'LIKE', 'WANT', 'NEED', 'HAVE', 'WILL', 'CAN', 'MUST', 'SHOULD', 'WOULD'
    ];
    
    // Check for exact word matches
    if (commonWords.includes(upperSeq)) {
        score += 90;
    }
    
    // Check for partial word matches
    for (const word of commonWords) {
        if (word.includes(upperSeq) && upperSeq.length >= 3) {
            score += 70;
            break;
        }
        if (upperSeq.includes(word) && word.length >= 3) {
            score += 60;
            break;
        }
    }
    
    // Letter frequency analysis (English)
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
    freqScore = (freqScore / upperSeq.length) * 2; // Normalize
    score += Math.min(freqScore, 30);
    
    // Vowel-consonant pattern (English typically has good vowel distribution)
    const vowels = 'AEIOU';
    let vowelCount = 0;
    for (const char of upperSeq) {
        if (vowels.includes(char)) vowelCount++;
    }
    const vowelRatio = vowelCount / upperSeq.length;
    if (vowelRatio >= 0.2 && vowelRatio <= 0.6) {
        score += 20;
    }
    
    // Length bonus (longer sequences that look like words are more likely intentional)
    if (upperSeq.length >= 4) score += 10;
    if (upperSeq.length >= 6) score += 10;
    
    // Penalize very long sequences without spaces (less likely to be intentional)
    if (upperSeq.length > 20) score -= 20;
    
    // Common letter combinations
    const commonBigrams = ['TH', 'HE', 'IN', 'ER', 'AN', 'RE', 'ED', 'ND', 'ON', 'EN', 'AT', 'OU', 'IT', 'IS', 'OR', 'TI', 'HI', 'ST', 'AR', 'NE'];
    for (let i = 0; i < upperSeq.length - 1; i++) {
        const bigram = upperSeq.slice(i, i + 2);
        if (commonBigrams.includes(bigram)) {
            score += 5;
        }
    }
    
    return Math.min(Math.max(score, 0), 100);
}

// Display decode results
function displayDecodeResults(results) {
    const container = document.getElementById('discoveredMessages');
    
    if (results.length === 0) {
        container.innerHTML = '<div class="no-results">No hidden messages found. Try adjusting your analysis parameters or check if the text contains encoded messages.</div>';
    } else {
        let html = `<h3>Found ${results.length} potential message${results.length > 1 ? 's' : ''}:</h3>`;
        
        results.forEach((result, index) => {
            const confidenceClass = result.confidence > 70 ? 'high' : result.confidence > 40 ? 'medium' : 'low';
            
            html += `
                <div class="discovered-message">
                    <div class="message-header">
                        <span class="message-text">"${result.message}"</span>
                        <span class="confidence-score confidence-${confidenceClass}">
                            ${Math.round(result.confidence)}% confidence
                        </span>
                    </div>
                    <div class="message-details">
                        Method: ${result.method} | ${result.details}
                    </div>
                    <div class="message-actions">
                        <button class="message-action" onclick="highlightInText(${index})">Highlight in Text</button>
                        <button class="message-action" onclick="exportMessage(${index})">Export</button>
                        <button class="message-action" onclick="testDecode(${index})">Verify</button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    document.getElementById('decodeResultsSection').style.display = 'block';
    document.getElementById('decodeResultsSection').scrollIntoView({ behavior: 'smooth' });
}

// Result actions
function highlightInText(index) {
    const result = decodeResults[index];
    const textArea = document.getElementById('decodeText');
    const text = textArea.value;
    
    // This is a simplified highlighting - in a real implementation,
    // you'd want to highlight the actual character positions
    console.log('Highlighting result:', result);
    alert(`Message "${result.message}" found using ${result.method}\nDetails: ${result.details}`);
}

function exportMessage(index) {
    const result = decodeResults[index];
    const exportData = {
        message: result.message,
        method: result.method,
        confidence: result.confidence,
        details: result.details,
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codevault_message_${index + 1}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function testDecode(index) {
    const result = decodeResults[index];
    alert(`Testing decode for: "${result.message}"\nMethod: ${result.method}\nConfidence: ${Math.round(result.confidence)}%\n\nThis would attempt to verify the message using the same encoding parameters.`);
}

// Utility functions
function copyToClipboard() {
    const encodedText = document.getElementById('encodedResult').textContent;
    navigator.clipboard.writeText(encodedText).then(() => {
        showNotification('Encoded text copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text:', err);
        alert('Failed to copy text. Please try selecting and copying manually.');
    });
}

function downloadResult() {
    if (!encodingResult) return;
    
    const content = `CodeVault Encoded Message
========================

Encoded Text:
${encodingResult.encodedText}

Encoding Details:
Method: ${encodingResult.method}
Original Message: "${encodingResult.originalMessage}"
Message Length: ${encodingResult.messageLength} characters
${encodingResult.skipDistance ? `Skip Distance: ${encodingResult.skipDistance}` : ''}
${encodingResult.linesUsed ? `Lines Used: ${encodingResult.linesUsed}` : ''}
${encodingResult.bitsEncoded ? `Bits Encoded: ${encodingResult.bitsEncoded}/${encodingResult.binaryLength}` : ''}
${encodingResult.wordsModified ? `Words Modified: ${encodingResult.wordsModified}` : ''}

Security Analysis:
Detection Risk: ${encodingResult.security.detectionRisk}
Statistical Security: ${encodingResult.security.statisticalSecurity}%

Generated: ${new Date().toLocaleString()}
Platform: CodeVault Text Steganography
`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'codevault_encoded_message.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function shareInstructions() {
    if (!encodingResult) return;
    
    const instructions = `CodeVault Decoding Instructions
==============================

To decode this message, use CodeVault (codevault.io) with these parameters:

Method: ${encodingResult.method}
${encodingResult.skipDistance ? `Skip Distance: ${encodingResult.skipDistance}` : ''}
${encodingResult.startPosition !== undefined ? `Start Position: ${encodingResult.startPosition}` : ''}
${encodingResult.linesUsed ? `Lines to Check: ${encodingResult.linesUsed}` : ''}

Steps:
1. Go to CodeVault and switch to "Decode" mode
2. Paste the encoded text
3. Select "${encodingResult.method}" method
4. Use the parameters above
5. Click "ANALYZE TEXT"

Original message length: ${encodingResult.messageLength} characters
`;
    
    navigator.clipboard.writeText(instructions).then(() => {
        showNotification('Decoding instructions copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy instructions:', err);
        alert('Failed to copy instructions. Please try again.');
    });
}

function exportAllResults() {
    if (decodeResults.length === 0) return;
    
    const exportData = {
        timestamp: new Date().toISOString(),
        analysisResults: decodeResults,
        textAnalyzed: document.getElementById('decodeText').value.substring(0, 500) + '...', // First 500 chars
        totalResults: decodeResults.length
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'codevault_analysis_results.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Navigation and cleanup functions
function closeResults() {
    document.getElementById('resultsSection').style.display = 'none';
}

function closeDecodeResults() {
    document.getElementById('decodeResultsSection').style.display = 'none';
}

function resetForm() {
    document.getElementById('secretMessage').value = '';
    document.getElementById('carrierText').value = '';
    document.getElementById('encryptionType').value = '';
    document.getElementById('fileInput').value = '';
    document.querySelector('input[name="security"][value="light"]').checked = true;
    
    updateCharacterCounts();
    updateCarrierTextAnalysis();
    updateMethodInfo();
    closeResults();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetDecodeForm() {
    document.getElementById('decodeText').value = '';
    document.getElementById('decodeFileInput').value = '';
    document.querySelector('input[name="analysisMode"][value="auto"]').checked = true;
    toggleAnalysisMode();
    
    decodeResults = [];
    closeDecodeResults();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchToDecodeMode() {
    if (encodingResult) {
        document.getElementById('decodeText').value = encodingResult.encodedText;
        switchMode('decode');
        closeResults();
    }
}

// Notification system
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1001;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS for notification animations
const notificationCSS = `
@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
`;

// Add notification styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationCSS;
document.head.appendChild(styleSheet);

// Error handling
window.addEventListener('error', function(event) {
    console.error('Application error:', event.error);
    hideLoading();
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    hideLoading();
});

// Console welcome message
console.log(`
╔═══════════════════════════════════════╗
║              CodeVault                ║
║     Text Steganography Platform       ║
║                                       ║
║  🔐 Hide messages in plain sight      ║
║  🔍 Discover hidden content           ║
║  🛡️  Secure communication             ║
╚═══════════════════════════════════════╝

Ready for encoding and decoding operations.
`);