/**
 * tactical.js — Precision Tactical Defense Operator & Interactive Optic Tracking
 * Smoothly transitions from low-ready to direct perpendicular aim on scroll.
 * Interactive cursor tracking: optic reticle, Mil-Spec HUD telemetry, and targeting laser.
 * Zero firing / ballistics — pure disciplined tactical stealth & precision engineering.
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

  // Interactive mouse tracking
  var mouse = { x: 0, y: 0, active: false };
  var currentAimOffset = { x: 0, y: 0 };

  // Ambient particles (tactical atmospheric dust motes)
  var ambientMotes = [];
  var radarPulse = { r: 0, maxR: 320, alpha: 0.6 };

  function initAmbient() {
    ambientMotes = [];
    for (var i = 0; i < 28; i++) {
      ambientMotes.push({
        x: (Math.random() - 0.5) * 560,
        y: (Math.random() - 0.5) * 440,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.15 - Math.random() * 0.3,
        size: 1 + Math.random() * 1.8,
        alpha: 0.15 + Math.random() * 0.45
      });
    }
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    width = rect.width || (canvas.parentElement ? canvas.parentElement.offsetWidth : 600);
    height = rect.height || (canvas.parentElement ? canvas.parentElement.offsetHeight : 450);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    radarPulse.maxR = Math.max(width, height) * 0.65;
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  initAmbient();

  // Scroll detection centered on .tactical-stage
  function updateScroll() {
    var stage = document.querySelector('.tactical-stage');
    if (!stage) return;

    var rect = stage.getBoundingClientRect();
    var windowH = window.innerHeight;

    var viewTravel = windowH + rect.height;
    var currentPos = windowH - rect.top;
    var raw = currentPos / viewTravel;

    targetProgress = Math.max(0, Math.min(1.2, raw));
  }

  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  // Mouse / cursor tracking on canvas & viewport
  function onMouseMove(e) {
    var rect = canvas.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;

    // Normalize coordinates (-1 to 1) relative to canvas center
    var nx = (e.clientX - cx) / (rect.width / 2);
    var ny = (e.clientY - cy) / (rect.height / 2);

    mouse.x = Math.max(-1.2, Math.min(1.2, nx));
    mouse.y = Math.max(-1.2, Math.min(1.2, ny));
    mouse.active = true;
  }

  function onMouseLeave() {
    mouse.active = false;
  }

  canvas.addEventListener('mousemove', onMouseMove, { passive: true });
  canvas.addEventListener('mouseleave', onMouseLeave, { passive: true });
  var viewport = document.getElementById('tacticalViewport');
  if (viewport) {
    viewport.addEventListener('mousemove', onMouseMove, { passive: true });
    viewport.addEventListener('mouseleave', onMouseLeave, { passive: true });
  }

  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  var isVisible = true;
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      isVisible = entries[0].isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(canvas);
  }

  function draw() {
    if (!isVisible) {
      requestAnimationFrame(draw);
      return;
    }

    scrollProgress = lerp(scrollProgress, targetProgress, 0.1);

    // Aim phase: 0 -> 1 as user reaches and engages with tactical stage
    var aimPhase = Math.max(0, Math.min(1, (scrollProgress - 0.16) / 0.28));

    // Smoothly track mouse aim offset when aim is engaged
    var targetAimX = mouse.active ? mouse.x * 38 : 0;
    var targetAimY = mouse.active ? mouse.y * 24 : 0;
    currentAimOffset.x = lerp(currentAimOffset.x, targetAimX, 0.08);
    currentAimOffset.y = lerp(currentAimOffset.y, targetAimY, 0.08);

    ctx.clearRect(0, 0, width, height);

    var cx = width * 0.5;
    var cy = height * 0.52;

    var scale = Math.min(width / 520, height / 440);
    scale = Math.max(0.75, Math.min(1.2, scale));

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Subtle tactical breathing oscillation
    var breath = Math.sin(Date.now() * 0.0022) * 2;

    drawGridBackground();
    drawAmbientMotes();
    drawSoldier(aimPhase, breath, currentAimOffset);
    drawTacticalHUD(aimPhase, currentAimOffset);

    ctx.restore();

    requestAnimationFrame(draw);
  }

  function drawGridBackground() {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.lineWidth = 1;

    // Mil-Spec Tactical Coordinate Grid
    for (var x = -280; x <= 280; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, -210);
      ctx.lineTo(x, 210);
      ctx.stroke();
    }
    for (var y = -210; y <= 210; y += 40) {
      ctx.beginPath();
      ctx.moveTo(-280, y);
      ctx.lineTo(280, y);
      ctx.stroke();
    }

    // Expanding Radar Sonar Pulse
    radarPulse.r += 0.8;
    if (radarPulse.r > radarPulse.maxR) radarPulse.r = 0;
    var pulseAlpha = (1 - radarPulse.r / radarPulse.maxR) * 0.25;

    ctx.strokeStyle = 'rgba(56, 189, 248, ' + pulseAlpha + ')';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 4, radarPulse.r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  function drawAmbientMotes() {
    ctx.save();
    for (var i = 0; i < ambientMotes.length; i++) {
      var m = ambientMotes[i];
      m.x += m.vx;
      m.y += m.vy;

      if (m.y < -220) m.y = 220;
      if (m.x < -280) m.x = 280;
      if (m.x > 280) m.x = -280;

      ctx.fillStyle = 'rgba(56, 189, 248, ' + m.alpha + ')';
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSoldier(aim, breath, aimOffset) {
    ctx.save();

    var bodyColor = '#1e2433';
    var armorColor = '#2d374d';
    var highlightEdge = '#475569';
    var rimGlow = '#38bdf8';

    var torsoY = 82 - aim * 10 + breath;
    var mouseTurn = aimOffset.x * 0.003;

    // Apply subtle torso parallax tracking with mouse
    ctx.translate(aimOffset.x * 0.15, aimOffset.y * 0.1);
    ctx.rotate(mouseTurn);

    // ── Torso & Shoulders ──
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(-115, torsoY + 145);
    ctx.lineTo(-102, torsoY + 25);
    ctx.lineTo(-65, torsoY - 18);
    ctx.lineTo(65, torsoY - 18);
    ctx.lineTo(102, torsoY + 25);
    ctx.lineTo(115, torsoY + 145);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = highlightEdge;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Tactical Plate Carrier ──
    ctx.fillStyle = armorColor;
    ctx.beginPath();
    ctx.roundRect(-52, torsoY + 6, 104, 82, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // MOLLE Webbing Loops
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    for (var m = 0; m < 4; m++) {
      ctx.beginPath();
      ctx.moveTo(-44, torsoY + 18 + m * 17);
      ctx.lineTo(44, torsoY + 18 + m * 17);
      ctx.stroke();
    }

    // ── Head & Ballistic Combat Helmet ──
    var headY = torsoY - 78;
    ctx.save();
    ctx.translate(aimOffset.x * 0.12, 0);

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, headY, 36, Math.PI, 0, false);
    ctx.lineTo(34, headY + 14);
    ctx.lineTo(-34, headY + 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = highlightEdge;
    ctx.stroke();

    // Night-Vision Goggles / Tactical Optic Visor
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(-24, headY + 4, 48, 11, 3);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Dual NVG Objective Lens Cylinders
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(-11, headY + 9, 4.5, 0, Math.PI * 2);
    ctx.arc(11, headY + 9, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Comms Headset with Boom
    ctx.fillStyle = armorColor;
    ctx.fillRect(-40, headY - 6, 8, 22);
    ctx.fillRect(32, headY - 6, 8, 22);
    ctx.restore();

    // ── Arms & Weapon System ──
    ctx.save();

    if (aim < 0.95) {
      // Transitioning smoothly from low ready to forward aim
      var weaponAngle = (1 - aim) * 0.65;
      var offsetX = (1 - aim) * 46;
      var offsetY = (1 - aim) * 34;

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
      // Holographic optic
      ctx.fillRect(12, -26, 44, 14);

      // Hands gripping weapon
      ctx.fillStyle = armorColor;
      ctx.beginPath();
      ctx.arc(82, 5, 12, 0, Math.PI * 2);
      ctx.arc(0, 12, 12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // ── DIRECT PERPENDICULAR AIM (Directly Facing User) ──
      // Dynamic micro-aim adjustment following cursor
      ctx.translate(aimOffset.x * 0.35, aimOffset.y * 0.25);

      // Arms extending forward directly toward viewer
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

      // Collimated Red Dot Reticle inside optical window
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, -28, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // ── Barrel & Muzzle Compensator (Facing user) ──
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 4, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();

      // Dark bore opening straight toward viewer
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(0, 4, 7, 0, Math.PI * 2);
      ctx.fill();

      // Compensator gas ports
      ctx.fillStyle = '#64748b';
      for (var p = 0; p < 6; p++) {
        var pa = (p * Math.PI) / 3;
        var px = Math.cos(pa) * 10.5;
        var py = 4 + Math.sin(pa) * 10.5;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── TACTICAL TARGETING LASER ──
      // Dynamic laser spot & collimator flare tracking cursor
      var laserOriginX = 14;
      var laserOriginY = -12;
      var laserTargetX = aimOffset.x * 1.5;
      var laserTargetY = 4 + aimOffset.y * 1.2;

      // Faint atmospheric laser beam line
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(laserOriginX, laserOriginY);
      ctx.lineTo(laserTargetX, laserTargetY);
      ctx.stroke();

      // Intense Ruby Laser Collimator Core
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(laserTargetX, laserTargetY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
    ctx.restore();
  }

  function drawTacticalHUD(aim, aimOffset) {
    ctx.save();

    var isLocked = aim > 0.85;
    var hudColor = isLocked ? '#38bdf8' : 'rgba(56, 189, 248, 0.55)';
    ctx.strokeStyle = hudColor;
    ctx.lineWidth = 1.2;

    var tx = aimOffset.x * 1.2;
    var ty = 4 + aimOffset.y * 1.1;

    // Reticle radius smoothly contracts as aim locks
    var r = 52 - aim * 20;

    // ── Central Targeting Reticle ──
    ctx.beginPath();
    ctx.arc(tx, ty, r, 0, Math.PI * 2);
    ctx.stroke();

    // Precision Crosshairs
    ctx.beginPath();
    ctx.moveTo(tx - r - 16, ty);
    ctx.lineTo(tx - r + 4, ty);
    ctx.moveTo(tx + r - 4, ty);
    ctx.lineTo(tx + r + 16, ty);
    ctx.moveTo(tx, ty - r - 16);
    ctx.lineTo(tx, ty - r + 4);
    ctx.moveTo(tx, ty + r - 4);
    ctx.lineTo(tx, ty + r + 16);
    ctx.stroke();

    // Corner Targeting Brackets
    var b = r + 18;
    ctx.beginPath();
    // Top-Left
    ctx.moveTo(tx - b, ty - b + 10); ctx.lineTo(tx - b, ty - b); ctx.lineTo(tx - b + 10, ty - b);
    // Top-Right
    ctx.moveTo(tx + b - 10, ty - b); ctx.lineTo(tx + b, ty - b); ctx.lineTo(tx + b, ty - b + 10);
    // Bottom-Left
    ctx.moveTo(tx - b, ty + b - 10); ctx.lineTo(tx - b, ty + b); ctx.lineTo(tx - b + 10, ty + b);
    // Bottom-Right
    ctx.moveTo(tx + b - 10, ty + b); ctx.lineTo(tx + b, ty + b); ctx.lineTo(tx + b, ty + b - 10);
    ctx.stroke();

    // ── Real-Time Mil-Spec Digital Telemetry Readout ──
    var azMil = ((aimOffset.x / 38) * 14.5).toFixed(1);
    var elMil = ((-aimOffset.y / 24) * 8.2).toFixed(1);
    if (azMil >= 0) azMil = '+' + azMil;
    if (elMil >= 0) elMil = '+' + elMil;

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = hudColor;
    ctx.textAlign = 'center';

    var statusText = isLocked ? 'AZ: ' + azMil + '° MIL // EL: ' + elMil + '° MIL // OPTIC: LOCKED' : 'STANDBY // LOW-READY STANCE';
    ctx.fillText(statusText, tx, ty + r + 38);

    ctx.restore();
  }

  requestAnimationFrame(draw);
})();
