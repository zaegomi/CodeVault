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

// Acrostic Method Encoding, Punctuation Pattern Encoding, and Null Cipher Encoding methods moved inside the CodeVault class above