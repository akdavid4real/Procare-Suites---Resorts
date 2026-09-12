function initMainUi() {
  const yearElements = document.querySelectorAll("#current-year")
  const currentYear = new Date().getFullYear()

  yearElements.forEach((element) => {
    element.textContent = currentYear
  })

  const mobileMenuButton = document.querySelector(".mobile-menu-button")
  const mobileNav = document.querySelector(".mobile-nav")

  if (mobileMenuButton && mobileNav && mobileMenuButton.dataset.menuInitialized !== "true") {
    mobileMenuButton.dataset.menuInitialized = "true"
    mobileMenuButton.addEventListener("click", () => {
      mobileNav.classList.toggle("active")

      const icon = mobileMenuButton.querySelector("i")
      if (!icon) return
      if (icon.classList.contains("fa-bars")) {
        icon.classList.remove("fa-bars")
        icon.classList.add("fa-times")
      } else {
        icon.classList.remove("fa-times")
        icon.classList.add("fa-bars")
      }
    })
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMainUi, { once: true })
} else {
  initMainUi()
}
