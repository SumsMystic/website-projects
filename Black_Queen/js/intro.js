document.addEventListener('DOMContentLoaded', function() {
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
  document.body.appendChild(overlay);

  const mainContent = document.getElementById('main-content');
  const whiteOverlay = document.getElementById('white-overlay');
  const logoOverlay = document.getElementById('logo-anim-overlay');
  const logoImg = document.getElementById('logo-anim-img');

  /**
   * Immediately shows the main content and cleans up intro overlays.
   */
  function showMainContentAndCleanup() {
    console.log("Showing main content and cleaning up intro overlays.");
    if (mainContent) {
      mainContent.style.display = 'block'; // Ensure main content is visible
    }
    if (whiteOverlay) {
      whiteOverlay.style.display = 'none';
    }
    if (logoOverlay) {
      logoOverlay.style.display = 'none';
      logoOverlay.style.opacity = '1'; // Reset opacity for future uses if any
    }
    // Remove the intro video overlay from the DOM
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    sessionStorage.removeItem('skipIntro'); // Clear the flag after use
  }

  // --- Check for skipIntro flag immediately ---
  if (sessionStorage.getItem('skipIntro') === 'true') {
    console.log("Skip intro flag detected. Bypassing intro animation.");
    showMainContentAndCleanup();
    return; // Exit the DOMContentLoaded listener
  }

  // --- Initial (first-time) intro sequence ---
  startBtn.onclick = function(e) {
    e.stopPropagation();
    video.muted = false;
    video.currentTime = 0;
    video.setAttribute('autoplay', 'autoplay');
    video.play().catch(function(err) {
      console.warn('Video play failed:', err);
      // Fallback if video play fails (e.g., autoplay blocked)
      // Directly proceed to logo animation or main content
      overlay.style.display = 'none';
      runLogoIntroSequence();
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

  // --- Logo Animation Sequence ---
  function runLogoIntroSequence() {
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
          // After animation, fade out and redirect to login.html
          setTimeout(function() {
            logoOverlay.style.transition = 'opacity 0.5s';
            logoOverlay.style.opacity = '0';
            setTimeout(function() {
              // --- CRITICAL CORRECTION: Redirect to login.html if first time, else show main content ---
              // This is the initial entry point after intro, so always redirect to login.html
              window.location.href = 'login.html';
            }, 500);
          }, 1200);
        }, 50); // Small delay to allow browser to apply initial transform
      }, 700);
    }, 500); // White overlay duration
  }
});
