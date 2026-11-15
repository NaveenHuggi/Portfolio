/**
 * tactical.js — Cinematic Tactical Soldier & Ballistic Kinetic Canvas
 * Dedicated viewport canvas rendering a tactical operator who aims
 * perpendicular to the screen and fires a high-velocity projectile on scroll.
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
  var lastFireTime = 0;

  // Particle systems
  var particles = [];
  var shockwaves = [];
  var casing = null;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    width = rect.width || (canvas.parentElement ? canvas.parentElement.offsetWidth : 600);
    height = rect.height || (canvas.parentElement ? canvas.parentElement.offsetHeight : 450);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  // Scroll detection centered on .tactical-stage
  function updateScroll() {
    var stage = document.querySelector('.tactical-stage');
    if (!stage) return;

    var rect = stage.getBoundingClientRect();
    var windowH = window.innerHeight;

    // Progression:
    // 0.0 when top of section enters viewport bottom
    // 0.45 - 0.65 when section is right in front of user (aims perpendicular and fires!)
    // 1.0 when scrolling past
    var viewTravel = windowH + rect.height;
    var currentPos = windowH - rect.top;
    var raw = currentPos / viewTravel;

    targetProgress = Math.max(0, Math.min(1.2, raw));

    // Fire trigger when section is in active view
    if (targetProgress >= 0.42 && targetProgress <= 0.85 && !hasFired) {
      triggerFire();
    } else if (targetProgress < 0.25 || targetProgress > 0.95) {
      hasFired = false;
    }

    // Update HUD text if element exists
    var hudText = document.getElementById('hudBearing');
    if (hudText) {
      if (targetProgress < 0.3) {
        hudText.textContent = 'STATUS: STANDBY // WEAPON LOW-READY';
        hudText.style.color = '#38bdf8';
      } else if (targetProgress < 0.45) {
        hudText.textContent = 'STATUS: SIGHT ALIGNING // DIRECT AIM';
        hudText.style.color = '#f59e0b';
      } else if (targetProgress < 0.75) {
        hudText.textContent = 'STATUS: KINETIC DISPATCH // WEAPON FIRED';
        hudText.style.color = '#ef4444';
      } else {
        hudText.textContent = 'STATUS: THREAT NEUTRALIZED // TARGET HIT';
        hudText.style.color = '#10b981';
      }
    }
  }

  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  function triggerFire() {
    hasFired = true;
    lastFireTime = performance.now();

    // Muzzle sparks
    for (var i = 0; i < 35; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 3 + Math.random() * 9;
      particles.push({
        x: 0,
        y: 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 3,
        alpha: 1,
        decay: 0.025 + Math.random() * 0.04,
        color: Math.random() > 0.35 ? '#f59e0b' : '#38bdf8'
      });
    }

    // Shockwaves
    shockwaves.push({
      radius: 6,
      maxRadius: Math.min(width, height) * 0.55,
      alpha: 1,
      speed: 15
    });

    // Ejected brass casing
    casing = {
      x: 32,
      y: 12,
      vx: 4 + Math.random() * 2.5,
      vy: -5 - Math.random() * 2.5,
      rot: 0,
      vrot: 0.3 + Math.random() * 0.25,
      alpha: 1
    };
  }

  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  function draw() {
    scrollProgress = lerp(scrollProgress, targetProgress, 0.12);

    ctx.clearRect(0, 0, width, height);

    var cx = width * 0.5;
    var cy = height * 0.52;

    var scale = Math.min(width / 520, height / 440);
    scale = Math.max(0.75, Math.min(1.2, scale));

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Aim phase: 0 -> 1 as scrollProgress goes from 0.15 to 0.42
    var aimPhase = Math.max(0, Math.min(1, (scrollProgress - 0.15) / 0.27));
    // Fire phase: 0 -> 1 as scrollProgress goes from 0.42 to 0.72
    var firePhase = Math.max(0, Math.min(1, (scrollProgress - 0.42) / 0.3));

    drawGridBackground();
    drawTacticalHUD(aimPhase, firePhase);
    drawSoldier(aimPhase, firePhase);
    drawBulletAndMuzzle(firePhase);
    drawParticles();

    ctx.restore();

    requestAnimationFrame(draw);
  }

  function drawGridBackground() {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
    ctx.lineWidth = 1;
    for (var x = -260; x <= 260; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, -200);
      ctx.lineTo(x, 200);
      ctx.stroke();
    }
    for (var y = -200; y <= 200; y += 40) {
      ctx.beginPath();
      ctx.moveTo(-260, y);
      ctx.lineTo(260, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTacticalHUD(aim, fire) {
    ctx.save();
    var hudColor = aim > 0.85 ? (fire > 0 && fire < 0.75 ? '#ef4444' : '#f59e0b') : '#38bdf8';
    ctx.strokeStyle = hudColor;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.65;

    var r = 48 - aim * 16;
    ctx.beginPath();
    ctx.arc(0, 4, r, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(-r - 18, 4);
    ctx.lineTo(-r + 4, 4);
    ctx.moveTo(r - 4, 4);
    ctx.lineTo(r + 18, 4);
    ctx.moveTo(0, 4 - r - 18);
    ctx.lineTo(0, 4 - r + 4);
    ctx.moveTo(0, 4 + r - 4);
    ctx.lineTo(0, 4 + r + 18);
    ctx.stroke();

    // Corner targeting brackets around reticle
    var brk = r + 22;
    ctx.beginPath();
    // TL
    ctx.moveTo(-brk, -brk + 12); ctx.lineTo(-brk, -brk); ctx.lineTo(-brk + 12, -brk);
    // TR
    ctx.moveTo(brk - 12, -brk); ctx.lineTo(brk, -brk); ctx.lineTo(brk, -brk + 12);
    // BL
    ctx.moveTo(-brk, brk - 12); ctx.lineTo(-brk, brk); ctx.lineTo(-brk + 12, brk);
    // BR
    ctx.moveTo(brk - 12, brk); ctx.lineTo(brk, brk); ctx.lineTo(brk, brk - 12);
    ctx.stroke();

    // HUD Text
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = hudColor;
    ctx.textAlign = 'center';
    ctx.fillText('RANGE: 000.0m // SIGHTLINE: PERPENDICULAR', 0, r + 48);

    ctx.restore();
  }

  function drawSoldier(aim, fire) {
    ctx.save();

    // Color definitions with clear high contrast against dark viewport
    var bodyColor = '#1e2433';
    var armorColor = '#2d374d';
    var highlightEdge = '#475569';
    var rimGlow = 'rgba(56, 189, 248, 0.4)';

    var torsoY = 85 - aim * 10;

    // ── Torso & Shoulders ──
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(-115, torsoY + 140);
    ctx.lineTo(-100, torsoY + 25);
    ctx.lineTo(-65, torsoY - 18);
    ctx.lineTo(65, torsoY - 18);
    ctx.lineTo(100, torsoY + 25);
    ctx.lineTo(115, torsoY + 140);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = highlightEdge;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Tactical Plate Carrier / Armor ──
    ctx.fillStyle = armorColor;
    ctx.beginPath();
    ctx.roundRect(-52, torsoY + 6, 104, 80, 4);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.stroke();

    // MOLLE Webbing
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    for (var m = 0; m < 4; m++) {
      ctx.beginPath();
      ctx.moveTo(-45, torsoY + 18 + m * 17);
      ctx.lineTo(45, torsoY + 18 + m * 17);
      ctx.stroke();
    }

    // ── Head & Ballistic Helmet ──
    var headY = torsoY - 78;
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, headY, 36, Math.PI, 0, false);
    ctx.lineTo(34, headY + 14);
    ctx.lineTo(-34, headY + 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = highlightEdge;
    ctx.stroke();

    // Night-Vision Goggles / Tactical Visor
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(-24, headY + 4, 48, 11, 3);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Dual NVG lens cylinders
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(-11, headY + 9, 4.5, 0, Math.PI * 2);
    ctx.arc(11, headY + 9, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Comms Headset
    ctx.fillStyle = armorColor;
    ctx.fillRect(-40, headY - 6, 8, 22);
    ctx.fillRect(32, headY - 6, 8, 22);

    // ── Arms & Weapon (Aiming Transformation) ──
    ctx.save();

    if (aim < 0.95) {
      // Transitioning from low ready to forward
      var weaponAngle = (1 - aim) * 0.65; // ~37° to 0°
      var offsetX = (1 - aim) * 48;
      var offsetY = (1 - aim) * 36;

      ctx.translate(offsetX, offsetY);
      ctx.rotate(weaponAngle);

      // Carbine profile
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-15, -12, 115, 22);
      ctx.fillRect(100, -7, 65, 12);
      // Magazine
      ctx.beginPath();
      ctx.moveTo(25, 10);
      ctx.lineTo(40, 52);
      ctx.lineTo(24, 55);
      ctx.lineTo(10, 10);
      ctx.closePath();
      ctx.fill();
      // Scope
      ctx.fillRect(12, -26, 44, 14);

      // Hands
      ctx.fillStyle = armorColor;
      ctx.beginPath();
      ctx.arc(82, 5, 12, 0, Math.PI * 2);
      ctx.arc(0, 12, 12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // ── DIRECT PERPENDICULAR AIM (Pointing straight at viewer's screen!) ──
      var recoilY = fire > 0 && fire < 0.28 ? (0.28 - fire) * 18 : 0;
      ctx.translate(0, -recoilY);

      // Arms extending forward directly toward camera
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(-56, 32, 25, 40, -0.2, 0, Math.PI * 2);
      ctx.ellipse(56, 32, 25, 40, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Tactical Gloves
      ctx.fillStyle = armorColor;
      ctx.beginPath();
      ctx.arc(-26, 8, 14, 0, Math.PI * 2);
      ctx.arc(26, 8, 14, 0, Math.PI * 2);
      ctx.fill();

      // Handguard viewed head-on
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-20, -14);
      ctx.lineTo(20, -14);
      ctx.lineTo(26, 4);
      ctx.lineTo(20, 22);
      ctx.lineTo(-20, 22);
      ctx.lineTo(-26, 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();

      // Holographic Sight Housing
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-17, -40, 34, 24);
      ctx.strokeStyle = '#64748b';
      ctx.strokeRect(-17, -40, 34, 24);

      // Red Dot inside sight
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, -28, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // ── BARREL & MUZZLE BRAKE (Directly facing the user) ──
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 4, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();

      // Dark bore opening straight at user
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(0, 4, 7, 0, Math.PI * 2);
      ctx.fill();

      // Muzzle compensator ports
      ctx.fillStyle = '#64748b';
      for (var p = 0; p < 6; p++) {
        var pa = (p * Math.PI) / 3;
        var px = Math.cos(pa) * 10.5;
        var py = 4 + Math.sin(pa) * 10.5;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tactical Laser Sight Beam (Cuts straight out towards viewer)
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(15, -12, 4 + Math.sin(Date.now() * 0.01) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
    ctx.restore();
  }

  function drawBulletAndMuzzle(fire) {
    if (fire <= 0) return;

    ctx.save();

    // ── MUZZLE FLASH BURST ──
    if (fire < 0.42) {
      var flashIntensity = (0.42 - fire) / 0.42;
      var flashScale = 1 + flashIntensity * 2.8;

      var flareGrad = ctx.createRadialGradient(0, 4, 2, 0, 4, 75 * flashScale);
      flareGrad.addColorStop(0, 'rgba(255, 255, 255, ' + flashIntensity + ')');
      flareGrad.addColorStop(0.2, 'rgba(245, 158, 11, ' + (flashIntensity * 0.9) + ')');
      flareGrad.addColorStop(0.6, 'rgba(239, 68, 68, ' + (flashIntensity * 0.6) + ')');
      flareGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = flareGrad;
      ctx.beginPath();
      ctx.arc(0, 4, 80 * flashScale, 0, Math.PI * 2);
      ctx.fill();

      // Starburst spikes
      ctx.fillStyle = 'rgba(255, 255, 255, ' + flashIntensity + ')';
      for (var s = 0; s < 4; s++) {
        var sAngle = (s * Math.PI) / 2 + Math.PI / 4;
        ctx.save();
        ctx.translate(0, 4);
        ctx.rotate(sAngle);
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(0, -65 * flashScale);
        ctx.lineTo(3, 0);
        ctx.lineTo(0, 65 * flashScale);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // ── 3D PERSPECTIVE BULLET (Streaks perpendicular toward user) ──
    if (fire > 0.05 && fire < 0.9) {
      var bulletProg = (fire - 0.05) / 0.85;
      var bulletScale = Math.pow(bulletProg, 2.3) * 16 + 0.4;
      var bulletAlpha = bulletProg > 0.82 ? (1 - bulletProg) / 0.18 : 1;

      ctx.save();
      ctx.translate(0, 4);
      ctx.scale(bulletScale, bulletScale);
      ctx.globalAlpha = bulletAlpha;

      // Tracer Bloom
      var tracerGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 22);
      tracerGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      tracerGrad.addColorStop(0.25, 'rgba(56, 189, 248, 0.9)');
      tracerGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.45)');
      tracerGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

      ctx.fillStyle = tracerGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();

      // Copper jacket bullet base
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 6.2, 0, Math.PI * 2);
      ctx.fill();

      // Intense white-hot tracer ignition core
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Mach shockwave ring around projectile
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // Barrel smoke
    if (fire > 0.3) {
      var smokeAlpha = (1 - (fire - 0.3) / 0.7) * 0.4;
      ctx.fillStyle = 'rgba(148, 163, 184, ' + smokeAlpha + ')';
      ctx.beginPath();
      ctx.arc(-10, -4 - (fire * 22), 14 + fire * 16, 0, Math.PI * 2);
      ctx.arc(12, -10 - (fire * 26), 18 + fire * 22, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

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

      ctx.strokeStyle = 'rgba(56, 189, 248, ' + (wave.alpha * 0.85) + ')';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 4, wave.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (wave.alpha * 0.4) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 4, wave.radius * 0.86, 0, Math.PI * 2);
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
