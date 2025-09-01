# Razakma Password Generator

🔐 **Secure Password Generator — Deterministic (phrase) & Random**  
✨ **100% Offline, Client-Side Only**

## 🌟 Key Features

- **🎯 Deterministic**: Generate the same password from the same phrase
- **🎲 Random**: Generate random passwords using Cryptographically Secure PRNG
- **🔒 100% Offline**: No data sent to any server
- **⚡ Client-Side Only**: All processing done in your browser
- **🛡️ Web Crypto API**: Uses modern security standards
- **📱 Responsive**: Works perfectly on desktop and mobile

## 📋 How to Use

### Deterministic Mode
1. Enter a unique phrase in the "Phrase" field
2. Set password length (8-128 characters)
3. Choose characters to include
4. Click "Generate" to get your password
5. The same password will always be generated from the same phrase

### Random Mode
1. Leave the "Phrase" field empty
2. Set password length and character options
3. Click "Generate" for a random password
4. Each generation will produce a different password

## 🔧 Technology Stack

- **HTML5**: Semantic and modern structure
- **CSS3**: Responsive styling with neon animations
- **Vanilla JavaScript**: Application logic without frameworks
- **Web Crypto API**: Encryption and random number generation
- **SHA-256**: Hash function for deterministic mode
- **CSPRNG**: Cryptographically Secure Pseudo-Random Number Generator

## 🛡️ Security

### Security Features
- ✅ **Client-Side Only**: No data sent to any server
- ✅ **Web Crypto API**: Uses modern cryptographic standards
- ✅ **CSPRNG**: Cryptographically secure random number generator
- ✅ **SHA-256**: Strong hash function for deterministic mode
- ✅ **No Storage**: Doesn't store passwords or phrases

### Security Tips
- Use unique and memorable phrases for deterministic mode
- Don't use personal information as phrases
- Enable 2FA on important platforms
- Use a password manager to store passwords
- Update passwords regularly

## 📁 Project Structure

```
passgen/
├── index.html          # Main HTML file
├── style.css           # Styling and animations
├── script.js           # Application logic
├── img/                # Image assets
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   └── site.webmanifest
└── README.md           # This documentation
```

## 🚀 Installation & Local Usage

1. **Clone repository**
   ```bash
   git clone https://github.com/rukmanary/password-generator.git
   cd password-generator
   ```

2. **Run local server**
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Or using Node.js
   npx serve .
   
   # Or using PHP
   php -S localhost:8000
   ```

3. **Open browser**
   ```
   http://localhost:8000
   ```

## 🔍 Algorithm

### Deterministic Mode
1. Input phrase is hashed using SHA-256
2. Hash is used as seed for PRNG
3. PRNG generates consistent sequence
4. Characters are selected based on user preferences

### Random Mode
1. Uses `crypto.getRandomValues()` from Web Crypto API
2. Generates cryptographically secure random bytes
3. Bytes are converted to characters according to preferences

## 📱 PWA Support

- ✅ Web App Manifest
- ✅ Installable on mobile and desktop
- ✅ App-like experience

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## 👨‍💻 Author

**rukmanary**
- GitHub: [@rukmanary](https://github.com/rukmanary)

## 🙏 Acknowledgments

- Web Crypto API for modern security standards
- CSS Grid and Flexbox for responsive layout
- Modern JavaScript ES6+ features

---

**⚠️ Disclaimer**: This tool is created for educational and personal use purposes. Always use good security practices and consider using professional password managers for critical business needs.