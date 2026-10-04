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

  // Animate entering content without ever hiding it or depending on JavaScript for access.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        observer.unobserve(target);
        if (!reduced.matches && target.animate) target.animate([
          { opacity: 0.35, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' });
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.about, .section-heading, .experience-card, .project, .certificate-card, .contact-section').forEach(el => observer.observe(el));
  }

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
