document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const currentPage = body.dataset.page;

  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === currentPage) link.classList.add("is-active");
  });

  document.querySelectorAll("[data-year]").forEach((year) => {
    year.textContent = new Date().getFullYear();
  });

  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");

  menuToggle?.addEventListener("click", () => {
    const isOpen = body.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      body.classList.remove("menu-open");
      menuToggle?.setAttribute("aria-expanded", "false");
    });
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px" }
  );

  document.querySelectorAll(".reveal").forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
    revealObserver.observe(element);
  });

  const glow = document.querySelector(".cursor-glow");
  if (glow && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", (event) => {
      glow.animate(
        { left: `${event.clientX}px`, top: `${event.clientY}px` },
        { duration: 900, fill: "forwards" }
      );
    });
  }

  document.querySelectorAll(".magnetic").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      if (!window.matchMedia("(pointer: fine)").matches) return;
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = `translate(${x * 0.1}px, ${y * 0.16}px)`;
    });

    button.addEventListener("pointerleave", () => {
      button.style.transform = "";
    });
  });

  const parallax = document.querySelector("[data-parallax]");
  if (parallax && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 12;
      const y = (event.clientY / window.innerHeight - 0.5) * 12;
      parallax.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }

  initImageFallbacks();
  initBrandLogos();
  initMediaPreviews();
  initBeforeAfterSliders();
  initCarousel();
  initFilters();
  initProjectModal();
  initContactForm();

  window.addEventListener("pageshow", initBeforeAfterSliders);
});

function initImageFallbacks() {
  document.querySelectorAll("img[data-fallback-src]").forEach((image) => {
    image.addEventListener(
      "error",
      () => {
        const fallback = image.dataset.fallbackSrc;
        if (!fallback || image.src.endsWith(fallback)) return;
        image.src = fallback;
      },
      { once: true }
    );
  });
}

function initBrandLogos() {
  document.querySelectorAll(".brand-logo").forEach((mark) => {
    const image = mark.querySelector("img");
    if (!image) return;

    const showFallback = () => mark.classList.add("is-missing");
    const showLogo = () => mark.classList.remove("is-missing");

    image.addEventListener("error", showFallback, { once: true });
    image.addEventListener("load", showLogo, { once: true });
    if (image.complete && !image.naturalWidth) showFallback();
  });
}

function initMediaPreviews() {
  document.querySelectorAll(".preview-video").forEach((video) => {
    const trigger = video.closest(".project-media, .work-visual");
    if (!trigger) return;
    const previewTime = 0.12;

    const showPreviewFrame = () => {
      if (!Number.isFinite(video.duration) || video.duration <= previewTime) return;
      try {
        video.currentTime = previewTime;
      } catch (error) {}
    };

    if (video.readyState >= 1) {
      showPreviewFrame();
    } else {
      video.addEventListener("loadedmetadata", showPreviewFrame, { once: true });
    }

    const play = () => {
      video.play().catch(() => {});
    };

    const pause = () => {
      video.pause();
      showPreviewFrame();
    };

    trigger.addEventListener("pointerenter", play);
    trigger.addEventListener("focusin", play);
    trigger.addEventListener("pointerleave", pause);
    trigger.addEventListener("focusout", pause);
  });
}

function initBeforeAfterSliders() {
  document.querySelectorAll("[data-before-after]").forEach((slider) => {
    const handle = slider.querySelector(".before-after-handle");
    if (!handle) return;

    if (slider.beforeAfterRefresh) {
      slider.beforeAfterRefresh();
      return;
    }

    let isDragging = false;
    let value = Number(handle.getAttribute("aria-valuenow")) || 50;

    const setValue = (nextValue) => {
      value = Math.max(0, Math.min(100, nextValue));
      slider.style.setProperty("--position", `${value}%`);
      handle.setAttribute("aria-valuenow", String(Math.round(value)));
    };

    const setFromPointer = (event) => {
      const rect = slider.getBoundingClientRect();
      if (!rect.width) return;
      const nextValue = ((event.clientX - rect.left) / rect.width) * 100;
      setValue(nextValue);
    };

    slider.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      isDragging = true;
      slider.setPointerCapture?.(event.pointerId);
      setFromPointer(event);
    });

    slider.addEventListener("pointermove", (event) => {
      if (!isDragging) return;
      setFromPointer(event);
    });

    const stopDragging = (event) => {
      isDragging = false;
      slider.releasePointerCapture?.(event.pointerId);
    };

    slider.addEventListener("pointerup", stopDragging);
    slider.addEventListener("pointercancel", stopDragging);
    window.addEventListener("pointerup", stopDragging);

    handle.addEventListener("keydown", (event) => {
      const keys = {
        ArrowLeft: -5,
        ArrowDown: -5,
        ArrowRight: 5,
        ArrowUp: 5,
      };

      if (event.key === "Home") {
        event.preventDefault();
        setValue(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        setValue(100);
        return;
      }

      if (keys[event.key] !== undefined) {
        event.preventDefault();
        setValue(value + keys[event.key]);
      }
    });

    slider.querySelectorAll("img").forEach((image) => {
      if (image.complete) return;
      image.addEventListener("load", () => setValue(value), { once: true });
    });

    window.addEventListener("resize", () => setValue(value));
    slider.beforeAfterRefresh = () => {
      isDragging = false;
      setValue(value);
    };
    setValue(value);
  });
}

