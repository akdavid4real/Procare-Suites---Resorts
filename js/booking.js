function initBookingPage() {
  // Avoid attaching duplicate handlers if Next.js replays or re-renders scripts.
  const bookingForm = document.getElementById("booking-form")
  if (!bookingForm || bookingForm.dataset.bookingInitialized === "true") return
  bookingForm.dataset.bookingInitialized = "true"

  const checkInInput = document.getElementById("check-in")
  const checkOutInput = document.getElementById("check-out")
  const checkAvailabilityBtn = document.getElementById("check-availability-btn")
  const availableRooms = document.getElementById("available-rooms")
  const roomList = document.getElementById("room-list")
  const bookingSuccess = document.getElementById("booking-success")
  const bookingFormContainer = document.getElementById("booking-form-container")
  const bookingInfo = document.getElementById("booking-info")
  const newBookingBtn = document.getElementById("new-booking-btn")

  bookingForm.addEventListener("submit", async function bookingSubmitHandler(e) {
    e.preventDefault()
    e.stopImmediatePropagation()

    const guestNameInput = document.getElementById("guest-name")
    const guestEmailInput = document.getElementById("guest-email")
    const guestName = guestNameInput ? guestNameInput.value.trim() : ""
    const guestEmail = guestEmailInput ? guestEmailInput.value.trim() : ""
    const checkIn = checkInInput ? checkInInput.value : ""
    const checkOut = checkOutInput ? checkOutInput.value : ""
    const adults = document.getElementById("adults") ? document.getElementById("adults").value : "1"
    const children = document.getElementById("children") ? document.getElementById("children").value : "0"
    const specialRequests = document.getElementById("special-requests") ? document.getElementById("special-requests").value : ""
    const roomType = document.getElementById("room-type") ? document.getElementById("room-type").value : "any"

    if (!guestName || !guestEmail || !checkIn || !checkOut) {
      alert("Please complete all required booking fields.")
      return
    }

    if (checkOut <= checkIn) {
      alert("Check-out must be after check-in.")
      return
    }

    if (checkAvailabilityBtn) {
      checkAvailabilityBtn.disabled = true
      checkAvailabilityBtn.textContent = "Submitting..."
    }

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: guestName,
          guest_email: guestEmail,
          check_in: checkIn,
          check_out: checkOut,
          room_type: roomType,
          adults,
          children,
          special_requests: specialRequests
        })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Booking failed. Please try again.")
      }

      if (bookingFormContainer) bookingFormContainer.style.display = "none"
      if (bookingInfo) bookingInfo.style.display = "none"
      if (availableRooms) availableRooms.style.display = "none"
      if (bookingSuccess) {
        bookingSuccess.style.display = "block"
        const title = bookingSuccess.querySelector("h2")
        const message = bookingSuccess.querySelector("p")
        if (title) title.textContent = "Booking Request Received!"
        if (message) {
          message.textContent = result.booking_reference
            ? `Your booking request has been received. Reference: ${result.booking_reference}. We sent a confirmation email and the hotel will confirm availability shortly.`
            : "Your booking request has been received. We sent a confirmation email and the hotel will confirm availability shortly."
        }
        bookingSuccess.scrollIntoView({ behavior: "smooth" })
      }
    } catch (err) {
      showBookingErrorModal(err && err.message ? err.message : "An error occurred while submitting your booking. Please try again later.")
    } finally {
      if (checkAvailabilityBtn) {
        checkAvailabilityBtn.disabled = false
        checkAvailabilityBtn.textContent = "Check Availability"
      }
    }
  })

  if (newBookingBtn) {
    newBookingBtn.addEventListener("click", () => {
      if (bookingSuccess) bookingSuccess.style.display = "none"
      if (bookingFormContainer) bookingFormContainer.style.display = "block"
      if (bookingInfo) bookingInfo.style.display = "block"
      bookingForm.reset()
      if (availableRooms) availableRooms.style.display = "none"
    })
  }

  const urlParams = new URLSearchParams(window.location.search)
  const roomParam = urlParams.get("room")
  if (roomParam) {
    const roomTypeSelect = document.getElementById("room-type")
    if (roomTypeSelect) {
      for (let i = 0; i < roomTypeSelect.options.length; i++) {
        if (roomTypeSelect.options[i].value === roomParam) {
          roomTypeSelect.selectedIndex = i
          break
        }
      }
    }
  }

  let errorModal = document.getElementById("booking-error-modal")
  if (!errorModal) {
    errorModal = document.createElement("div")
    errorModal.id = "booking-error-modal"
    errorModal.style.display = "none"
    errorModal.innerHTML = `
      <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;">
        <div style="background:#fff;padding:2rem 2.5rem;border-radius:10px;max-width:90vw;box-shadow:0 2px 16px #0002;text-align:center;">
          <h3 style="color:#e11d48;margin-bottom:1rem;">Booking Error</h3>
          <div id="booking-error-message" style="color:#334155;font-size:1.1rem;margin-bottom:1.5rem;"></div>
          <button id="close-booking-error-modal" style="background:#2563eb;color:#fff;padding:0.5rem 1.5rem;border:none;border-radius:6px;font-size:1rem;cursor:pointer;">OK</button>
        </div>
      </div>
    `
    document.body.appendChild(errorModal)
  }

  function showBookingErrorModal(message) {
    const msg = document.getElementById("booking-error-message")
    if (msg) msg.textContent = message
    errorModal.style.display = "block"
  }

  const closeErrorButton = document.getElementById("close-booking-error-modal")
  if (closeErrorButton && closeErrorButton.dataset.bound !== "true") {
    closeErrorButton.dataset.bound = "true"
    closeErrorButton.addEventListener("click", () => {
      errorModal.style.display = "none"
    })
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBookingPage, { once: true })
} else {
  initBookingPage()
}
