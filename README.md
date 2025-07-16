# CodeVault

A universal text-based steganography platform that enables users to embed and extract hidden messages using various encoding methods including Equidistant Letter Sequences (ELS).

## 🔐 Features

- **Multiple Encoding Methods**: ELS, Acrostic, Punctuation Pattern, Null Cipher
- **Dual Functionality**: Both encoding and decoding capabilities
- **File Upload Support**: Upload .txt files as carrier text
- **Real-time Analysis**: Text statistics and encoding capacity analysis
- **Security Assessment**: Built-in security metrics and recommendations
- **Export Functionality**: Download encoded messages and decoding instructions
- **Modern Web Interface**: Responsive design working on all devices

## 🚀 Quick Start

### Frontend Only (Simple)
1. Open `frontend/index.html` in a web browser
2. Enter your secret message
3. Provide carrier text (type or upload)
4. Select encoding method
5. Click "START ENCODING" to generate encoded text

### Full Stack (Recommended)

#### Prerequisites
- Node.js 16+ installed
- Git installed

#### Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/codevault.git
cd codevault

# Set up backend
cd backend
npm install
npm run dev

# In another terminal, serve frontend
cd ../frontend
# Use Live Server extension in VS Code, or:
python -m http.server 8000
# or
npx serve .
```

#### Access
- Frontend: http://localhost:8000 (or Live Server URL)
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/

## 📖 Encoding Methods

### Equidistant Letter Sequence (ELS)
Hides messages by placing letters at regular intervals throughout the text. Most secure method for longer texts.

**Example**: Message "HELP" in carrier text with skip distance 3
```
Original: "The quick brown fox jumps over the lazy dog"
Encoded:  "Hhe Euick Lrown Pox jumps over the lazy dog"
```

### Acrostic Method
Uses the first letter of each line to spell out the hidden message.

**Example**: Message "CODE"
```
Cats are wonderful pets
Owls hunt at night
Dogs are loyal friends
Eagles soar high above
```

### Punctuation Pattern
Encodes messages using punctuation marks in binary representation.

**Example**: '.' = 0, '!' = 1
```
Original: "Hello world. How are you?"
Encoded:  "Hello world! How are you." (binary: 01)
```

### Null Cipher
Hides messages in the first letters of words.

**Example**: Message "RUN"
```
Original: "The cat sat on the mat"
Encoded:  "Really understanding nature, cats always think"
```

## 🔧 API Endpoints

### POST /api/encryption/encode
Encode a message into carrier text.

**Request Body:**
```json
{
  "message": "secret message",
  "carrierText": "your carrier text here",
  "method": "els",
  "securityLevel": "medium"
}
```

### POST /api/encryption/decode
Decode hidden messages from text.

**Request Body:**
```json
{
  "text": "text to analyze",
  "method": "auto",
  "parameters": {
    "skipDistance": 5,
    "startPosition": 0
  }
}
```

### POST /api/encryption/analyze
Analyze text for encoding capacity and statistics.

**Request Body:**
```json
{
  "text": "text to analyze"
}
```

## 🛡️ Security Features

- **Detection Risk Assessment**: Analyzes how easily hidden messages can be detected
- **Statistical Security Scoring**: Quantifies the security level of encoding
- **Security Recommendations**: Provides specific advice for improving message security
- **Multiple Security Levels**: Light, Medium, and Heavy encoding options

## 📁 Project Structure

```
codevault/
├── frontend/
│   ├── index.html          # Main application interface
│   ├── styles.css          # Styling and responsive design
│   └── script.js           # Client-side logic and algorithms
├── backend/
│   ├── server.js           # Express server setup
│   ├── package.json        # Dependencies and scripts
│   ├── routes/
│   │   └── encryption.js   # API endpoints
│   └── utils/
│       └── encoders.js     # Encoding/decoding algorithms
├── docs/
│   └── project-report.md   # Academic documentation
├── README.md
├── .gitignore
└── LICENSE
```

## 🎯 Academic Context

This project was developed as a cybersecurity capstone project exploring text-based steganography methods and their practical applications for secure communication. It demonstrates:

- **Cryptographic Concepts**: Implementation of historical and modern encoding techniques
- **Statistical Analysis**: Pattern recognition and frequency analysis
- **Security Assessment**: Risk analysis and detection resistance
- **Full-Stack Development**: Modern web application architecture
- **API Design**: RESTful service architecture

## 🔬 Technical Implementation

### Frontend Technologies
- **HTML5**: Semantic markup and modern web standards
- **CSS3**: Responsive design with CSS Grid and Flexbox
- **Vanilla JavaScript**: No framework dependencies for maximum compatibility

### Backend Technologies
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web application framework
- **Security Middleware**: Helmet, CORS, rate limiting
- **Error Handling**: Comprehensive error management

### Algorithms
- **ELS Implementation**: Variable skip distances with security optimization
- **Pattern Recognition**: Statistical analysis of text patterns
- **Confidence Scoring**: Machine learning-inspired confidence calculation
- **Security Metrics**: Multi-factor security assessment

## 📊 Performance

- Supports texts up to 100,000 characters
- Encoding: < 2 seconds for typical messages
- Decoding: < 5 seconds for comprehensive analysis
- Memory efficient with streaming for large files

## 🤝 Contributing

This is an academic project, but suggestions and improvements are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Bible code research by Eliyahu Rips and Doron Witztum
- Historical steganography techniques and their modern applications
- Open source cryptography and security communities

## 📞 Support

For questions about this academic project:
- Open an issue on GitHub
- Contact: [your.email@university.edu]

---

**⚠️ Academic Use Notice**: This project is designed for educational and research purposes. Users are responsible for ensuring their use complies with applicable laws and regulations.