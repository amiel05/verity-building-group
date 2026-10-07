import { arrowIconMarkup } from "../lib/icons";
const doc = document;
doc.documentElement.classList.add("js-enabled");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduced) {
  doc.documentElement.classList.add("js-motion");
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const sequenceDelay = element.dataset.id
            ? (Number(element.dataset.id) - 1) * 400
            : 0;
          const extraDelay = element.classList.contains("delay-250")
            ? 250
            : element.classList.contains("delay-500")
              ? 500
              : 0;
          const revealDelay = sequenceDelay + extraDelay;
          element.style.transitionDelay = element.classList.contains(
            "contact-action",
          )
            ? `${revealDelay}ms, ${revealDelay}ms, 0ms, 0ms`
            : `${revealDelay}ms`;
          element.classList.add("is-visible");
          observer.unobserve(element);
        }
      }),
    { threshold: 0.08 },
  );
  doc.querySelectorAll(".animated,.entry-content > *").forEach((element) => {
    if (!element.classList.contains("animated"))
      element.classList.add("reveal-item");
    observer.observe(element);
  });
}
const navigationElement = doc.querySelector("#site-navigation");
const toggle = navigationElement?.querySelector("button");
toggle?.addEventListener("click", () => {
  const open = navigationElement!.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(open));
  if (!open) {
    navigationElement!
      .querySelectorAll(".menu-item-has-children")
      .forEach((item) => item.classList.remove("is-submenu-open"));
    navigationElement!
      .querySelectorAll<HTMLButtonElement>(".submenu-toggle")
      .forEach((submenuToggle) => {
        submenuToggle.setAttribute("aria-expanded", "false");
        const icon = submenuToggle.querySelector(".submenu-toggle__icon");
        if (icon) icon.textContent = "+";
      });
  }
});
const submenuToggles = Array.from(
  navigationElement?.querySelectorAll<HTMLButtonElement>(".submenu-toggle") ??
    [],
);
submenuToggles.forEach((submenuToggle) => {
  submenuToggle.addEventListener("click", () => {
    const parent = submenuToggle.closest(".menu-item-has-children");
    const willOpen = !parent?.classList.contains("is-submenu-open");
    submenuToggles.forEach((otherToggle) => {
      if (otherToggle === submenuToggle) return;
      otherToggle
        .closest(".menu-item-has-children")
        ?.classList.remove("is-submenu-open");
      otherToggle.setAttribute("aria-expanded", "false");
      const icon = otherToggle.querySelector(".submenu-toggle__icon");
      if (icon) icon.textContent = "+";
    });
    parent?.classList.toggle("is-submenu-open", willOpen);
    submenuToggle.setAttribute("aria-expanded", String(willOpen));
    const icon = submenuToggle.querySelector(".submenu-toggle__icon");
    if (icon) icon.textContent = willOpen ? "−" : "+";
  });
});
doc.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && navigationElement?.classList.contains("is-open")) {
    submenuToggles.forEach((submenuToggle) => {
      submenuToggle
        .closest(".menu-item-has-children")
        ?.classList.remove("is-submenu-open");
      submenuToggle.setAttribute("aria-expanded", "false");
      const icon = submenuToggle.querySelector(".submenu-toggle__icon");
      if (icon) icon.textContent = "+";
    });
    navigationElement.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.focus();
  }
});

