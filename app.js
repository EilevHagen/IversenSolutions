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

const contactForm = document.querySelector("#contact-form");

if (contactForm) {
  const phoneInput = contactForm.querySelector("#contact-phone");
  const emailInput = contactForm.querySelector("#contact-email");
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const formContent = contactForm.querySelector("#contact-form-content");
  const statusMessage = contactForm.querySelector("#contact-status");
  const successPanel = contactForm.querySelector("#contact-success");
  const successMessage = contactForm.querySelector("#contact-success-message");
  const successCloseButton = contactForm.querySelector("#contact-success-close");
  const contactMethodMessage = "Oppgi minst én kontaktmåte: telefonnummer eller e-post.";

  const updateContactMethodValidity = () => {
    const hasContactMethod = phoneInput.value.trim().length > 0 || emailInput.value.trim().length > 0;
    phoneInput.setCustomValidity(hasContactMethod ? "" : contactMethodMessage);
  };

  const showStatus = (message, state) => {
    statusMessage.textContent = message;
    statusMessage.dataset.state = state;
  };

  phoneInput.addEventListener("input", updateContactMethodValidity);
  emailInput.addEventListener("input", updateContactMethodValidity);
  updateContactMethodValidity();

  successCloseButton.addEventListener("click", () => {
    successPanel.hidden = true;
    contactForm.classList.remove("is-success");
    formContent.inert = false;
    formContent.removeAttribute("aria-hidden");
    statusMessage.textContent = "";
    delete statusMessage.dataset.state;
    contactForm.querySelector("#contact-name").focus();
  });

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!contactForm.reportValidity()) {
      return;
    }

    const captchaResponse = contactForm.querySelector('textarea[name="h-captcha-response"]');

    if (!captchaResponse?.value) {
      showStatus("Bekreft at du ikke er en robot før du sender meldingen.", "error");
      return;
    }

    contactForm.setAttribute("aria-busy", "true");
    submitButton.disabled = true;
    showStatus("Sender meldingen …", "pending");

    try {
      const formData = Object.fromEntries(new FormData(contactForm));
      const response = await fetch(contactForm.action, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (!response.ok || result.success !== true) {
        const serviceMessage = typeof result.message === "string" ? ` ${result.message}` : "";
        showStatus(`Meldingen kunne ikke sendes.${serviceMessage} Prøv igjen, eller ring 902 63 772.`, "error");
        return;
      }

      contactForm.reset();
      updateContactMethodValidity();
      successMessage.textContent = "Meldingen er sendt. Vi tar kontakt så snart vi kan.";

      try {
        window.hcaptcha?.reset?.();
      } catch {
        successMessage.textContent = "Meldingen er sendt, men CAPTCHA kunne ikke tilbakestilles. Oppdater siden før du sender en ny melding.";
      }

      statusMessage.textContent = "";
      delete statusMessage.dataset.state;
      formContent.inert = true;
      formContent.setAttribute("aria-hidden", "true");
      successPanel.hidden = false;
      contactForm.classList.add("is-success");
      successPanel.focus();
    } catch {
      showStatus("En teknisk feil hindret innsendingen. Sjekk internettilkoblingen og prøv igjen, eller ring 902 63 772.", "error");
    } finally {
      contactForm.setAttribute("aria-busy", "false");
      submitButton.disabled = false;
    }
  });
}
