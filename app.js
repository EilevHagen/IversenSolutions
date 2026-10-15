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
  const captchaOverlay = contactForm.querySelector("#contact-captcha-overlay");
  const captchaStatus = contactForm.querySelector("#contact-captcha-status");
  const captchaCancelButton = contactForm.querySelector("#contact-captcha-cancel");
  const statusMessage = contactForm.querySelector("#contact-status");
  const successPanel = contactForm.querySelector("#contact-success");
  const successMessage = contactForm.querySelector("#contact-success-message");
  const successCloseButton = contactForm.querySelector("#contact-success-close");
  const contactMethodMessage = "Oppgi minst én kontaktmåte: telefonnummer eller e-post.";
  let captchaToken = "";
  let isCaptchaOpen = false;
  let isSubmitting = false;

  const updateContactMethodValidity = () => {
    const hasContactMethod = phoneInput.value.trim().length > 0 || emailInput.value.trim().length > 0;
    phoneInput.setCustomValidity(hasContactMethod ? "" : contactMethodMessage);
  };

  const showStatus = (message, state) => {
    statusMessage.textContent = message;
    statusMessage.dataset.state = state;
  };

  const setCaptchaOverlayOpen = (isOpen) => {
    isCaptchaOpen = isOpen;
    captchaOverlay.setAttribute("aria-hidden", String(!isOpen));
    captchaOverlay.inert = !isOpen;
    formContent.inert = isOpen;
    formContent.setAttribute("aria-hidden", String(isOpen));
    captchaStatus.textContent = "";

    if (isOpen) {
      captchaCancelButton.focus();
    }
  };

  const submitContactMessage = async (token) => {
    if (isSubmitting) {
      return;
    }

    isSubmitting = true;
    contactForm.setAttribute("aria-busy", "true");
    submitButton.disabled = true;
    showStatus("Sender meldingen …", "pending");

    let submissionSucceeded = false;

    try {
      const formData = Object.fromEntries(new FormData(contactForm));
      formData["h-captcha-response"] = token;
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

      submissionSucceeded = true;
      contactForm.reset();
      captchaToken = "";
      updateContactMethodValidity();
      successMessage.textContent = "Meldingen er sendt. Vi tar kontakt så snart vi kan.";
      window.hcaptcha?.reset?.();

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
      if (!submissionSucceeded) {
        captchaToken = "";
        window.hcaptcha?.reset?.();
      }

      isSubmitting = false;
      contactForm.setAttribute("aria-busy", "false");
      submitButton.disabled = false;
    }
  };

  phoneInput.addEventListener("input", updateContactMethodValidity);
  emailInput.addEventListener("input", updateContactMethodValidity);
  updateContactMethodValidity();

  captchaCancelButton.addEventListener("click", () => {
    setCaptchaOverlayOpen(false);
    captchaToken = "";
    window.hcaptcha?.reset?.();
    submitButton.focus();
  });

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

    if (!captchaToken) {
      setCaptchaOverlayOpen(true);
      return;
    }

    await submitContactMessage(captchaToken);
  });

  window.onContactCaptchaSolved = async (token) => {
    if (!isCaptchaOpen || !token || isSubmitting) {
      return;
    }

    captchaToken = token;
    setCaptchaOverlayOpen(false);
    await submitContactMessage(token);
  };

  window.onContactCaptchaExpired = () => {
    captchaToken = "";

    if (isCaptchaOpen) {
      captchaStatus.textContent = "Bekreftelsen har utløpt. Prøv igjen.";
    }
  };

  window.onContactCaptchaError = () => {
    captchaToken = "";

    if (isCaptchaOpen) {
      captchaStatus.textContent = "Bekreftelsen kunne ikke lastes. Oppdater siden og prøv igjen.";
    }
  };
}
