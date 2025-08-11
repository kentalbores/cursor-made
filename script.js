// Form handling and API integration
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('apiForm');
    const submitBtn = form.querySelector('.submit-btn');
    const notification = document.getElementById('notification');
    
    // Store fetched user data
    let validUsers = [];
    
    // Function to set current date in the date field
    function setCurrentDate() {
        const dateField = document.getElementById('field2');
        if (dateField) {
            const today = new Date();
            const formattedDate = today.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            console.log('Setting date field to:', formattedDate);
            dateField.value = formattedDate;
            
            // Force the value to stick by setting it again after a brief delay
            setTimeout(() => {
                if (dateField.value !== formattedDate) {
                    console.log('Date field changed, resetting to:', formattedDate);
                    dateField.value = formattedDate;
                }
            }, 10);
        }
    }
    
    // Set current date initially
    setCurrentDate();
    
    // Protect the date field from being changed
    const dateField = document.getElementById('field2');
    if (dateField) {
        // Prevent manual changes to the date field
        dateField.addEventListener('input', function(e) {
            e.preventDefault();
            setCurrentDate();
        });
        
        // Prevent pasting into the date field
        dateField.addEventListener('paste', function(e) {
            e.preventDefault();
            setCurrentDate();
        });
        
        // Monitor for any changes and reset if needed
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                    const currentValue = dateField.value;
                    const today = new Date();
                    const expectedFormat = today.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    
                    if (currentValue !== expectedFormat) {
                        console.log('Date field changed unexpectedly, resetting...');
                        setCurrentDate();
                    }
                }
            });
        });
        
        observer.observe(dateField, {
            attributes: true,
            attributeFilter: ['value']
        });
    }
    
    // Fetch valid users on page load
    async function fetchValidUsers() {
        try {
            console.log('Fetching valid users...');
            const response = await fetch('http://localhost:5678/webhook-test/f9902862-f9de-452c-b8a5-69fe2a047823', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            // const response = await fetch('http://localhost:5678/webhook/f9902862-f9de-452c-b8a5-69fe2a047823', {
            //     method: 'GET',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     }
            // });
            
            
            if (response.status < 200 || response.status >= 300) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const users = await response.json();
            console.log('Fetched users:', users);
            
            validUsers = users;
            console.log('Valid users loaded:', validUsers.length);
            
        } catch (error) {
            console.error('Failed to fetch valid users:', error);
            showNotification('Failed to load user data. Please refresh the page.', 'error');
        }
    }
    
    // Load valid users when page loads
    fetchValidUsers();
    
    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(form);
        const enteredName = formData.get('field1').trim();
        
        // Find the user data for the entered name
        const userData = validUsers.find(user => user.name.toLowerCase() === enteredName.toLowerCase());
        
        if (!userData) {
            showNotification('Invalid name. Please enter a valid name from the system.', 'error');
            return;
        }
        
        const data = {
            field1: enteredName,               // name
            field2: formData.get('field2'),    // date
            field3: formData.get('field3'),    // report
            dep: userData.dep                  // department from fetched data
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
                // Wait a moment for form reset to complete, then set date
                setTimeout(() => {
                    setCurrentDate(); // Re-set the date after form reset
                }, 50);
                hideNotification();
            }, 2000);
            
        } catch (error) {
            console.error('API call failed:', error);
            // Show specific error message if available
            const errorMessage = error.message || 'Failed to submit form. Please try again.';
            showNotification(errorMessage, 'error');
        } finally {
            setLoadingState(false);
        }
    });
    
    // Form validation
    function validateForm(data) {
        // Check if all fields are filled
        if (!data.field1.trim() || !data.field2.trim() || !data.field3.trim()) {
            return false;
        }
        
        // Name validation is already done in form submission handler
        return true;
    }
    
    // API call to webhook endpoint
    async function simulateApiCall(data) {
        try {
            console.log('Sending data to webhook:', data);
            const response = await fetch('http://localhost:5678/webhook-test/f9902862-f9de-452c-b8a5-69fe2a047823', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            console.log('Webhook response status:', response.status);
            console.log('Webhook response ok:', response.ok);
            
            // n8n webhooks often return 200, 201, or other success codes
            // Check for any 2xx status code (200-299)
            if (response.status < 200 || response.status >= 300) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Try to parse JSON, but don't fail if it's not JSON
            let result = {};
            try {
                const text = await response.text();
                console.log('Webhook response text:', text);
                if (text.trim()) {
                    result = JSON.parse(text);
                }
            } catch (jsonError) {
                console.log('Response is not JSON, but that\'s okay for webhooks');
                result = { success: true, message: 'Webhook executed successfully' };
            }
            
            console.log('Webhook final result:', result);
            return result;
            
        } catch (error) {
            console.error('Webhook call failed:', error);
            
            // Check if it's a network error (endpoint not available)
            if (error.name === 'TypeError' && (
                error.message.includes('fetch') || 
                error.message.includes('Failed to fetch') ||
                error.message.includes('Network request failed')
            )) {
                throw new Error('Unable to connect to server. Please check if the webhook endpoint is running.');
            }
            
            // If it's any other error, re-throw it
            throw error;
        }
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
                // Check if name exists in valid users (case insensitive)
                isValid = value.length >= 2 && validUsers.some(user => 
                    user.name.toLowerCase() === value.toLowerCase()
                );
                break;
            case 'field2': // Date validation
                isValid = value.length > 0;
                break;
            case 'field3': // Report validation
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