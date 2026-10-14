(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const navLinks = [...document.querySelectorAll('.header nav a[href^="#"]')];
  const sections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  let scheduled = false;
  const updateNavigation = () => {
    scheduled = false;
    const line = Math.min(innerHeight * 0.3, 220);
    let current = null;
    sections.forEach(section => { if (section.getBoundingClientRect().top <= line) current = section; });
    navLinks.forEach(link => {
      if (current && link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateNavigation); }
  }, { passive: true });
  addEventListener('resize', updateNavigation);
  updateNavigation();

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
    document.querySelectorAll('.hero-copy, .portrait, .about, .section-heading, .experience-card, .activity-card, .project, .certificate-card, .contact-section').forEach(el => observer.observe(el));
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
