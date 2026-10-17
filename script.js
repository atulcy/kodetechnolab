(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  $('#yr').textContent = new Date().getFullYear();

  // nav, progress, cursor glow
  const nav = $('#nav'), bar = $('#progress'), glow = $('#cursorGlow');
  addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', scrollY > 20);
    const h = document.documentElement;
    bar.style.width = (scrollY / (h.scrollHeight - h.clientHeight)) * 100 + '%';
  }, { passive: true });
  addEventListener('pointermove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; });

  // mobile menu
  const burger = $('#burger'), menu = $('#menu');
  burger.onclick = () => { burger.classList.toggle('open'); menu.classList.toggle('open'); };
  $$('#menu a').forEach(a => a.onclick = () => { burger.classList.remove('open'); menu.classList.remove('open'); });

  // scroll reveal with stagger
  $$('.grid, .steps, .values').forEach(g => $$('.reveal', g).forEach((el, i) => el.style.setProperty('--d', i * 0.1 + 's')));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
    if (e.target.classList.contains('stats')) countUp();
  }), { threshold: 0.15 });
  $$('.reveal').forEach(el => io.observe(el));

  // counters
  function countUp() {
    $$('[data-count]').forEach(el => {
      const end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1800;
      const tick = t => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      reduce ? el.textContent = end + suf : requestAnimationFrame(tick);
    });
  }

  // typing headline
  const words = ['AI ideas', 'smart agents', 'automation', 'data insights', 'vision systems'];
  const typed = $('#typed');
  if (reduce) typed.textContent = words[0];
  else {
    let w = 0, c = 0, del = false;
    (function loop() {
      const word = words[w];
      typed.textContent = word.slice(0, c);
      let d = del ? 45 : 95;
      if (!del && ++c > word.length) { del = true; d = 1400; }
      else if (del && --c < 0) { del = false; c = 0; w = (w + 1) % words.length; d = 300; }
      setTimeout(loop, d);
    })();
  }

  // card spotlight + 3D tilt
  $$('.tilt').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty('--mx', x + 'px'); card.style.setProperty('--my', y + 'px');
      if (!reduce) card.style.transform = `perspective(700px) rotateX(${(y / r.height - .5) * -8}deg) rotateY(${(x / r.width - .5) * 8}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => card.style.transform = '');
  });

  // work filter by service category
  const chips = $$('#filters .chip'), cases = $$('#cases .case');
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.toggle('on', c === chip));
    cases.forEach(cs => {
      const show = chip.dataset.f === 'all' || cs.dataset.cat === chip.dataset.f;
      cs.classList.toggle('hide', !show);
      cs.classList.remove('pop');
      if (show) { void cs.offsetWidth; cs.classList.add('pop'); }
    });
  }));

  // testimonial rotator
  const qs = $$('#quotes blockquote'); let qi = 0;
  setInterval(() => { qs[qi].classList.remove('on'); qi = (qi + 1) % qs.length; qs[qi].classList.add('on'); }, 4500);

  // hero particle network
  const cv = $('#net'), ctx = cv.getContext('2d');
  let W, H, pts = [], mouse = { x: -1e3, y: -1e3 };
  const size = () => {
    const dpr = devicePixelRatio || 1;
    W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(110, Math.floor(W * H / 14000));
    pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5 }));
  };
  addEventListener('resize', size); size();
  cv.parentElement.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  let visible = true;
  new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(cv);
  (function draw() {
    requestAnimationFrame(draw);
    if (!visible) return;
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      if (!reduce) { p.x += p.vx; p.y += p.vy; }
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 120 && d > 0) { p.x += dx / d * 1.5; p.y += dy / d * 1.5; }
      ctx.fillStyle = 'rgba(0,212,255,.8)';
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, 6.283); ctx.fill();
    }
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d < 130) {
        ctx.strokeStyle = `rgba(124,92,255,${(1 - d / 130) * .45})`;
        ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
      }
    }
  })();

  // contact form (front-end only)
  const form = $('#form'), note = $('#note');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('input,textarea', form).forEach(f => {
      const bad = !f.checkValidity() || !f.value.trim();
      f.classList.toggle('bad', bad); if (bad) ok = false;
    });
    note.className = 'note ' + (ok ? 'ok' : 'err');
    if (!ok) { note.textContent = 'Please fill in all fields with valid details.'; return; }
    const d = Object.fromEntries(new FormData(form));
    // Opens the visitor's mail client. Replace with fetch() to Formspree/your API for real delivery.
    location.href = `mailto:info@kodetechnolab.com?subject=${encodeURIComponent('Inquiry: ' + d.service)}&body=${encodeURIComponent(`Name: ${d.name}\nEmail: ${d.email}\n\n${d.message}`)}`;
    note.textContent = "Thanks! We'll get back to you within one business day.";
    form.reset();
  });
})();
