import { auth } from './firebase.js';

class NavManager {
    constructor() {
        this.elements = {
            nav: document.querySelector('.navbar'),
            linksContainer: document.querySelector('.links-container'),
        };

        this.initialize();
    }

    initialize() {
        auth.onAuthStateChanged(user => {
            this.updateNavigation(user);
        });

        // Global click handler for delegation
        document.addEventListener('click', (e) => {
            // Handle dropdown toggle
            if (e.target.closest('.user-btn')) {
                const dropdown = e.target.closest('.user-dropdown-container').querySelector('.user-dropdown');
                dropdown.classList.toggle('active');
                e.stopPropagation();
            }
            // Handle dropdown close when clicking outside
            else if (!e.target.closest('.user-dropdown')) {
                const dropdowns = document.querySelectorAll('.user-dropdown');
                dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
            }
            // Handle logout
            else if (e.target.closest('.logout-btn')) {
                this.handleLogout();
            }
        });

        // Add styles
        this.addStyles();
    }

    updateNavigation(user) {
        // Remove any existing dynamic links
        const dynamicLinks = this.elements.linksContainer.querySelectorAll('.dynamic-link');
        dynamicLinks.forEach(link => link.remove());

        if (user) {
            // Add user dropdown for logged in users
            const userDropdown = this.createUserDropdown(user);
            this.elements.linksContainer.appendChild(userDropdown);
        } else {
            // Add login link for logged out users
            const loginLink = document.createElement('li');
            loginLink.className = 'link-item dynamic-link';
            loginLink.innerHTML = '<a href="/login" class="link">Login</a>';
            this.elements.linksContainer.appendChild(loginLink);
        }
    }

    createUserDropdown(user) {
        const li = document.createElement('li');
        li.className = 'link-item dynamic-link user-dropdown-container';
        
        li.innerHTML = `
            <button class="user-btn" type="button" aria-haspopup="true" aria-expanded="false">
                <img src="/img/avatar.jpeg" alt="User" class="user-avatar">
                <span class="user-name">${user.displayName || user.email.split('@')[0]}</span>
                <svg class="dropdown-arrow" viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M7 10l5 5 5-5z"/>
                </svg>
            </button>
            <div class="user-dropdown" role="menu">
                <a href="/profile" class="dropdown-item" role="menuitem">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                    <span>Profile</span>
                </a>
                <a href="/admin" class="dropdown-item" role="menuitem">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                    </svg>
                    <span>Dashboard</span>
                </a>
                <button type="button" class="dropdown-item logout-btn" role="menuitem">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                    </svg>
                    <span>Logout</span>
                </button>
            </div>
        `;

        return li;
    }

    addStyles() {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            .user-dropdown-container {
                position: relative;
            }

            .user-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 12px;
                border: none;
                background: none;
                cursor: pointer;
                border-radius: 20px;
                transition: background-color 0.3s ease;
            }

            .user-btn:hover {
                background: rgba(0, 0, 0, 0.05);
            }

            .user-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                margin-right: 8px;
                object-fit: cover;
            }

            .user-avatar:not([src]), 
            .user-avatar[src=""], 
            .user-avatar[src="img/avatar.jpeg"] {
                background-image: url('/img/avatar.svg');
                background-size: cover;
                background-position: center;
            }

            .user-avatar:not([src])::after, 
            .user-avatar[src=""]::after,
            .user-avatar[src="/img/default-avatar.png"]::after {
                content: attr(alt);
                position: absolute;
                text-transform: uppercase;
                font-size: 14px;
            }

            .user-name {
                font-size: 14px;
                color: #333;
            }

            .dropdown-arrow {
                transition: transform 0.3s ease;
            }

            .user-dropdown {
                position: absolute;
                top: 100%;
                right: 0;
                width: 200px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                padding: 8px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(10px);
                transition: all 0.3s ease;
                z-index: 1000;
            }

            .user-dropdown.active {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .dropdown-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px;
                color: #333;
                text-decoration: none;
                border-radius: 6px;
                transition: background-color 0.3s ease;
                border: none;
                background: none;
                width: 100%;
                text-align: left;
                cursor: pointer;
                font: inherit;
            }

            .dropdown-item:hover {
                background: rgba(0, 0, 0, 0.05);
            }

            .dropdown-item svg {
                opacity: 0.7;
            }

            .logout-btn {
                color: #dc3545;
            }

            .logout-btn svg {
                color: #dc3545;
            }

            .logout-confirm {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1100;
            }

            .logout-confirm-content {
                background: white;
                padding: 24px;
                border-radius: 12px;
                width: 90%;
                max-width: 400px;
                text-align: center;
            }

            .logout-confirm h3 {
                color: #dc3545;
                margin: 0 0 16px;
                font-size: 20px;
            }

            .logout-confirm p {
                color: #666;
                margin: 0 0 24px;
            }

            .logout-confirm-buttons {
                display: flex;
                gap: 12px;
                justify-content: center;
            }

            .logout-confirm-btn {
                padding: 10px 24px;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease;
            }

            .confirm-logout {
                background: #dc3545;
                color: white;
            }

            .confirm-logout:hover {
                background: #c82333;
            }

            .cancel-logout {
                background: #e9ecef;
                color: #495057;
            }

            .cancel-logout:hover {
                background: #dde2e6;
            }

            @media (prefers-color-scheme: dark) {
                .user-name {
                    color: #fff;
                }

                .user-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .user-dropdown {
                    background: #2d2d2d;
                }

                .dropdown-item {
                    color: #fff;
                }

                .dropdown-item:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .logout-confirm-content {
                    background: #2d2d2d;
                }

                .logout-confirm p {
                    color: #bbb;
                }

                .cancel-logout {
                    background: #495057;
                    color: #fff;
                }

                .cancel-logout:hover {
                    background: #3d4246;
                }
            }
        `;
        document.head.appendChild(styleEl);
    }

    async handleLogout() {
        // Create confirmation dialog
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'logout-confirm';
        confirmDialog.innerHTML = `
            <div class="logout-confirm-content">
                <h3>Confirm Logout</h3>
                <p>Are you sure you want to log out? You will need to log in again to access your account.</p>
                <div class="logout-confirm-buttons">
                    <button class="logout-confirm-btn cancel-logout">Cancel</button>
                    <button class="logout-confirm-btn confirm-logout">Logout</button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmDialog);

        // Handle confirmation dialog actions
        confirmDialog.addEventListener('click', async (e) => {
            if (e.target.classList.contains('confirm-logout')) {
                try {
                    await auth.signOut();
                    // Clear any user-specific data from localStorage
                    localStorage.removeItem('user-theme');
                    localStorage.removeItem('user-preferences');
                    
                    // Redirect to home page
                    window.location.href = '/';
                } catch (error) {
                    console.error('Error signing out:', error);
                }
            }
            if (e.target.classList.contains('cancel-logout') || e.target.classList.contains('logout-confirm')) {
                confirmDialog.remove();
            }
        });
    }
}

// Initialize navigation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new NavManager();
});
