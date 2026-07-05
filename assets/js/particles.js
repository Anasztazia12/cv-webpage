(function () {
    var canvas = document.getElementById('bg-particles');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var width, height, dpr, particles;
    var linkDistance = 70;
    var running = true;

    /* A handful of contained drift zones instead of a full-page field */
    var hotspots = [
        { xRatio: 0.88, yRatio: 0.10, radius: 130, count: 7 },
        { xRatio: 0.06, yRatio: 0.48, radius: 110, count: 6 },
        { xRatio: 0.80, yRatio: 0.82, radius: 120, count: 6 }
    ];

    function getDotRgb() {
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        var varName = isDark ? '--accent-light' : '--accent';
        var hex = getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#0d9488';
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(function (c) { return c + c; }).join('');
        }
        var num = parseInt(hex, 16);
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    }

    function seedParticles() {
        particles = [];
        hotspots.forEach(function (spot) {
            var cx = spot.xRatio * width;
            var cy = spot.yRatio * height;
            for (var i = 0; i < spot.count; i++) {
                var angle = Math.random() * Math.PI * 2;
                var dist = Math.random() * spot.radius;
                particles.push({
                    cx: cx,
                    cy: cy,
                    radius: spot.radius,
                    x: cx + Math.cos(angle) * dist,
                    y: cy + Math.sin(angle) * dist,
                    vx: (Math.random() - 0.5) * 0.2,
                    vy: (Math.random() - 0.5) * 0.2,
                    r: Math.random() < 0.25 ? 3.6 : 2.4,
                    square: Math.random() < 0.2
                });
            }
        });
    }

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        seedParticles();
    }

    function draw() {
        var rgb = getDotRgb();
        ctx.clearRect(0, 0, width, height);

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            var dx = p.x - p.cx;
            var dy = p.y - p.cy;
            if (Math.sqrt(dx * dx + dy * dy) > p.radius) {
                p.vx -= dx * 0.0015;
                p.vy -= dy * 0.0015;
            }

            for (var j = i + 1; j < particles.length; j++) {
                var q = particles[j];
                var ddx = p.x - q.x;
                var ddy = p.y - q.y;
                var dist = Math.sqrt(ddx * ddx + ddy * ddy);
                if (dist < linkDistance) {
                    var alpha = (1 - dist / linkDistance) * 0.18;
                    ctx.strokeStyle = 'rgba(' + rgb.join(',') + ',' + alpha + ')';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.stroke();
                }
            }
        }

        for (var k = 0; k < particles.length; k++) {
            var pt = particles[k];
            if (pt.square) {
                ctx.strokeStyle = 'rgba(' + rgb.join(',') + ',0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(pt.x - pt.r, pt.y - pt.r, pt.r * 2, pt.r * 2);
            } else {
                ctx.fillStyle = 'rgba(' + rgb.join(',') + ',0.45)';
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function loop() {
        draw();
        if (running && !reduceMotion) {
            requestAnimationFrame(loop);
        }
    }

    document.addEventListener('visibilitychange', function () {
        running = !document.hidden;
        if (running && !reduceMotion) requestAnimationFrame(loop);
    });

    document.addEventListener('themechange', function () {
        if (reduceMotion) draw();
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });

    resize();
    loop();
})();
