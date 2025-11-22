// Authentication JavaScript
function switchToSignUp() {
    document.getElementById('signInForm').classList.remove('active');
    document.getElementById('signUpForm').classList.add('active');
    document.getElementById('authTitle').textContent = 'Sign Up';
    document.getElementById('authSubtitle').textContent = 'Create your account to start tracking your nutrition';
}

function switchToSignIn() {
    document.getElementById('signUpForm').classList.remove('active');
    document.getElementById('signInForm').classList.add('active');
    document.getElementById('authTitle').textContent = 'Sign In';
    document.getElementById('authSubtitle').textContent = 'Welcome back! Sign in to continue your journey';
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

async function handleSignIn(event) {
    event.preventDefault();
    
    const username = document.getElementById('signInUsername').value;
    const password = document.getElementById('signInPassword').value;
    
    try {
        const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store user session
            localStorage.setItem('user_id', data.user_id);
            localStorage.setItem('username', data.username);
            localStorage.setItem('is_authenticated', 'true');
            
            Toast.success('Welcome back, ' + data.username + '!');
            
            // Redirect to home
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            Toast.error(data.error || 'Invalid username or password');
        }
    } catch (error) {
        Toast.error('Error signing in: ' + error.message);
    }
}

async function handleSignUp(event) {
    event.preventDefault();
    
    const username = document.getElementById('signUpUsername').value;
    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;
    const passwordConfirm = document.getElementById('signUpPasswordConfirm').value;
    
    // Validate passwords match
    if (password !== passwordConfirm) {
        Toast.error('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        Toast.error('Password must be at least 6 characters');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            Toast.success('Account created successfully!');
            
            // Auto sign in
            setTimeout(async () => {
                const signInResponse = await fetch('/api/auth/signin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const signInData = await signInResponse.json();
                
                if (signInData.success) {
                    localStorage.setItem('user_id', signInData.user_id);
                    localStorage.setItem('username', signInData.username);
                    localStorage.setItem('is_authenticated', 'true');
                    
                    window.location.href = '/';
                }
            }, 1000);
        } else {
            Toast.error(data.error || 'Error creating account');
        }
    } catch (error) {
        Toast.error('Error signing up: ' + error.message);
    }
}

// Check if already authenticated
window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('is_authenticated') === 'true') {
        window.location.href = '/';
    }
});

