/**
 * tactical.js — Cinematic Tactical Soldier & Ballistic Kinetic Canvas
 * Controls the soldier aiming perpendicular to the screen and firing a bullet on scroll.
 */
(function() {
  'use strict';

  var canvas = document.getElementById('tacticalCanvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  var width = 0;
  var height = 0;
  var scrollProgress = 0;
  var targetProgress = 0;
  var hasFired = false;

  // Particle systems for firing effect
  var particles = [];
  var shockwaves = [];
  var casing = null;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    width = rect.width || window.innerWidth;
    height = rect.height || window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  // Calculate scroll progression through the hero and tactical quote section
  function updateScroll() {
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;
    var hero = document.querySelector('.hero');
    var triggerEnd = hero ? (hero.offsetTop + hero.offsetHeight + 180) : window.innerHeight;
    
    var rawProgress = scrollY / (triggerEnd || 1);
    targetProgress = Math.max(0, Math.min(1.2, rawProgress));

    // Fire detection
    if (targetProgress >= 0.45 && !hasFired) {
      triggerFire();
    } else if (targetProgress < 0.25) {
      hasFired = false;
    }
  }

  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  function triggerFire() {
    hasFired = true;

    // Spawn muzzle sparks
    for (var i = 0; i < 30; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 2 + Math.random() * 8;
      particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2.5,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.04,
        color: Math.random() > 0.4 ? '#f59e0b' : '#38bdf8'
      });
    }

    // Spawn sonic shockwave ring
    shockwaves.push({
      radius: 8,
      maxRadius: Math.min(width, height) * 0.45,
      alpha: 0.9,
      speed: 14
    });

    // Spawn ejected cartridge
    casing = {
      x: 35,
      y: 15,
      vx: 4 + Math.random() * 3,
      vy: -5 - Math.random() * 3,
      rot: 0,
      vrot: 0.35 + Math.random() * 0.3,
      alpha: 1
    };
  }

  // Linear interpolation for smooth aiming
  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  function draw() {
    // Smooth progress interpolation
    scrollProgress = lerp(scrollProgress, targetProgress, 0.1);

    ctx.clearRect(0, 0, width, height);

    var cx = width > 900 ? width * 0.72 : width * 0.5;
    var cy = height * 0.52;

    // Responsive scaling
    var scale = Math.min(width, height) / 800;
    scale = Math.max(0.65, Math.min(1.25, scale));

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    var aimPhase = Math.min(1, scrollProgress / 0.45);
    var firePhase = Math.max(0, Math.min(1, (scrollProgress - 0.45) / 0.3));

    drawTacticalHUD(aimPhase, firePhase);
    drawSoldier(aimPhase, firePhase);
    drawBulletAndMuzzle(firePhase);
    drawParticles();

    ctx.restore();

    requestAnimationFrame(draw);
  }

  // Draw tactical grid & telemetry HUD
  function drawTacticalHUD(aim, fire) {
    ctx.save();
    ctx.strokeStyle = 'oklch(60% 0.13 257 / 0.25)';
    ctx.lineWidth = 1;
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = 'oklch(70% 0.085 256 / 0.7)';

    // Circular targeting reticle
    var reticleRadius = 45 - aim * 15;
    ctx.beginPath();
    ctx.arc(0, 0, reticleRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(-reticleRadius - 15, 0);
    ctx.lineTo(-reticleRadius + 5, 0);
    ctx.moveTo(reticleRadius - 5, 0);
    ctx.lineTo(reticleRadius + 15, 0);
    ctx.moveTo(0, -reticleRadius - 15);
    ctx.lineTo(0, -reticleRadius + 5);
    ctx.moveTo(0, reticleRadius - 5);
    ctx.lineTo(0, reticleRadius + 15);
    ctx.stroke();

    // Rangefinder ticks
    for (var a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      var tx1 = Math.cos(a) * (reticleRadius + 22);
      var ty1 = Math.sin(a) * (reticleRadius + 22);
      var tx2 = Math.cos(a) * (reticleRadius + 28);
      var ty2 = Math.sin(a) * (reticleRadius + 28);
      ctx.beginPath();
      ctx.moveTo(tx1, ty1);
      ctx.lineTo(tx2, ty2);
      ctx.stroke();
    }

    // Dynamic HUD Status readout
    var statusText = 'STATE: STANDBY // SCANNING';
    var statusColor = 'oklch(60% 0.13 257 / 0.8)';
    if (aim > 0.85 && fire === 0) {
      statusText = 'TARGET LOCKED // ZERO BEARING';
      statusColor = '#f59e0b';
    } else if (fire > 0 && fire < 0.8) {
      statusText = 'ENGAGING // KINETIC FIRE';
      statusColor = '#ef4444';
    } else if (fire >= 0.8) {
      statusText = 'IMPACT LOGGED // THREAT NEUTRALIZED';
      statusColor = '#10b981';
    }

    ctx.fillStyle = statusColor;
    ctx.textAlign = 'center';
    ctx.fillText(statusText, 0, reticleRadius + 55);

    // Angle and elevation readout
    ctx.fillStyle = 'oklch(50% 0.018 258 / 0.6)';
    ctx.font = '9px "JetBrains Mono", monospace';
    var angleDeg = (aim * 90).toFixed(1);
    ctx.fillText('AZIMUTH: 000.0° · PITCH: ' + angleDeg + '° · ELEV: +0.02', 0, -reticleRadius - 28);

    ctx.restore();
  }

  // Draw tactical operator silhouette & weapon
  function drawSoldier(aim, fire) {
    ctx.save();

    var bodyColor = 'oklch(22% 0.028 262)';
    var armorPlate = 'oklch(28% 0.03 260)';
    var rimLight = 'oklch(52% 0.19 258 / 0.5)';
    var visorGlow = 'oklch(76% 0.13 254)';

    var torsoY = 95 - aim * 8;

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(-110, torsoY + 140);
    ctx.lineTo(-95, torsoY + 30);
    ctx.lineTo(-65, torsoY - 15);
    ctx.lineTo(65, torsoY - 15);
    ctx.lineTo(95, torsoY + 30);
    ctx.lineTo(110, torsoY + 140);
    ctx.closePath();
    ctx.fill();

    // Chest rig / Tactical Plate Carrier
    ctx.fillStyle = armorPlate;
    ctx.beginPath();
    ctx.rect(-50, torsoY + 10, 100, 75);
    ctx.fill();
    ctx.strokeStyle = 'oklch(36% 0.022 260)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // MOLLE Webbing stripes on tactical vest
    ctx.strokeStyle = 'oklch(33% 0.02 260 / 0.8)';
    for (var row = 0; row < 4; row++) {
      ctx.beginPath();
      ctx.moveTo(-44, torsoY + 22 + row * 16);
      ctx.lineTo(44, torsoY + 22 + row * 16);
      ctx.stroke();
    }

    // Head, Helmet & Night Vision Goggles / Visor
    var headY = torsoY - 75;
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, headY, 36, Math.PI, 0, false);
    ctx.lineTo(34, headY + 12);
    ctx.lineTo(-34, headY + 12);
    ctx.closePath();
    ctx.fill();

    // Tactical Visor / Goggles (glowing cyan/cobalt line)
    ctx.fillStyle = visorGlow;
    ctx.shadowColor = visorGlow;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(-22, headY + 4, 44, 10, 3);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Helmet rails & Comms Headset
    ctx.fillStyle = armorPlate;
    ctx.fillRect(-38, headY - 4, 8, 20);
    ctx.fillRect(30, headY - 4, 8, 20);

    // ── Weapon & Arms Aiming Transformation ──
    ctx.save();

    if (aim < 0.95) {
      // Transitioning from low ready to forward
      var weaponAngle = (1 - aim) * 0.65;
      var weaponOffsetX = (1 - aim) * 45;
      var weaponOffsetY = (1 - aim) * 35;

      ctx.translate(weaponOffsetX, weaponOffsetY);
      ctx.rotate(weaponAngle);

      ctx.fillStyle = 'oklch(16% 0.02 260)';
      ctx.fillRect(-15, -12, 110, 22);
      ctx.fillRect(95, -7, 65, 12);
      ctx.beginPath();
      ctx.moveTo(25, 10);
      ctx.lineTo(40, 52);
      ctx.lineTo(24, 55);
      ctx.lineTo(10, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(10, -26, 42, 14);

      ctx.fillStyle = armorPlate;
      ctx.beginPath();
      ctx.arc(80, 5, 11, 0, Math.PI * 2);
      ctx.arc(0, 12, 11, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // ── PERPENDICULAR SIGHTLINE (Directly facing the user/screen) ──
      var recoilY = fire > 0 && fire < 0.25 ? (0.25 - fire) * 16 : 0;
      ctx.translate(0, -recoilY);

      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(-55, 30, 24, 38, -0.2, 0, Math.PI * 2);
      ctx.ellipse(55, 30, 24, 38, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = armorPlate;
      ctx.beginPath();
      ctx.arc(-26, 8, 14, 0, Math.PI * 2);
      ctx.arc(26, 8, 14, 0, Math.PI * 2);
      ctx.fill();

      // Handguard viewed head-on
      ctx.fillStyle = 'oklch(14% 0.02 260)';
      ctx.beginPath();
      ctx.moveTo(-18, -14);
      ctx.lineTo(18, -14);
      ctx.lineTo(24, 4);
      ctx.lineTo(18, 22);
      ctx.lineTo(-18, 22);
      ctx.lineTo(-24, 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rimLight;
      ctx.stroke();

      // Optical Sight Housing
      ctx.fillStyle = 'oklch(18% 0.025 260)';
      ctx.fillRect(-16, -38, 32, 22);
      ctx.strokeStyle = 'oklch(36% 0.022 260)';
      ctx.strokeRect(-16, -38, 32, 22);

      // Optic Lens
      ctx.fillStyle = 'oklch(20% 0.04 250)';
      ctx.beginPath();
      ctx.arc(0, -27, 8, 0, Math.PI * 2);
      ctx.fill();

      // Red Aiming Dot
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, -27, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Barrel & Suppressor cap
      ctx.fillStyle = 'oklch(12% 0.01 260)';
      ctx.beginPath();
      ctx.arc(0, 4, 13, 0, Math.PI * 2);
      ctx.fill();

      // Bore opening directly facing viewer
      ctx.fillStyle = '#05070a';
      ctx.beginPath();
      ctx.arc(0, 4, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Muzzle gas ports
      ctx.fillStyle = 'oklch(30% 0.02 260)';
      for (var p = 0; p < 6; p++) {
        var pa = (p * Math.PI) / 3;
        var px = Math.cos(pa) * 9.5;
        var py = 4 + Math.sin(pa) * 9.5;
        ctx.beginPath();
        ctx.arc(px, py, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Laser Sight Beam
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.arc(14, -12, 4 + Math.sin(Date.now() * 0.008) * 1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  }

  // Draw muzzle flash, projectile bullet, and shockwave
  function drawBulletAndMuzzle(fire) {
    if (fire <= 0) return;

    ctx.save();

    // ── MUZZLE FLASH ──
    if (fire < 0.4) {
      var flashIntensity = (0.4 - fire) / 0.4;
      var flashScale = 1 + flashIntensity * 2.2;

      var flareGrad = ctx.createRadialGradient(0, 4, 2, 0, 4, 65 * flashScale);
      flareGrad.addColorStop(0, 'rgba(255, 255, 255, ' + (flashIntensity * 0.95) + ')');
      flareGrad.addColorStop(0.2, 'rgba(245, 158, 11, ' + (flashIntensity * 0.85) + ')');
      flareGrad.addColorStop(0.6, 'rgba(239, 68, 68, ' + (flashIntensity * 0.5) + ')');
      flareGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = flareGrad;
      ctx.beginPath();
      ctx.arc(0, 4, 70 * flashScale, 0, Math.PI * 2);
      ctx.fill();

      // Multi-pointed star spikes
      ctx.fillStyle = 'rgba(255, 250, 220, ' + flashIntensity + ')';
      for (var s = 0; s < 4; s++) {
        var sAngle = (s * Math.PI) / 2 + Math.PI / 4;
        ctx.save();
        ctx.translate(0, 4);
        ctx.rotate(sAngle);
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(0, -55 * flashScale);
        ctx.lineTo(3, 0);
        ctx.lineTo(0, 55 * flashScale);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // ── BULLET TRAVELING PERPENDICULAR TO SCREEN (3D Perspective Zoom) ──
    if (fire > 0.05 && fire < 0.85) {
      var bulletProgress = (fire - 0.05) / 0.8;
      var bulletScale = Math.pow(bulletProgress, 2.2) * 14 + 0.3;
      var bulletAlpha = bulletProgress > 0.8 ? (1 - bulletProgress) / 0.2 : 1;

      ctx.save();
      ctx.translate(0, 4);
      ctx.scale(bulletScale, bulletScale);
      ctx.globalAlpha = bulletAlpha;

      // Tracer Trail
      var tracerGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 18);
      tracerGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      tracerGrad.addColorStop(0.25, 'rgba(56, 189, 248, 0.9)');
      tracerGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.4)');
      tracerGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

      ctx.fillStyle = tracerGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();

      // Bullet Base
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      // Tracer Core
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Mach Shockwave Cone
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // Residual smoke puffs
    if (fire > 0.3) {
      var smokeAlpha = (1 - (fire - 0.3) / 0.7) * 0.4;
      ctx.fillStyle = 'rgba(160, 175, 200, ' + smokeAlpha + ')';
      ctx.beginPath();
      ctx.arc(-8, -4 - (fire * 20), 12 + fire * 15, 0, Math.PI * 2);
      ctx.arc(10, -10 - (fire * 25), 16 + fire * 20, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw expanding shockwaves and sparks
  function drawParticles() {
    ctx.save();

    // Shockwaves
    for (var w = shockwaves.length - 1; w >= 0; w--) {
      var wave = shockwaves[w];
      wave.radius += wave.speed;
      wave.alpha -= 0.035;

      if (wave.alpha <= 0 || wave.radius >= wave.maxRadius) {
        shockwaves.splice(w, 1);
        continue;
      }

      ctx.strokeStyle = 'rgba(56, 189, 248, ' + (wave.alpha * 0.75) + ')';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 4, wave.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (wave.alpha * 0.4) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 4, wave.radius * 0.88, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Sparks
    for (var p = particles.length - 1; p >= 0; p--) {
      var pt = particles[p];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha -= pt.decay;

      if (pt.alpha <= 0) {
        particles.splice(p, 1);
        continue;
      }

      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.alpha;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y + 4, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shell casing
    if (casing && casing.alpha > 0) {
      casing.x += casing.vx;
      casing.y += casing.vy;
      casing.vy += 0.45;
      casing.rot += casing.vrot;
      casing.alpha -= 0.015;

      ctx.save();
      ctx.translate(casing.x, casing.y);
      ctx.rotate(casing.rot);
      ctx.globalAlpha = Math.max(0, casing.alpha);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-6, -2, 12, 4.5);
      ctx.strokeStyle = '#fef3c7';
      ctx.strokeRect(-6, -2, 12, 4.5);
      ctx.restore();
    }

    ctx.restore();
  }

  // Interactive fire trigger on click/tap
  canvas.addEventListener('click', function() {
    triggerFire();
  });

  requestAnimationFrame(draw);
})();
