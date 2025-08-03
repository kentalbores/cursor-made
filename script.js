// Form handling and API integration
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('apiForm');
    const submitBtn = form.querySelector('.submit-btn');
    const notification = document.getElementById('notification');
    
    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(form);
        const data = {
            field1: formData.get('field1'),
            field2: formData.get('field2'),
            field3: formData.get('field3')
        };
        
        // Validate form
        if (!validateForm(data)) {
            showNotification('Please fill in all fields correctly', 'error');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        try {
            // TODO: Replace with actual API endpoint when provided
            await simulateApiCall(data);
            
            // Show success notification
            showNotification('Form submitted successfully!', 'success');
            
            // Reset form after successful submission
            setTimeout(() => {
                form.reset();
                hideNotification();
            }, 2000);
            
        } catch (error) {
            console.error('API call failed:', error);
            showNotification('Failed to submit form. Please try again.', 'error');
        } finally {
            setLoadingState(false);
        }
    });
    
    // Form validation
    function validateForm(data) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        // Check if all fields are filled
        if (!data.field1.trim() || !data.field2.trim() || !data.field3.trim()) {
            return false;
        }
        
        // Validate email format
        if (!emailRegex.test(data.field2)) {
            return false;
        }
        
        return true;
    }
    
    // Simulate API call (replace with actual API integration)
    async function simulateApiCall(data) {
        // TODO: Replace this simulation with actual API call
        // Example:
        // const response = await fetch('YOUR_API_ENDPOINT', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(data)
        // });
        // 
        // if (!response.ok) {
        //     throw new Error('API call failed');
        // }
        // 
        // return await response.json();
        
        console.log('Form data that would be sent to API:', data);
        
        // Simulate network delay
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, message: 'Data received successfully' });
            }, 1500);
        });
    }
    
    // Loading state management
    function setLoadingState(loading) {
        if (loading) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        } else {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }
    
    // Notification system
    function showNotification(message, type = 'success') {
        const notificationContent = notification.querySelector('.notification-content span');
        const notificationIcon = notification.querySelector('.notification-content i');
        
        notificationContent.textContent = message;
        
        // Update notification style based on type
        notification.className = 'notification';
        
        if (type === 'error') {
            notification.style.background = 'linear-gradient(135deg, #f56565, #e53e3e)';
            notificationIcon.className = 'fas fa-exclamation-circle';
        } else {
            notification.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
            notificationIcon.className = 'fas fa-check-circle';
        }
        
        // Show notification
        notification.classList.remove('hidden');
    }
    
    function hideNotification() {
        notification.classList.add('hidden');
    }
    
    // Input field enhancements
    const inputs = form.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
        // Add floating label effect
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
        
        // Real-time validation feedback
        input.addEventListener('input', function() {
            validateField(this);
        });
    });
    
    // Individual field validation
    function validateField(field) {
        const inputGroup = field.parentElement;
        const fieldName = field.name;
        const value = field.value.trim();
        
        // Remove previous validation classes
        inputGroup.classList.remove('valid', 'invalid');
        
        // Skip validation if field is empty (handled by required attribute)
        if (!value) return;
        
        let isValid = true;
        
        switch (fieldName) {
            case 'field1': // Name validation
                isValid = value.length >= 2;
                break;
            case 'field2': // Email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = emailRegex.test(value);
                break;
            case 'field3': // Message validation
                isValid = value.length >= 10;
                break;
        }
        
        inputGroup.classList.add(isValid ? 'valid' : 'invalid');
    }
    
    // Add smooth scroll behavior for mobile
    if (window.innerWidth <= 768) {
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                setTimeout(() => {
                    this.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }, 300);
            });
        });
    }
    
    // Keyboard accessibility
    document.addEventListener('keydown', function(e) {
        // Close notification with Escape key
        if (e.key === 'Escape' && !notification.classList.contains('hidden')) {
            hideNotification();
        }
    });
    
    // Auto-hide notification after 5 seconds
    let notificationTimeout;
    
    function showNotificationWithAutoHide(message, type = 'success') {
        showNotification(message, type);
        
        clearTimeout(notificationTimeout);
        notificationTimeout = setTimeout(() => {
            hideNotification();
        }, 5000);
    }
    
    // Replace the original showNotification calls with auto-hide version
    window.showNotification = showNotificationWithAutoHide;
});

// API integration helper (for future use)
class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    
    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add any additional headers here (auth tokens, etc.)
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }
}

// Export for future use
// const apiClient = new ApiClient('YOUR_API_BASE_URL');

// Example of how to integrate with real API:
// 1. Replace simulateApiCall function with:
// async function makeApiCall(data) {
//     return await apiClient.post('/your-endpoint', data);
// }
//
// 2. Update the API_ENDPOINT constant with your actual endpoint
// 3. Add any required authentication headers or tokens