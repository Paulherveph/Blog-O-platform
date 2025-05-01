import { db } from './firebase.js';
import { collection, getDocs, query, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const blogSection = document.querySelector('.blogs-section');
const POSTS_PER_PAGE = 6;
let lastVisible = null;
let loading = false;
let allLoaded = false;

// Initialize blog cache
const blogCache = new Map();

// Create and append loading indicator with improved styling
const loadingIndicator = document.createElement('div');
loadingIndicator.className = 'loading-indicator';
loadingIndicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.9);
    padding: 10px 20px;
    border-radius: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 100;
    display: none;
`;
loadingIndicator.textContent = 'Loading more posts...';
document.body.appendChild(loadingIndicator);

// Debounce function for scroll handler
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Scroll handler with improved visibility check
const handleScroll = debounce(() => {
    if (loading || allLoaded) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const pageHeight = document.documentElement.offsetHeight;
    
    if (pageHeight - scrollPosition < 1000) {
        fetchMoreBlogs();
    }
}, 150);

// Initialize intersection observer for infinite scroll
window.addEventListener('scroll', handleScroll);

const fetchBlogs = async (initial = true) => {
    if (loading) return;
    
    try {
        loading = true;
        loadingIndicator.style.display = 'block';

        const blogsCollection = collection(db, "blogs");
        let q = query(
            blogsCollection,
            orderBy("publishedAt", "desc"),
            limit(POSTS_PER_PAGE)
        );

        if (!initial && lastVisible) {
            q = query(
                blogsCollection,
                orderBy("publishedAt", "desc"),
                startAfter(lastVisible),
                limit(POSTS_PER_PAGE)
            );
        }

        const blogsSnapshot = await getDocs(q);
        
        if (blogsSnapshot.empty) {
            allLoaded = true;
            loadingIndicator.textContent = 'No more posts to load';
            setTimeout(() => {
                loadingIndicator.style.display = 'none';
            }, 2000);
            return;
        }

        lastVisible = blogsSnapshot.docs[blogsSnapshot.docs.length - 1];
        
        const fragment = document.createDocumentFragment();
        blogsSnapshot.forEach((blog) => {
            const blogElement = createBlogElement(blog);
            fragment.appendChild(blogElement);
        });

        if (initial) {
            blogSection.innerHTML = '';
        }
        blogSection.appendChild(fragment);

    } catch (error) {
        console.error('Error fetching blogs:', error);
        loadingIndicator.textContent = 'Error loading posts. Please try again.';
        setTimeout(() => {
            loadingIndicator.style.display = 'none';
        }, 2000);
    } finally {
        loading = false;
        if (!allLoaded) {
            loadingIndicator.style.display = 'none';
        }
    }
};

const createBlogElement = (blog) => {
    const data = blog.data();
    const div = document.createElement('div');
    div.className = 'blog-card';
    
    // Create a temporary div to clean the content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = data.article;
    const cleanText = tempDiv.textContent || tempDiv.innerText || '';
    
    div.innerHTML = `
      <img 
        class="blog-image" 
        data-src="${data.bannerImage}" 
        src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        alt="${data.title}"
      >
      <div class="blog-content">
        <h1 class="blog-title">${data.title.substring(0, 100)}${data.title.length > 100 ? '...' : ''}</h1>
        <p class="blog-overview">${cleanText.substring(0, 200)}${cleanText.length > 200 ? '...' : ''}</p>
        <a href="/blog/${blog.id}" class="btn dark">read</a>
      </div>
    `;

    // Observer for lazy loading
    const img = div.querySelector('.blog-image');
    const imgObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            img.src = img.dataset.src;
            imgObserver.disconnect();
        }
    });

    imgObserver.observe(img);

    // Cache the blog data
    blogCache.set(blog.id, data);

    return div;
};

const fetchMoreBlogs = () => {
    if (!loading && !allLoaded) {
        fetchBlogs(false);
    }
};

// Add simple error boundary
window.addEventListener('error', function(e) {
    console.error('Runtime error:', e);
    if (loadingIndicator) {
        loadingIndicator.textContent = 'Something went wrong. Please refresh the page.';
        loadingIndicator.style.display = 'block';
    }
});

// Initialize the blog listing
fetchBlogs();