function initCarousel() {
  const carousel = document.querySelector(".project-carousel");
  const track = document.querySelector(".carousel-track");
  const prev = document.querySelector(".carousel-prev");
  const next = document.querySelector(".carousel-next");

  if (!carousel || !track || !prev || !next) return;

  let position = 0;

  const maxScroll = () => Math.max(0, track.scrollWidth - carousel.clientWidth);
  const step = () => Math.min(carousel.clientWidth * 0.72, 620);

  const render = () => {
    position = Math.max(0, Math.min(position, maxScroll()));
    track.style.transform = `translateX(${-position}px)`;
    prev.disabled = position <= 0;
    next.disabled = position >= maxScroll() - 2;
    prev.style.opacity = prev.disabled ? "0.55" : "1";
    next.style.opacity = next.disabled ? "0.55" : "1";
  };

  const move = (direction) => {
    position += step() * direction;
    render();
  };

  prev.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));

  window.addEventListener("resize", render);
  render();
}

function initFilters() {
  const buttons = document.querySelectorAll(".filter-button");
  const cards = document.querySelectorAll(".work-card");
  if (!buttons.length || !cards.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      const filter = button.dataset.filter;

      cards.forEach((card) => {
        const shouldShow = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !shouldShow);
      });
    });
  });
}

function initProjectModal() {
  const modal = document.querySelector(".project-modal");
  if (!modal) return;

  const title = modal.querySelector("#modal-title");
  const player = modal.querySelector(".modal-player");
  const embed = modal.querySelector(".modal-embed");
  const image = modal.querySelector(".modal-image");
  const openButtons = document.querySelectorAll(".open-project");
  const closeButtons = modal.querySelectorAll("[data-close-modal]");

  const close = () => {
    modal.classList.remove("is-open");
    modal.classList.remove("is-compact");
    modal.classList.remove("is-poster");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (player) {
      player.pause();
      player.removeAttribute("src");
      player.load();
      player.hidden = false;
    }
    if (embed) {
      embed.removeAttribute("src");
      embed.removeAttribute("title");
      embed.hidden = true;
    }
    if (image) {
      image.removeAttribute("src");
      image.removeAttribute("alt");
      image.hidden = true;
    }
  };

  openButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const video = button.dataset.video;
      const youtubeId = button.dataset.youtube;
      const imageSrc = button.dataset.image;
      const projectTitle = button.dataset.project || "Projet";
      title.textContent = projectTitle;
      modal.classList.toggle("is-compact", button.dataset.modalSize === "compact");
      modal.classList.toggle("is-poster", Boolean(imageSrc));
      if (player) {
        player.pause();
        player.removeAttribute("src");
        player.hidden = !video;
      }
      if (image) {
        image.hidden = !imageSrc;
        if (imageSrc) {
          image.src = imageSrc;
          image.alt = button.dataset.project || "Projet";
        } else {
          image.removeAttribute("src");
          image.removeAttribute("alt");
        }
      }
      if (embed) {
        embed.hidden = !youtubeId;
        if (youtubeId) {
          embed.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?autoplay=1&rel=0`;
          embed.title = projectTitle;
        } else {
          embed.removeAttribute("src");
          embed.removeAttribute("title");
        }
      }
      if (player && video) {
        player.src = video;
        player.load();
      }
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      modal.querySelector(".modal-close")?.focus();
      if (video) player?.play().catch(() => {});
    });
  });

  closeButtons.forEach((button) => button.addEventListener("click", close));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) close();
  });
}

function initContactForm() {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const requiredFields = form.querySelectorAll("[required]");
    let valid = true;

    requiredFields.forEach((field) => {
      const row = field.closest(".form-row");
      const isEmailValid =
        field.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
      const isValid = field.type === "checkbox" ? field.checked : field.value.trim() && isEmailValid;

      if (row) row.classList.toggle("has-error", !isValid);
      if (!isValid) valid = false;
    });

    const status = form.querySelector(".form-status");
    if (!valid) {
      status.textContent = "Vérifiez les champs obligatoires avant l’envoi.";
      status.style.color = "#cc3f20";
      return;
    }

    const submit = form.querySelector(".form-submit");
    const originalSubmitHtml = submit?.innerHTML;
    if (submit) {
      submit.disabled = true;
      submit.innerHTML = "Envoi en cours <span>…</span>";
    }

    const formData = new FormData(form);
    formData.set("_url", window.location.href);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Form submission failed");
      }

      if (submit) submit.innerHTML = "Message envoyé <span>✓</span>";
      status.textContent =
        "Merci ! Votre message a bien été envoyé. Pensez à valider l’e-mail d’activation FormSubmit si c’est le premier test.";
      status.style.color = "#387800";
      form.reset();
    } catch (error) {
      if (submit) {
        submit.disabled = false;
        submit.innerHTML = originalSubmitHtml || "Envoyer le message <span>↗</span>";
      }
      status.textContent =
        "L’envoi n’a pas abouti. Vous pouvez réessayer ou écrire directement à paul.fourton.pro@gmail.com.";
      status.style.color = "#cc3f20";
    }
  });
}
