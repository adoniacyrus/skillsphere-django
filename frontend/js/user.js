/**
 * SkillSphere User Dashboard Logic
 */

let currentPageUrl = '/workshops/';
let currentPricePerSeat = 0;

$(document).ready(function() {
    // 1. Initial Checks & Setup
    const role = localStorage.getItem('role');
    if (!role || role !== 'user') {
        window.location.href = 'login.html';
        return;
    }

    // 2. Fetch User Profile
    fetchUserProfile();

    // 3. Load Cities for Dropdowns
    loadCities();

    // 4. Load Workshops initially
    loadWorkshops();

    // --- Event Listeners ---
    
    // Navigation
    $('#navWorkshops').click(function(e) {
        e.preventDefault();
        $(this).addClass('active');
        $('#navMyBookings').removeClass('active');
        $('#browseWorkshopsView').removeClass('d-none');
        $('#myBookingsView').addClass('d-none');
        loadWorkshops();
    });

    $('#navMyBookings').click(function(e) {
        e.preventDefault();
        $(this).addClass('active');
        $('#navWorkshops').removeClass('active');
        $('#myBookingsView').removeClass('d-none');
        $('#browseWorkshopsView').addClass('d-none');
        loadMyBookings();
    });

    // Filters
    $('#applyFiltersBtn').click(function() {
        const search = $('#searchWorkshop').val();
        const city = $('#filterCity').val();
        const sort = $('#sortWorkshop').val();

        let queryParams = [];
        if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
        if (city) queryParams.push(`city=${encodeURIComponent(city)}`);
        if (sort) queryParams.push(`sort=${encodeURIComponent(sort)}`);

        const queryString = queryParams.length > 0 ? '?' + queryParams.join('&') : '';
        loadWorkshops('/workshops/' + queryString);
    });

    // Profile City Selection
    $('#setCityBtn').click(function() {
        const cityId = $('#preferredCitySelect').val();
        if (!cityId) return;

        $(this).prop('disabled', true).text('Saving...');
        apiCall('/accounts/set-city/', 'POST', { city_id: parseInt(cityId) })
            .then(res => {
                showAlert('dashboardAlert', res.message, 'success');
                fetchUserProfile(); // refresh
            })
            .catch(err => showAlert('dashboardAlert', err, 'danger'))
            .finally(() => {
                $(this).prop('disabled', false).text('Save City');
                setTimeout(() => $('#dashboardAlert').addClass('d-none'), 3000);
            });
    });

    // Book Modal calculations
    $('#bookSeats').on('input', function() {
        const seats = $(this).val();
        const total = (seats * currentPricePerSeat).toFixed(2);
        $('#bookTotalPrice').text(total);
    });

    // Submit Booking
    $('#bookForm').submit(function(e) {
        e.preventDefault();
        const workshopId = $('#bookWorkshopId').val();
        const seats = parseInt($('#bookSeats').val());

        $('#confirmBookBtn').prop('disabled', true).text('Processing...');
        $('#bookAlert').addClass('d-none');

        apiCall('/bookings/create/', 'POST', {
            workshop: parseInt(workshopId),
            seats_booked: seats
        })
        .then(res => {
            showAlert('bookAlert', 'Booking successful!', 'success');
            setTimeout(() => {
                $('#bookModal').modal('hide');
                loadWorkshops(); // refresh seats
            }, 1500);
        })
        .catch(err => showAlert('bookAlert', err, 'danger'))
        .finally(() => {
            $('#confirmBookBtn').prop('disabled', false).text('Confirm Booking');
        });
    });

});

// --- Functions ---

function fetchUserProfile() {
    apiCall('/accounts/me/', 'GET')
        .then(user => {
            $('#welcomeMessage').text(`Welcome, ${user.username}`);
            $('#userInfoText').text(`Email: ${user.email}`);
            // Note: the backend /accounts/me/ doesn't currently return preferred_city in serializer,
            // but we allow setting it.
        })
        .catch(err => {
            console.error("Failed to fetch profile", err);
        });
}

function loadCities() {
    apiCall('/cities/', 'GET')
        .then(cities => {
            let options = '<option value="">All Cities</option>';
            let prefOptions = '<option value="">Select Preferred City</option>';
            
            cities.forEach(city => {
                // Using city name for filtering as per backend `city__name__iexact=city`
                options += `<option value="${city.name}">${city.name}</option>`;
                // Using city ID for setting preference
                prefOptions += `<option value="${city.id}">${city.name}</option>`;
            });
            
            $('#filterCity').html(options);
            $('#preferredCitySelect').html(prefOptions);
        })
        .catch(err => console.error('Failed to load cities:', err));
}

