// CodeVault Steganography Engine
class CodeVault {
    constructor() {
        this.initializeEventListeners();
        this.currentResult = null;
        this.currentMethod = null;
        this.decodingInstructions = null;
    }

    initializeEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.processMessage());
        document.getElementById('fileUpload').addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('copyBtn').addEventListener('click', () => this.copyResult());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadResult());
        document.getElementById('decodeBtn').addEventListener('click', () => this.testDecode());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetApp());
        document.getElementById('generateCarrierBtn').addEventListener('click', () => this.generateCarrierText());

        // Carrier method toggle
        document.querySelectorAll('input[name="carrierMethod"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.toggleCarrierMethod(e.target.value));
        });

        // Custom length toggle
        document.getElementById('carrierLength').addEventListener('change', (e) => {
            const customSection = document.getElementById('customLengthSection');
            if (e.target.value === 'custom') {
                customSection.classList.remove('hidden');
            } else {
                customSection.classList.add('hidden');
            }
        });

        // Real-time validation
        document.getElementById('secretMessage').addEventListener('input', () => this.validateInputs());
        document.getElementById('carrierText').addEventListener('input', () => this.validateInputs());
        document.getElementById('generatedCarrierText').addEventListener('input', () => this.validateInputs());
    }

    toggleCarrierMethod(method) {
        const manualSection = document.getElementById('manualCarrierSection');
        const generatedSection = document.getElementById('generatedCarrierSection');
        
        if (method === 'manual') {
            manualSection.classList.remove('hidden');
            generatedSection.classList.add('hidden');
        } else {
            manualSection.classList.add('hidden');
            generatedSection.classList.remove('hidden');
        }
        
        this.validateInputs();
    }

    validateInputs() {
        const secretMessage = document.getElementById('secretMessage').value.trim();
        const carrierMethod = document.querySelector('input[name="carrierMethod"]:checked').value;
        const startBtn = document.getElementById('startBtn');
        
        let hasCarrierText = false;
        
        if (carrierMethod === 'manual') {
            hasCarrierText = document.getElementById('carrierText').value.trim().length > 0;
        } else {
            hasCarrierText = document.getElementById('generatedCarrierText').value.trim().length > 0;
        }

        if (secretMessage.length > 0 && hasCarrierText) {
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
                this.showSuccess('File uploaded successfully!');
            };
            reader.readAsText(file);
        } else {
            this.showError('Please upload a valid .txt file');
        }
    }

    async generateCarrierText() {
        const secretMessage = document.getElementById('secretMessage').value.trim();
        if (!secretMessage) {
            this.showError('Please enter a secret message first');
            return;
        }

        const topic = document.getElementById('carrierTopic').value;
        const length = document.getElementById('carrierLength').value;
        const style = document.getElementById('carrierStyle').value;
        const method = document.getElementById('encryptionMethod').value;
        
        const generateBtn = document.getElementById('generateCarrierBtn');
        const originalText = generateBtn.textContent;
        
        // Show loading state
        generateBtn.disabled = true;
        generateBtn.textContent = '🔄 Generating...';
        
        try {
            const generatedText = this.createOptimalCarrierText(secretMessage, topic, length, style, method);
            document.getElementById('generatedCarrierText').value = generatedText;
            this.validateInputs();
            this.showSuccess('Carrier text generated successfully! Optimized for your secret message.');
        } catch (error) {
            this.showError('Failed to generate carrier text: ' + error.message);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = originalText;
        }
    }

    createOptimalCarrierText(secretMessage, topic, length, style, method) {
        const cleanMessage = secretMessage.toLowerCase().replace(/[^a-z]/g, '');
        const generator = new CarrierTextGenerator(topic, style, length);
        
        switch (method) {
            case 'els':
                return generator.generateELSOptimized(cleanMessage);
            case 'acrostic':
                return generator.generateAcrosticOptimized(cleanMessage);
            case 'punctuation':
                return generator.generatePunctuationOptimized(cleanMessage);
            case 'null':
                return generator.generateNullCipherOptimized(cleanMessage);
            default:
                return generator.generateGeneral(cleanMessage);
        }
    }

    async processMessage() {
        const secretMessage = document.getElementById('secretMessage').value.trim();
        const carrierMethod = document.querySelector('input[name="carrierMethod"]:checked').value;
        const method = document.getElementById('encryptionMethod').value;
        
        let carrierText;
        if (carrierMethod === 'manual') {
            carrierText = document.getElementById('carrierText').value.trim();
        } else {
            carrierText = document.getElementById('generatedCarrierText').value.trim();
        }

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

        // Simulate processing delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
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

            // Add carrier generation info to result
            if (carrierMethod === 'generated') {
                result.generatedCarrier = true;
                result.carrierTopic = document.getElementById('carrierTopic').value;
                result.carrierStyle = document.getElementById('carrierStyle').value;
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

    // Equidistant Letter Sequence (ELS) Encoding
    encodeELS(message, carrierText) {
        const cleanMessage = message.toLowerCase().replace(/[^a-z]/g, '');
        const cleanCarrier = carrierText.toLowerCase().replace(/[^a-z]/g, '');
        
        if (cleanMessage.length === 0) {
            throw new Error('Secret message must contain at least one letter');
        }

        if (cleanCarrier.length < cleanMessage.length * 2) {
            throw new Error(`Carrier text too short for ELS encoding. Need at least ${cleanMessage.length * 2} letters, but only have ${cleanCarrier.length}.`);
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

    // Punctuation Pattern Encoding
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
        let existingPunctuation = [];
        
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
            const sentences = encodedText.split(/(?<=[.!?])\s+/);
            let insertionsMade = 0;
            let modifiedText = encodedText;
            
            for (let i = 0; i < remainingBinary.length && insertionsMade < sentences.length; i++) {
                const binaryDigit = remainingBinary[i];
                const punctuation = binaryDigit === '0' ? '.' : '!';
                
                modifiedText += punctuation;
                addedPunctuation.push({
                    position: modifiedText.length - 1,
                    char: punctuation,
                    binaryIndex: binaryIndex + i,
                    represents: `${message[Math.floor((binaryIndex + i) / 8)] || 'overflow'} bit ${(binaryIndex + i) % 8}`
                });
                
                insertionsMade++;
            }
            
            encodedText = modifiedText;
            
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
            const wordsNeeded = cleanMessage.length - words.length;
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
        
        for (let i = 0; i < cleanMessage.length; i++) {
            const targetChar = cleanMessage[i];
            const wordInfo = wordAnalysis[i];
            let word = encodedWords[i];
            
            if (wordInfo.hasLetters) {
                const firstLetterIndex = wordInfo.firstLetterPos;
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
        
        const ratio = messageLength / carrierLength;
        if (ratio < 0.01) baseScore += 30;
        else if (ratio < 0.05) baseScore += 20;
        else if (ratio < 0.1) baseScore += 10;
        else baseScore -= 10;
        
        switch (method) {
            case 'els':
                baseScore += 20;
                break;
            case 'punctuation':
                baseScore += 15;
                break;
            case 'null':
                baseScore += 10;
                break;
            case 'acrostic':
                baseScore += 5;
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
        document.getElementById('generatedCarrierText').value = '';
        document.getElementById('encryptionMethod').value = 'els';
        document.getElementById('fileUpload').value = '';
        document.querySelector('input[name="carrierMethod"][value="manual"]').checked = true;
        this.toggleCarrierMethod('manual');
        document.getElementById('resultsDiv').classList.add('hidden');
        document.getElementById('errorDiv').classList.add('hidden');
        document.getElementById('successDiv').classList.add('hidden');
        document.getElementById('startBtn').disabled = true;
        
        this.currentResult = null;
        this.currentMethod = null;
        this.decodingInstructions = null;
        
        this.showSuccess('Application reset successfully!');
    }
}

// AI Carrier Text Generator Class
class CarrierTextGenerator {
    constructor(topic, style, length) {
        this.topic = topic;
        this.style = style;
        this.length = length;
        this.templates = this.getTopicTemplates();
        this.wordCount = this.getWordCount();
    }

    getWordCount() {
        const counts = {
            'short': 300,
            'medium': 600,
            'long': 1000,
            'custom': parseInt(document.getElementById('customWordCount')?.value || 600)
        };
        return counts[this.length] || 600;
    }

    getTopicTemplates() {
        const templates = {
            technology: {
                themes: ['artificial intelligence', 'software development', 'cybersecurity', 'data science', 'cloud computing'],
                vocabulary: ['innovation', 'algorithm', 'implementation', 'optimization', 'integration', 'architecture'],
                sentences: [
                    'Advanced technology solutions demonstrate remarkable capabilities in modern applications.',
                    'Digital transformation initiatives continue to reshape business operations worldwide.',
                    'Machine learning algorithms provide sophisticated analytical capabilities for complex problems.',
                    'Cloud computing infrastructure enables scalable and efficient resource management.',
                    'Cybersecurity measures protect critical systems from potential threats and vulnerabilities.'
                ]
            },
            business: {
                themes: ['strategic planning', 'market analysis', 'financial performance', 'organizational development'],
                vocabulary: ['efficiency', 'profitability', 'stakeholder', 'optimization', 'synergy', 'leveraging'],
                sentences: [
                    'Strategic business initiatives drive sustainable growth and competitive advantage.',
                    'Market analysis reveals significant opportunities for expansion and development.',
                    'Financial performance indicators demonstrate consistent improvement across multiple sectors.',
                    'Organizational excellence requires comprehensive planning and effective execution.',
                    'Stakeholder engagement promotes collaborative decision-making and shared value creation.'
                ]
            },
            science: {
                themes: ['research methodology', 'experimental design', 'data analysis', 'scientific discovery'],
                vocabulary: ['hypothesis', 'methodology', 'empirical', 'correlation', 'statistical', 'observation'],
                sentences: [
                    'Scientific research methodologies provide rigorous frameworks for investigation and analysis.',
                    'Experimental designs enable systematic testing of hypotheses and theoretical predictions.',
                    'Data analysis techniques reveal patterns and relationships within complex datasets.',
                    'Peer review processes ensure quality and reliability in scientific publications.',
                    'Research findings contribute to expanding knowledge and understanding in various fields.'
                ]
            },
            education: {
                themes: ['learning strategies', 'curriculum development', 'student engagement', 'educational technology'],
                vocabulary: ['pedagogy', 'comprehension', 'analytical', 'critical thinking', 'knowledge'],
                sentences: [
                    'Educational methodologies enhance student learning and academic achievement.',
                    'Curriculum development requires careful consideration of learning objectives and outcomes.',
                    'Student engagement strategies promote active participation and knowledge retention.',
                    'Assessment techniques provide valuable feedback on educational progress and effectiveness.',
                    'Educational technology tools support innovative teaching and learning approaches.'
                ]
            },
            general: {
                themes: ['modern society', 'global perspective', 'contemporary issues', 'human experience'],
                vocabulary: ['significant', 'important', 'relevant', 'comprehensive', 'effective', 'substantial'],
                sentences: [
                    'Contemporary analysis reveals important trends and developments in modern society.',
                    'Comprehensive examination of current issues provides valuable insights and perspectives.',
                    'Significant progress continues to shape our understanding of complex phenomena.',
                    'Effective strategies demonstrate practical applications in various contexts and situations.',
                    'Important considerations guide decision-making processes and strategic planning initiatives.'
                ]
            }
        };
        
        return templates[this.topic] || templates.general;
    }

    generateELSOptimized(message) {
        let text = this.createOpening();
        const targetLetters = message.length * 15; // Ensure plenty of letters
        
        while (this.countLetters(text) < targetLetters || this.countWords(text) < this.wordCount) {
            text += this.generateParagraph() + '\n\n';
        }
        
        text += this.createClosing();
        return this.optimizeForELS(text, message);
    }

    generateAcrosticOptimized(message) {
        const lines = [];
        
        for (let i = 0; i < message.length; i++) {
            const char = message[i];
            lines.push(this.generateAcrosticLine(char));
        }
        
        return lines.join('\n');
    }

    generatePunctuationOptimized(message) {
        const bitsNeeded = message.length * 8;
        let text = this.createOpening();
        
        while (this.countPunctuation(text) < bitsNeeded || this.countWords(text) < this.wordCount) {
            text += this.generatePunctuationRichParagraph() + '\n\n';
        }
        
        return text.trim();
    }

    generateNullCipherOptimized(message) {
        const wordsNeeded = message.length * 3;
        let text = '';
        
        while (this.countWords(text) < Math.max(wordsNeeded, this.wordCount)) {
            text += this.generateWordRichParagraph() + '\n\n';
        }
        
        return text.trim();
    }

    generateGeneral(message) {
        let text = this.createOpening();
        
        while (this.countWords(text) < this.wordCount) {
            text += this.generateParagraph() + '\n\n';
        }
        
        text += this.createClosing();
        return text;
    }

    createOpening() {
        const openings = [
            "In today's rapidly evolving landscape, comprehensive analysis reveals significant opportunities for advancement and development. ",
            "Contemporary research demonstrates the importance of systematic approaches to complex challenges and emerging opportunities. ",
            "Recent developments highlight the critical role of strategic thinking in addressing modern requirements and expectations. ",
            "Advanced methodologies provide valuable frameworks for understanding complex systems and their practical applications. ",
            "Systematic investigation reveals important patterns and relationships that inform effective decision-making processes. "
        ];
        
        return openings[Math.floor(Math.random() * openings.length)];
    }

    createClosing() {
        const closings = [
            "These insights provide valuable guidance for future development and continued advancement in the field.",
            "Ultimately, this analysis contributes to our broader understanding and practical application of these principles.",
            "The implications of these findings extend beyond immediate applications and suggest promising research directions.",
            "This comprehensive examination establishes important foundations for continued investigation and development.",
            "These conclusions support evidence-based approaches to addressing complex challenges and opportunities."
        ];
        
        return '\n\n' + closings[Math.floor(Math.random() * closings.length)];
    }

    generateParagraph() {
        const sentences = this.templates.sentences;
        const numSentences = Math.floor(Math.random() * 3) + 3; // 3-5 sentences
        let paragraph = '';
        
        for (let i = 0; i < numSentences; i++) {
            const sentence = sentences[Math.floor(Math.random() * sentences.length)];
            paragraph += sentence + ' ';
        }
        
        return paragraph.trim();
    }

    generateAcrosticLine(char) {
        const word = this.templates.vocabulary[Math.floor(Math.random() * this.templates.vocabulary.length)];
        const theme = this.templates.themes[Math.floor(Math.random() * this.templates.themes.length)];
        
        return `${char.toUpperCase()}dvanced research in ${theme} demonstrates ${word} and systematic progress.`;
    }

    generatePunctuationRichParagraph() {
        const sentences = [
            "This methodology offers several key advantages: efficiency, reliability, and comprehensive coverage.",
            "Research findings demonstrate significant progress! These results exceed initial expectations.",
            "Multiple factors contribute to successful outcomes. These include planning, execution, and evaluation.",
            "Consider the following essential elements: analysis, design, implementation, and testing procedures.",
            "The results proved highly effective! Data analysis confirmed substantial improvements.",
            "Key components include: strategic planning, resource allocation, and performance monitoring systems.",
            "This approach demonstrates consistent effectiveness. Furthermore, it provides reliable results!",
            "Analysis indicates positive trends. However, continued monitoring remains essential.",
            "The process involves multiple stages: assessment, planning, implementation, and review.",
            "Significant achievements have been documented! These developments represent major progress."
        ];
        
        let paragraph = '';
        for (let i = 0; i < 3; i++) {
            paragraph += sentences[Math.floor(Math.random() * sentences.length)] + ' ';
        }
        
        return paragraph.trim();
    }

    generateWordRichParagraph() {
        const words = this.templates.vocabulary;
        let paragraph = '';
        
        for (let i = 0; i < 5; i++) {
            const word1 = words[Math.floor(Math.random() * words.length)];
            const word2 = words[Math.floor(Math.random() * words.length)];
            paragraph += `The ${word1} analysis demonstrates how ${word2} evaluation leads to better outcomes. `;
        }
        
        return paragraph.trim();
    }

    optimizeForELS(text, message) {
        // Ensure each character in message appears frequently enough
        for (let char of message.toLowerCase()) {
            if (char.match(/[a-z]/)) {
                const count = (text.toLowerCase().match(new RegExp(char, 'g')) || []).length;
                if (count < 10) {
                    text += this.generateCharacterRichSentence(char);
                }
            }
        }
        return text;
    }

    generateCharacterRichSentence(char) {
        const charWords = {
            'a': ['advanced', 'analysis', 'application', 'approach'],
            'b': ['beneficial', 'business', 'balanced', 'broad'],
            'c': ['comprehensive', 'critical', 'complex', 'consistent'],
            'd': ['detailed', 'development', 'design', 'dynamic'],
            'e': ['effective', 'evaluation', 'essential', 'evidence'],
            'f': ['fundamental', 'framework', 'findings', 'factors'],
            'g': ['general', 'growth', 'guidance', 'global'],
            'h': ['however', 'highlighted', 'hypothesis', 'historical'],
            'i': ['important', 'implementation', 'investigation', 'insights'],
            'j': ['justified', 'joint', 'judgment', 'journey'],
            'k': ['knowledge', 'key', 'known', 'keeping'],
            'l': ['logical', 'learning', 'leadership', 'literature'],
            'm': ['methodology', 'modern', 'management', 'multiple'],
            'n': ['necessary', 'natural', 'numerous', 'national'],
            'o': ['outcomes', 'opportunities', 'organizational', 'optimal'],
            'p': ['process', 'performance', 'planning', 'principles'],
            'q': ['quality', 'questions', 'quantitative', 'quickly'],
            'r': ['research', 'results', 'relevant', 'resources'],
            's': ['systematic', 'significant', 'strategies', 'successful'],
            't': ['theoretical', 'techniques', 'technology', 'thorough'],
            'u': ['understanding', 'useful', 'unique', 'universal'],
            'v': ['valuable', 'various', 'validation', 'vital'],
            'w': ['work', 'widespread', 'ways', 'within'],
            'x': ['examined', 'experience', 'extensive', 'expected'],
            'y': ['years', 'yield', 'yet', 'young'],
            'z': ['zero', 'zones', 'zeal', 'zenith']
        };
        
        const words = charWords[char] || ['additional', 'analysis'];
        return ` The ${words[0]} ${words[1]} demonstrates ${words[2] || 'effective'} outcomes. `;
    }

    countLetters(text) {
        return (text.match(/[a-zA-Z]/g) || []).length;
    }

    countWords(text) {
        return text.trim().split(/\s+/).length;
    }

    countPunctuation(text) {
        return (text.match(/[.!]/g) || []).length;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new CodeVault();
});