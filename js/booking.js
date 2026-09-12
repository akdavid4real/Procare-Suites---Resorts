document.addEventListener("DOMContentLoaded", () => {
  const checkInInput = document.getElementById("check-in")
  const checkOutInput = document.getElementById("check-out")

  const bookingForm = document.getElementById("booking-form")
  const availableRooms = document.getElementById("available-rooms")
  const bookingSuccess = document.getElementById("booking-success")
  const bookingFormContainer = document.getElementById("booking-form-container")
  const bookingInfo = document.getElementById("booking-info")
  const newBookingBtn = document.getElementById("new-booking-btn")
  const submitButton = document.getElementById("check-availability-btn")

  if (bookingForm) {
    bookingForm.addEventListener("submit", async function bookingSubmitHandler(e) {
      e.preventDefault()

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
        showBookingErrorModal("Please complete all required booking fields.")
        return
      }

      if (checkOut <= checkIn) {
        showBookingErrorModal("Check-out must be after check-in.")
        return
      }

      const originalButtonText = submitButton ? submitButton.textContent : "Check Availability"
      if (submitButton) {
        submitButton.disabled = true
        submitButton.textContent = "Sending Booking Request..."
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

        const result = await response.json().catch(() => null)

        if (!response.ok || !result || !result.success) {
          throw new Error(result && result.message ? result.message : "Booking request failed. Please try again.")
        }

        bookingFormContainer.style.display = "none"
        bookingInfo.style.display = "none"
        availableRooms.style.display = "none"
        bookingSuccess.style.display = "block"
        bookingSuccess.querySelector("h2").textContent = "Booking Request Received!"
        bookingSuccess.querySelector("p").textContent = result.booking_reference
          ? `Thank you. Your booking request ${result.booking_reference} has been received. Please check your email for confirmation.`
          : "Thank you. Your booking request has been received. Please check your email for confirmation."
        bookingSuccess.scrollIntoView({ behavior: "smooth" })
      } catch (err) {
        showBookingErrorModal(err && err.message ? err.message : "An error occurred while submitting your booking. Please try again later.")
      } finally {
        if (submitButton) {
          submitButton.disabled = false
          submitButton.textContent = originalButtonText
        }
      }
    })
  }

  if (newBookingBtn) {
    newBookingBtn.addEventListener("click", () => {
      bookingSuccess.style.display = "none"
      bookingFormContainer.style.display = "block"
      bookingInfo.style.display = "block"
      bookingForm.reset()
      availableRooms.style.display = "none"
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

  const errorModal = document.createElement("div")
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

  function showBookingErrorModal(message) {
    document.getElementById("booking-error-message").textContent = message
    errorModal.style.display = "block"
  }

  document.getElementById("close-booking-error-modal").onclick = function () {
    errorModal.style.display = "none"
  }
})