function loadWorkshops(url = '/workshops/') {
    $('#workshopList').html('<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>');
    
    apiCall(url, 'GET')
        .then(response => {
            const workshops = response.results || response; // handle pagination wrapper if exists
            renderWorkshops(workshops);
            
            // Handle pagination controls if backend uses PageNumberPagination
            if (response.next || response.previous) {
                $('#paginationControls').removeClass('d-none');
                $('#nextPageBtn').prop('disabled', !response.next)
                    .off('click').on('click', () => loadWorkshops(response.next.replace(API_BASE_URL, '')));
                $('#prevPageBtn').prop('disabled', !response.previous)
                    .off('click').on('click', () => loadWorkshops(response.previous.replace(API_BASE_URL, '')));
            } else {
                $('#paginationControls').addClass('d-none');
            }
        })
        .catch(err => {
            $('#workshopList').html(`<div class="col-12"><div class="alert alert-danger">Error loading workshops: ${err}</div></div>`);
        });
}

function renderWorkshops(workshops) {
    const container = $('#workshopList');
    container.empty();

    if (!workshops || workshops.length === 0) {
        container.html('<div class="col-12 text-center text-muted py-4">No workshops found.</div>');
        return;
    }

    workshops.forEach(ws => {
        const dateStr = new Date(ws.date).toLocaleString(undefined, {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        const isSoldOut = ws.seats_available <= 0;
        const btnClass = isSoldOut ? 'btn-secondary disabled' : 'btn-primary book-btn';
        const btnText = isSoldOut ? 'Sold Out' : 'Book Now';

        const card = `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100 border-0 shadow-sm rounded-4">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="badge bg-info text-dark rounded-pill">${ws.city_name || 'City'}</span>
                            <span class="fw-bold text-success">₹${ws.price}</span>
                        </div>
                        <h5 class="card-title fw-bold text-dark">${ws.title}</h5>
                        <p class="card-text text-muted small flex-grow-1">${ws.description}</p>
                        
                        <div class="mb-3 text-muted small">
                            <div><i class="bi bi-calendar"></i> ${dateStr}</div>
                            <div><i class="bi bi-person"></i> Available Seats: <strong>${ws.seats_available}</strong>/${ws.seat_limit}</div>
                        </div>
                        
                        <button class="btn w-100 rounded-pill fw-semibold ${btnClass}" 
                                data-id="${ws.id}" data-title="${ws.title}" data-city="${ws.city_name}" 
                                data-price="${ws.price}" data-seats="${ws.seats_available}">
                            ${btnText}
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.append(card);
    });

    // Attach click events to dynamic buttons
    $('.book-btn').click(function() {
        const id = $(this).data('id');
        const title = $(this).data('title');
        const city = $(this).data('city');
        const price = parseFloat($(this).data('price'));
        const available = $(this).data('seats');

        $('#bookWorkshopId').val(id);
        $('#bookWorkshopTitle').text(title);
        $('#bookWorkshopCity').text(city || 'N/A');
        $('#bookWorkshopPrice').text(price.toFixed(2));
        $('#bookAvailableSeats').text(available);
        $('#bookSeats').val(1).attr('max', available);
        
        currentPricePerSeat = price;
        $('#bookTotalPrice').text(price.toFixed(2));
        
        $('#bookAlert').addClass('d-none');
        $('#bookModal').modal('show');
    });
}

function loadMyBookings() {
    $('#bookingsList').html('<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>');

    apiCall('/bookings/my-bookings/', 'GET')
        .then(bookings => {
            const container = $('#bookingsList');
            container.empty();

            if (!bookings || bookings.length === 0) {
                container.html('<div class="col-12 text-center text-muted py-4">You have no bookings yet.</div>');
                return;
            }

            bookings.forEach(b => {
                const dateStr = new Date(b.booked_at).toLocaleString();
                const card = `
                    <div class="col-md-6 mb-3">
                        <div class="card border-0 shadow-sm rounded-3">
                            <div class="card-body">
                                <div class="d-flex justify-content-between">
                                    <h5 class="fw-bold text-dark">Booking #${b.id}</h5>
                                    <span class="badge bg-success rounded-pill">Confirmed</span>
                                </div>
                                <p class="mb-1"><strong>Workshop ID:</strong> ${b.workshop}</p>
                                <p class="mb-1"><strong>Seats Booked:</strong> ${b.seats_booked}</p>
                                <p class="mb-1"><strong>Total Paid:</strong> ₹${b.total_price}</p>
                                <p class="mb-2 text-muted small">Booked on: ${dateStr}</p>
                                
                                <button class="btn btn-outline-danger btn-sm cancel-booking-btn rounded-pill px-3" data-id="${b.id}">
                                    Cancel Booking
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                container.append(card);
            });

            // Cancel buttons
            $('.cancel-booking-btn').click(function() {
                if (confirm('Are you sure you want to cancel this booking?')) {
                    const bookingId = $(this).data('id');
                    const btn = $(this);
                    btn.prop('disabled', true).text('Cancelling...');
                    
                    apiCall(`/bookings/${bookingId}/cancel/`, 'DELETE')
                        .then(res => {
                            showAlert('dashboardAlert', res.message, 'success');
                            loadMyBookings(); // refresh list
                        })
                        .catch(err => {
                            showAlert('dashboardAlert', err, 'danger');
                            btn.prop('disabled', false).text('Cancel Booking');
                        });
                }
            });
        })
        .catch(err => {
            $('#bookingsList').html(`<div class="col-12"><div class="alert alert-danger">Error loading bookings: ${err}</div></div>`);
        });
}
