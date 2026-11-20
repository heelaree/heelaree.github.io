(function () {
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Mobile navigation drawer (interruptible, Escape + outside-click + link close)
  var toggle = document.querySelector('.menu-toggle');
  var drawer = document.getElementById('mobile-menu');
  var closeTimer = null;

  function openDrawer() {
    if (!drawer || !toggle) return;
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    drawer.classList.remove('is-closing');
    drawer.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    if (!reducedMotion) {
      drawer.classList.remove('is-open');
      void drawer.offsetWidth;
      drawer.classList.add('is-open');
    }
  }

  function closeDrawer(returnFocus) {
    if (!drawer || !toggle || drawer.hidden) return;
    toggle.setAttribute('aria-expanded', 'false');
    drawer.classList.remove('is-open');
    if (reducedMotion) {
      drawer.hidden = true;
    } else {
      drawer.classList.add('is-closing');
      closeTimer = setTimeout(function () {
        drawer.hidden = true;
        drawer.classList.remove('is-closing');
        closeTimer = null;
      }, 160);
    }
    if (returnFocus) toggle.focus();
  }

  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      if (expanded) closeDrawer(false); else openDrawer();
    });

    drawer.addEventListener('click', function (e) {
      if (e.target && e.target.closest('a')) closeDrawer(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        closeDrawer(true);
      }
    });

    document.addEventListener('click', function (e) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      var header = document.querySelector('.site-nav');
      if (header && !header.contains(e.target)) closeDrawer(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 820 && !drawer.hidden) closeDrawer(false);
    });
  }

  // 2. Reading progress bar (GPU scaleX, rAF-throttled)
  var progressBar = document.querySelector('.scroll-progress-bar');
  var ticking = false;

  function updateProgress() {
    ticking = false;
    if (!progressBar) return;
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
    progressBar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
  }

  if (progressBar) {
    updateProgress();
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateProgress);
      }
    }, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
  }

  // 3. Active section highlight across desktop & mobile nav
  var sectionIds = ['about', 'work', 'projects', 'experience', 'skills', 'education', 'contact'];
  var sections = sectionIds.map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-desktop a[href^="#"], .mobile-drawer a[href^="#"]'));

  function setActive(id) {
    navLinks.forEach(function (link) {
      var match = link.getAttribute('href') === '#' + id;
      link.classList.toggle('is-active', match);
      if (match) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });
    sections.forEach(function (sec) { navObserver.observe(sec); });
  }

  // 4. Purposeful scroll-arrival motion from an already-visible default
  // Elements are NEVER hidden in CSS; only elements genuinely below the fold get a brief arrival nudge.
  if (!reducedMotion && 'IntersectionObserver' in window && Element.prototype.animate) {
    var targets = Array.prototype.slice.call(document.querySelectorAll('[data-animate]'));
    var animated = new WeakSet();
    var batchCount = 0;
    var batchReset = null;

    var motionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || animated.has(entry.target)) return;
        animated.add(entry.target);
        motionObserver.unobserve(entry.target);

        var delay = Math.min(batchCount * 55, 220);
        batchCount += 1;
        clearTimeout(batchReset);
        batchReset = setTimeout(function () { batchCount = 0; }, 120);

        entry.target.animate(
          [
            { opacity: 0.35, transform: 'translateY(14px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ],
          {
            duration: 420,
            delay: delay,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'backwards'
          }
        );
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });

    targets.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top > window.innerHeight * 0.92) {
        motionObserver.observe(el);
      } else {
        animated.add(el);
      }
    });
  }
})();
