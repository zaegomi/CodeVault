// Enhanced CodeVault with Decoding Functionality
class CodeVaultPro {
    constructor() {
        this.initializeEventListeners();
        this.currentResult = null;
        this.currentMethod = null;
        this.decodingInstructions = null;
        this.backendUrl = 'http://localhost:3001';
        this.activeTab = 'encode';
        this.checkBackendConnection();
    }

    initializeEventListeners() {
        // Original encoding event listeners
        document.getElementById('startBtn').addEventListener('click', () => this.processMessage());
        document.getElementById('fileUpload').addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('copyBtn').addEventListener('click', () => this.copyResult());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadResult());
        document.getElementById('testDecodeBtn').addEventListener('click', () => this.testDecode());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetApp());
        document.getElementById('generateAIText').addEventListener('click', () => this.generateAICarrierText());
        document.getElementById('retryConnection').addEventListener('click', () => this.checkBackendConnection());

        // NEW: Decoding event listeners
        document.getElementById('decodeBtn').addEventListener('click', () => this.decodeMessage());
        document.getElementById('decodeFileUpload').addEventListener('change', (e) => this.handleDecodeFileUpload(e));
        document.getElementById('copyDecodedBtn').addEventListener('click', () => this.copyDecodedMessage());
        document.getElementById('downloadDecodedBtn').addEventListener('click', () => this.downloadDecodedMessage());
        document.getElementById('analyzeBtn').addEventListener('click', () => this.showDetailedAnalysis());
        document.getElementById('resetDecodeBtn').addEventListener('click', () => this.resetDecoder());

        // Real-time validation for encoding
        document.getElementById('secretMessage').addEventListener('input', () => this.validateInputs());
        document.getElementById('carrierText').addEventListener('input', () => {
            this.validateInputs();
            this.analyzeText();
        });

        // Real-time validation for decoding
        document.getElementById('encodedText').addEventListener('input', () => this.analyzeEncodedText());
        document.getElementById('decodeMethod').addEventListener('change', () => this.updateDecodingTips());

        // AI parameter change listeners
        document.getElementById('encryptionMethod').addEventListener('change', () => this.updateAIRecommendations());
        document.getElementById('secretMessage').addEventListener('input', () => this.updateAIRecommendations());
    }

    // Tab switching functionality
    switchTab(tabName) {
        // Update active tab
        this.activeTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName + 'Tab').classList.add('active');
        
        // Hide results when switching tabs
        document.getElementById('resultsDiv').classList.add('hidden');
        document.getElementById('decodeResultsDiv').classList.add('hidden');
        document.getElementById('errorDiv').classList.add('hidden');
        document.getElementById('successDiv').classList.add('hidden');
    }

    // DECODING FUNCTIONALITY
    analyzeEncodedText() {
        const encodedText = document.getElementById('encodedText').value;
        
        if (!encodedText) {
            document.getElementById('decodeAnalysis').classList.add('hidden');
            document.getElementById('detectedMethodInfo').classList.add('hidden');
            document.getElementById('decodeBtn').disabled = true;
            return;
        }

        // Enable decode button
        document.getElementById('decodeBtn').disabled = false;

        // Analyze text patterns
        const words = encodedText.split(/\s+/).filter(word => word.length > 0);
        const chars = encodedText.length;
        const punctuation = (encodedText.match(/[.!]/g) || []).length;
        const lines = encodedText.split('\n').length;

        // Update analysis display
        document.getElementById('decodeWordCount').textContent = words.length;
        document.getElementById('decodeCharCount').textContent = chars;
        document.getElementById('decodePunctCount').textContent = punctuation;
        document.getElementById('decodeLineCount').textContent = lines;
        document.getElementById('decodeAnalysis').classList.remove('hidden');

        // Auto-detect method if selected
        if (document.getElementById('decodeMethod').value === 'auto') {
            this.detectEncodingMethod(encodedText);
        }
    }

    detectEncodingMethod(text) {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        const punctuation = (text.match(/[.!]/g) || []).length;
        const letters = text.replace(/[^a-zA-Z]/g, '').length;

        let scores = {
            punctuation: 0,
            acrostic: 0,
            null: 0,
            els: 0
        };

        // Punctuation method detection
        if (punctuation > words.length * 0.3) {
            scores.punctuation += 3;
        }
        if (punctuation > 20) {
            scores.punctuation += 2;
        }

        // Acrostic method detection
        if (lines.length > 3 && lines.length < 50) {
            scores.acrostic += 2;
        }
        if (lines.length >= 5) {
            scores.acrostic += 1;
        }

        // Null cipher detection
        if (words.length > 5 && words.length < 100) {
            scores.null += 2;
        }

        // ELS detection (harder to detect, but longer texts are more likely)
        if (letters > 200) {
            scores.els += 2;
        }
        if (letters > 500) {
            scores.els += 1;
        }

        // Find the method with highest score
        const bestMethod = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        const confidence = scores[bestMethod];

        if (confidence > 0) {
            const methodNames = {
                punctuation: 'Punctuation Pattern',
                acrostic: 'Acrostic Method',
                null: 'Null Cipher',
                els: 'Equidistant Letter Sequence'
            };

            document.getElementById('detectedMethod').textContent = methodNames[bestMethod];
            document.getElementById('detectionConfidence').textContent = 
                `Confidence: ${Math.min(confidence * 25, 85)}% - ${this.getConfidenceDescription(confidence)}`;
            document.getElementById('detectedMethodInfo').classList.remove('hidden');
            
            // Auto-select the detected method
            document.getElementById('decodeMethod').value = bestMethod;
        } else {
            document.getElementById('detectedMethodInfo').classList.add('hidden');
        }
    }

    getConfidenceDescription(score) {
        if (score >= 3) return "High confidence detection";
        if (score >= 2) return "Moderate confidence detection";
        if (score >= 1) return "Low confidence detection";
        return "Method unclear";
    }

    updateDecodingTips() {
        const method = document.getElementById('decodeMethod').value;
        const tipsElement = document.getElementById('decodingTips');
        
        const tips = {
            auto: "Select a specific method or let auto-detection analyze the text patterns.",
            els: "ELS reads characters at regular intervals. Works best with longer texts.",
            acrostic: "Acrostic reads the first letter of each line. Look for natural paragraph breaks.",
            punctuation: "Punctuation method uses periods (0) and exclamation marks (1) as binary code.",
            null: "Null cipher reads the first letter of consecutive words to spell the message."
        };

        tipsElement.innerHTML = `<p><strong>Tip:</strong> ${tips[method] || tips.auto}</p>`;
    }

    async decodeMessage() {
        const encodedText = document.getElementById('encodedText').value.trim();
        let method = document.getElementById('decodeMethod').value;

        if (!encodedText) {
            this.showError('Please enter the encoded text to decode');
            return;
        }

        // If auto-detect, use the detected method
        if (method === 'auto') {
            this.detectEncodingMethod(encodedText);
            method = document.getElementById('decodeMethod').value;
            
            if (method === 'auto') {
                this.showError('Could not automatically detect the encoding method. Please select one manually.');
                return;
            }
        }

        // Show loading
        document.getElementById('decodeLoadingDiv').classList.remove('hidden');
        document.getElementById('decodeResultsDiv').classList.add('hidden');
        document.getElementById('decodeBtn').disabled = true;

        const startTime = Date.now();

        try {
            let decodedMessage = '';
            let confidence = 0;

            // Decode using the selected method
            switch (method) {
                case 'els':
                    const result = this.decodeELS(encodedText);
                    decodedMessage = result.message;
                    confidence = result.confidence;
                    break;
                case 'acrostic':
                    decodedMessage = this.decodeAcrostic(encodedText);
                    confidence = this.calculateDecodeConfidence(decodedMessage);
                    break;
                case 'punctuation':
                    decodedMessage = this.decodePunctuation(encodedText);
                    confidence = this.calculateDecodeConfidence(decodedMessage);
                    break;
                case 'null':
                    decodedMessage = this.decodeNullCipher(encodedText);
                    confidence = this.calculateDecodeConfidence(decodedMessage);
                    break;
                default:
                    throw new Error('Invalid decoding method selected');
            }

            const processingTime = Date.now() - startTime;

            // Display results
            this.displayDecodeResults(decodedMessage, method, processingTime, confidence);
            this.showSuccess(`Message decoded successfully using ${this.getMethodName(method)}!`);

        } catch (error) {
            this.showError(`Decoding failed: ${error.message}`);
        } finally {
            document.getElementById('decodeLoadingDiv').classList.add('hidden');
            document.getElementById('decodeBtn').disabled = false;
        }
    }

    // DECODING METHODS - Fixed to match encoding algorithms exactly
    decodeELS(text) {
        // Use the same algorithm as testDecodeELS but try different skip distances
        const cleanText = text.replace(/[^a-zA-Z]/g, '');
        let bestResult = { message: '', confidence: 0 };

        // Try skip distances from 2 to reasonable maximum
        for (let skip = 2; skip <= Math.min(50, Math.floor(cleanText.length / 3)); skip++) {
            let message = '';
            let currentPos = 0;
            
            // Use the same extraction method as the encoding
            for (let i = 0; i < Math.floor(cleanText.length / skip); i++) {
                let placed = false;
                
                for (let j = 0; j < skip && !placed; j++) {
                    const pos = currentPos + j;
                    if (pos < text.length) {
                        const char = text[pos];
                        if (char.match(/[a-zA-Z]/)) {
                            message += char.toLowerCase();
                            placed = true;
                        }
                    }
                }
                
                currentPos += skip;
                if (message.length > 100) break; // Prevent extremely long messages
            }
            
            const confidence = this.calculateELSConfidence(message, skip, cleanText.length);
            if (confidence > bestResult.confidence && message.length > 2) {
                bestResult = { message, confidence };
            }
        }

        return bestResult;
    }

    calculateELSConfidence(message, skip, textLength) {
        let confidence = 0;
        
        // Check for common English patterns
        const commonWords = ['the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but', 'his', 'from', 'they'];
        const vowels = 'aeiou';
        
        let vowelCount = 0;
        let commonWordMatches = 0;
        
        for (let char of message) {
            if (vowels.includes(char)) vowelCount++;
        }
        
        // Check for common words
        for (let word of commonWords) {
            if (message.includes(word)) commonWordMatches++;
        }
        
        // Calculate confidence based on various factors
        const vowelRatio = vowelCount / message.length;
        if (vowelRatio > 0.2 && vowelRatio < 0.6) confidence += 20;
        
        confidence += commonWordMatches * 5;
        
        // Prefer reasonable message lengths
        if (message.length > 3 && message.length < 50) confidence += 10;
        
        // Prefer reasonable skip distances
        if (skip > 2 && skip < 20) confidence += 5;
        
        return Math.min(confidence, 100);
    }

    decodeAcrostic(text) {
        // Use the exact same algorithm as testDecodeAcrostic
        const lines = text.split('\n');
        let message = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let firstLetterIndex = -1;
            for (let j = 0; j < line.length; j++) {
                if (line[j].match(/[a-zA-Z]/)) {
                    firstLetterIndex = j;
                    break;
                }
            }
            
            if (firstLetterIndex !== -1) {
                const char = line[firstLetterIndex];
                message += char.toLowerCase();
            }
        }

        return message;
    }

    decodePunctuation(text) {
        // Use the exact same algorithm as testDecodePunctuation
        let binaryString = '';
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '.') {
                binaryString += '0';
            } else if (char === '!') {
                binaryString += '1';
            }
        }
        
        let message = '';
        for (let i = 0; i < binaryString.length; i += 8) {
            const byte = binaryString.slice(i, i + 8);
            if (byte.length === 8) {
                const charCode = parseInt(byte, 2);
                if (charCode > 0 && charCode < 128) {
                    const char = String.fromCharCode(charCode);
                    message += char;
                } else {
                    break;
                }
            }
        }
        
        return message;
    }

    decodeNullCipher(text) {
        // Use the exact same algorithm as testDecodeNullCipher
        const words = text.split(/\s+/).filter(word => word.length > 0);
        let message = '';

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            let firstLetterIndex = -1;
            for (let j = 0; j < word.length; j++) {
                if (word[j].match(/[a-zA-Z]/)) {
                    firstLetterIndex = j;
                    break;
                }
            }
            
            if (firstLetterIndex !== -1) {
                const char = word[firstLetterIndex];
                message += char.toLowerCase();
            }
        }

        return message;
    }

    calculateDecodeConfidence(message) {
        if (!message) return 0;
        
        let confidence = 50; // Base confidence
        
        // Check for readable English patterns
        const vowels = 'aeiou';
        const consonants = 'bcdfghjklmnpqrstvwxyz';
        
        let vowelCount = 0;
        let consonantCount = 0;
        
        for (let char of message.toLowerCase()) {
            if (vowels.includes(char)) vowelCount++;
            if (consonants.includes(char)) consonantCount++;
        }
        
        const totalLetters = vowelCount + consonantCount;
        if (totalLetters > 0) {
            const vowelRatio = vowelCount / totalLetters;
            
            // English typically has 35-45% vowels
            if (vowelRatio > 0.25 && vowelRatio < 0.55) {
                confidence += 30;
            } else if (vowelRatio > 0.15 && vowelRatio < 0.65) {
                confidence += 15;
            }
        }
        
        // Check for common English words
        const commonWords = ['the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but'];
        let wordMatches = 0;
        for (let word of commonWords) {
            if (message.toLowerCase().includes(word)) wordMatches++;
        }
        confidence += wordMatches * 5;
        
        // Reasonable message length
        if (message.length > 2 && message.length < 200) {
            confidence += 10;
        }
        
        return Math.min(confidence, 95);
    }

    displayDecodeResults(message, method, processingTime, confidence) {
        document.getElementById('decodedMessage').textContent = message || 'No readable message found';
        document.getElementById('usedMethod').textContent = this.getMethodName(method);
        document.getElementById('messageLength').textContent = message.length + ' chars';
        document.getElementById('decodingTime').textContent = processingTime + 'ms';
        document.getElementById('confidence').textContent = Math.round(confidence) + '%';
        
        document.getElementById('decodeResultsDiv').classList.remove('hidden');
    }

    getMethodName(method) {
        const names = {
            els: 'Equidistant Letter Sequence',
            acrostic: 'Acrostic Method',
            punctuation: 'Punctuation Pattern',
            null: 'Null Cipher'
        };
        return names[method] || method;
    }

    // FILE HANDLING FOR DECODING
    handleDecodeFileUpload(event) {
        const file = event.target.files[0];
        if (file && file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('encodedText').value = e.target.result;
                this.analyzeEncodedText();
                this.showSuccess('Encoded file uploaded successfully!');
            };
            reader.readAsText(file);
        } else {
            this.showError('Please upload a valid .txt file');
        }
    }

    // DECODE RESULT ACTIONS
    copyDecodedMessage() {
        const message = document.getElementById('decodedMessage').textContent;
        navigator.clipboard.writeText(message).then(() => {
            this.showSuccess('Decoded message copied to clipboard!');
        }).catch(() => {
            this.showError('Failed to copy to clipboard');
        });
    }

    downloadDecodedMessage() {
        const message = document.getElementById('decodedMessage').textContent;
        const method = document.getElementById('usedMethod').textContent;
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        
        const content = `Decoded Message (${method})\nDecoded on: ${new Date().toLocaleString()}\n\n${message}`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `decoded_message_${timestamp}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showSuccess('Decoded message downloaded successfully!');
    }

    showDetailedAnalysis() {
        const message = document.getElementById('decodedMessage').textContent;
        const method = document.getElementById('usedMethod').textContent;
        const confidence = document.getElementById('confidence').textContent;
        
        const analysis = `
DETAILED DECODING ANALYSIS
==========================

Decoded Message: "${message}"
Method Used: ${method}
Confidence Level: ${confidence}
Message Length: ${message.length} characters

Character Analysis:
- Letters: ${message.replace(/[^a-zA-Z]/g, '').length}
- Numbers: ${message.replace(/[^0-9]/g, '').length}
- Spaces: ${message.replace(/[^ ]/g, '').length}
- Special Characters: ${message.replace(/[a-zA-Z0-9\s]/g, '').length}

Quality Assessment:
${this.getQualityAssessment(message, confidence)}
                `.trim();

        alert(analysis);
    }

    getQualityAssessment(message, confidenceStr) {
        const confidence = parseInt(confidenceStr);
        
        if (confidence >= 80) {
            return "✅ High quality decode - Message appears to be correctly extracted";
        } else if (confidence >= 60) {
            return "⚠️ Moderate quality decode - Message may be correct but verify manually";
        } else if (confidence >= 40) {
            return "❓ Low quality decode - Message extraction uncertain, try different method";
        } else {
            return "❌ Poor quality decode - Consider trying a different decoding method";
        }
    }

    resetDecoder() {
        document.getElementById('encodedText').value = '';
        document.getElementById('decodeMethod').value = 'auto';
        document.getElementById('decodeFileUpload').value = '';
        document.getElementById('decodeAnalysis').classList.add('hidden');
        document.getElementById('detectedMethodInfo').classList.add('hidden');
        document.getElementById('decodeResultsDiv').classList.add('hidden');
        document.getElementById('decodeBtn').disabled = true;
        
        this.showSuccess('Decoder reset successfully!');
    }

    // EXISTING ENCODING FUNCTIONALITY (unchanged)
    async checkBackendConnection() {
        try {
            const response = await fetch(`${this.backendUrl}/api/health`);
            const data = await response.json();
            
            if (data.status === 'OK') {
                this.showBackendStatus('connected', data.openai_configured);
            } else {
                this.showBackendStatus('disconnected');
            }
        } catch (error) {
            this.showBackendStatus('disconnected');
        }
    }

    showBackendStatus(status, aiConfigured = false) {
        const aiBtn = document.getElementById('generateAIText');
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const retryBtn = document.getElementById('retryConnection');
        
        if (status === 'connected') {
            aiBtn.disabled = false;
            statusIndicator.textContent = '✅';
            retryBtn.style.display = 'none';
            
            if (aiConfigured) {
                aiBtn.innerHTML = '🚀 Generate AI Carrier Text';
                statusText.textContent = 'Backend connected - OpenAI ready';
            } else {
                aiBtn.innerHTML = '🤖 Generate Template Text';
                statusText.textContent = 'Backend connected - Template mode';
            }
        } else {
            aiBtn.disabled = true;
            aiBtn.innerHTML = '⚠️ Backend Required';
            statusIndicator.textContent = '❌';
            statusText.textContent = 'Backend disconnected';
            retryBtn.style.display = 'inline-block';
        }
    }

    updateAIRecommendations() {
        const method = document.getElementById('encryptionMethod').value;
        const messageLength = document.getElementById('secretMessage').value.length;
        const lengthInput = document.getElementById('aiLength');
        
        let recommendedLength = Math.max(200, messageLength * 5);
        
        switch (method) {
            case 'els': recommendedLength = Math.max(300, messageLength * 8); break;
            case 'acrostic': recommendedLength = Math.max(150, messageLength * 6); break;
            case 'punctuation': recommendedLength = Math.max(250, messageLength * 10); break;
            case 'null': recommendedLength = Math.max(messageLength * 4, 100); break;
        }
        
        lengthInput.value = Math.min(recommendedLength, 1000);
    }

    async generateAICarrierText() {
        const secretMessage = document.getElementById('secretMessage').value.trim();
        const topic = document.getElementById('aiTopic').value.trim();
        const method = document.getElementById('encryptionMethod').value;
        const style = document.getElementById('aiStyle').value;
        const length = parseInt(document.getElementById('aiLength').value);

        if (!secretMessage) {
            this.showError('Please enter a secret message first');
            return;
        }

        if (!topic) {
            this.showError('Please enter a topic for the carrier text');
            return;
        }

        const aiLoadingDiv = document.getElementById('aiLoadingDiv');
        const generateBtn = document.getElementById('generateAIText');
        
        aiLoadingDiv.classList.remove('hidden');
        generateBtn.disabled = true;

        try {
            const response = await fetch(`${this.backendUrl}/api/generate-carrier-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: secretMessage, topic, method, style, length })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate text');
            }

            const data = await response.json();
            document.getElementById('carrierText').value = data.carrierText;
            
            const source = data.metadata.source === 'openai' ? 'AI-generated' : 'Template-based';
            this.showSuccess(`${source} carrier text generated successfully! (${data.metadata.actualWordCount} words)`);
            
            this.analyzeText();
            this.validateInputs();

        } catch (error) {
            this.showError(`Failed to generate carrier text: ${error.message}`);
        } finally {
            aiLoadingDiv.classList.add('hidden');
            generateBtn.disabled = false;
        }
    }

    analyzeText() {
        const carrierText = document.getElementById('carrierText').value;
        const method = document.getElementById('encryptionMethod').value;
        const secretMessage = document.getElementById('secretMessage').value;
        
        if (!carrierText) {
            document.getElementById('textAnalysis').classList.add('hidden');
            return;
        }

        const words = carrierText.split(/\s+/).filter(word => word.length > 0);
        const chars = carrierText.length;
        const letters = carrierText.replace(/[^a-zA-Z]/g, '').length;
        
        let suitability = 'Good';
        let suitabilityClass = 'good';
        
        switch (method) {
            case 'els':
                if (letters < secretMessage.length * 3) {
                    suitability = 'Too Short'; suitabilityClass = 'poor';
                } else if (letters < secretMessage.length * 5) {
                    suitability = 'Adequate'; suitabilityClass = 'fair';
                }
                break;
            case 'acrostic':
                const lines = carrierText.split('\n').length;
                if (lines < secretMessage.length) {
                    suitability = 'Need More Lines'; suitabilityClass = 'poor';
                }
                break;
            case 'punctuation':
                const punctuation = (carrierText.match(/[.!]/g) || []).length;
                if (punctuation < secretMessage.length * 4) {
                    suitability = 'Need More Punctuation'; suitabilityClass = 'fair';
                }
                break;
            case 'null':
                if (words.length < secretMessage.length) {
                    suitability = 'Too Few Words'; suitabilityClass = 'poor';
                }
                break;
        }

        document.getElementById('wordCount').textContent = words.length;
        document.getElementById('charCount').textContent = chars;
        document.getElementById('suitability').textContent = suitability;
        document.getElementById('suitability').className = `analysis-value ${suitabilityClass}`;
        document.getElementById('textAnalysis').classList.remove('hidden');
    }

    validateInputs() {
        const secretMessage = document.getElementById('secretMessage').value.trim();
        const carrierText = document.getElementById('carrierText').value.trim();
        const startBtn = document.getElementById('startBtn');

        startBtn.disabled = !(secretMessage.length > 0 && carrierText.length > 0);
    }

    showError(message) {
        const errorDiv = document.getElementById('errorDiv');
        document.getElementById('errorMessage').textContent = message;
        errorDiv.classList.remove('hidden');
        setTimeout(() => errorDiv.classList.add('hidden'), 5000);
    }

    showSuccess(message) {
        const successDiv = document.getElementById('successDiv');
        document.getElementById('successMessage').textContent = message;
        successDiv.classList.remove('hidden');
        setTimeout(() => successDiv.classList.add('hidden'), 3000);
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file && file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('carrierText').value = e.target.result;
                this.validateInputs();
                this.analyzeText();
                this.showSuccess('File uploaded successfully!');
            };
            reader.readAsText(file);
        } else {
            this.showError('Please upload a valid .txt file');
        }
    }

    async processMessage() {
        const secretMessage = document.getElementById('secretMessage').value.trim();
        const carrierText = document.getElementById('carrierText').value.trim();
        const method = document.getElementById('encryptionMethod').value;

        if (!secretMessage || !carrierText) {
            this.showError('Please enter both secret message and carrier text');
            return;
        }

        if (secretMessage.length > 500) {
            this.showError('Secret message must be 500 characters or less');
            return;
        }

        document.getElementById('loadingDiv').classList.remove('hidden');
        document.getElementById('resultsDiv').classList.add('hidden');
        document.getElementById('startBtn').disabled = true;

        try {
            try {
                const response = await fetch(`${this.backendUrl}/api/encode`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: secretMessage, carrierText: carrierText, method: method })
                });

                if (response.ok) {
                    const data = await response.json();
                    this.currentResult = data.result.encodedText;
                    this.currentMethod = method;
                    this.decodingInstructions = data.result.instructions;
                    this.displayResults(data.result);
                    this.showSuccess('Message encoded successfully using backend!');
                    return;
                }
            } catch (error) {
                console.warn('Backend encoding failed, using frontend fallback:', error);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

            let result;
            switch (method) {
                case 'els': result = this.encodeELS(secretMessage, carrierText); break;
                case 'acrostic': result = this.encodeAcrostic(secretMessage, carrierText); break;
                case 'punctuation': result = this.encodePunctuation(secretMessage, carrierText); break;
                case 'null': result = this.encodeNullCipher(secretMessage, carrierText); break;
                default: throw new Error('Invalid encoding method');
            }

            this.currentResult = result.encodedText;
            this.currentMethod = method;
            this.decodingInstructions = result.instructions;
            this.displayResults(result);
            this.showSuccess('Message encoded successfully!');

        } catch (error) {
            this.showError(error.message);
        } finally {
            document.getElementById('loadingDiv').classList.add('hidden');
            document.getElementById('startBtn').disabled = false;
        }
    }

    // ENCODING METHODS (unchanged from original)
    encodeELS(message, carrierText) {
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

    encodeAcrostic(message, carrierText) {
        const cleanMessage = message.toLowerCase().replace(/[^a-z]/g, '');
        
        if (cleanMessage.length === 0) {
            throw new Error('Secret message must contain at least one letter');
        }

        let lines = carrierText.split('\n').filter(line => line.trim().length > 0);
        
        if (lines.length === 1 && lines[0].length > 100) {
            const sentences = lines[0].split(/(?<=[.!?])\s+/);
            if (sentences.length >= cleanMessage.length) {
                lines = sentences.slice(0, cleanMessage.length);
            }
        }
        
        if (lines.length < cleanMessage.length) {
            let newLines = [];
            
            for (let line of lines) {
                if (line.length > 80 && newLines.length < cleanMessage.length) {
                    const breakPoints = line.split(/(?:,\s+|;\s+|\s+and\s+|\s+but\s+|\s+or\s+|\s+so\s+)/);
                    
                    if (breakPoints.length > 1) {
                        for (let part of breakPoints) {
                            if (part.trim().length > 10) {
                                newLines.push(part.trim());
                                if (newLines.length >= cleanMessage.length) break;
                            }
                        }
                    } else {
                        newLines.push(line);
                    }
                } else {
                    newLines.push(line);
                }
                
                if (newLines.length >= cleanMessage.length) break;
            }
            lines = newLines;
        }
        
        if (lines.length < cleanMessage.length) {
            const needed = cleanMessage.length - lines.length;
            const contextualLines = [
                'Hence the conclusion.',
                'Therefore we see.',
                'Thus it follows.',
                'Moreover this shows.',
                'Furthermore it proves.',
                'Additionally we note.',
                'Consequently we find.',
                'Nevertheless it stands.'
            ];
            
            for (let i = 0; i < needed; i++) {
                const selectedLine = contextualLines[i % contextualLines.length];
                lines.push(selectedLine);
            }
        }

        lines = lines.slice(0, cleanMessage.length);

        let encodedLines = [];
        let modificationsCount = 0;
        
        for (let i = 0; i < cleanMessage.length; i++) {
            const targetChar = cleanMessage[i];
            let line = lines[i] || '';
            
            let firstLetterIndex = -1;
            for (let j = 0; j < line.length; j++) {
                if (line[j].match(/[a-zA-Z]/)) {
                    firstLetterIndex = j;
                    break;
                }
            }
            
            if (firstLetterIndex !== -1) {
                const originalChar = line[firstLetterIndex];
                const isUpperCase = originalChar === originalChar.toUpperCase();
                const newChar = isUpperCase ? targetChar.toUpperCase() : targetChar;
                
                if (originalChar.toLowerCase() !== targetChar) {
                    line = line.substring(0, firstLetterIndex) + newChar + line.substring(firstLetterIndex + 1);
                    modificationsCount++;
                }
            } else {
                line = targetChar.toUpperCase() + (line.length > 0 ? ' ' + line : '.');
                modificationsCount++;
            }
            
            encodedLines.push(line);
        }

        const securityScore = this.calculateSecurityScore(cleanMessage.length, encodedLines.join('\n').length, 'acrostic');

        return {
            encodedText: encodedLines.join('\n'),
            method: 'Acrostic Method',
            linesUsed: cleanMessage.length,
            modificationsCount: modificationsCount,
            originalLines: lines.length,
            securityScore: securityScore,
            instructions: {
                method: 'Acrostic',
                readFirstLetters: true,
                numberOfLines: cleanMessage.length,
                modificationsCount: modificationsCount
            }
        };
    }

    encodePunctuation(message, carrierText) {
        if (message.length === 0) {
            throw new Error('Secret message cannot be empty');
        }

        const binaryMessage = message.split('').map(char => {
            const binary = char.charCodeAt(0).toString(2).padStart(8, '0');
            return { char: char, ascii: char.charCodeAt(0), binary: binary };
        });
        
        const fullBinary = binaryMessage.map(item => item.binary).join('');
        
        let encodedText = carrierText;
        let binaryIndex = 0;
        let modifications = [];
        
        let newText = '';
        for (let i = 0; i < encodedText.length && binaryIndex < fullBinary.length; i++) {
            const char = encodedText[i];
            if (char === '.' || char === '!') {
                const binaryDigit = fullBinary[binaryIndex];
                const newChar = binaryDigit === '0' ? '.' : '!';
                newText += newChar;
                
                if (char !== newChar) {
                    modifications.push({
                        position: i,
                        original: char,
                        new: newChar,
                        binaryIndex: binaryIndex,
                        represents: `${Math.floor(binaryIndex / 8) < message.length ? message[Math.floor(binaryIndex / 8)] : 'padding'} bit ${binaryIndex % 8}`
                    });
                }
                binaryIndex++;
            } else {
                newText += char;
            }
        }
        
        encodedText = newText;
        let addedPunctuation = [];

        if (binaryIndex < fullBinary.length) {
            const remainingBinary = fullBinary.substring(binaryIndex);
            encodedText += ' ';
            
            for (let i = 0; i < remainingBinary.length; i++) {
                const punctuation = remainingBinary[i] === '0' ? '.' : '!';
                encodedText += punctuation;
                
                addedPunctuation.push({
                    position: encodedText.length - 1,
                    char: punctuation,
                    binaryIndex: binaryIndex + i,
                    represents: `${message[Math.floor((binaryIndex + i) / 8)] || 'overflow'} bit ${(binaryIndex + i) % 8}`
                });
                
                if ((i + 1) % 8 === 0 && i < remainingBinary.length - 1) {
                    encodedText += ' ';
                }
            }
        }

        const totalBitsEncoded = Math.min(binaryIndex + addedPunctuation.length, fullBinary.length);
        const encodingComplete = totalBitsEncoded === fullBinary.length;
        const securityScore = this.calculateSecurityScore(message.length, carrierText.length, 'punctuation');

        return {
            encodedText: encodedText,
            method: 'Punctuation Pattern',
            messageAnalysis: binaryMessage,
            binaryLength: fullBinary.length,
            modificationsCount: modifications.length,
            addedPunctuation: addedPunctuation.length,
            totalBitsEncoded: totalBitsEncoded,
            encodingComplete: encodingComplete,
            encodingEfficiency: Math.round((totalBitsEncoded / fullBinary.length) * 100),
            securityScore: securityScore,
            instructions: {
                method: 'Punctuation',
                pattern: 'Periods (.) = 0, Exclamation marks (!) = 1',
                binaryLength: fullBinary.length,
                totalBitsEncoded: totalBitsEncoded,
                readInstructions: 'Read all punctuation marks (. and !) in order, convert to binary, then to ASCII'
            }
        };
    }

    encodeNullCipher(message, carrierText) {
        const cleanMessage = message.toLowerCase().replace(/[^a-z]/g, '');
        
        if (cleanMessage.length === 0) {
            throw new Error('Secret message must contain at least one letter');
        }

        let words = carrierText.split(/\s+/).filter(word => word.length > 0);
        
        if (words.length < cleanMessage.length) {
            const wordsNeeded = cleanMessage.length - words.length;
            const contextualFillers = [
                'also', 'thus', 'then', 'here', 'there', 'when', 'where', 'while',
                'since', 'though', 'still', 'yet', 'just', 'quite', 'rather', 'very',
                'well', 'indeed', 'perhaps', 'maybe', 'surely', 'truly', 'really'
            ];
            
            for (let i = 0; i < wordsNeeded; i++) {
                const fillerWord = contextualFillers[i % contextualFillers.length];
                words.push(fillerWord);
            }
        }

        let encodedWords = [...words];
        let modifications = [];
        
        for (let i = 0; i < cleanMessage.length; i++) {
            const targetChar = cleanMessage[i];
            let word = encodedWords[i];
            
            const firstLetterMatch = word.match(/[a-zA-Z]/);
            if (firstLetterMatch) {
                const firstLetterIndex = word.indexOf(firstLetterMatch[0]);
                const originalChar = word[firstLetterIndex];
                const isUpperCase = originalChar === originalChar.toUpperCase();
                const newChar = isUpperCase ? targetChar.toUpperCase() : targetChar;
                
                if (originalChar.toLowerCase() !== targetChar) {
                    const newWord = word.substring(0, firstLetterIndex) + 
                                   newChar + 
                                   word.substring(firstLetterIndex + 1);
                    
                    encodedWords[i] = newWord;
                    modifications.push({
                        wordIndex: i,
                        original: word,
                        modified: newWord,
                        originalLetter: originalChar,
                        newLetter: newChar,
                        targetChar: targetChar,
                        position: firstLetterIndex,
                        messageIndex: i
                    });
                }
            } else {
                const newWord = targetChar.toLowerCase() + 'nd';
                encodedWords[i] = newWord;
                modifications.push({
                    wordIndex: i,
                    original: word,
                    modified: newWord,
                    originalLetter: null,
                    newLetter: targetChar,
                    targetChar: targetChar,
                    position: 0,
                    messageIndex: i,
                    created: true
                });
            }
        }

        const securityScore = this.calculateSecurityScore(cleanMessage.length, carrierText.length, 'null');

        return {
            encodedText: encodedWords.join(' '),
            method: 'Null Cipher',
            totalWords: encodedWords.length,
            wordsModified: modifications.length,
            securityScore: securityScore,
            instructions: {
                method: 'Null Cipher',
                readFirstLetters: true,
                numberOfWords: cleanMessage.length,
                decodingSteps: [
                    '1. Read the first letter of each word in sequence',
                    '2. Take only the first ' + cleanMessage.length + ' letters',
                    '3. Combine letters to form the hidden message'
                ]
            }
        };
    }

    calculateSecurityScore(messageLength, carrierLength, method) {
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

    displayResults(result) {
        document.getElementById('resultText').textContent = result.encodedText;
        document.getElementById('methodUsed').textContent = result.method;
        document.getElementById('textLength').textContent = result.encodedText.length;
        document.getElementById('hiddenChars').textContent = document.getElementById('secretMessage').value.length;
        document.getElementById('securityScore').textContent = result.securityScore + '%';
        
        document.getElementById('resultsDiv').classList.remove('hidden');
    }

    copyResult() {
        navigator.clipboard.writeText(this.currentResult).then(() => {
            this.showSuccess('Result copied to clipboard!');
        }).catch(() => {
            this.showError('Failed to copy to clipboard');
        });
    }

    downloadResult() {
        const blob = new Blob([this.currentResult], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `codevault_encoded_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showSuccess('File downloaded successfully!');
    }

    testDecode() {
        if (!this.currentResult || !this.decodingInstructions) {
            this.showError('No encoded message to decode');
            return;
        }

        try {
            let decodedMessage = '';
            const instructions = this.decodingInstructions;
            const originalMessage = document.getElementById('secretMessage').value;

            switch (instructions.method) {
                case 'ELS':
                    decodedMessage = this.testDecodeELS(this.currentResult, instructions);
                    break;
                case 'Acrostic':
                    decodedMessage = this.testDecodeAcrostic(this.currentResult, instructions);
                    break;
                case 'Punctuation':
                    decodedMessage = this.testDecodePunctuation(this.currentResult, instructions);
                    break;
                case 'Null Cipher':
                    decodedMessage = this.testDecodeNullCipher(this.currentResult, instructions);
                    break;
                default:
                    throw new Error('Unknown decoding method: ' + instructions.method);
            }

            const cleanOriginal = originalMessage.toLowerCase().replace(/[^a-z]/g, '');
            const cleanDecoded = decodedMessage.toLowerCase().replace(/[^a-z]/g, '');

            if (cleanDecoded === cleanOriginal) {
                this.showSuccess(`✅ Decode test successful! Retrieved: "${decodedMessage}"`);
            } else {
                this.showError(`❌ Decode test failed.\nGot: "${decodedMessage}"\nExpected: "${originalMessage}"`);
            }
        } catch (error) {
            this.showError('Decode test failed: ' + error.message);
        }
    }

    testDecodeELS(text, instructions) {
        let decodedMessage = '';
        let currentPos = 0;
        
        for (let i = 0; i < instructions.messageLength; i++) {
            let placed = false;
            
            for (let j = 0; j < instructions.skipDistance && !placed; j++) {
                const pos = currentPos + j;
                if (pos < text.length) {
                    const char = text[pos];
                    if (char.match(/[a-zA-Z]/)) {
                        decodedMessage += char.toLowerCase();
                        placed = true;
                    }
                }
            }
            
            currentPos += instructions.skipDistance;
        }
        
        return decodedMessage;
    }

    testDecodeAcrostic(text, instructions) {
        const lines = text.split('\n');
        let decodedMessage = '';

        for (let i = 0; i < Math.min(lines.length, instructions.numberOfLines); i++) {
            const line = lines[i];
            let firstLetterIndex = -1;
            for (let j = 0; j < line.length; j++) {
                if (line[j].match(/[a-zA-Z]/)) {
                    firstLetterIndex = j;
                    break;
                }
            }
            
            if (firstLetterIndex !== -1) {
                const char = line[firstLetterIndex];
                decodedMessage += char.toLowerCase();
            }
        }
        
        return decodedMessage;
    }

    testDecodePunctuation(text, instructions) {
        let binaryString = '';
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '.') {
                binaryString += '0';
            } else if (char === '!') {
                binaryString += '1';
            }
        }
        
        let decodedMessage = '';
        for (let i = 0; i < binaryString.length; i += 8) {
            const byte = binaryString.slice(i, i + 8);
            if (byte.length === 8) {
                const charCode = parseInt(byte, 2);
                if (charCode > 0 && charCode < 128) {
                    const char = String.fromCharCode(charCode);
                    decodedMessage += char;
                } else {
                    break;
                }
            }
        }
        
        return decodedMessage;
    }

    testDecodeNullCipher(text, instructions) {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        let decodedMessage = '';

        for (let i = 0; i < Math.min(words.length, instructions.numberOfWords); i++) {
            const word = words[i];
            let firstLetterIndex = -1;
            for (let j = 0; j < word.length; j++) {
                if (word[j].match(/[a-zA-Z]/)) {
                    firstLetterIndex = j;
                    break;
                }
            }
            
            if (firstLetterIndex !== -1) {
                const char = word[firstLetterIndex];
                decodedMessage += char.toLowerCase();
            }
        }

        return decodedMessage;
    }

    resetApp() {
        document.getElementById('secretMessage').value = '';
        document.getElementById('carrierText').value = '';
        document.getElementById('encryptionMethod').value = 'els';
        document.getElementById('fileUpload').value = '';
        document.getElementById('aiTopic').value = 'technology';
        document.getElementById('aiStyle').value = 'casual';
        document.getElementById('aiLength').value = '200';
        document.getElementById('resultsDiv').classList.add('hidden');
        document.getElementById('errorDiv').classList.add('hidden');
        document.getElementById('successDiv').classList.add('hidden');
        document.getElementById('textAnalysis').classList.add('hidden');
        document.getElementById('startBtn').disabled = true;
        
        this.currentResult = null;
        this.currentMethod = null;
        this.decodingInstructions = null;
        
        this.showSuccess('Application reset successfully!');
    }
}

// Global function for tab switching
function switchTab(tabName) {
    // Get the instance (we'll create it globally)
    if (window.codeVaultInstance) {
        window.codeVaultInstance.switchTab(tabName);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.codeVaultInstance = new CodeVaultPro();
});