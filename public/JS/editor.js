import { db, imagesRef, auth } from './firebase.js';
import { collection, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { uploadBytes, getDownloadURL, ref } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

class Editor {
    constructor() {
        this.editor = document.getElementById('editor');
        this.toolbar = document.querySelector('.editor-toolbar');
        this.bannerImage = null; // Store the banner image file
        this.setupEditor();
        this.setupEventListeners();
        this.setupAutoSave();
        this.setupBannerUpload();
    }

    setupEditor() {
        const savedContent = localStorage.getItem('editorContent');
        if (savedContent) {
            this.editor.innerHTML = savedContent;
        }
    }

    setupEventListeners() {
        this.setupToolbarEvents();
        this.setupImageEvents();
        this.setupEditorEvents();
    }

    setupToolbarEvents() {
        // Handle toolbar button clicks
        this.toolbar.querySelectorAll('button[data-command]').forEach(button => {
            button.addEventListener('click', () => {
                const command = button.dataset.command;
                this.executeCommand(command);
            });
        });

        // Handle font size changes
        const fontSelect = this.toolbar.querySelector('.font-size-select');
        if (fontSelect) {
            fontSelect.addEventListener('change', (e) => {
                document.execCommand('fontSize', false, e.target.value);
            });
        }
    }

    setupBannerUpload() {
        const bannerUpload = document.getElementById('banner-upload');
        const banner = document.querySelector('.banner');

        bannerUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.includes('image')) {
                this.bannerImage = file; // Store the file for later upload
                const reader = new FileReader();
                reader.onload = () => {
                    banner.style.backgroundImage = `url("${reader.result}")`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    setupImageEvents() {
        // Handle image insertion button
        const insertImageBtn = document.getElementById('insert-image-btn');
        const imageUpload = document.getElementById('image-upload');
        
        insertImageBtn.addEventListener('click', () => {
            imageUpload.click();
        });

        // Handle image upload
        imageUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file && file.type.includes('image')) {
                try {
                    const imageUrl = await this.uploadImage(file);
                    // Insert image at cursor position
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.className = 'article-image';
                    img.style.maxWidth = '100%';
                    
                    const selection = window.getSelection();
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(img);
                    
                    // Clear the file input
                    imageUpload.value = '';
                } catch (error) {
                    console.error('Error uploading image:', error);
                    alert('Failed to upload image. Please try again.');
                }
            }
        });
    }

    setupEditorEvents() {
        // Update toolbar state on content changes
        ['keyup', 'mouseup'].forEach(event => {
            this.editor.addEventListener(event, () => this.updateToolbarState());
        });
    }

    executeCommand(command) {
        switch(command) {
            case 'h1':
            case 'h2':
            case 'h3':
                document.execCommand('formatBlock', false, command.toUpperCase());
                break;
            case 'format-quote':
                document.execCommand('formatBlock', false, 'BLOCKQUOTE');
                break;
            case 'format-code':
                document.execCommand('formatBlock', false, 'PRE');
                break;
            case 'format-highlight':
                document.execCommand('backColor', false, '#ffeb3b');
                break;
            case 'createLink':
                const url = prompt('Enter the URL:');
                if (url) document.execCommand(command, false, url);
                break;
            default:
                document.execCommand(command, false, null);
        }
        this.updateToolbarState();
    }

    updateToolbarState() {
        this.toolbar.querySelectorAll('button[data-command]').forEach(button => {
            const command = button.dataset.command;
            if (['bold', 'italic', 'underline'].includes(command)) {
                button.classList.toggle('active', document.queryCommandState(command));
            }
        });
    }

    async uploadImage(file) {
        const timestamp = Date.now();
        const filename = `${timestamp}_${file.name}`;
        const imageRef = ref(imagesRef, filename);
        await uploadBytes(imageRef, file);
        return await getDownloadURL(imageRef);
    }

    async uploadBannerImage() {
        if (!this.bannerImage) {
            const bannerUrl = document.querySelector('.banner').style.backgroundImage;
            if (bannerUrl) {
                return bannerUrl.slice(5, -2); // Return existing URL if no new image
            }
            throw new Error('No banner image selected');
        }

        const timestamp = Date.now();
        const filename = `${timestamp}_${this.bannerImage.name}`;
        const imageRef = ref(imagesRef, filename);
        await uploadBytes(imageRef, this.bannerImage);
        return await getDownloadURL(imageRef);
    }

    setupAutoSave() {
        let saveTimeout;
        this.editor.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                localStorage.setItem('editorContent', this.editor.innerHTML);
                console.log('Content auto-saved');
            }, 1000);
        });
    }

    getContent() {
        return {
            html: this.editor.innerHTML,
            text: this.editor.innerText
        };
    }
}

// Initialize editor when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const editor = new Editor();
    const blogId = new URL(window.location.href).searchParams.get('id');

    // Load existing blog content if editing
    if (blogId) {
        try {
            const blogDoc = await getDoc(doc(db, "blogs", blogId));
            if (blogDoc.exists()) {
                const data = blogDoc.data();
                document.querySelector('.title').value = data.title || '';
                document.querySelector('.banner').style.backgroundImage = data.bannerImage ? `url("${data.bannerImage}")` : '';
                editor.editor.innerHTML = data.article || '';
            }
        } catch (error) {
            console.error('Error loading blog:', error);
            alert('Failed to load blog content');
        }
    }

    // Handle publishing
    document.querySelector('.publish-btn').addEventListener('click', async () => {
        const titleField = document.querySelector('.title');
        const content = editor.getContent();

        if (!titleField.value || !content.text) {
            alert('Please fill in all fields and add a banner image');
            return;
        }

        try {
            const blogId = new URL(window.location.href).searchParams.get('id') || 
                          generateBlogId(titleField.value);
            
            // Upload banner image only when publishing
            const bannerImageUrl = await editor.uploadBannerImage();
            
            await publishBlog(blogId, {
                title: titleField.value,
                bannerImage: bannerImageUrl,
                article: content.html,
                publishedAt: new Date().toISOString()
            });

            localStorage.removeItem('editorContent');
            window.location.href = `/blog/${blogId}`;
        } catch (error) {
            console.error('Error publishing:', error);
            alert('Failed to publish. Please try again.');
        }
    });
});

function generateBlogId(title) {
    return title.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50) + 
        '-' + Date.now().toString(36);
}

async function publishBlog(blogId, data) {
    if (!auth.currentUser) {
        throw new Error('You must be logged in to publish');
    }

    await setDoc(doc(db, "blogs", blogId), {
        ...data,
        author: auth.currentUser.email.split('@')[0]
    });
}
