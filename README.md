# Blogging Platform

A modern, feature-rich blogging platform built with vanilla JavaScript, Firebase, and Express. Create, manage, and share your stories with a clean and intuitive interface.

## 🌟 Features

- 📝 Rich text editor with real-time formatting
- 🖼️ Image upload and management
- 🌓 Dark mode support
- 📱 Responsive design
- 🔐 User authentication
- 💾 Auto-save functionality
- 🚀 Performance optimized
- 📊 User dashboard
- 💫 Smooth animations

## 🚀 Getting Started

### Prerequisites

- Node.js
- NPM
- Firebase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/Paulherveph/Blogging-Platform
cd Blogging-Platform
```

2. Install dependencies
```bash
npm i
```

3. Create a `.env` file in the root directory (use `.env.example` as a template)
```bash
cp .env.example .env
```

4. Set up Firebase:
   - Create a new project in [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Enable Storage
   - Add your Firebase configuration to the `.env` file
   - Create a `firebase.js` file in the JS file found in the Public directory (use `.env.example` as a template)
```bash
cd .\public\JS\  
cp firebase.js.example firebase.js
```
Update the Firebase configuration in `public/JS/firebase.js` with your project's credentials.

5. Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:3001`

## 🛠️ Usage

### Creating a Blog Post

1. Click on "login" in the navigation bar and create an account
2. Click on "Editor" in the navigation bar
3. Add a banner image (optional)
4. Write your blog title
5. Use the rich text editor to write your content
   - Format text using the toolbar
   - Add images by clicking the image button or drag & drop
   - Use keyboard shortcuts for common formatting
6. Click "Publish" when you're ready

### Managing Your Posts

1. Click on on your "Profile username" on the navigation bar, and click on "Dashboard" on the navigation containter that will slide down 
2. View all your published posts
3. Edit or delete posts as needed
4. Monitor post engagement

## 🎨 Customization

## 📱 Progressive Web App

The platform is PWA-ready with:
- Service Worker for offline support
- Manifest file for installation
- Caching strategies for better performance

## 🔒 Security Features

- CORS protection
- Rate limiting
- Helmet security headers
- File upload restrictions
- Authentication state management
- Secure session handling

## 💻 Development

### Project Structure

```
public/               
         CSS/
         img/             
         JS/                                   
         uploads/
html files
config.js
package.json          
server.js       
```

### Available Scripts

- `npm start`: Start the server
- `npm run dev`: Start development server
- `npm run prod`: Start production server with production settings

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Firebase for authentication and database
- Express.js for the server
- Contributors and maintainers

## 🔧 Troubleshooting

### Common Issues

1. **Firebase Configuration**
   - Ensure all Firebase environment variables are set
   - Check Firebase Console for correct configuration
   - Verify authentication methods are enabled

2. **Image Upload Issues**
   - Check storage permissions in Firebase
   - Verify file size limits in `config.js`
   - Ensure proper MIME types are allowed

3. **Development Server**
   - Clear browser cache (Ctrl + F5)
   - Check console for errors
   - Verify port availability

For more issues, please check the [Issues](https://github.com/Paulherveph/Blogging-Platform/issues) page.

##  Contributors 
1. [Tatieze Paul Herve](https://github.com/Paulherveph)
1. [dluffymk](https://github.com/dluffymk)
2. [Nisso Emmanuel Frank](https://github.com/NissoStudios)
3. [Godwill6269](https://github.com/Godwill626)
4. [dznr](https://github.com/dznr0)
5. [KwankamLewis237](https://github.com/KwankamLewis237)
