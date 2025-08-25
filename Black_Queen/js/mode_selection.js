document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in, redirect to login.html if not
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return; // Stop execution if not logged in
    }

    // CRITICAL: Reset the game state on a fresh login to prevent lingering data
    sessionStorage.removeItem('loggedInPlayer');
    sessionStorage.removeItem('gameMode');
    sessionStorage.removeItem('cardTheme');

    const gameModeSelect = document.getElementById('game-mode-select');
    const cardThemeSelect = document.getElementById('card-theme-select');
    const startGameBtn = document.getElementById('start-game-btn');
    const setupContainer = document.querySelector('.setup-container'); // Get the main setup container

    // --- Dynamic creation of Intro Overlays ---
    // These elements were previously in starter.html or intro.js
    const introVideoOverlay = document.createElement('div');
    introVideoOverlay.id = 'intro-video-overlay';
    introVideoOverlay.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center;">
            <video id="intro-video" src="./intro/black_queen_intro_vid.mp4" playsinline preload="auto"></video>
        </div>
    `;
    document.body.appendChild(introVideoOverlay);

    const whiteOverlay = document.createElement('div');
    whiteOverlay.id = 'white-overlay';
    document.body.appendChild(whiteOverlay);

    const logoAnimOverlay = document.createElement('div');
    logoAnimOverlay.id = 'logo-anim-overlay';
    logoAnimOverlay.innerHTML = `
        <img id="logo-anim-img" src="./img/black_queen_backside_default.webp" alt="Black Queen Logo" />
    `;
    document.body.appendChild(logoAnimOverlay);

    // Get references to the newly created elements
    const video = introVideoOverlay.querySelector('#intro-video');
    const logoImg = logoAnimOverlay.querySelector('#logo-anim-img');

    // --- Admin Mode Check and Initial Setup ---
    // This flag determines if the user logged in as admin from login.html
    const isAdminLogin = sessionStorage.getItem('isAdminLogin') === 'true';

    if (isAdminLogin) {
        // For admin, disable selections but allow them to click 'Enter'
        gameModeSelect.value = 'single-player'; // Default for admin or a preferred debug mode
        gameModeSelect.disabled = true;
        cardThemeSelect.value = 'def'; // Default theme for admin
        cardThemeSelect.disabled = true;
        console.log("Admin login detected. Selections disabled on this screen.");
    }

    /**
     * Final step after intro/skip: redirects to starter.html.
     * All game parameters are now stored in sessionStorage.
     */
    function finalizeGameStart() {
        const selectedMode = gameModeSelect.value;
        const selectedTheme = cardThemeSelect.value;

        // Store selected options in sessionStorage for script.js to pick up
        sessionStorage.setItem('gameMode', selectedMode);
        sessionStorage.setItem('cardTheme', selectedTheme);
        // isAdminLogin is already in sessionStorage from login.html, no need to re-set here

        window.location.href = 'starter.html'; // Redirect without URL parameters
    }

    // --- Event Listener for "Enter the Dominion..." button ---
    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            // Hide the mode selection UI
            setupContainer.style.display = 'none';

            // ALL users, including admin, now proceed to the intro sequence
            runIntroSequence();
        });
    } else {
        console.error("Start Game button not found in mode_selection.html");
    }

    // --- Intro Sequence Functions (Moved from old intro.js) ---

    function runIntroSequence() {
        // Show video overlay and play video
        introVideoOverlay.style.visibility = 'visible';
        introVideoOverlay.style.opacity = '1';

        video.muted = false; // Ensure video sound is on if desired, or keep muted for autoplay
        video.currentTime = 0;
        video.play().catch(function(err) {
            console.warn('Video play failed, attempting logo animation:', err);
            // Fallback if video play fails (e.g., autoplay blocked)
            introVideoOverlay.style.visibility = 'hidden';
            introVideoOverlay.style.opacity = '0';
            runLogoIntroSequence();
        });
    }

    video.onended = function() {
        introVideoOverlay.style.visibility = 'hidden';
        introVideoOverlay.style.opacity = '0';
        runLogoIntroSequence();
    };

    // Allows skipping video by clicking on the overlay
    introVideoOverlay.onclick = function() {
        if (!video.paused) video.pause();
        introVideoOverlay.style.visibility = 'hidden';
        introVideoOverlay.style.opacity = '0';
        runLogoIntroSequence();
    };

    function runLogoIntroSequence() {
        // Step 1: Show white overlay
        whiteOverlay.style.visibility = 'visible';
        whiteOverlay.style.opacity = '1';

        setTimeout(function() {
            whiteOverlay.style.visibility = 'hidden';
            whiteOverlay.style.opacity = '0';

            // Step 2: Show logo overlay, fade in logo with glow
            logoAnimOverlay.style.display = 'flex'; // Ensure display is flex for centering
            logoAnimOverlay.style.visibility = 'visible';
            logoAnimOverlay.style.opacity = '1';

            logoImg.style.opacity = '1';
            logoImg.style.boxShadow = '0 0 60px 20px #1de9b6, 0 0 0 0 #fff';

            // Step 3: Animate logo from center to top left and shrink in one go
            setTimeout(function() {
                var finalHeight = window.innerHeight * 0.16; // 16vh in pixels
                var startHeight = logoImg.offsetHeight;
                var scaleRatio = finalHeight / startHeight;

                // Initial state for animation (ensure CSS doesn't conflict)
                logoImg.style.position = 'fixed'; // Use fixed for animation over whole viewport
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

                    // After animation, fade out and redirect to starter.html
                    setTimeout(function() {
                        logoAnimOverlay.style.transition = 'opacity 0.5s';
                        logoAnimOverlay.style.opacity = '0';
                        setTimeout(function() {
                            logoAnimOverlay.style.visibility = 'hidden';
                            logoAnimOverlay.style.display = 'none'; // Ensure it's fully gone
                            finalizeGameStart(); // Redirect to starter.html, parameters from sessionStorage
                        }, 500); // Wait for opacity transition
                    }, 1200); // Duration of the logo movement animation
                }, 50); // Small delay to allow browser to apply initial transform
            }, 700); // Delay before logo animation starts (after white overlay fades)
        }, 500); // White overlay duration
    }
});
