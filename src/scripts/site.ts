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
          element.style.transitionDelay = `${sequenceDelay + extraDelay}ms`;
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
