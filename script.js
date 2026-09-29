/* =============================================
   MELVS Portfolio - JavaScript
   3D Effects, Animations, Particles & Interactions
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // Theme Toggle (Dark / Light)
    // ==========================================
    const themeToggle = document.getElementById('themeToggle');
    const rootElement = document.documentElement;
    const sakuraPetals = document.getElementById('sakuraPetals');
    const spiderlilyPetals = document.getElementById('spiderlilyPetals');

    function applyTheme(theme) {
        rootElement.setAttribute('data-theme', theme);
    }

    function createSakuraPetal() {
        const petal = document.createElement('div');
        petal.className = 'sakura-petal';
        const size = Math.random() * 14 + 8;
        petal.style.width = size + 'px';
        petal.style.height = size + 'px';
        petal.style.left = Math.random() * 100 + 'vw';
        petal.style.animationDuration = Math.random() * 6 + 7 + 's';
        petal.style.animationDelay = -(Math.random() * 10) + 's';
        petal.style.opacity = Math.random() * 0.5 + 0.4;
        return petal;
    }

    function enablePetals() {
        if (sakuraPetals.childElementCount === 0) {
            const count = Math.min(28, Math.floor(window.innerWidth / 45));
            for (let i = 0; i < count; i++) {
                sakuraPetals.appendChild(createSakuraPetal());
            }
        }
        sakuraPetals.classList.add('active');
    }

    function disablePetals() {
        sakuraPetals.classList.remove('active');
    }

    function createSpiderPetal() {
        const petal = document.createElement('div');
        petal.className = 'spiderlily-petal';
        const size = Math.random() * 14 + 12;
        petal.style.height = size + 'px';
        petal.style.width = size * 0.36 + 'px';
        petal.style.left = Math.random() * 100 + 'vw';
        petal.style.animationDuration = Math.random() * 7 + 8 + 's';
        petal.style.animationDelay = -(Math.random() * 12) + 's';
        petal.style.opacity = Math.random() * 0.4 + 0.5;
        petal.innerHTML = '<svg viewBox="0 0 20 60" preserveAspectRatio="none">' +
            '<defs><linearGradient id="spiderGrad" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0%" stop-color="#ff6b5e"/>' +
            '<stop offset="60%" stop-color="#d6453c"/>' +
            '<stop offset="100%" stop-color="#a92c24"/>' +
            '</linearGradient></defs>' +
            '<path d="M10 2 C 3 8, 1 20, 4 33 C 6 44, 5 52, 7 58 C 10 54, 11 46, 10 40 C 9 28, 13 14, 10 2 Z" fill="url(#spiderGrad)"/>' +
            '</svg>';
        return petal;
    }

    function enableSpiderLilies() {
        if (spiderlilyPetals.childElementCount === 0) {
            const count = Math.min(24, Math.floor(window.innerWidth / 50));
            for (let i = 0; i < count; i++) {
                spiderlilyPetals.appendChild(createSpiderPetal());
            }
        }
        spiderlilyPetals.classList.add('active');
    }

    function disableSpiderLilies() {
        spiderlilyPetals.classList.remove('active');
    }

    function syncPetals() {
        if (rootElement.getAttribute('data-theme') === 'light') {
            enablePetals();
            disableSpiderLilies();
        } else {
            disablePetals();
            enableSpiderLilies();
        }
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        applyTheme(window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    }
    syncPetals();

    themeToggle.addEventListener('click', () => {
        const current = rootElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        const next = current === 'light' ? 'dark' : 'light';
        applyTheme(next);
        localStorage.setItem('theme', next);
        syncPetals();
    });

    // ==========================================
    // Loading Screen
    // ==========================================
    const loader = document.getElementById('loader');
    
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('hidden');
            document.body.style.overflow = '';
            triggerHeroAnimations();
        }, 2200);
    });

    // Fallback if load event already fired
    if (document.readyState === 'complete') {
        setTimeout(() => {
            loader.classList.add('hidden');
            document.body.style.overflow = '';
            triggerHeroAnimations();
        }, 2200);
    }

    // ==========================================
    // Hero Reveal Animations
    // ==========================================
    function triggerHeroAnimations() {
        const reveals = document.querySelectorAll('.reveal-up');
        reveals.forEach(el => {
            el.classList.add('revealed');
        });
    }

    // ==========================================
    // Particle System
    // ==========================================
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouseX = 0;
    let mouseY = 0;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.speedY = (Math.random() - 0.5) * 0.3;
            this.opacity = Math.random() * 0.5 + 0.1;
            this.color = Math.random() > 0.7 
                ? `rgba(192, 57, 43, ${this.opacity})` 
                : `rgba(168, 154, 142, ${this.opacity * 0.5})`;
            this.pulse = Math.random() * Math.PI * 2;
            this.pulseSpeed = Math.random() * 0.02 + 0.005;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.pulse += this.pulseSpeed;

            // Mouse interaction
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                const force = (150 - dist) / 150;
                this.x -= dx * force * 0.01;
                this.y -= dy * force * 0.01;
            }

            // Wrap around
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;
        }

        draw() {
            const currentSize = this.size + Math.sin(this.pulse) * 0.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(currentSize, 0.1), 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    // Create particles
    const particleCount = Math.min(80, Math.floor(window.innerWidth / 20));
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(192, 57, 43, ${(1 - dist / 120) * 0.08})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animateParticles);
    }

    animateParticles();

    // ==========================================
    // Cursor Glow Effect
    // ==========================================
    const cursorGlow = document.getElementById('cursorGlow');

    // Custom circular cursor
    const cursorDot = document.getElementById('cursorDot');
    const cursorRing = document.getElementById('cursorRing');
    let ringX = 0;
    let ringY = 0;

    function animateCursor() {
        cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
        requestAnimationFrame(animateCursor);
    }

    animateCursor();

    document.querySelectorAll('a, button, input, textarea').forEach(el => {
        el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
    });

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
        
        if (!cursorGlow.classList.contains('active')) {
            cursorGlow.classList.add('active');
        }
    });

    document.addEventListener('mouseleave', () => {
        cursorGlow.classList.remove('active');
    });

    // ==========================================
    // Navigation
    // ==========================================
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const navLinkElements = document.querySelectorAll('.nav-link');

    // Scroll behavior
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;

        // Update active nav link
        updateActiveNav();
    });

    function updateActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const scrollY = window.scrollY + 200;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                navLinkElements.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('data-section') === sectionId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // Mobile toggle
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    // Close mobile nav on link click
    navLinkElements.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });

    // ==========================================
    // 3D Tilt Effect on Cards
    // ==========================================
    const tiltCards = document.querySelectorAll('.card-3d');

    tiltCards.forEach(card => {
        const inner = card.querySelector('.card-inner, .project-inner, .contact-inner');
        if (!inner) return;

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;

            inner.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            inner.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });

    // ==========================================
    // 3D Hero Image Parallax & Mask Reveal
    // ==========================================
    const heroImageContainer = document.getElementById('heroImageContainer');
    const maskHoverZone = document.getElementById('maskHoverZone');

    if (heroImageContainer) {
        const heroVisual = document.getElementById('heroVisual');
        
        if (heroVisual) {
            heroVisual.addEventListener('mousemove', (e) => {
                const rect = heroVisual.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;

                heroImageContainer.style.transform = `
                    perspective(1000px) 
                    rotateY(${x * 15}deg) 
                    rotateX(${-y * 15}deg) 
                    translateZ(20px)
                `;
            });

            heroVisual.addEventListener('mouseleave', () => {
                heroImageContainer.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
            });
        }

        if (maskHoverZone) {
            maskHoverZone.addEventListener('mouseenter', () => {
                heroImageContainer.classList.add('mask-reveal');
            });

            maskHoverZone.addEventListener('mouseleave', () => {
                heroImageContainer.classList.remove('mask-reveal');
            });

            // Touch support for mobile / tablet tap toggle
            maskHoverZone.addEventListener('click', (e) => {
                e.stopPropagation();
                heroImageContainer.classList.toggle('mask-reveal');
            });

            document.addEventListener('click', (e) => {
                if (!heroImageContainer.contains(e.target)) {
                    heroImageContainer.classList.remove('mask-reveal');
                }
            });
        }
    }

    // ==========================================
    // Scroll Reveal Animation
    // ==========================================
    const scrollRevealElements = document.querySelectorAll('.scroll-reveal');

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -80px 0px',
        threshold: 0.1
    };

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                scrollObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    scrollRevealElements.forEach(el => {
        scrollObserver.observe(el);
    });

    // ==========================================
    // Counter Animation
    // ==========================================
    const statNumbers = document.querySelectorAll('.stat-number');

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const count = parseInt(target.getAttribute('data-count'));
                animateCounter(target, 0, count, 2000);
                counterObserver.unobserve(target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(num => counterObserver.observe(num));

    function animateCounter(element, start, end, duration) {
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (end - start) * eased);
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }

    // ==========================================
    // Parallax Scrolling for Background Elements
    // ==========================================
    const torii3d = document.getElementById('torii3d');
    const heroContent = document.getElementById('heroContent');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const speed = 0.3;

        if (torii3d) {
            torii3d.style.transform = `
                translate(-50%, calc(-50% + ${scrollY * speed * 0.5}px)) 
                rotateX(${5 + scrollY * 0.02}deg) 
                rotateY(${-5 + scrollY * 0.01}deg) 
                translateZ(-100px)
            `;
        }

        if (heroContent && scrollY < window.innerHeight) {
            heroContent.style.transform = `translateY(${scrollY * speed * 0.3}px)`;
            heroContent.style.opacity = 1 - scrollY / (window.innerHeight * 0.8);
        }

        // Scroll indicator fade
        const scrollIndicator = document.getElementById('scrollIndicator');
        if (scrollIndicator) {
            scrollIndicator.style.opacity = Math.max(0, 1 - scrollY / 200);
        }
    });

    // ==========================================
    // Smooth Section Transitions
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ==========================================
    // Contact Form
    // ==========================================
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = contactForm.querySelector('button[type="submit"]');
            const originalHTML = btn.innerHTML;

            btn.innerHTML = '<span>SENDING...</span><i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;

            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: new FormData(contactForm),
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    btn.innerHTML = '<span>SENT! ✓</span>';
                    btn.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
                } else {
                    btn.innerHTML = '<span>ERROR - TRY AGAIN</span>';
                    btn.style.background = 'linear-gradient(135deg, #c0392b, #e74c3c)';
                }
            } catch (err) {
                btn.innerHTML = '<span>NETWORK ERROR</span>';
                btn.style.background = 'linear-gradient(135deg, #c0392b, #e74c3c)';
            }

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = '';
                btn.disabled = false;
                contactForm.reset();
            }, 2500);
        });
    }

    // ==========================================
    // Magnetic Buttons Effect
    // ==========================================
    const magneticBtns = document.querySelectorAll('.btn, .social-icon');

    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });

    // ==========================================
    // Typing Effect for Hero Title (subtle)
    // ==========================================
    const titleText = document.querySelector('.title-text');
    if (titleText) {
        const text = titleText.textContent;
        titleText.textContent = '';
        titleText.style.borderRight = '2px solid var(--red-primary)';
        
        let i = 0;
        function typeWriter() {
            if (i < text.length) {
                titleText.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 80);
            } else {
                // Blink cursor then remove
                setTimeout(() => {
                    titleText.style.borderRight = 'none';
                }, 2000);
            }
        }

        // Start typing after hero reveals
        setTimeout(typeWriter, 2800);
    }

    // ==========================================
    // Dynamic Year in Footer
    // ==========================================
    const footerYear = document.querySelector('.footer-bottom p');
    if (footerYear) {
        footerYear.innerHTML = footerYear.innerHTML.replace('2024', new Date().getFullYear());
    }

});
