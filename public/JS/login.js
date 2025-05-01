import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from './firebase.js';

class AuthUI {
    constructor() {
        this.elements = {
            loginForm: document.getElementById("loginForm"),
            registerForm: document.getElementById("registerForm"),
            loginFormElement: document.getElementById("loginFormElement"),
            registerFormElement: document.getElementById("registerFormElement"),
            inputs: document.querySelectorAll('input')
        };

        this.initializeEventListeners();
        this.setupInputAnimations();
    }

    initializeEventListeners() {
        // Form switching
        document.getElementById("showRegister").addEventListener("click", (e) => {
            e.preventDefault();
            this.switchForm('register');
        });

        document.getElementById("showLogin").addEventListener("click", (e) => {
            e.preventDefault();
            this.switchForm('login');
        });

        // Form submissions
        this.elements.loginFormElement.addEventListener("submit", (e) => this.handleLogin(e));
        this.elements.registerFormElement.addEventListener("submit", (e) => this.handleRegister(e));
    }

    setupInputAnimations() {
        this.elements.inputs.forEach(input => {
            // Add highlight span when input is focused
            input.addEventListener('focus', () => {
                input.parentElement.querySelector('.input-highlight').style.width = '100%';
            });

            // Remove highlight span when input is blurred
            input.addEventListener('blur', () => {
                input.parentElement.querySelector('.input-highlight').style.width = '0';
            });

            // Handle label animation if input has value
            if (input.value) {
                input.parentElement.querySelector('label').classList.add('active');
            }
        });
    }

    switchForm(type) {
        const loginForm = this.elements.loginForm;
        const registerForm = this.elements.registerForm;

        if (type === 'register') {
            loginForm.classList.add('inactive');
            registerForm.style.display = 'block';
            setTimeout(() => {
                registerForm.classList.add('active');
            }, 50);
        } else {
            registerForm.classList.remove('active');
            setTimeout(() => {
                registerForm.style.display = 'none';
                loginForm.classList.remove('inactive');
            }, 400);
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        const submitBtn = event.target.querySelector('.submit-btn');

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';
            
            await signInWithEmailAndPassword(auth, email, password);
            this.showNotification('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = "/admin";
            }, 1000);
        } catch (error) {
            this.showNotification(this.getErrorMessage(error), 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;
        const confirmPass = document.getElementById("confirmPassword").value;
        const submitBtn = event.target.querySelector('.submit-btn');

        if (password !== confirmPass) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';

            await createUserWithEmailAndPassword(auth, email, password);
            this.showNotification('Account created successfully!', 'success');
            setTimeout(() => {
                window.location.href = "/admin";
            }, 1000);
        } catch (error) {
            this.showNotification(this.getErrorMessage(error), 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    }

    showNotification(message, type) {
        // Remove existing notification if any
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getErrorMessage(error) {
        switch (error.code) {
            case 'auth/invalid-email':
                return 'Invalid email address';
            case 'auth/user-disabled':
                return 'This account has been disabled';
            case 'auth/user-not-found':
                return 'No account found with this email';
            case 'auth/wrong-password':
                return 'Incorrect password';
            case 'auth/email-already-in-use':
                return 'Email already registered';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters';
            default:
                return error.message;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AuthUI();
});
