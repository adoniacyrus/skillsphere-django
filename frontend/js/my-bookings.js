$(document).ready(function () {
    const API_BASE = "http://127.0.0.1:8000/api";

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

    function loadBookings() {
        $("#loadingBookings").show();
        $("#bookingList").find(".booking-card").remove();

        $.ajax({
            url: `${API_BASE}/bookings/my-bookings/`,
            method: "GET",
            xhrFields: { withCredentials: true },
            success: function (response) {
                $("#loadingBookings").hide();
                const bookings = response.results || response;
                const container = $("#bookingList");

                if (!bookings || bookings.length === 0) {
                    container.append('<div class="col-12 booking-card"><p class="text-muted">You have no active bookings.</p></div>');
                    return;
                }

                bookings.forEach(booking => {
                    const dateObj = new Date(booking.booked_at);
                    const card = `
                        <div class="col-md-6 mb-4 booking-card">
                            <div class="card h-100 shadow-sm border-0 border-start border-primary border-4">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <h5 class="card-title text-primary fw-bold mb-0">${booking.workshop_title}</h5>
                                        <span class="badge bg-success">Confirmed</span>
                                    </div>
                                    <p class="card-text text-muted small mb-3">
                                        Booked on: ${dateObj.toLocaleDateString()} at ${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                    <ul class="list-group list-group-flush mb-3">
                                        <li class="list-group-item d-flex justify-content-between">
                                            <span><strong>Seats Booked:</strong></span> 
                                            <span>${booking.seats_booked}</span>
                                        </li>
                                        <li class="list-group-item d-flex justify-content-between">
                                            <span><strong>Total Price:</strong></span> 
                                            <span class="text-success fw-bold">$${booking.total_price}</span>
                                        </li>
                                    </ul>
                                    <button class="btn btn-outline-danger w-100 btn-cancel" data-id="${booking.id}">
                                        Cancel Booking
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    container.append(card);
                });
            },
            error: function (xhr) {
                $("#loadingBookings").hide();
                console.error("Error loading bookings:", xhr);
                
                let errorMsg = "Failed to load bookings. Please make sure you are logged in.";
                if (xhr.status === 403 || xhr.status === 401) {
                    errorMsg = "Unauthorized: You must be logged in as a User to view bookings.";
                }
                
                $("#bookingList").html(`<div class="col-12"><p class="text-danger">${errorMsg}</p></div>`);
            }
        });
    }

    // Cancel Booking
    $(document).on("click", ".btn-cancel", function() {
        const bookingId = $(this).data("id");
        
        if (!confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) {
            return;
        }

        const btn = $(this);
        btn.prop('disabled', true).text('Cancelling...');

        $.ajax({
            url: `${API_BASE}/bookings/${bookingId}/cancel/`,
            method: "DELETE",
            xhrFields: { withCredentials: true },
            success: function(response) {
                alert("Booking cancelled successfully.");
                loadBookings(); // refresh list
            },
            error: function(xhr) {
                btn.prop('disabled', false).text('Cancel Booking');
                let errorMsg = "Failed to cancel booking.";
                if (xhr.responseJSON) {
                    if (xhr.responseJSON.message) errorMsg = xhr.responseJSON.message;
                    else if (xhr.responseJSON.error) errorMsg = xhr.responseJSON.error;
                }
                alert(errorMsg);
            }
        });
    });

    // Initial Load
    loadBookings();
});