doc
  .querySelectorAll<HTMLElement>(".services-faq, .vbg-faq")
  .forEach((accordion, accordionIndex) => {
    let openItem: HTMLElement | null = null;
    const detailsItems = Array.from(
      accordion.querySelectorAll<HTMLDetailsElement>(":scope > details"),
    );

    detailsItems.forEach((details, itemIndex) => {
      const summary = details.querySelector<HTMLElement>(":scope > summary");
      if (!summary) return;

      const item = doc.createElement("div");
      item.className = `accordion-item ${details.className}`.trim();

      const trigger = doc.createElement("button");
      const panel = doc.createElement("div");
      const panelInner = doc.createElement("div");
      const idBase = `accordion-${accordionIndex + 1}-${itemIndex + 1}`;

      trigger.type = "button";
      trigger.className = "accordion-trigger";
      trigger.id = `${idBase}-trigger`;
      trigger.innerHTML = summary.innerHTML;
      trigger.setAttribute("aria-controls", `${idBase}-panel`);

      panel.className = "accordion-panel";
      panel.id = `${idBase}-panel`;
      panel.setAttribute("role", "region");
      panel.setAttribute("aria-labelledby", trigger.id);
      panelInner.className = "accordion-panel__inner";

      Array.from(details.childNodes).forEach((child) => {
        if (child !== summary) panelInner.append(child);
      });
      panel.append(panelInner);
      item.append(trigger, panel);

      const initiallyOpen = details.open && openItem === null;
      item.classList.toggle("is-open", initiallyOpen);
      trigger.setAttribute("aria-expanded", String(initiallyOpen));
      panel.setAttribute("aria-hidden", String(!initiallyOpen));
      panel.inert = !initiallyOpen;
      if (initiallyOpen) openItem = item;

      const setOpen = (shouldOpen: boolean) => {
        item.classList.toggle("is-open", shouldOpen);
        trigger.setAttribute("aria-expanded", String(shouldOpen));
        panel.setAttribute("aria-hidden", String(!shouldOpen));
        panel.inert = !shouldOpen;
      };

      trigger.addEventListener("click", () => {
        const shouldOpen = !item.classList.contains("is-open");
        if (shouldOpen && openItem && openItem !== item) {
          const openTrigger =
            openItem.querySelector<HTMLButtonElement>(".accordion-trigger");
          const openPanel =
            openItem.querySelector<HTMLElement>(".accordion-panel");
          openItem.classList.remove("is-open");
          openTrigger?.setAttribute("aria-expanded", "false");
          openPanel?.setAttribute("aria-hidden", "true");
          if (openPanel) openPanel.inert = true;
        }
        setOpen(shouldOpen);
        openItem = shouldOpen ? item : null;
      });

      details.replaceWith(item);
    });
  });

const modal = doc.querySelector<HTMLElement>("#verity-project-modal")!;
const dialog = modal.querySelector<HTMLElement>("[role=dialog]")!;
let lastFocus: HTMLElement | null = null;
function closeModal() {
  modal.hidden = true;
  doc.body.classList.remove("verity-project-modal-open");
  lastFocus?.focus();
}
doc.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const link = target.closest("a");
  if (
    link &&
    (link.classList.contains("js-verity-project-modal") ||
      link.textContent?.trim().replace(/\s+/g, " ").trim().toLowerCase() ===
        "start your project")
  ) {
    event.preventDefault();
    lastFocus = link;
    modal.hidden = false;
    doc.body.classList.add("verity-project-modal-open");
    dialog.focus();
  } else if (target.closest("[data-verity-modal-close]")) closeModal();
});
doc.addEventListener("keydown", (event) => {
  if (modal.hidden) return;
  if (event.key === "Escape") closeModal();
  if (event.key === "Tab") {
    const items = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a,button,input:not([type=hidden]),select,textarea,[tabindex="0"]',
      ),
    ).filter((e) => e.getClientRects().length && e.tabIndex >= 0);
    const first = items[0],
      last = items.at(-1);
    if (
      event.shiftKey &&
      (doc.activeElement === first || doc.activeElement === dialog)
    ) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && doc.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
});
doc
  .querySelectorAll<HTMLElement>("[data-gallery-controls]")
  .forEach((controls) => {
    const gallery = controls.nextElementSibling;
    if (!gallery) return;
    controls.addEventListener("click", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
        "button",
      );
      if (!button) return;
      let primary =
        controls.querySelector<HTMLElement>("[data-primary-filter].is-active")
          ?.dataset.primaryFilter || "all";
      let secondary = "all";
      if (button.hasAttribute("data-primary-filter")) {
        primary = button.dataset.primaryFilter!;
        controls
          .querySelectorAll<HTMLElement>("[data-primary-filter]")
          .forEach((b) => {
            b.classList.toggle("is-active", b === button);
            b.setAttribute("aria-pressed", String(b === button));
          });
        controls
          .querySelectorAll<HTMLElement>("[data-subfilters]")
          .forEach((group) => {
            group.hidden = group.dataset.subfilters !== primary;
            group.querySelectorAll("button").forEach((b, i) => {
              b.classList.toggle("is-active", i === 0);
              b.setAttribute("aria-pressed", String(i === 0));
            });
          });
      } else {
        secondary = button.dataset.secondaryFilter || "all";
        button
          .closest("[data-subfilters]")
          ?.querySelectorAll("button")
          .forEach((b) => {
            b.classList.toggle("is-active", b === button);
            b.setAttribute("aria-pressed", String(b === button));
          });
      }
      let count = 0;
      gallery
        .querySelectorAll<HTMLElement>(".vbg-gallery-item")
        .forEach((item) => {
          const categories = (item.dataset.category || "").split(/\s+/);
          item.hidden = !(
            (primary === "all" || categories.includes(primary)) &&
            (secondary === "all" || categories.includes(secondary))
          );
          if (!item.hidden) count++;
        });
      let empty = gallery.querySelector<HTMLElement>(".vbg-gallery-empty");
      if (!empty) {
        empty = doc.createElement("p");
        empty.className = "vbg-gallery-empty";
        empty.textContent = "More images in this category are coming soon.";
        gallery.append(empty);
      }
      empty.hidden = count > 0;
    });
  });
