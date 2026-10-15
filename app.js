const currentYear = document.querySelector("#current-year");

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

const siteHeader = document.querySelector(".site-header");

if (siteHeader) {
  const updateHeaderHeight = () => {
    document.documentElement.style.setProperty("--header-height", `${siteHeader.getBoundingClientRect().height}px`);
  };

  updateHeaderHeight();
  const headerObserver = new ResizeObserver(updateHeaderHeight);
  headerObserver.observe(siteHeader);
}
