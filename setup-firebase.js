const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'public', 'JS', 'firebase.example.js');
const destPath = path.join(__dirname, 'public', 'JS', 'firebase.js');

// Check if firebase.js already exists
if (fs.existsSync(destPath)) {
    console.log('firebase.js already exists. Skipping creation to prevent overwriting configuration.');
} else {
    // Copy the example file to create firebase.js
    fs.copyFile(sourcePath, destPath, (err) => {
        if (err) {
            console.error('Error creating firebase.js:', err);
            process.exit(1);
        }
        console.log('firebase.js has been created successfully.');
        console.log('Please update the configuration in firebase.js with your Firebase credentials.');
    });
}