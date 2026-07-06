(function () {
    var canvas = document.getElementById('bg-particles');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var width, height, dpr, stars;
    var running = true;
    var startTime = Date.now();

    /* Four constellations that swim slowly across the whole screen (left-right
       and up-down) while their own stars wander a little individually. Each
       one also occasionally drifts inward into a loose cluster before
       re-forming its familiar outline. */
    var constellations = [
        {
            xRatio: 0.5, yRatio: 0.28, scale: 220, driftSpeedX: 0.000028, driftSpeedY: 0.000041, phase: 0,
            points: [
                [0.00, 0.55], [0.05, 0.15], [0.35, 0.05], [0.30, 0.50],
                [0.55, 0.00], [0.78, 0.10], [1.00, 0.30]
            ],
            lines: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5], [5, 6]],
            bright: [0, 6]
        },
        {
            xRatio: 0.5, yRatio: 0.74, scale: 145, driftSpeedX: 0.000033, driftSpeedY: 0.000023, phase: 2,
            points: [
                [0.15, 0.60], [0.10, 0.35], [0.35, 0.25], [0.35, 0.55],
                [0.55, 0.15], [0.78, 0.10], [1.00, 0.00]
            ],
            lines: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5], [5, 6]],
            bright: [0, 6]
        },
        {
            /* Orion: shoulders, three-star belt, and feet */
            xRatio: 0.26, yRatio: 0.5, scale: 190, driftSpeedX: 0.000023, driftSpeedY: 0.000036, phase: 4,
            points: [
                [0.15, 0.05], [0.85, 0.05], [0.35, 0.40], [0.50, 0.45],
                [0.65, 0.50], [0.80, 0.90], [0.10, 0.90]
            ],
            lines: [[0, 2], [1, 4], [2, 3], [3, 4], [4, 5], [2, 6]],
            bright: [0, 1]
        },
        {
            /* Corona Borealis: a gentle semicircular arc of stars, the "crown" */
            xRatio: 0.74, yRatio: 0.5, scale: 190, driftSpeedX: 0.000038, driftSpeedY: 0.000028, phase: 6,
            points: [
                [0.00, 0.60], [0.15, 0.25], [0.35, 0.05], [0.50, 0.00],
                [0.65, 0.05], [0.85, 0.25], [1.00, 0.60]
            ],
            lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
            bright: [3]
        }
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

    function seedStars() {
        stars = constellations.map(function (c) {
            return {
                config: c,
                cx: c.xRatio * width,
                cy: c.yRatio * height,
                ampX: Math.min(width, height) * 0.24,
                ampY: Math.min(width, height) * 0.2,
                wander: c.points.map(function () {
                    return {
                        amp: 3 + Math.random() * 4,
                        fx: 0.00025 + Math.random() * 0.00025,
                        fy: 0.0002 + Math.random() * 0.0003,
                        px: Math.random() * Math.PI * 2,
                        py: Math.random() * Math.PI * 2
                    };
                }),
                twinklePhases: c.points.map(function () { return Math.random() * Math.PI * 2; }),
                sizeJitter: c.points.map(function () { return 0.85 + Math.random() * 0.3; })
            };
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
        seedStars();
    }

    function drawStar(x, y, r, alpha, rgb) {
        var rgba = 'rgba(' + rgb.join(',') + ',' + alpha.toFixed(2) + ')';
        ctx.save();
        ctx.shadowBlur = r * 3.2;
        ctx.shadowColor = rgba;
        ctx.fillStyle = rgba;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function draw() {
        var rgb = getDotRgb();
        var t = Date.now() - startTime;
        ctx.clearRect(0, 0, width, height);

        stars.forEach(function (group) {
            var c = group.config;
            var driftX = Math.sin(t * c.driftSpeedX + c.phase) * group.ampX;
            var driftY = Math.cos(t * c.driftSpeedY + c.phase * 1.3) * group.ampY;
            var originX = group.cx + driftX;
            var originY = group.cy + driftY;

            var abs = c.points.map(function (p, i) {
                var w = group.wander[i];
                var wx = reduceMotion ? 0 : Math.sin(t * w.fx + w.px) * w.amp;
                var wy = reduceMotion ? 0 : Math.cos(t * w.fy + w.py) * w.amp;
                return [
                    originX + (p[0] - 0.5) * c.scale + wx,
                    originY + (p[1] - 0.5) * c.scale + wy
                ];
            });

            ctx.strokeStyle = 'rgba(' + rgb.join(',') + ',0.18)';
            ctx.lineWidth = 1;
            c.lines.forEach(function (pair) {
                var a = abs[pair[0]];
                var b = abs[pair[1]];
                ctx.beginPath();
                ctx.moveTo(a[0], a[1]);
                ctx.lineTo(b[0], b[1]);
                ctx.stroke();
            });

            abs.forEach(function (pos, i) {
                var twinkle = reduceMotion ? 1 : 0.8 + 0.2 * Math.sin(t * 0.0012 + group.twinklePhases[i]);
                var isBright = c.bright.indexOf(i) !== -1;
                var base = (isBright ? 2.6 : 1.7) * group.sizeJitter[i];
                drawStar(pos[0], pos[1], base * twinkle, 0.75 * twinkle, rgb);
            });
        });
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
