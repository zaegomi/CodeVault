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

        // Real-time validation
        document.getElementById('secretMessage').addEventListener('input', () => this.validateInputs());
        document.getElementById('carrierText').addEventListener('input', () => this.validateInputs());
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

        // Split carrier text into lines, or create lines if none exist
        let lines = carrierText.includes('\n') ? carrierText.split('\n') : [carrierText];
        let encodedLines = [...lines];
        
        // If we don't have enough lines, split long lines or add new ones
        if (encodedLines.length < cleanMessage.length) {
            // Try to split long lines into multiple lines
            let newLines = [];
            for (let line of encodedLines) {
                if (line.length > 50) {
                    // Split long lines at word boundaries
                    const words = line.split(' ');
                    let currentLine = '';
                    for (let word of words) {
                        if (currentLine.length + word.length > 50 && currentLine.length > 0) {
                            newLines.push(currentLine.trim());
                            currentLine = word + ' ';
                        } else {
                            currentLine += word + ' ';
                        }
                    }
                    if (currentLine.trim().length > 0) {
                        newLines.push(currentLine.trim());
                    }
                } else {
                    newLines.push(line);
                }
            }
            encodedLines = newLines;
        }
        
        // Still need more lines? Add them
        while (encodedLines.length < cleanMessage.length) {
            const sampleLines = [
                'Another sentence continues the narrative flow naturally.',
                'This additional content maintains the document structure.',
                'Extra text helps preserve the original meaning.',
                'Further details support the main topic discussed.',
                'More information adds depth to the subject matter.',
                'Additional context enriches the overall content.',
                'These words contribute to the document length.',
                'Such sentences help disguise the hidden message.'
            ];
            const randomLine = sampleLines[Math.floor(Math.random() * sampleLines.length)];
            encodedLines.push(randomLine);
        }

        // Modify first letter of each line to match message
        for (let i = 0; i < cleanMessage.length; i++) {
            const targetChar = cleanMessage[i];
            let line = encodedLines[i] || '';
            
            if (line.length === 0) {
                // Create new line starting with target character
                const continuations = ['ddressing this topic further.', 'nalyzing the data shows.', 'ccording to research.', 'lso important to note.'];
                const randomContinuation = continuations[Math.floor(Math.random() * continuations.length)];
                encodedLines[i] = targetChar.toUpperCase() + randomContinuation;
            } else {
                // Find and replace first alphabetic character
                let modified = false;
                for (let j = 0; j < line.length; j++) {
                    if (line[j].match(/[a-zA-Z]/)) {
                        const isUpperCase = line[j] === line[j].toUpperCase();
                        encodedLines[i] = line.substring(0, j) + 
                                        (isUpperCase ? targetChar.toUpperCase() : targetChar) + 
                                        line.substring(j + 1);
                        modified = true;
                        break;
                    }
                }
                if (!modified) {
                    // No letters found, prepend target character
                    encodedLines[i] = targetChar.toUpperCase() + ' ' + line;
                }
            }
        }

        const securityScore = this.calculateSecurityScore(cleanMessage.length, encodedLines.join('\n').length, 'acrostic');

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
    encodePunctuation(message, carrierText) {
        if (message.length === 0) {
            throw new Error('Secret message cannot be empty');
        }

        // Convert message to binary
        const binaryMessage = message.split('').map(char => 
            char.charCodeAt(0).toString(2).padStart(8, '0')
        ).join('');
        
        let encodedText = carrierText;
        let binaryIndex = 0;
        let modifications = [];
        let newText = '';
        
        // First pass: replace existing punctuation
        for (let i = 0; i < encodedText.length && binaryIndex < binaryMessage.length; i++) {
            const char = encodedText[i];
            if (char === '.' || char === '!') {
                const binaryDigit = binaryMessage[binaryIndex];
                const newChar = binaryDigit === '0' ? '.' : '!';
                newText += newChar;
                
                if (char !== newChar) {
                    modifications.push({position: i, original: char, new: newChar});
                }
                binaryIndex++;
            } else {
                newText += char;
            }
        }
        
        encodedText = newText;

        // Second pass: add punctuation if needed
        if (binaryIndex < binaryMessage.length) {
            const remainingBinary = binaryMessage.substring(binaryIndex);
            
            // Find good places to insert punctuation (after sentences)
            const sentences = encodedText.split(/(?<=[.!?])\s+/);
            let insertionsMade = 0;
            
            for (let i = 0; i < remainingBinary.length && i < sentences.length - 1; i++) {
                const binaryDigit = remainingBinary[i];
                const punctuation = binaryDigit === '0' ? '.' : '!';
                
                // Add punctuation after sentence
                sentences[i] += punctuation;
                insertionsMade++;
            }
            
            encodedText = sentences.join(' ');
            
            // If still need more punctuation, add at the end
            if (insertionsMade < remainingBinary.length) {
                const remaining = remainingBinary.substring(insertionsMade);
                encodedText += ' ';
                for (let i = 0; i < remaining.length; i++) {
                    encodedText += remaining[i] === '0' ? '.' : '!';
                    if (i % 8 === 7 && i < remaining.length - 1) {
                        encodedText += ' '; // Add space every 8 bits for readability
                    }
                }
            }
        }

        const securityScore = this.calculateSecurityScore(message.length, carrierText.length, 'punctuation');

        return {
            encodedText: encodedText,
            method: 'Punctuation Pattern',
            binaryLength: binaryMessage.length,
            modifications: modifications.length,
            bitsEncoded: Math.min(binaryIndex + (encodedText.length - carrierText.length), binaryMessage.length),
            securityScore: securityScore,
            instructions: {
                method: 'Punctuation',
                pattern: 'Periods (.) = 0, Exclamation marks (!) = 1',
                binaryLength: binaryMessage.length
            }
        };
    }

    // Null Cipher Encoding
    encodeNullCipher(message, carrierText) {
        const cleanMessage = message.toLowerCase().replace(/[^a-z]/g, '');
        
        if (cleanMessage.length === 0) {
            throw new Error('Secret message must contain at least one letter');
        }

        // Split into words and filter out empty ones
        let words = carrierText.split(/\s+/).filter(word => word.length > 0);
        
        if (words.length < cleanMessage.length) {
            // Need to add more words
            const fillerWords = [
                'and', 'the', 'with', 'for', 'this', 'that', 'which', 'these', 'those', 'some',
                'many', 'several', 'various', 'different', 'important', 'significant', 'relevant',
                'appropriate', 'necessary', 'essential', 'critical', 'fundamental', 'basic',
                'advanced', 'complex', 'simple', 'effective', 'efficient', 'useful', 'valuable'
            ];
            
            while (words.length < cleanMessage.length) {
                const randomWord = fillerWords[Math.floor(Math.random() * fillerWords.length)];
                words.push(randomWord);
            }
        }

        let encodedWords = [...words];
        
        // Modify first letter of selected words to spell out the message
        for (let i = 0; i < cleanMessage.length; i++) {
            const targetChar = cleanMessage[i];
            let word = encodedWords[i];
            
            if (word && word.length > 0) {
                // Find first alphabetic character in the word
                let firstLetterIndex = -1;
                for (let j = 0; j < word.length; j++) {
                    if (word[j].match(/[a-zA-Z]/)) {
                        firstLetterIndex = j;
                        break;
                    }
                }
                
                if (firstLetterIndex !== -1) {
                    // Replace the first letter
                    const originalChar = word[firstLetterIndex];
                    const isUpperCase = originalChar === originalChar.toUpperCase();
                    const newChar = isUpperCase ? targetChar.toUpperCase() : targetChar;
                    
                    encodedWords[i] = word.substring(0, firstLetterIndex) + 
                                    newChar + 
                                    word.substring(firstLetterIndex + 1);
                } else {
                    // No letters in word, create a new word starting with target character
                    const wordEndings = ['ay', 'ing', 'ed', 'er', 'ly', 'ness', 'ment', 'tion'];
                    const randomEnding = wordEndings[Math.floor(Math.random() * wordEndings.length)];
                    encodedWords[i] = targetChar + randomEnding;
                }
            } else {
                // Empty word, create new one
                const wordEndings = ['ay', 'ing', 'ed', 'er', 'ly', 'ness', 'ment', 'tion'];
                const randomEnding = wordEndings[Math.floor(Math.random() * wordEndings.length)];
                encodedWords[i] = targetChar + randomEnding;
            }
        }

        const securityScore = this.calculateSecurityScore(cleanMessage.length, carrierText.length, 'null');

        return {
            encodedText: encodedWords.join(' '),
            method: 'Null Cipher',
            wordsModified: cleanMessage.length,
            totalWords: encodedWords.length,
            securityScore: securityScore,
            instructions: {
                method: 'Null Cipher',
                readFirstLetters: true,
                numberOfWords: cleanMessage.length
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

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new CodeVault();
});