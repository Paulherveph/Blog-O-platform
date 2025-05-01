import { auth, db, signInWithEmailAndPassword, collection, query, where, getDocs, doc, deleteDoc } from './firebase.js';

class DashboardManager {
  constructor() {
    this.state = {
      isLoading: false,
      blogs: new Map(),
      currentUser: null
    };

    this.elements = {
      loginForm: document.getElementById('loginFormElement'),
      loginSection: document.querySelector('.login'),
      blogsSection: document.querySelector('.blogs-section'),
      loadingIndicator: this.createLoadingIndicator()
    };

    this.initialize();
  }

  createLoadingIndicator() {
    const div = document.createElement('div');
    div.className = 'loading-indicator';
    div.innerHTML = `
      <div class="spinner"></div>
      <p>Loading your blogs...</p>
    `;
    document.body.appendChild(div);
    return div;
  }

  showLoading(show = true) {
    this.state.isLoading = show;
    this.elements.loadingIndicator.style.display = show ? 'flex' : 'none';
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }

  initialize() {
    this.setupEventListeners();
    this.handleAuthStateChange();
  }

  setupEventListeners() {
    this.elements.loginForm?.addEventListener('submit', (e) => this.handleLogin(e));
    window.addEventListener('online', () => this.handleConnectionChange(true));
    window.addEventListener('offline', () => this.handleConnectionChange(false));
  }

  handleConnectionChange(isOnline) {
    const status = document.getElementById('connection-status') || this.createConnectionStatus();
    if (!isOnline) {
      status.textContent = 'You are offline. Changes will be saved when you reconnect.';
      status.style.display = 'block';
    } else {
      status.style.display = 'none';
      this.refreshBlogs();
    }
  }

  createConnectionStatus() {
    const div = document.createElement('div');
    div.id = 'connection-status';
    div.className = 'connection-status';
    document.body.insertBefore(div, document.body.firstChild);
    return div;
  }

  async handleLogin(event) {
    event.preventDefault();
    const email = this.elements.loginForm.loginEmail.value;
    const password = this.elements.loginForm.loginPassword.value;

    try {
      this.showLoading();
      await signInWithEmailAndPassword(auth, email, password);
      this.elements.loginSection.style.display = 'none';
    } catch (error) {
      console.error('Login error:', error);
      this.showError(error.message);
    } finally {
      this.showLoading(false);
    }
  }

  handleAuthStateChange() {
    auth.onAuthStateChanged((user) => {
      this.state.currentUser = user;
      if (this.elements.loginSection) {
        this.elements.loginSection.style.display = user ? 'none' : 'flex';
      }
      if (user) {
        this.refreshBlogs();
      }
    });
  }

  async refreshBlogs() {
    if (!this.state.currentUser) return;

    try {
      this.showLoading();
      const blogsQuery = query(
        collection(db, 'blogs'),
        where('author', '==', this.state.currentUser.email.split('@')[0])
      );

      const blogs = await getDocs(blogsQuery);
      this.state.blogs.clear();
      
      if (blogs.empty) {
        this.renderEmptyState();
        return;
      }

      const fragment = document.createDocumentFragment();
      blogs.forEach(blog => {
        this.state.blogs.set(blog.id, blog.data());
        fragment.appendChild(this.createBlogCard(blog));
      });

      this.elements.blogsSection.innerHTML = '';
      this.elements.blogsSection.appendChild(fragment);

    } catch (error) {
      console.error("Error fetching blogs:", error);
      this.showError('Failed to load your blogs. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  renderEmptyState() {
    this.elements.blogsSection.innerHTML = `
      <div class="empty-state">
        <h2>No blogs yet</h2>
        <p>Start writing your first blog post!</p>
        <a href="/editor" class="btn dark">Create Blog</a>
      </div>
    `;
  }

  createBlogCard(blog) {
    const data = blog.data();
    const div = document.createElement('div');
    div.className = 'blog-card';
    
    // Use IntersectionObserver for lazy loading
    const observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: '50px' }
    );

    div.innerHTML = `
      <img 
        class="blog-image" 
        data-src="${data.bannerImage}" 
        src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        alt="${data.title}"
      >
      <div class="blog-content">
        <h1 class="blog-title">${data.title.substring(0, 100)}${data.title.length > 100 ? '...' : ''}</h1>
        <p class="blog-overview">${data.article.substring(0, 200)}${data.article.length > 200 ? '...' : ''}</p>
        <div class="blog-actions">
          <a href="/blog/${blog.id}" class="btn dark">Read</a>
          <a href="/editor?id=${blog.id}" class="btn grey">Edit</a>
          <button class="btn danger delete-btn" data-id="${blog.id}">Delete</button>
        </div>
      </div>
    `;

    // Observe the image for lazy loading
    const img = div.querySelector('.blog-image');
    observer.observe(img);

    // Add delete handler
    const deleteBtn = div.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => this.handleDelete(blog.id));

    return div;
  }

  async handleDelete(blogId) {
    if (!confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      this.showLoading();
      await deleteDoc(doc(db, 'blogs', blogId));
      this.state.blogs.delete(blogId);
      await this.refreshBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
      this.showError('Failed to delete the blog post');
    } finally {
      this.showLoading(false);
    }
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new DashboardManager();
});
