// signup.js - Client-side script for the signup page

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('signupButton').addEventListener('click', async function() {
        const user_id = document.getElementById('user_id').value.trim();
        const password = document.getElementById('password').value;
        const confirm_password = document.getElementById('confirm_password').value;
        
        if (!user_id || !password || !confirm_password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (password !== confirm_password) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_id, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showMessage('Account created successfully!', 'success');
                // Redirect to login page after successful signup
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            } else {
                showMessage(data.message || 'Signup failed. Please try again.', 'error');
            }
        } catch (error) {
            showMessage('An error occurred. Please try again later.', 'error');
            console.error('Signup error:', error);
        }
    });
    
    function showMessage(message, type) {
        const messageBox = document.getElementById('messageBox');
        messageBox.textContent = message;
        messageBox.style.display = 'block';
        messageBox.className = 'message ' + type;
    }
});
