/**
 * SkillSphere Authentication & Core API Functions
 */

// Base API URL
const API_BASE_URL = '/api';

/**
 * Reusable AJAX function that automatically attaches auth headers
 * @param {string} endpoint - API endpoint (e.g., '/accounts/login/')
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {object} data - Data to send (optional)
 * @returns {Promise} - Resolves with response data, rejects with error
 */
function apiCall(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = 'Basic ' + token;
        }

        const options = {
            url: API_BASE_URL + endpoint,
            type: method,
            headers: headers,
            success: function(response) {
                resolve(response);
            },
            error: function(xhr) {
                let errorMessage = 'An error occurred. Please try again.';
                if (xhr.responseJSON) {
                    if (xhr.responseJSON.error) {
                        errorMessage = xhr.responseJSON.error;
                    } else if (typeof xhr.responseJSON === 'object') {
                        // Extract first validation error
                        const firstKey = Object.keys(xhr.responseJSON)[0];
                        if (Array.isArray(xhr.responseJSON[firstKey])) {
                            errorMessage = `${firstKey}: ${xhr.responseJSON[firstKey][0]}`;
                        }
                    }
                }
                reject(errorMessage);
            }
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.data = JSON.stringify(data);
        }

        $.ajax(options);
    });
}

/**
 * Redirect user based on role
 * @param {string} role - User role (user, organizer, admin)
 */
function redirectBasedOnRole(role) {
    if (role === 'admin') {
        window.location.href = 'dashboard_admin.html';
    } else if (role === 'organizer') {
        window.location.href = 'dashboard_organizer.html';
    } else {
        window.location.href = 'dashboard_user.html';
    }
}

/**
 * Show alert message
 * @param {string} elementId - ID of the alert element
 * @param {string} message - Message to display
 * @param {string} type - Alert type (success, danger, etc.)
 */
function showAlert(elementId, message, type = 'danger') {
    const alertEl = $(`#${elementId}`);
    alertEl.removeClass('d-none alert-success alert-danger alert-warning alert-info')
           .addClass(`alert-${type}`)
           .text(message);
}

$(document).ready(function() {
    
    // ==========================================
    // LOGIN HANDLER
    // ==========================================
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        
        const username = $('#username').val();
        const password = $('#password').val();
        
        $('#loginBtn').prop('disabled', true);
        $('#loginSpinner').removeClass('d-none');
        $('#loginAlert').addClass('d-none');

        apiCall('/accounts/login/', 'POST', { username, password })
            .then(response => {
                // Generate Basic Auth token (base64 encoded username:password)
                const token = btoa(username + ':' + password);
                
                // Store auth info
                localStorage.setItem('token', token);
                localStorage.setItem('user_id', response.user_id);
                localStorage.setItem('role', response.role);
                
                showAlert('loginAlert', 'Login successful! Redirecting...', 'success');
                
                // Redirect after short delay
                setTimeout(() => {
                    redirectBasedOnRole(response.role);
                }, 1000);
            })
            .catch(error => {
                showAlert('loginAlert', error, 'danger');
            })
            .finally(() => {
                $('#loginBtn').prop('disabled', false);
                $('#loginSpinner').addClass('d-none');
            });
    });

    // ==========================================
    // REGISTER HANDLER
    // ==========================================
    $('#registerForm').on('submit', function(e) {
        e.preventDefault();
        
        const username = $('#username').val();
        const email = $('#email').val();
        const password = $('#password').val();
        const role = $('#role').val();
        
        $('#registerBtn').prop('disabled', true);
        $('#registerSpinner').removeClass('d-none');
        $('#registerAlert').addClass('d-none');

        apiCall('/accounts/register/', 'POST', { username, email, password, role })
            .then(response => {
                showAlert('registerAlert', 'Registration successful! Please login.', 'success');
                $('#registerForm')[0].reset();
                
                // Optional: Auto-login after register
                // For now, redirect to login page after short delay
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            })
            .catch(error => {
                showAlert('registerAlert', error, 'danger');
            })
            .finally(() => {
                $('#registerBtn').prop('disabled', false);
                $('#registerSpinner').addClass('d-none');
            });
    });

    // ==========================================
    // LOGOUT HANDLER (can be used in dashboards)
    // ==========================================
    $(document).on('click', '#logoutBtn', function(e) {
        e.preventDefault();
        apiCall('/accounts/logout/', 'POST')
            .finally(() => {
                localStorage.clear();
                window.location.href = 'login.html';
            });
    });
});
