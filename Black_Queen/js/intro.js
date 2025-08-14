document.addEventListener('DOMContentLoaded', function() {
  // --- Intro Video Overlay ---
  var overlay = document.createElement('div');
  overlay.id = 'intro-video-overlay';
  overlay.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center;">
      <video id="intro-video" src="./intro/black_queen_intro_vid.mp4" playsinline preload="auto"></video>
      <button id="start-intro-btn" style="margin-top: 24px; font-size: 1.2em; padding: 12px 32px;">
        Enter the dominion of the Black Queen
      </button>
    </div>
  `;
  var video = overlay.querySelector('video');
  var startBtn = overlay.querySelector('#start-intro-btn');
  startBtn.onclick = function(e) {
    e.stopPropagation();
    video.muted = false;
    video.currentTime = 0;
    video.setAttribute('autoplay', 'autoplay');
    video.play().catch(function(err) {
      console.warn('Video play failed:', err);
    });
    startBtn.style.display = 'none';
  };
  video.onended = function() {
    overlay.style.display = 'none';
    runLogoIntroSequence();
  };
  overlay.onclick = function() {
    if (!video.paused) video.pause();
    overlay.style.display = 'none';
    runLogoIntroSequence();
  };
  document.body.appendChild(overlay);

  // --- Logo Animation Sequence ---
  function runLogoIntroSequence() {
    var whiteOverlay = document.getElementById('white-overlay');
    var logoOverlay = document.getElementById('logo-anim-overlay');
    var logoImg = document.getElementById('logo-anim-img');
    // Step 1: Show white overlay
    whiteOverlay.style.display = 'block';
    setTimeout(function() {
      whiteOverlay.style.display = 'none';
      // Step 2: Show logo overlay, fade in logo with glow
      logoOverlay.style.display = 'flex';
      logoImg.style.opacity = '1';
      logoImg.style.boxShadow = '0 0 60px 20px #1de9b6, 0 0 0 0 #fff';

      // Step 3: Animate logo from center to top left and shrink in one go
      setTimeout(function() {
        var finalHeight = window.innerHeight * 0.16; // 16vh in pixels
        var startHeight = logoImg.offsetHeight;
        var scaleRatio = finalHeight / startHeight;

        // Initial state: centered and full size
        logoImg.style.position = 'fixed';
        logoImg.style.left = '50%';
        logoImg.style.top = '50%';
        logoImg.style.height = startHeight + 'px';
        logoImg.style.width = 'auto';
        logoImg.style.transform = 'translate(-50%, -50%) scale(1)';
        logoImg.style.transition =
          'opacity 0.5s, box-shadow 0.7s, left 1.2s cubic-bezier(.77,0,.18,1), top 1.2s cubic-bezier(.77,0,.18,1), transform 1.2s cubic-bezier(.77,0,.18,1)';

        // Animate to top left and final size
        setTimeout(function() {
          logoImg.style.boxShadow = '0 0 0 0 #1de9b6';
          logoImg.style.left = '0';
          logoImg.style.top = '0';
          logoImg.style.transform = `translate(0, 0) scale(${scaleRatio})`;
          logoImg.style.height = finalHeight + 'px';
          // After animation, fade out and show main content
          setTimeout(function() {
            logoOverlay.style.transition = 'opacity 0.5s';
            logoOverlay.style.opacity = '0';
            setTimeout(function() {
              logoOverlay.style.display = 'none';
              logoOverlay.style.opacity = '1';
              document.getElementById('main-content').style.display = 'block';
            }, 500);
          }, 1200);
        }, 50); // Small delay to allow browser to apply initial transform
      }, 700);
    }, 500); // White overlay duration
  }
});