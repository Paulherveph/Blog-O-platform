import { auth, db, storage } from './firebase.js';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';
import { updateProfile } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.userStats = {
            totalPosts: 0,
            totalViews: 0,
            totalDrafts: 0
        };

        this.elements = {
            profileImage: document.querySelector('.profile-image'),
            imageUpload: document.querySelector('#profile-image-upload'),
            displayName: document.querySelector('#display-name'),
            bio: document.querySelector('#bio'),
            saveBtn: document.querySelector('#save-profile'),
            statsContainer: document.querySelector('.stats-container'),
            postsContainer: document.querySelector('.posts-container'),
            draftsContainer: document.querySelector('.drafts-container')
        };

        this.initialize();
    }

    async initialize() {
        // Check authentication state
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadProfile();
                await this.loadUserStats();
                await this.loadUserContent();
                this.setupEventListeners();
            } else {
                window.location.href = '/login';
            }
        });
    }

    setupEventListeners() {
        // Profile image upload
        this.elements.imageUpload?.addEventListener('change', (e) => this.handleImageUpload(e));

        // Save profile changes
        this.elements.saveBtn?.addEventListener('click', () => this.saveProfile());

        // Auto-save on input changes with debounce
        let saveTimeout;
        ['displayName', 'bio'].forEach(field => {
            this.elements[field]?.addEventListener('input', () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => this.saveProfile(true), 1000);
            });
        });
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select an image file', 'error');
            return;
        }

        try {
            this.showNotification('Uploading image...', 'info');

            const imageRef = ref(storage, `profile-images/${this.currentUser.uid}`);
            await uploadBytes(imageRef, file);
            const imageUrl = await getDownloadURL(imageRef);

            // Update auth profile
            await updateProfile(this.currentUser, {
                photoURL: imageUrl
            });

            // Update UI
            this.elements.profileImage.src = imageUrl;
            this.showNotification('Profile image updated successfully!', 'success');

        } catch (error) {
            console.error('Error uploading image:', error);
            this.showNotification('Error uploading image. Please try again.', 'error');
        }
    }

    async loadProfile() {
        try {
            // Get user profile data
            const profileRef = doc(db, 'users', this.currentUser.uid);
            const profileDoc = await getDoc(profileRef);

            if (profileDoc.exists()) {
                const data = profileDoc.data();
                this.elements.displayName.value = data.displayName || '';
                this.elements.bio.value = data.bio || '';
            }

            // Set profile image - use custom avatar as default
            this.elements.profileImage.src = this.currentUser.photoURL || '/img/avatar.jpeg';

        } catch (error) {
            console.error('Error loading profile:', error);
            this.showNotification('Error loading profile. Please refresh the page.', 'error');
        }
    }

    async loadUserStats() {
        try {
            // Get user's blogs
            const blogsQuery = query(
                collection(db, 'blogs'),
                where('authorEmail', '==', this.currentUser.email)
            );
            const blogsSnapshot = await getDocs(blogsQuery);

            // Calculate stats
            this.userStats.totalPosts = blogsSnapshot.size;
            this.userStats.totalViews = blogsSnapshot.docs.reduce((total, doc) => total + (doc.data().views || 0), 0);

            // Get drafts count
            const draftsRef = doc(db, 'users', this.currentUser.email, 'drafts', 'current');
            const draftsDoc = await getDoc(draftsRef);
            this.userStats.totalDrafts = draftsDoc.exists() ? 1 : 0;

            // Update stats display
            this.updateStatsDisplay();

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateStatsDisplay() {
        this.elements.statsContainer.innerHTML = `
            <div class="stat-item">
                <span class="stat-value">${this.userStats.totalPosts}</span>
                <span class="stat-label">Posts</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${this.userStats.totalViews}</span>
                <span class="stat-label">Views</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${this.userStats.totalDrafts}</span>
                <span class="stat-label">Drafts</span>
            </div>
        `;
    }

    async loadUserContent() {
        try {
            // Load published posts
            const blogsQuery = query(
                collection(db, 'blogs'),
                where('authorEmail', '==', this.currentUser.email)
            );
            const blogsSnapshot = await getDocs(blogsQuery);

            // Update posts container
            this.elements.postsContainer.innerHTML = '';
            blogsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                this.elements.postsContainer.innerHTML += `
                    <div class="content-card">
                        <img src="${data.bannerImage || '/img/default-banner.jpg'}" alt="Blog banner">
                        <div class="card-content">
                            <h3>${data.title}</h3>
                            <p class="views">${data.views || 0} views</p>
                            <div class="card-actions">
                                <a href="/blog/${doc.id}" class="view-btn">View</a>
                                <a href="/editor?id=${doc.id}" class="edit-btn">Edit</a>
                            </div>
                        </div>
                    </div>
                `;
            });

            if (blogsSnapshot.empty) {
                this.elements.postsContainer.innerHTML = `
                    <div class="empty-state">
                        <p>No published posts yet</p>
                        <a href="/editor" class="create-btn">Create New Post</a>
                    </div>
                `;
            }

            // Load draft
            const draftRef = doc(db, 'users', this.currentUser.email, 'drafts', 'current');
            const draftDoc = await getDoc(draftRef);

            // Update drafts container
            this.elements.draftsContainer.innerHTML = '';
            if (draftDoc.exists() && !draftDoc.data().cleared) {
                const data = draftDoc.data();
                this.elements.draftsContainer.innerHTML = `
                    <div class="content-card draft">
                        <img src="${data.bannerImage || '/img/default-banner.jpg'}" alt="Draft banner">
                        <div class="card-content">
                            <h3>${data.title || 'Untitled Draft'}</h3>
                            <p class="last-edited">Last edited: ${this.formatDate(data.lastSaved)}</p>
                            <div class="card-actions">
                                <a href="/editor" class="edit-btn">Continue Editing</a>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                this.elements.draftsContainer.innerHTML = `
                    <div class="empty-state">
                        <p>No drafts</p>
                        <a href="/editor" class="create-btn">Start Writing</a>
                    </div>
                `;
            }

        } catch (error) {
            console.error('Error loading content:', error);
            this.showNotification('Error loading your content. Please refresh the page.', 'error');
        }
    }

    async saveProfile(isAutoSave = false) {
        try {
            const profileData = {
                displayName: this.elements.displayName.value.trim(),
                bio: this.elements.bio.value.trim(),
                updatedAt: new Date().toISOString()
            };

            // Update profile in Firestore
            await setDoc(doc(db, 'users', this.currentUser.uid), profileData, { merge: true });

            // Update auth profile
            if (profileData.displayName) {
                await this.currentUser.updateProfile({
                    displayName: profileData.displayName
                });
            }

            if (!isAutoSave) {
                this.showNotification('Profile updated successfully!', 'success');
            }

        } catch (error) {
            console.error('Error saving profile:', error);
            this.showNotification('Error saving profile. Please try again.', 'error');
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.abs(now - date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
        if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

        return date.toLocaleDateString();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="message">${message}</span>
                <button class="close-btn">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Add close button functionality
        notification.querySelector('.close-btn').addEventListener('click', () => {
            notification.remove();
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize profile manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});