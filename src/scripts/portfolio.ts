export {};
const root = document.querySelector<HTMLElement>('.portfolio-page');
if (root) {
  const photos = Array.from(root.querySelectorAll<HTMLAnchorElement>('.portfolio-photo'));
  const filters = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-portfolio-filter]'));
  const count = root.querySelector<HTMLElement>('#portfolio-count')!;
  const viewer = root.querySelector<HTMLDialogElement>('.portfolio-viewer')!;
  const large = viewer.querySelector<HTMLImageElement>('[data-large-photo]')!;
  const caption = viewer.querySelector<HTMLElement>('[data-photo-caption]')!;
  const position = viewer.querySelector<HTMLElement>('[data-photo-position]')!;
  const play = viewer.querySelector<HTMLButtonElement>('[data-slideshow]')!;
  let active = photos;
  let current = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  let opener: HTMLAnchorElement | undefined;
  let selected = '';
  function pause() {
    clearInterval(timer);
    timer = undefined;
    play.textContent = 'Play slideshow';
    play.setAttribute('aria-pressed', 'false');
    caption.setAttribute('aria-live', 'polite');
  }
  function show(index: number) {
    current = (index + active.length) % active.length;
    const photo = active[current].querySelector('img')!;
    large.src = photo.src;
    large.alt = photo.alt;
    caption.textContent = photo.alt;
    position.textContent = `${current + 1} / ${active.length}`;
  }
  filters.forEach(button => button.addEventListener('click', () => {
    const requested = button.dataset.portfolioFilter!;
    selected = !requested || selected === requested ? '' : requested;
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter.dataset.portfolioFilter === selected)));
    photos.forEach(photo => { photo.hidden = Boolean(selected && photo.dataset.space !== selected); });
    active = photos.filter(photo => !photo.hidden);
    count.textContent = `${active.length} photos · ${selected || 'Interior & Exterior'}`;
  }));
  photos.forEach(photo => photo.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = photo;
    show(active.indexOf(photo));
    viewer.showModal();
    document.body.classList.add('portfolio-viewer-open');
    viewer.querySelector<HTMLButtonElement>('[data-close-viewer]')!.focus();
  }));
  viewer.querySelector('[data-close-viewer]')!.addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => { pause(); document.body.classList.remove('portfolio-viewer-open'); opener?.focus(); });
  viewer.querySelector('[data-previous]')!.addEventListener('click', () => { pause(); show(current - 1); });
  viewer.querySelector('[data-next]')!.addEventListener('click', () => { pause(); show(current + 1); });
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); pause(); show(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  play.addEventListener('click', () => {
    if (timer) { pause(); return; }
    play.textContent = 'Pause slideshow';
    play.setAttribute('aria-pressed', 'true');
    caption.setAttribute('aria-live', 'off');
    timer = setInterval(() => show(current + 1), 5000);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
}