doc.querySelectorAll<HTMLElement>(".work-gallery").forEach((gallery) => {
  const track = gallery.querySelector<HTMLElement>(".swiper-wrapper");
  gallery
    .querySelectorAll<HTMLElement>(".swiper-button-prev,.swiper-button-next")
    .forEach((button) => {
      button.setAttribute("role", "button");
      button.tabIndex = 0;
      button.setAttribute(
        "aria-label",
        button.classList.contains("swiper-button-next")
          ? "Next images"
          : "Previous images",
      );
      button.innerHTML = arrowIconMarkup(
        button.classList.contains("swiper-button-next") ? "right" : "left",
      );
      const advance = () => {
        if (!track) return;
        const slide = track.querySelector<HTMLElement>(".swiper-slide");
        const distance =
          (slide?.getBoundingClientRect().width || 0) +
          (Number.parseFloat(getComputedStyle(track).columnGap) || 0);
        track.scrollBy({
          left:
            distance *
            (button.classList.contains("swiper-button-next") ? 1 : -1),
          behavior: reduced ? "instant" : "smooth",
        });
      };
      button.addEventListener("click", advance);
      button.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          advance();
        }
      });
    });
});
doc.querySelectorAll<HTMLElement>("[data-home-portfolio]").forEach((root) => {
  const photos = Array.from(
    root.querySelectorAll<HTMLAnchorElement>(".home-portfolio-photo"),
  );
  const viewer = root.querySelector<HTMLDialogElement>(
    ".home-portfolio-viewer",
  );
  if (!photos.length || !viewer) return;

  const large = viewer.querySelector<HTMLImageElement>(
    "[data-home-large-photo]",
  )!;
  const caption = viewer.querySelector<HTMLElement>(
    "[data-home-photo-caption]",
  )!;
  const position = viewer.querySelector<HTMLElement>(
    "[data-home-photo-position]",
  )!;
  const play = viewer.querySelector<HTMLButtonElement>(
    "[data-home-slideshow]",
  )!;
  const previous = viewer.querySelector<HTMLButtonElement>(
    "[data-home-previous]",
  )!;
  const next = viewer.querySelector<HTMLButtonElement>("[data-home-next]")!;
  let current = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  let opener: HTMLAnchorElement | undefined;

  previous.innerHTML = arrowIconMarkup("left");
  next.innerHTML = arrowIconMarkup("right");

  const pause = () => {
    clearInterval(timer);
    timer = undefined;
    play.textContent = "Play slideshow";
    play.setAttribute("aria-pressed", "false");
    caption.setAttribute("aria-live", "polite");
  };
  const show = (index: number) => {
    current = (index + photos.length) % photos.length;
    const photo = photos[current].querySelector("img")!;
    large.src = photo.currentSrc || photo.src;
    large.alt = photo.alt;
    caption.textContent = photo.alt;
    position.textContent = `${current + 1} / ${photos.length}`;
  };

  photos.forEach((photo, index) => {
    photo.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      event.preventDefault();
      opener = photo;
      show(index);
      viewer.showModal();
      doc.body.classList.add("home-portfolio-viewer-open");
      viewer
        .querySelector<HTMLButtonElement>("[data-home-close-viewer]")!
        .focus();
    });
  });
  viewer
    .querySelector("[data-home-close-viewer]")!
    .addEventListener("click", () => viewer.close());
  viewer.addEventListener("close", () => {
    pause();
    doc.body.classList.remove("home-portfolio-viewer-open");
    opener?.focus();
  });
  previous.addEventListener("click", () => {
    pause();
    show(current - 1);
  });
  next.addEventListener("click", () => {
    pause();
    show(current + 1);
  });
  viewer.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      pause();
      show(current + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
  play.addEventListener("click", () => {
    if (timer) {
      pause();
      return;
    }
    play.textContent = "Pause slideshow";
    play.setAttribute("aria-pressed", "true");
    caption.setAttribute("aria-live", "off");
    timer = setInterval(() => show(current + 1), 5000);
  });
});
doc.querySelectorAll<HTMLFormElement>("[data-inquiry-form]").forEach((form) => {
  const starter = Array.from(
    form.querySelectorAll<HTMLInputElement>(".starter input"),
  );
  const update = () =>
    form.classList.toggle(
      "is-expanded",
      starter.some((i) => i.value.trim()),
    );
  starter.forEach((i) => i.addEventListener("input", update));
  update();
  form
    .querySelector<HTMLInputElement>("[type=file]")
    ?.addEventListener("change", (event) => {
      const input = event.target as HTMLInputElement;
      form.querySelector("[data-file-list]")!.textContent = Array.from(
        input.files || [],
      )
        .map((f) => f.name)
        .join(", ");
    });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = form.querySelector<HTMLElement>(".form-status")!;
    const button = form.querySelector<HTMLButtonElement>("[type=submit]")!;
    form
      .querySelectorAll("[aria-invalid]")
      .forEach((e) => e.removeAttribute("aria-invalid"));
    form.querySelectorAll(".field-error").forEach((e) => e.remove());
    button.disabled = true;
    status.textContent = "Sending your message…";
    try {
      const response = await fetch("/api/contact/", {
        method: "POST",
        body: new FormData(form),
      });
      const result = await response.json();
      status.textContent = result.message;
      if (result.errors) {
        for (const [name, message] of Object.entries(result.errors)) {
          const input = form.elements.namedItem(name);
          if (input instanceof HTMLElement) {
            input.setAttribute("aria-invalid", "true");
            const error = doc.createElement("p");
            error.className = "field-error";
            error.id = input.id + "-error";
            error.textContent = String(message);
            input.setAttribute("aria-describedby", error.id);
            input.after(error);
          }
        }
      }
      if (response.ok && result.ok) {
        form.reset();
        const template = form.parentElement?.querySelector<HTMLTemplateElement>(
          "[data-inquiry-confirmation]",
        );
        const confirmation =
          template?.content.firstElementChild?.cloneNode(true);
        if (confirmation instanceof HTMLElement) {
          form.replaceWith(confirmation);
          confirmation.focus();
          return;
        }
        update();
      }
      status.focus();
    } catch {
      status.textContent =
        "Your message could not be sent. Please try again later.";
      status.focus();
    } finally {
      button.disabled = false;
    }
  });
});
