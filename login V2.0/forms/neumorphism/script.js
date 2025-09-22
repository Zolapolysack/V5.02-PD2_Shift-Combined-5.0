// Neumorphism Login Form JavaScript
class NeumorphismLoginForm {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.passwordToggle = document.getElementById('passwordToggle');
        this.submitButton = this.form.querySelector('.login-btn');
        this.successMessage = document.getElementById('successMessage');
        this.announcer = document.getElementById('formAnnouncer');
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.setupPasswordToggle();
        this.setupNeumorphicEffects();
        this.setupAvatarFallback();

        // Ensure form is not aria-busy initially
        this.form.setAttribute('aria-busy', 'false');
    }
    
    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.usernameInput.addEventListener('blur', () => this.validateUsername());
        this.passwordInput.addEventListener('blur', () => this.validatePassword());
        this.usernameInput.addEventListener('input', () => this.clearError('username'));
        this.passwordInput.addEventListener('input', () => this.clearError('password'));
        
        // Add soft press effects to inputs
        [this.usernameInput, this.passwordInput].forEach(input => {
            input.addEventListener('focus', (e) => this.addSoftPress(e));
            input.addEventListener('blur', (e) => this.removeSoftPress(e));
        });
    }
    
    setupPasswordToggle() {
        this.passwordToggle.addEventListener('click', () => {
            const type = this.passwordInput.type === 'password' ? 'text' : 'password';
            this.passwordInput.type = type;
            
            this.passwordToggle.classList.toggle('show-password', type === 'text');
            this.passwordToggle.setAttribute('aria-pressed', String(type === 'text'));
            this.passwordToggle.setAttribute('aria-label', type === 'text' ? 'Hide password' : 'Show password');
            
            // Keep toggle static: no click animation per customization
        });
    }
    
    
    setupNeumorphicEffects() {
        // Add hover effects to all neumorphic elements
        const neuElements = document.querySelectorAll('.neu-icon, .neu-checkbox');
        neuElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.style.transform = 'scale(1.05)';
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.transform = 'scale(1)';
            });
        });
        
        // Add ambient light effect on mouse move with throttling
        let ticking = false;
        document.addEventListener('mousemove', (e) => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.updateAmbientLight(e);
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    setupAvatarFallback() {
        const img = document.getElementById('neuAvatar');
        if (!img) return;

        const fallback = img.parentElement.querySelector('.avatar-fallback');
        // Helper to report status to on-page errorPanel for debugging
        // report(msg, isError=false): always console.log; only append to on-page error panel for errors
        const report = (msg, isError = false) => {
            try {
                if (isError) {
                    const panelList = document.getElementById('errorList');
                    if (panelList) {
                        const li = document.createElement('li');
                        li.textContent = `[avatar] ${msg}`;
                        panelList.appendChild(li);
                        const panel = document.getElementById('errorPanel');
                        if (panel) panel.style.display = 'block';
                    }
                    console.error('Avatar:', msg);
                } else {
                    console.log('Avatar:', msg);
                }
            } catch (e) { console.log('report fail', e); }
        };

        // If image fails to load, hide the img and show the fallback SVG by toggling classes
        img.addEventListener('error', () => {
            img.classList.add('hidden');
            if (fallback) fallback.classList.add('visible');
            report('image failed to load (error event). src=' + img.getAttribute('src'), true);
        });

        // If image loads successfully, ensure fallback is hidden
        img.addEventListener('load', () => {
            img.classList.remove('hidden');
            if (fallback) fallback.classList.remove('visible');
            report('image loaded successfully. src=' + img.getAttribute('src'));
        });

        // Also, perform a quick check: is the resource reachable via Image object?
        try {
            const probe = new Image();
            probe.onload = () => { /* will trigger load handler above when browser loads the same resource */ };
            probe.onerror = () => { report('probe failed to load resource', true); };
            probe.src = img.getAttribute('src');
        } catch (e) { report('probe exception: ' + String(e)); }
    }
    
    updateAmbientLight(e) {
    const card = document.querySelector('.login-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const angleX = (x - centerX) / centerX;
        const angleY = (y - centerY) / centerY;
        
        const shadowX = angleX * 30;
        const shadowY = angleY * 30;
        
        card.style.boxShadow = `
            ${shadowX}px ${shadowY}px 60px #bec3cf,
            ${-shadowX}px ${-shadowY}px 60px #ffffff
        `;
    }
    
    addSoftPress(e) {
        const inputGroup = e.target.closest('.neu-input');
        inputGroup.style.transform = 'scale(0.98)';
    }
    
    removeSoftPress(e) {
        const inputGroup = e.target.closest('.neu-input');
        inputGroup.style.transform = 'scale(1)';
    }
    
    animateSoftPress(element) {
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 150);
    }
    
    validateUsername() {
        const username = this.usernameInput.value.trim();
        const validator = (typeof FormValidators !== 'undefined') ? FormValidators.validateUsername : null;
        if (validator) {
            const res = validator(username);
            if (!res.valid) {
                this.showError('username', res.message || 'Username is required');
                return false;
            }
            this.clearError('username');
            return true;
        }

        if (!username) {
            this.showError('username', 'Username is required');
            return false;
        }

        this.clearError('username');
        return true;
    }
    
    validatePassword() {
        const password = this.passwordInput.value;
        const validator = (typeof FormValidators !== 'undefined') ? FormValidators.validatePassword : null;
        if (validator) {
            const res = validator(password);
            if (!res.valid) {
                this.showError('password', res.message || 'Password is required');
                return false;
            }
            this.clearError('password');
            return true;
        }

        if (!password) {
            this.showError('password', 'Password is required');
            return false;
        }

        if (password.length < 6) {
            this.showError('password', 'Password must be at least 6 characters');
            return false;
        }

        this.clearError('password');
        return true;
    }
    
    showError(field, message) {
        const formGroup = document.getElementById(field).closest('.form-group');
        const errorElement = document.getElementById(`${field}Error`);
        
        formGroup.classList.add('error');
        errorElement.textContent = message;
        errorElement.classList.add('show');
        
        // Add gentle shake animation
        const input = document.getElementById(field);
        input.style.animation = 'gentleShake 0.5s ease-in-out';
        setTimeout(() => {
            input.style.animation = '';
        }, 500);

        // Announce error for screen readers
        if (this.announcer) {
            this.announcer.textContent = message;
        }
    }
    
    clearError(field) {
        const formGroup = document.getElementById(field).closest('.form-group');
        const errorElement = document.getElementById(`${field}Error`);
        
        formGroup.classList.remove('error');
        errorElement.classList.remove('show');
        setTimeout(() => {
            errorElement.textContent = '';
        }, 300);
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const isUsernameValid = this.validateUsername();
        const isPasswordValid = this.validatePassword();
        
        if (!isUsernameValid || !isPasswordValid) {
            this.animateSoftPress(this.submitButton);
            // Focus the first invalid input
            if (!isUsernameValid) this.usernameInput.focus();
            else if (!isPasswordValid) this.passwordInput.focus();
            return;
        }
        
        this.setLoading(true);
        this.form.setAttribute('aria-busy', 'true');
        if (this.announcer) this.announcer.textContent = 'Signing in...';
        
        try {
            // If a client-side auth module is available, use it. Otherwise simulate success.
            let authOk = true;
            if (typeof FormAuth !== 'undefined' && FormAuth && typeof FormAuth.authenticate === 'function'){
                const res = await FormAuth.authenticate(this.usernameInput.value, this.passwordInput.value);
                authOk = !!(res && res.ok);
                if (authOk) {
                    FormAuth.loginSession(res.user);
                }
            } else {
                // fallback: simulate soft authentication for environments without FormAuth
                await new Promise(resolve => setTimeout(resolve, 800));
                authOk = true;
            }

            if (authOk) {
                this.showNeumorphicSuccess();
                if (this.announcer) this.announcer.textContent = 'Login successful';
                // Notify parent (if embedded in overlay) that auth succeeded
                try {
                    const user = (typeof FormAuth !== 'undefined' && FormAuth && typeof FormAuth.getSession === 'function')
                        ? (FormAuth.getSession() && FormAuth.getSession().user)
                        : (this.usernameInput && this.usernameInput.value ? this.usernameInput.value.trim() : undefined);
                    if (window.parent && window.parent !== window) {
                        window.parent.postMessage({ type: 'PD2_AUTH_OK', user: user, ts: Date.now() }, window.location.origin);
                    }
                } catch(_) { /* no-op */ }
            } else {
                this.showError('password', 'Invalid username or password');
                if (this.announcer) this.announcer.textContent = 'Invalid username or password';
            }
        } catch (error) {
            this.showError('password', 'Login failed. Please try again.');
            if (this.announcer) this.announcer.textContent = 'Login failed. Please try again.';
        } finally {
            this.setLoading(false);
            this.form.setAttribute('aria-busy', 'false');
        }
    }
    
    
    setLoading(loading) {
        this.submitButton.classList.toggle('loading', loading);
        this.submitButton.disabled = loading;
        
        // No social buttons in this build
    }
    
    showNeumorphicSuccess() {
        // Soft fade out form
        this.form.style.transform = 'scale(0.95)';
        this.form.style.opacity = '0';
        
        setTimeout(() => {
            this.form.style.display = 'none';
            
            // Show success with soft animation
            this.successMessage.classList.add('show');
            
            // Animate success icon
            const successIcon = this.successMessage.querySelector('.neu-icon');
            successIcon.style.animation = 'successPulse 0.6s ease-out';
            
        }, 300);
        
        // Post-login redirect: honor ?next= param if present
        setTimeout(() => {
            try {
                const qs = new URLSearchParams(window.location.search);
                const rawNext = qs.get('next');
                if (rawNext) {
                    const dec = decodeURIComponent(rawNext);
                    // Only allow same-origin relative paths to prevent open redirect
                    if (dec.startsWith('/') && !dec.startsWith('//')) {
                        window.location.href = dec;
                        return;
                    }
                    console.warn('Blocked unsafe next redirect:', dec);
                }
                console.log('Login success; no safe next param. Staying on page.');
            } catch (e) {
                console.log('Redirect handling error', e);
            }
        }, 2500);
    }
}

// Add custom animations
if (!document.querySelector('#neu-keyframes')) {
    const style = document.createElement('style');
    style.id = 'neu-keyframes';
    style.textContent = `
        @keyframes gentleShake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-3px); }
            75% { transform: translateX(3px); }
        }
        
        @keyframes successPulse {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// Initialize the form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NeumorphismLoginForm();
});