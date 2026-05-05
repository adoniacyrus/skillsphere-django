$(document).ready(function () {
    const API_BASE = "http://127.0.0.1:8000/api";
    let selectedCity = "";

    // Helper to get CSRF token from cookies
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    // Configure AJAX to always send CSRF token for state-changing methods
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
            }
        }
    });

    // Helper for CSRF/Session if needed, but for GET it's usually fine
    // 1. Fetch and Display Workshops
    function loadWorkshops() {
        let url = `${API_BASE}/workshops/`;
        let params = [];
        
        if (selectedCity) {
            params.push(`city=${encodeURIComponent(selectedCity)}`);
        }
        
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }

        $.ajax({
            url: url,
            method: "GET",
            xhrFields: {
                withCredentials: true // send session cookies
            },
            success: function (response) {
                // Handle paginated response
                const workshops = response.results || response;
                const container = $("#workshopList");
                container.empty();

                if (!workshops || workshops.length === 0) {
                    container.append('<div class="col-12"><p class="text-muted">No workshops found.</p></div>');
                    return;
                }

                workshops.forEach(workshop => {
                    const dateObj = new Date(workshop.date);
                    const card = `
                        <div class="col-md-4 mb-4">
                            <div class="card h-100 shadow-sm border-0">
                                <div class="card-body">
                                    <h5 class="card-title text-primary fw-bold">${workshop.title}</h5>
                                    <h6 class="card-subtitle mb-2 text-muted"><i class="bi bi-geo-alt"></i> ${workshop.city_name || 'Location TBD'}</h6>
                                    <p class="card-text">${workshop.description}</p>
                                    <ul class="list-group list-group-flush mb-3">
                                        <li class="list-group-item d-flex justify-content-between">
                                            <span><strong>Date:</strong></span> 
                                            <span>${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </li>
                                        <li class="list-group-item d-flex justify-content-between">
                                            <span><strong>Price:</strong></span> 
                                            <span class="text-success fw-bold">$${workshop.price}</span>
                                        </li>
                                        <li class="list-group-item d-flex justify-content-between">
                                            <span><strong>Seats:</strong></span> 
                                            <span class="badge ${workshop.seats_available > 0 ? 'bg-info' : 'bg-danger'} text-dark rounded-pill">${workshop.seats_available} available</span>
                                        </li>
                                    </ul>
                                    <button class="btn btn-primary w-100 btn-book" data-id="${workshop.id}" ${workshop.seats_available === 0 ? 'disabled' : ''}>
                                        ${workshop.seats_available === 0 ? 'Sold Out' : 'Book Now'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    container.append(card);
                });
            },
            error: function (xhr) {
                console.error("Error loading workshops:", xhr);
                $("#workshopList").html('<div class="col-12"><p class="text-danger">Failed to load workshops. Please make sure the server is running.</p></div>');
            }
        });
    }

    // 2. City Autocomplete
    $("#citySearch").on("input", function () {
        const query = $(this).val().trim();
        if (query.length < 2) {
            $("#cityDropdown").empty();
            if (query.length === 0 && selectedCity !== "") {
                selectedCity = "";
                loadWorkshops(); // Reset filter
            }
            return;
        }

        $.ajax({
            url: `${API_BASE}/cities/?search=${encodeURIComponent(query)}`,
            method: "GET",
            xhrFields: {
                withCredentials: true
            },
            success: function (response) {
                const cities = response.results || response;
                const dropdown = $("#cityDropdown");
                dropdown.empty();

                if (cities.length > 0) {
                    cities.forEach(city => {
                        dropdown.append(`<a href="#" class="list-group-item list-group-item-action city-item" data-name="${city.name}">${city.name}</a>`);
                    });
                    dropdown.show();
                } else {
                    dropdown.hide();
                }
            },
            error: function (xhr) {
                console.error("Error loading cities:", xhr);
                // May fail if not logged in (IsAuthenticated)
            }
        });
    });

    // 3. Select City from Dropdown
    $(document).on("click", ".city-item", function (e) {
        e.preventDefault();
        selectedCity = $(this).data("name");
        $("#citySearch").val(selectedCity);
        $("#cityDropdown").empty().hide();
        loadWorkshops();
    });

    // Hide dropdown when clicking outside
    $(document).on("click", function (e) {
        if (!$(e.target).closest("#citySearch").length && !$(e.target).closest("#cityDropdown").length) {
            $("#cityDropdown").hide();
        }
    });

    // 4. Book Workshop
    $(document).on("click", ".btn-book", function() {
        const workshopId = $(this).data("id");
        
        // Simple prompt for seats
        let seats = prompt("How many seats would you like to book?", "1");
        if (seats === null) return; // User cancelled
        
        seats = parseInt(seats);
        if (isNaN(seats) || seats <= 0) {
            alert("Please enter a valid number of seats.");
            return;
        }

        const btn = $(this);
        btn.prop('disabled', true).text('Booking...');

        $.ajax({
            url: `${API_BASE}/bookings/create/`,
            method: "POST",
            xhrFields: { withCredentials: true },
            contentType: "application/json",
            data: JSON.stringify({
                workshop: workshopId,
                seats_booked: seats
            }),
            success: function(response) {
                alert("Booking successful!");
                loadWorkshops(); // refresh the list to show updated seats
            },
            error: function(xhr) {
                btn.prop('disabled', false).text('Book Now');
                let errorMsg = "Failed to book workshop.";
                if (xhr.responseJSON) {
                    if (xhr.responseJSON.message) errorMsg = xhr.responseJSON.message;
                    else if (xhr.responseJSON.error) errorMsg = xhr.responseJSON.error;
                }
                alert(errorMsg);
            }
        });
    });

    // Initial Load
    loadWorkshops();
});