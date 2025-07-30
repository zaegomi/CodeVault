// CodeVault Steganography Engine with AI Integration
class CodeVault {
    constructor() {
        this.initializeEventListeners();
        this.currentResult = null;
        this.currentMethod = null;
        this.decodingInstructions = null;
        this.backendUrl = 'http://localhost:3001';
        this.checkBackendConnection();
    }

    initializeEventListeners() {
        // Original event listeners
        document.getElementById('startBtn').addEventListener('click', () => this.processMessage());
        document.getElementById('fileUpload').addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('copyBtn').addEventListener('click', () => this.copyResult());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadResult());
        document.getElementById('decodeBtn').addEventListener('click', () => this.testDecode());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetApp());

        // NEW: AI text generation listener
        document.getElementById('generateAIText').addEventListener('click', () => this.generateAICarrierText());

        // NEW: Backend retry listener
        document.getElementById('retryConnection').addEventListener('click', () => this.checkBackendConnection());

        // Real-time validation
        document.getElementById('secretMessage').addEventListener('input', () => this.validateInputs());
        document.getElementById('carrierText').addEventListener('input', () => {
            this.validateInputs();
            this.analyzeText();
        });

        // NEW: AI parameter change listeners
        document.getElementById('encryptionMethod').addEventListener('change', () => this.updateAIRecommendations());
        document.getElementById('secretMessage').addEventListener('input', () => this.updateAIRecommendations());
    }

    async checkBackendConnection() {
        try {
            console.log('Checking backend connection...');
            const response = await fetch(`${this.backendUrl}/api/health`);
            const data = await response.json();
            
            console.log('Backend response:', data);
            
            if (data.status === 'OK') {
                this.showBackendStatus('connected', data.openai_configured);
                console.log('Backend connected successfully');
            } else {
                this.showBackendStatus('disconnected');
            }
        } catch (error) {
            console.error('Backend connection failed:', error);
            this.showBackendStatus('disconnected');
            console.warn('Backend not available, using frontend-only mode');
        }
    }

    showBackendStatus(status, aiConfigured = false) {
        const aiBtn = document.getElementById('generateAIText');
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const retryBtn = document.getElementById('retryConnection');
        
        console.log('Setting backend status:', status, 'AI configured:', aiConfigured);
        
        if (status === 'connected') {
            aiBtn.disabled = false;
            statusIndicator.textContent = '✅';
            retryBtn.style.display = 'none';
            
            if (aiConfigured) {
                aiBtn.innerHTML = '🚀 Generate AI Carrier Text';
                aiBtn.title = 'AI text generation available with OpenAI';
                statusText.textContent = 'Backend connected - OpenAI ready';
            } else {
                aiBtn.innerHTML = '🤖 Generate Template Text';
                aiBtn.title = 'Backend available - using template generation (OpenAI not configured)';
                statusText.textContent = 'Backend connected - Template mode';
            }
            console.log('Backend status: Connected');
        } else {
            aiBtn.disabled = true;
            aiBtn.innerHTML = '⚠️ Backend Required';
            aiBtn.title = 'Backend server not available';
            statusIndicator.textContent = '❌';
            statusText.textContent = 'Backend disconnected';
            retryBtn.style.display = 'inline-block';
            console.log('Backend status: Disconnected');
        }
    }

    updateAIRecommendations() {
        const method = document.getElementById('encryptionMethod').value;
        const messageLength = document.getElementById('secretMessage').value.length;
        const lengthInput = document.getElementById('aiLength');
        
        // Update recommended length based on method and message
        let recommendedLength = Math.max(200, messageLength * 5);
        
        switch (method) {
            case 'els':
                recommendedLength = Math.max(300, messageLength * 8);
                break;
            case 'acrostic':
                recommendedLength = Math.max(150, messageLength * 6);
                break;
            case 'punctuation':
                recommendedLength = Math.max(250, messageLength * 10);
                break;
            case 'null':
                recommendedLength = Math.max(messageLength * 4, 100);
                break;
        }
        
        lengthInput.value = Math.min(recommendedLength, 1000);
    }

    async generateAICarrierText() {
        const secretMessage = document.getElementById('secretMessage').value.trim();
        const topic = document.getElementById('aiTopic').value.trim();
        const method = document.getElementById('encryptionMethod').value;
        const style = document.getElementById('aiStyle').value;
        const length = parseInt(document.getElementById('aiLength').value);

        // Validation
        if (!secretMessage) {
            this.showError('Please enter a secret message first');
            return;
        }

        if (!topic) {
            this.showError('Please enter a topic for the carrier text');
            return;
        }

        // Show loading
        const aiLoadingDiv = document.getElementById('aiLoadingDiv');
        const generateBtn = document.getElementById('generateAIText');
        
        aiLoadingDiv.classList.remove('hidden');
        generateBtn.disabled = true;
        generateBtn.classList.add('loading');

        try {
            const response = await fetch(`${this.backendUrl}/api/generate-carrier-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: secretMessage,
                    topic: topic,
                    method: method,
                    style: style,
                    length: length
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate text');
            }

            const data = await response.json();
            
            // Set the generated text
            document.getElementById('carrierText').value = data.carrierText;
            
            // Show success message with metadata
            const source = data.metadata.source === 'openai' ? 'AI-generated' : 'Template-based';
            this.showSuccess(`${source} carrier text generated successfully! (${data.metadata.actualWordCount} words)`);
            
            // Update text analysis
            this.analyzeText();
            this.validateInputs();

            // Log metadata for debugging
            console.log('Generated text metadata:', data.metadata);

        } catch (error) {
            console.error('AI generation error:', error);
            this.showError(`Failed to generate carrier text: ${error.message}`);
        } finally {
            aiLoadingDiv.classList.add('hidden');
            generateBtn.disabled = false;
            generateBtn.classList.remove('loading');
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
        
        // Calculate suitability for current method
        let suitability = 'Good';
        let suitabilityClass = 'good';
        
        switch (method) {
            case 'els':
                if (letters < secretMessage.length * 3) {
                    suitability = 'Too Short';
                    suitabilityClass = 'poor';
                } else if (letters < secretMessage.length * 5) {
                    suitability = 'Adequate';
                    suitabilityClass = 'fair';
                }
                break;
            case 'acrostic':
                const lines = carrierText.split('\n').length;
                if (lines < secretMessage.length) {
                    suitability = 'Need More Lines';
                    suitabilityClass = 'poor';
                }
                break;
            case 'punctuation':
                const punctuation = (carrierText.match(/[.!]/g) || []).length;
                if (punctuation < secretMessage.length * 4) {
                    suitability = 'Need More Punctuation';
                    suitabilityClass = 'fair';
                }
                break;
            case 'null':
                if (words.length < secretMessage.length) {
                    suitability = 'Too Few Words';
                    suitabilityClass = 'poor';
                }
                break;
        }

        // Update display
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

        if (secretMessage.length > 0 && carrierText.length > 0) {
            startBtn.disabled = false;
        } else {
            startBtn.disabled = true;
        }
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

        // Show loading
        document.getElementById('loadingDiv').classList.remove('hidden');
        document.getElementById('resultsDiv').classList.add('hidden');
        document.getElementById('startBtn').disabled = true;

        try {
            // Try backend first, fallback to frontend
            try {
                const response = await fetch(`${this.backendUrl}/api/encode`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: secretMessage,
                        carrierText: carrierText,
                        method: method
                    })
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

            // Fallback to frontend encoding
            await new Promise(resolve => setTimeout(resolve, 1000));

            let result;
            switch (method) {
                case 'els':
                    result = this.encodeELS(secretMessage, carrierText);
                    break;
                case 'acrostic':
                    result = this.encodeAcrostic(secretMessage, carrierText);
                    break;
                case 'punctuation':
                    result = this.encodePunctuation(secretMessage, carrierText);
                    break;
                case 'null':
                    result = this.encodeNullCipher(secretMessage, carrierText);
                    break;
                default:
                    throw new Error('Invalid encoding method');
            }

            this.currentResult = result.encodedText;
            this.currentMethod = method;
            this.decodingInstructions = result.instructions;
            this.displayResults(result);
            this.showSuccess('Message encoded successfully!');

        } catch (error) {
            this.showError(error.message);
        } finally {
            // ALWAYS hide loading and re-enable button, regardless of success or failure
            document.getElementById('loadingDiv').classList.add('hidden');
            document.getElementById('startBtn').disabled = false;
        }
    }

    // Equidistant Letter Sequence (ELS) Encoding
    encodeELS(message, carrierText) {
        const cleanMessage = message.toLowerCase().replace(/[^a-z]/g, '');
        const cleanCarrier = carrierText.toLowerCase().replace(/[^a-z]/g, '');
        
        if (cleanMessage.length === 0) {
            throw new Error('Secret message must contain at least one letter');
        }

        if (cleanCarrier.length < cleanMessage.length * 2) {
            throw new Error('Carrier text too short for ELS encoding. Need at least ' + (cleanMessage.length * 2) + ' letters.');
        }

        // Calculate optimal skip distance
        const skipDistance = Math.floor(cleanCarrier.length / cleanMessage.length);
        
        if (skipDistance < 2) {
            throw new Error('Carrier text too short for secure ELS encoding');
        }

        let encodedText = carrierText;
        let positions = [];
        let currentPos = 0;

        // Place message characters at calculated intervals
        for (let i = 0; i < cleanMessage.length; i++) {
            const targetChar = cleanMessage[i];
            let placed = false;
            
            // Try to find position within skip distance
            for (let j = 0; j < skipDistance && !placed; j++) {
                const pos = currentPos + j;
                if (pos < encodedText.length) {
                    const originalChar = encodedText[pos].toLowerCase();
                    if (originalChar.match(/[a-z]/)) {
                        // Replace with target character, preserving case
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
    encodeAcrostic(message, carrierText) {
        const cleanMessage = message.toLowerCase().replace(/[^a-z]/g, '');
        
        if (cleanMessage.length === 0) {
            throw new Error('Secret message must contain at least one letter');
        }

        // Split carrier text into lines - be more conservative about line breaks
        let lines = carrierText.split('\n').filter(line => line.trim().length > 0);
        
        // If no line breaks exist, try to split at sentence boundaries
        if (lines.length === 1 && lines[0].length > 100) {
            const sentences = lines[0].split(/(?<=[.!?])\s+/);
            if (sentences.length >= cleanMessage.length) {
                lines = sentences.slice(0, cleanMessage.length);
            }
        }
        
        // If still not enough lines, split the text more intelligently
        if (lines.length < cleanMessage.length) {
            let newLines = [];
            
            for (let line of lines) {
                if (line.length > 80 && newLines.length < cleanMessage.length) {
                    // Split at natural break points: commas, semicolons, conjunctions
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
        
        // Only add minimal lines if absolutely necessary
        if (lines.length < cleanMessage.length) {
            const needed = cleanMessage.length - lines.length;
            
            // Add contextually relevant short lines
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

        // Trim to exactly what we need
        lines = lines.slice(0, cleanMessage.length);

        // Modify first letter of each line to match the secret message
        let encodedLines = [];
        let modificationsCount = 0;
        
        for (let i = 0; i < cleanMessage.length; i++) {
            const targetChar = cleanMessage[i];
            let line = lines[i] || '';
            
            // Find the first alphabetic character and its position
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
                
                // Only modify if different
                if (originalChar.toLowerCase() !== targetChar) {
                    line = line.substring(0, firstLetterIndex) + newChar + line.substring(firstLetterIndex + 1);
                    modificationsCount++;
                }
            } else {
                // No letters found - prepend the target character naturally
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

    // Punctuation Pattern Encoding
    encodePunctuation(message, carrierText) {
        if (message.length === 0) {
            throw new Error('Secret message cannot be empty');
        }

        // Convert message to binary with detailed logging
        const binaryMessage = message.split('').map(char => {
            const binary = char.charCodeAt(0).toString(2).padStart(8, '0');
            return { char: char, ascii: char.charCodeAt(0), binary: binary };
        });
        
        const fullBinary = binaryMessage.map(item => item.binary).join('');
        
        let encodedText = carrierText;
        let binaryIndex = 0;
        let modifications = [];
        let existingPunctuation = [];
        
        // First pass: catalog and replace existing punctuation
        for (let i = 0; i < encodedText.length; i++) {
            const char = encodedText[i];
            if (char === '.' || char === '!') {
                existingPunctuation.push({
                    position: i,
                    original: char,
                    context: encodedText.substring(Math.max(0, i-10), i+10)
                });
            }
        }
        
        // Replace existing punctuation with binary pattern
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

        // Second pass: add punctuation if needed
        if (binaryIndex < fullBinary.length) {
            const remainingBinary = fullBinary.substring(binaryIndex);
            
            // Find sentence boundaries for natural insertion
            const sentencePattern = /([.!?])\s+/g;
            const sentences = [];
            let lastIndex = 0;
            let match;
            
            while ((match = sentencePattern.exec(encodedText)) !== null) {
                sentences.push({
                    end: match.index + match[0].length,
                    punctuation: match[1]
                });
            }
            
            // Insert remaining binary at sentence boundaries
            let insertionsMade = 0;
            let modifiedText = encodedText;
            
            for (let i = 0; i < remainingBinary.length && insertionsMade < sentences.length; i++) {
                const binaryDigit = remainingBinary[i];
                const punctuation = binaryDigit === '0' ? '.' : '!';
                const insertPos = sentences[insertionsMade].end;
                
                modifiedText = modifiedText.substring(0, insertPos) + punctuation + modifiedText.substring(insertPos);
                
                addedPunctuation.push({
                    position: insertPos,
                    char: punctuation,
                    binaryIndex: binaryIndex + i,
                    represents: `${message[Math.floor((binaryIndex + i) / 8)] || 'overflow'} bit ${(binaryIndex + i) % 8}`
                });
                
                insertionsMade++;
                
                // Adjust positions for subsequent insertions
                for (let j = insertionsMade; j < sentences.length; j++) {
                    sentences[j].end++;
                }
            }
            
            encodedText = modifiedText;
            
            // If still need more punctuation, add at the end with spacing
            if (insertionsMade < remainingBinary.length) {
                const remaining = remainingBinary.substring(insertionsMade);
                encodedText += ' ';
                
                for (let i = 0; i < remaining.length; i++) {
                    const punctuation = remaining[i] === '0' ? '.' : '!';
                    encodedText += punctuation;
                    
                    addedPunctuation.push({
                        position: encodedText.length - 1,
                        char: punctuation,
                        binaryIndex: binaryIndex + insertionsMade + i,
                        represents: `${message[Math.floor((binaryIndex + insertionsMade + i) / 8)] || 'overflow'} bit ${(binaryIndex + insertionsMade + i) % 8}`
                    });
                    
                    // Add space every 8 bits for readability
                    if ((i + 1) % 8 === 0 && i < remaining.length - 1) {
                        encodedText += ' ';
                    }
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
            existingPunctuation: existingPunctuation.length,
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

    // Null Cipher Encoding
    encodeNullCipher(message, carrierText) {
        const cleanMessage = message.toLowerCase().replace(/[^a-z]/g, '');
        
        if (cleanMessage.length === 0) {
            throw new Error('Secret message must contain at least one letter');
        }

        // Split into words and analyze them
        let words = carrierText.split(/\s+/).filter(word => word.length > 0);
        let wordAnalysis = words.map((word, index) => ({
            index: index,
            original: word,
            firstLetter: word.match(/[a-zA-Z]/)?.[0] || null,
            firstLetterPos: word.search(/[a-zA-Z]/),
            hasLetters: /[a-zA-Z]/.test(word),
            length: word.length
        }));
        
        if (words.length < cleanMessage.length) {
            // Calculate how many words we need to add
            const wordsNeeded = cleanMessage.length - words.length;
            
            // Add contextually appropriate filler words
            const contextualFillers = [
                'also', 'thus', 'then', 'here', 'there', 'when', 'where', 'while',
                'since', 'though', 'still', 'yet', 'just', 'quite', 'rather', 'very',
                'well', 'indeed', 'perhaps', 'maybe', 'surely', 'truly', 'really'
            ];
            
            for (let i = 0; i < wordsNeeded; i++) {
                const fillerWord = contextualFillers[i % contextualFillers.length];
                words.push(fillerWord);
                wordAnalysis.push({
                    index: words.length - 1,
                    original: fillerWord,
                    firstLetter: fillerWord[0],
                    firstLetterPos: 0,
                    hasLetters: true,
                    length: fillerWord.length,
                    added: true
                });
            }
        }

        let encodedWords = [...words];
        let modifications = [];
        
        // Modify first letter of selected words to spell out the message
        for (let i = 0; i < cleanMessage.length; i++) {
            const targetChar = cleanMessage[i];
            const wordInfo = wordAnalysis[i];
            let word = encodedWords[i];
            
            if (wordInfo.hasLetters) {
                const firstLetterIndex = wordInfo.firstLetterPos;
                const originalChar = word[firstLetterIndex];
                const isUpperCase = originalChar === originalChar.toUpperCase();
                const newChar = isUpperCase ? targetChar.toUpperCase() : targetChar;
                
                // Only modify if the letter is different
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
                // No letters in word - create a minimal word starting with target character
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

        // Calculate encoding statistics
        const totalWords = encodedWords.length;
        const wordsUsed = cleanMessage.length;
        const wordsUnchanged = totalWords - modifications.length;
        const encodingRatio = (cleanMessage.length / totalWords * 100).toFixed(1);
        
        const securityScore = this.calculateSecurityScore(cleanMessage.length, carrierText.length, 'null');

        return {
            encodedText: encodedWords.join(' '),
            method: 'Null Cipher',
            originalWords: words.length,
            totalWords: totalWords,
            wordsUsedForMessage: wordsUsed,
            wordsModified: modifications.length,
            wordsUnchanged: wordsUnchanged,
            wordsAdded: wordAnalysis.filter(w => w.added).length,
            encodingRatio: parseFloat(encodingRatio),
            modifications: modifications,
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
        
        // Length ratio factor
        const ratio = messageLength / carrierLength;
        if (ratio < 0.01) baseScore += 30;
        else if (ratio < 0.05) baseScore += 20;
        else if (ratio < 0.1) baseScore += 10;
        else baseScore -= 10;
        
        // Method-specific adjustments
        switch (method) {
            case 'els':
                baseScore += 20; // ELS is more secure
                break;
            case 'punctuation':
                baseScore += 15;
                break;
            case 'null':
                baseScore += 10;
                break;
            case 'acrostic':
                baseScore += 5; // Acrostic is more obvious
                break;
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

            switch (instructions.method) {
                case 'ELS':
                    decodedMessage = this.decodeELS(this.currentResult, instructions);
                    break;
                case 'Acrostic':
                    decodedMessage = this.decodeAcrostic(this.currentResult, instructions);
                    break;
                case 'Punctuation':
                    decodedMessage = this.decodePunctuation(this.currentResult, instructions);
                    break;
                case 'Null Cipher':
                    decodedMessage = this.decodeNullCipher(this.currentResult, instructions);
                    break;
            }

            const originalMessage = document.getElementById('secretMessage').value.toLowerCase().replace(/[^a-z]/g, '');
            const cleanDecoded = decodedMessage.toLowerCase().replace(/[^a-z]/g, '');

            if (cleanDecoded === originalMessage) {
                this.showSuccess(`Decode test successful! Retrieved: "${decodedMessage}"`);
            } else {
                this.showError(`Decode test failed. Got: "${decodedMessage}", Expected: "${originalMessage}"`);
            }
        } catch (error) {
            this.showError('Decode test failed: ' + error.message);
        }
    }

    decodeELS(text, instructions) {
        const cleanText = text.toLowerCase().replace(/[^a-z]/g, '');
        let decodedMessage = '';
        let currentPos = instructions.startPosition;
        
        for (let i = 0; i < instructions.messageLength; i++) {
            if (currentPos < cleanText.length) {
                decodedMessage += cleanText[currentPos];
                currentPos += instructions.skipDistance;
            }
        }
        
        return decodedMessage;
    }

    decodeAcrostic(text, instructions) {
        const lines = text.split('\n');
        let decodedMessage = '';
        
        for (let i = 0; i < Math.min(lines.length, instructions.numberOfLines); i++) {
            const line = lines[i];
            const firstLetter = line.match(/[a-zA-Z]/);
            if (firstLetter) {
                decodedMessage += firstLetter[0].toLowerCase();
            }
        }
        
        return decodedMessage;
    }

    decodePunctuation(text, instructions) {
        let binaryString = '';
        
        for (let char of text) {
            if (char === '.') binaryString += '0';
            else if (char === '!') binaryString += '1';
        }
        
        // Convert binary to text
        let decodedMessage = '';
        for (let i = 0; i < binaryString.length; i += 8) {
            const byte = binaryString.substr(i, 8);
            if (byte.length === 8) {
                const charCode = parseInt(byte, 2);
                if (charCode > 0) {
                    decodedMessage += String.fromCharCode(charCode);
                }
            }
        }
        
        return decodedMessage;
    }

    decodeNullCipher(text, instructions) {
        const words = text.split(/\s+/);
        let decodedMessage = '';
        
        for (let i = 0; i < Math.min(words.length, instructions.numberOfWords); i++) {
            const word = words[i];
            const firstLetter = word.match(/[a-zA-Z]/);
            if (firstLetter) {
                decodedMessage += firstLetter[0].toLowerCase();
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

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new CodeVault();
});