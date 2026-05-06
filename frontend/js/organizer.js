/**
 * SkillSphere Organizer Dashboard Logic
 */

let currentUserId = localStorage.getItem('user_id');

$(document).ready(function() {
    // 1. Initial Checks
    const role = localStorage.getItem('role');
    if (!role || role !== 'organizer') {
        window.location.href = 'login.html';
        return;
    }
    
    // Convert to number for strict comparison later
    if (currentUserId) currentUserId = parseInt(currentUserId);

    // 2. Fetch User Profile
    fetchUserProfile();

    // 3. Load Data
    loadCities();
    loadMyWorkshops();

    // --- Navigation ---
    $('#navMyWorkshops').click(function(e) {
        e.preventDefault();
        $(this).addClass('active');
        $('#navViewBookings').removeClass('active');
        $('#myWorkshopsView').removeClass('d-none');
        $('#viewBookingsView').addClass('d-none');
        loadMyWorkshops();
    });

    $('#navViewBookings').click(function(e) {
        e.preventDefault();
        $(this).addClass('active');
        $('#navMyWorkshops').removeClass('active');
        $('#viewBookingsView').removeClass('d-none');
        $('#myWorkshopsView').addClass('d-none');
        loadBookings();
    });

    // --- Form Handlers ---
    $('#createForm').submit(function(e) {
        e.preventDefault();
        
        const title = $('#wsTitle').val();
        const desc = $('#wsDescription').val();
        const cityId = parseInt($('#wsCity').val());
        const date = $('#wsDate').val(); // format: YYYY-MM-DDTHH:MM
        const price = parseFloat($('#wsPrice').val());
        const limit = parseInt($('#wsSeatLimit').val());

        $('#createBtn').prop('disabled', true).text('Creating...');
        $('#createAlert').addClass('d-none');

        // Format date for Django (adding Z to explicitly signify UTC/local depending on needs, 
        // backend expects ISO 8601 or similar, so raw datetime-local val is usually fine)
        const dateObj = new Date(date);
        const isoDate = dateObj.toISOString();

        apiCall('/workshops/', 'POST', {
            title: title,
            description: desc,
            city: cityId,
            date: isoDate,
            price: price,
            seat_limit: limit
        })
        .then(res => {
            showAlert('createAlert', 'Workshop created successfully! Awaiting Admin approval.', 'success');
            setTimeout(() => {
                $('#createWorkshopModal').modal('hide');
                $('#createForm')[0].reset();
                loadMyWorkshops();
            }, 2000);
        })
        .catch(err => {
            showAlert('createAlert', err, 'danger');
        })
        .finally(() => {
            $('#createBtn').prop('disabled', false).text('Create Workshop');
        });
    });

    $('#editForm').submit(function(e) {
        e.preventDefault();
        
        const id = $('#editWsId').val();
        const title = $('#editWsTitle').val();
        const desc = $('#editWsDescription').val();
        const cityId = parseInt($('#editWsCity').val());
        const date = $('#editWsDate').val(); 
        const price = parseFloat($('#editWsPrice').val());
        const limit = parseInt($('#editWsSeatLimit').val());

        $('#editBtn').prop('disabled', true).text('Updating...');
        $('#editAlert').addClass('d-none');

        const dateObj = new Date(date);
        const isoDate = dateObj.toISOString();

        apiCall(`/workshops/${id}/`, 'PATCH', {
            title: title,
            description: desc,
            city: cityId,
            date: isoDate,
            price: price,
            seat_limit: limit
        })
        .then(res => {
            showAlert('editAlert', 'Workshop updated successfully!', 'success');
            setTimeout(() => {
                $('#editWorkshopModal').modal('hide');
                loadMyWorkshops();
            }, 1500);
        })
        .catch(err => {
            showAlert('editAlert', err, 'danger');
        })
        .finally(() => {
            $('#editBtn').prop('disabled', false).text('Update Workshop');
        });
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

function loadCities() {
    apiCall('/cities/', 'GET')
        .then(cities => {
            let options = '<option value="" disabled selected>Select a City</option>';
            cities.forEach(c => {
                options += `<option value="${c.id}">${c.name}</option>`;
            });
            $('#wsCity').html(options);
            $('#editWsCity').html(options);
        })
        .catch(err => console.error('Cities error', err));
}

function loadMyWorkshops() {
    $('#workshopsList').html('<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>');
    
    // Fetching large page size to ensure we get as many as possible to filter locally.
    apiCall('/workshops/?page_size=50', 'GET')
        .then(res => {
            const workshops = res.results || res;
            
            // Local filtering by organizer
            // Note: if `organizer` field isn't in serializer, we can't filter.
            // Assuming WorkshopSerializer returns `organizer` as user ID.
            const myWorkshops = workshops.filter(ws => ws.organizer === currentUserId);
            renderWorkshops(myWorkshops);
        })
        .catch(err => {
            $('#workshopsList').html(`<div class="col-12"><div class="alert alert-danger">Error: ${err}</div></div>`);
        });
}

function renderWorkshops(workshops) {
    const container = $('#workshopsList');
    container.empty();

    if (!workshops || workshops.length === 0) {
        container.html('<div class="col-12 text-center text-muted py-4">No workshops found or all are pending approval.</div>');
        return;
    }

    workshops.forEach(ws => {
        const dateStr = new Date(ws.date).toLocaleString();
        const booked = ws.seat_limit - ws.seats_available;
        const statusBadge = ws.is_approved 
            ? '<span class="badge bg-success">Approved</span>' 
            : '<span class="badge bg-warning text-dark">Pending</span>';

        const card = `
            <div class="col-md-6 mb-4">
                <div class="card h-100 border-0 shadow-sm rounded-4">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h5 class="card-title fw-bold text-dark mb-0">${ws.title}</h5>
                            ${statusBadge}
                        </div>
                        <p class="text-muted small mb-3"><i class="bi bi-geo-alt"></i> ${ws.city_name || 'City'} | <i class="bi bi-calendar"></i> ${dateStr}</p>
                        
                        <div class="row text-center mt-4">
                            <div class="col-4">
                                <h6 class="fw-bold mb-0">${ws.seat_limit}</h6>
                                <small class="text-muted">Total Seats</small>
                            </div>
                            <div class="col-4 border-start border-end">
                                <h6 class="fw-bold text-primary mb-0">${booked}</h6>
                                <small class="text-muted">Booked</small>
                            </div>
                            <div class="col-4">
                                <h6 class="fw-bold text-success mb-0">₹${ws.price}</h6>
                                <small class="text-muted">Price</small>
                            </div>
                        </div>
                        <div class="mt-3 text-end border-top pt-3">
                            <button class="btn btn-outline-danger btn-sm delete-btn rounded-pill px-3 me-2" data-id="${ws.id}">
                                <i class="bi bi-trash"></i> Delete
                            </button>
                            <button class="btn btn-outline-secondary btn-sm edit-btn rounded-pill px-3" 
                                data-id="${ws.id}" data-title="${ws.title}" data-desc="${ws.description}" 
                                data-city="${ws.city}" data-date="${ws.date}" data-price="${ws.price}" 
                                data-limit="${ws.seat_limit}">
                                <i class="bi bi-pencil"></i> Edit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.append(card);
    });

    $('.edit-btn').click(function() {
        $('#editWsId').val($(this).data('id'));
        $('#editWsTitle').val($(this).data('title'));
        $('#editWsDescription').val($(this).data('desc'));
        $('#editWsCity').val($(this).data('city'));
        $('#editWsPrice').val($(this).data('price'));
        $('#editWsSeatLimit').val($(this).data('limit'));
        
        // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
        const dateStr = $(this).data('date');
        if (dateStr) {
            const dateObj = new Date(dateStr);
            const tzOffset = dateObj.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(dateObj - tzOffset)).toISOString().slice(0, 16);
            $('#editWsDate').val(localISOTime);
        }

        $('#editAlert').addClass('d-none');
        $('#editWorkshopModal').modal('show');
    });

    $('.delete-btn').click(function() {
        const id = $(this).data('id');
        if (confirm('Are you sure you want to delete this workshop? This action cannot be undone.')) {
            apiCall(`/workshops/${id}/`, 'DELETE')
                .then(() => {
                    showAlert('dashboardAlert', 'Workshop deleted successfully!', 'success');
                    loadMyWorkshops();
                })
                .catch(err => {
                    showAlert('dashboardAlert', `Failed to delete workshop: ${err}`, 'danger');
                });
        }
    });
}

function loadBookings() {
    $('#attendeesList').html('<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>');
    
    apiCall('/bookings/organizer-bookings/', 'GET')
        .then(bookings => {
            const container = $('#attendeesList');
            container.empty();

            if (!bookings || bookings.length === 0) {
                container.html('<div class="col-12 text-center text-muted py-4">No bookings found for your workshops.</div>');
                return;
            }

            // Render table format for better visibility
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
                        <td><span class="fw-bold text-primary">#${b.id}</span></td>
                        <td>${b.workshop}</td>
                        <td>${b.user}</td>
                        <td><span class="badge bg-info text-dark rounded-pill">${b.seats_booked}</span></td>
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
            $('#attendeesList').html(`<div class="col-12"><div class="alert alert-danger">Error: ${err}</div></div>`);
        });
}
