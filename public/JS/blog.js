import { db, auth } from './firebase.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

class BlogViewer {
    constructor() {
        this.elements = {
            banner: document.querySelector('.banner'),
            titleField: document.querySelector('.title'),
            articleField: document.querySelector('.article'),
            editBtn: document.getElementById('edit-blog-btn'),
            publishInfo: document.querySelector('.published')
        };

        this.initialize();
    }

    async setupBlog() {
        const id = location.pathname.split('/').pop();

        try {
            const docRef = doc(db, "blogs", id);
            const blogDoc = await getDoc(docRef);

            if(blogDoc.exists()) {
                const data = blogDoc.data();
                
                this.elements.banner.style.backgroundImage = `url(${data.bannerImage})`;
                this.elements.titleField.innerHTML = data.title;
                // Directly use the HTML content instead of sanitizing it
                this.elements.articleField.innerHTML = data.article;

                // Format and display publish info
                const publishDate = data.publishedAt ? new Date(data.publishedAt) : new Date();
                const timeAgo = this.getTimeAgo(publishDate);
                const authorInfo = data.author || 'Anonymous';
                
                this.elements.publishInfo.innerHTML = `
                    <span class="author">Published by <strong>${authorInfo}</strong></span>
                    <span class="time">${timeAgo}</span>
                `;

                // Show edit button if user is the author
                if(auth.currentUser && auth.currentUser.email === data.authorEmail) {
                    this.elements.editBtn.style.display = 'inline-block';
                    this.elements.editBtn.href = `/editor?id=${id}`;
                }

                // Enhance content display without sanitizing
                this.enhanceContentDisplay();
            } else {
                location.replace('/');
            }
        } catch (error) {
            console.error('Error loading blog:', error);
            location.replace('/');
        }
    }

    enhanceContentDisplay() {
        // Add fade-in animation to content sections
        [this.elements.titleField, this.elements.articleField].forEach(element => {
            element.style.opacity = '0';
            element.style.animation = 'fadeIn 0.5s ease-out forwards';
        });

        // Enhance image handling
        const images = this.elements.articleField.querySelectorAll('img');
        images.forEach(img => {
            // Add loading animation
            img.style.opacity = '0';
            img.onload = () => {
                img.style.animation = 'fadeIn 0.5s ease-out forwards';
            };
            
            // Add lightbox functionality
            img.addEventListener('click', () => {
                this.openImageLightbox(img.src);
            });
        });

        // Preserve formatting for specific elements
        const formattedElements = this.elements.articleField.querySelectorAll('[style]');
        formattedElements.forEach(el => {
            // Ensure styles are preserved
            const computedStyle = window.getComputedStyle(el);
            const importantStyles = [
                'font-family', 'font-size', 'font-weight', 
                'color', 'background-color', 'text-align',
                'text-decoration', 'font-style'
            ];

            importantStyles.forEach(style => {
                if (computedStyle[style]) {
                    el.style[style] = computedStyle[style];
                }
            });
        });
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffTime / (1000 * 60));

        if (diffDays > 0) {
            return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        } else if (diffMinutes > 0) {
            return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
        } else {
            return 'just now';
        }
    }

    openImageLightbox(src) {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <img src="${src}" alt="Enlarged view">
                <button class="close-btn">&times;</button>
            </div>
        `;

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target.classList.contains('close-btn')) {
                lightbox.remove();
            }
        });

        document.body.appendChild(lightbox);
    }
}

// Initialize blog viewer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new BlogViewer();
});
