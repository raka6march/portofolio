(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.header');
  const updateHeaderOffset = () => {
    document.documentElement.style.setProperty('--navigation-offset', `${Math.ceil(header.getBoundingClientRect().height) + 16}px`);
  };
  if (header) {
    updateHeaderOffset();
    addEventListener('resize', updateHeaderOffset);
    if ('ResizeObserver' in window) new ResizeObserver(updateHeaderOffset).observe(header);
  }
  // Keep old single-page links working after the move to separate pages.
  const legacyRoutes = { pengalaman: 'experience.html', pendidikan: 'experience.html', proyek: 'projects.html', sertifikasi: 'certifications.html', kegiatan: 'activities.html', contact: 'contact.html' };
  const file = location.pathname.split('/').pop() || 'index.html';
  const fragment = location.hash.slice(1);
  if (file === 'index.html' && legacyRoutes[fragment]) {
    location.replace(legacyRoutes[fragment] + location.hash);
    return;
  }
  // Native cross-document transitions where supported; a short fallback elsewhere.
  let navigating = false;
  const nativeTransitions = CSS.supports('view-transition-name', 'none') && 'onpagereveal' in window;
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !/(?:\/(?:index|experience|projects|certifications|activities|contact)(?:\.html)?|\/)$/.test(url.pathname) || url.pathname === location.pathname || reduced.matches || nativeTransitions) return;
    event.preventDefault();
    if (navigating) return;
    navigating = true;
    document.body.classList.add('page-leaving');
    setTimeout(() => location.assign(url.href), 160);
  });
  addEventListener('pageshow', () => {
    navigating = false;
    document.body.classList.remove('page-leaving');
  });

  // Reveal each group gradually; content remains available if scripting is unavailable.
  const reveals = new Set();
  const reveal = (target, delay = 0) => {
    if (reduced.matches || !target.animate) return;
    const animation = target.animate([
      { opacity: 0.2, transform: 'translateY(24px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 750, delay, fill: 'backwards', easing: 'cubic-bezier(.2,.7,.2,1)' });
    reveals.add(animation);
    animation.onfinish = () => { reveals.delete(animation); animation.cancel(); };
  };
  reduced.addEventListener('change', () => {
    if (reduced.matches) { reveals.forEach(animation => animation.cancel()); reveals.clear(); }
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      let index = 0;
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        observer.unobserve(target);
        reveal(target, Math.min(index++ * 90, 180));
      });
    }, { threshold: 0.06 });
    document.querySelectorAll('.hero-copy, .portrait, .about, .section-heading, .experience-card, .education-card, .activity-card, .project, .certificate-card, .contact-section').forEach(el => observer.observe(el));
  }
  // Reintroduce the destination when revisiting it from a navigation shortcut.
  addEventListener('hashchange', () => {
    const target = document.getElementById(location.hash.slice(1));
    if (target) reveal(target.querySelector('.section-heading') || target);
  });

  document.querySelectorAll('.project-details, .certificate-details').forEach(details => {
    const summary = details.querySelector('summary');
    let animation = null;
    let expanded = details.open;
    const finish = () => {
      details.open = expanded;
      details.style.height = '';
      details.style.overflow = '';
      if (animation) { animation.onfinish = null; animation.cancel(); animation = null; }
    };
    summary.addEventListener('click', event => {
      // Native summary keyboard activation also produces click; links retain their own behavior.
      if (event.target.closest('a') || reduced.matches || !details.animate) return;
      event.preventDefault();
      const start = details.getBoundingClientRect().height;
      if (animation) { animation.onfinish = null; animation.cancel(); }
      expanded = !expanded;
      details.style.height = '';
      details.open = expanded;
      const end = details.getBoundingClientRect().height;
      details.open = true;
      details.style.height = `${start}px`;
      details.style.overflow = 'hidden';
      animation = details.animate([{ height: `${start}px` }, { height: `${end}px` }], {
        duration: 280, easing: 'cubic-bezier(.2,.7,.2,1)'
      });
      animation.onfinish = finish;
    });
    details.addEventListener('toggle', () => { if (!animation) expanded = details.open; });
    addEventListener('resize', () => { if (animation) finish(); });
    reduced.addEventListener('change', () => { if (animation) finish(); });
  });
})();

(() => {
  const tabs = [...document.querySelectorAll('.preview-tabs [role="tab"]')];
  const selectTab = tab => {
    tabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectTab(tabs[next]); tabs[next].focus(); }
    });
  });
  const filter = document.querySelector('.category-filter');
  if (filter) {
    filter.hidden = false;
    const buttons = [...filter.querySelectorAll('button')];
    const groups = [...document.querySelectorAll('.portfolio-group')];
    const show = category => {
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.category === category)));
      groups.forEach(g => { g.hidden = category !== 'all' && g.getAttribute('aria-labelledby') !== category; });
    };
    buttons.forEach(b => b.addEventListener('click', () => show(b.dataset.category)));
    addEventListener('hashchange', () => show('all'));
  }
})();
