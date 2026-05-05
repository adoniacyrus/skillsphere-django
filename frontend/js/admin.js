/**
 * SkillSphere Admin Dashboard Logic
 */

$(document).ready(function() {
    // 1. Initial Checks
    const role = localStorage.getItem('role');
    if (!role || role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // 2. Fetch User Profile
    fetchUserProfile();

    // 3. Load initial view
    loadUsers();

    // --- Navigation ---
    $('.nav-link').click(function(e) {
        if ($(this).attr('id') === 'logoutBtn') return;
        e.preventDefault();
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
        
        // Hide all views
        $('#usersView, #workshopsView, #citiesView, #bookingsView').addClass('d-none');
        
        // Show selected view
        const targetId = $(this).attr('id').replace('nav', '').toLowerCase() + 'View';
        $('#' + targetId).removeClass('d-none');

        // Load data based on view
        if (targetId === 'usersView') loadUsers();
        if (targetId === 'workshopsView') loadWorkshops();
        if (targetId === 'citiesView') loadCities();
        if (targetId === 'bookingsView') loadBookings();
    });

    // --- Users Filter ---
    $('#userRoleFilter').change(function() {
        const role = $(this).val();
        loadUsers(role);
    });

    // --- Add City Form ---
    $('#addCityForm').submit(function(e) {
        e.preventDefault();
        const name = $('#cityName').val();
        const btn = $('#addCityBtn');
        
        btn.prop('disabled', true).text('Adding...');
        $('#addCityAlert').addClass('d-none');

        apiCall('/cities/', 'POST', { name: name })
            .then(res => {
                showAlert('addCityAlert', 'City added successfully!', 'success');
                setTimeout(() => {
                    $('#addCityModal').modal('hide');
                    $('#addCityForm')[0].reset();
                    loadCities();
                }, 1500);
            })
            .catch(err => showAlert('addCityAlert', err, 'danger'))
            .finally(() => btn.prop('disabled', false).text('Add City'));
    });
});

// --- Functions ---

function fetchUserProfile() {
    apiCall('/accounts/me/', 'GET')
        .then(user => {
            $('#welcomeMessage').text(`Welcome, ${user.username}`);
        })
        .catch(err => console.error("Profile error", err));
}

function loadUsers(roleFilter = '') {
    $('#adminUsersList').html('<div class="col-12 text-center py-5"><div class="spinner-border text-danger"></div></div>');
    
    let url = '/accounts/users/';
    if (roleFilter) {
        url += `?role=${roleFilter}`;
    }

    apiCall(url, 'GET')
        .then(users => {
            const container = $('#adminUsersList');
            container.empty();

            if (!users || users.length === 0) {
                container.html('<div class="col-12 text-center text-muted py-4">No users found.</div>');
                return;
            }

            let tableHTML = `
                <div class="col-12">
                    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0 align-middle">
                                <thead class="table-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;

            users.forEach(u => {
                let roleBadge = '';
                if (u.role === 'admin') roleBadge = '<span class="badge bg-danger">Admin</span>';
                else if (u.role === 'organizer') roleBadge = '<span class="badge bg-primary">Organizer</span>';
                else roleBadge = '<span class="badge bg-secondary">Attendee</span>';

                tableHTML += `
                    <tr>
                        <td><span class="fw-bold text-muted">#${u.id}</span></td>
                        <td class="fw-semibold">${u.username}</td>
                        <td>${u.email || '<span class="text-muted small">N/A</span>'}</td>
                        <td>${roleBadge}</td>
                    </tr>
                `;
            });

            tableHTML += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            container.html(tableHTML);
        })
        .catch(err => {
            $('#adminUsersList').html(`<div class="col-12"><div class="alert alert-danger">Error: ${err}</div></div>`);
        });
}

function loadWorkshops() {
    $('#adminWorkshopsList').html('<div class="col-12 text-center py-5"><div class="spinner-border text-danger"></div></div>');
    
    apiCall('/workshops/?page_size=50', 'GET')
        .then(res => {
            const workshops = res.results || res;
            renderWorkshops(workshops);
        })
        .catch(err => {
            $('#adminWorkshopsList').html(`<div class="col-12"><div class="alert alert-danger">Error: ${err}</div></div>`);
        });
}

function renderWorkshops(workshops) {
    const container = $('#adminWorkshopsList');
    container.empty();

    if (!workshops || workshops.length === 0) {
        container.html('<div class="col-12 text-center text-muted py-4">No workshops available.</div>');
        return;
    }

    workshops.forEach(ws => {
        const approveBtn = ws.is_approved 
            ? `<button class="btn btn-success btn-sm" disabled><i class="bi bi-check-circle"></i> Approved</button>`
            : `<button class="btn btn-warning btn-sm approve-btn text-dark fw-bold" data-id="${ws.id}">Approve Now</button>`;

        const card = `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100 border-0 shadow-sm rounded-4">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge bg-light text-dark border">${ws.city_name || 'City'}</span>
                            ${approveBtn}
                        </div>
                        <h5 class="card-title fw-bold text-dark mt-2">${ws.title}</h5>
                        <p class="text-muted small mb-1 flex-grow-1">${ws.description}</p>
                        <div class="mt-3 pt-3 border-top">
                            <p class="text-muted small mb-1"><strong>Organizer ID:</strong> ${ws.organizer}</p>
                            <p class="text-muted small mb-0"><strong>Price:</strong> ₹${ws.price} | <strong>Seats:</strong> ${ws.seats_available}/${ws.seat_limit}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.append(card);
    });

    // Attach approve event
    $('.approve-btn').click(function() {
        const id = $(this).data('id');
        const btn = $(this);
        btn.prop('disabled', true).text('Approving...');
        
        apiCall(`/workshops/${id}/approve/`, 'PATCH', {})
            .then(res => {
                btn.removeClass('btn-warning text-dark').addClass('btn-success text-white').html('<i class="bi bi-check-circle"></i> Approved');
                // Optional: reload workshops
                // loadWorkshops(); 
            })
            .catch(err => {
                alert('Approval failed: ' + err);
                btn.prop('disabled', false).text('Approve Now');
            });
    });
}

function loadCities() {
    $('#citiesList').html('<div class="text-center py-5"><div class="spinner-border text-danger"></div></div>');
    
    apiCall('/cities/', 'GET')
        .then(cities => {
            const container = $('#citiesList');
            container.empty();

            if (!cities || cities.length === 0) {
                container.html('<li class="list-group-item text-center text-muted py-4">No cities found.</li>');
                return;
            }

            cities.forEach(c => {
                const li = `
                    <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                        <span class="fw-semibold">${c.name}</span>
                        <div>
                            <span class="text-muted small me-3">ID: ${c.id}</span>
                        </div>
                    </li>
                `;
                container.append(li);
            });
        })
        .catch(err => {
            $('#citiesList').html(`<li class="list-group-item text-danger">Error loading cities: ${err}</li>`);
        });
}

function loadBookings() {
    $('#adminBookingsList').html('<div class="col-12 text-center py-5"><div class="spinner-border text-danger"></div></div>');
    
    apiCall('/bookings/all/', 'GET')
        .then(bookings => {
            const container = $('#adminBookingsList');
            container.empty();

            if (!bookings || bookings.length === 0) {
                container.html('<div class="col-12 text-center text-muted py-4">No bookings found on the platform.</div>');
                return;
            }

            let tableHTML = `
                <div class="col-12">
                    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0 align-middle">
                                <thead class="table-light">
                                    <tr>
                                        <th>Booking ID</th>
                                        <th>Workshop ID</th>
                                        <th>User ID</th>
                                        <th>Seats Booked</th>
                                        <th>Total Paid</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;

            bookings.forEach(b => {
                const dateStr = new Date(b.booked_at).toLocaleString();
                tableHTML += `
                    <tr>
                        <td><span class="fw-bold text-danger">#${b.id}</span></td>
                        <td>${b.workshop}</td>
                        <td>${b.user}</td>
                        <td><span class="badge bg-secondary rounded-pill">${b.seats_booked}</span></td>
                        <td class="text-success fw-semibold">₹${b.total_price}</td>
                        <td class="text-muted small">${dateStr}</td>
                    </tr>
                `;
            });

            tableHTML += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            container.html(tableHTML);
        })
        .catch(err => {
            $('#adminBookingsList').html(`<div class="col-12"><div class="alert alert-danger">Error loading bookings: ${err}</div></div>`);
        });
}
