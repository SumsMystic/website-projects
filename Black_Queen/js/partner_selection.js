// Partner Selection Variables
let partnerModal;
let partnerStep1;
let partnerStep2;
let partnerSuitSelection;
let partnerRankSelection;
let nextToRankBtn;
let backToSuitBtn;
let confirmPartnerBtn;
let suitNameDisplay;
// Solo Confirmation Step Variables
let partnerStep3;
let soloWarningText;
let soloConfirmBtn;
let soloCancelBtn;

window.selectedPartnerSuit = null; // MODIFIED: Expose globally
window.selectedPartnerRank = null; // MODIFIED: Expose globally

// All ranks in order for partner selection
const partnerRanks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king", "ace"];

/**
 * Shows the partner selection modal (Step 1: Suit Selection)
 */
function showPartnerSelectionModal() {
    resetPartnerModalState();
    partnerModal.style.display = 'flex';
}

/**
 * Hides the partner selection modal
 */
function hidePartnerSelectionModal() {
    partnerModal.style.display = 'none';
}

/**
 * Resets the partner modal to initial state
 */
function resetPartnerModalState() {
    // Reset variables
    selectedPartnerSuit = null;
    selectedPartnerRank = null;
    
    // Show step 1, hide step 2
    partnerStep1.style.display = 'flex';
    partnerStep2.style.display = 'none';
    partnerStep3.style.display = 'none';
    
    // Clear selections
    document.querySelectorAll('#partner-suit-selection .suit-option').forEach(suit => {
        suit.classList.remove('selected');
    });
    document.querySelectorAll('.rank-option').forEach(rank => {
        rank.classList.remove('selected');
    });
    
    // Disable buttons
    nextToRankBtn.setAttribute('disabled', 'true');
    confirmPartnerBtn.setAttribute('disabled', 'true');
    
    // Clear rank selection container
    partnerRankSelection.innerHTML = '';
}

/**
 * Moves from suit selection to rank selection
 */
function moveToRankSelection() {
    if (!selectedPartnerSuit) return;
    
    // Hide step 1, show step 2
    partnerStep1.style.display = 'none';
    partnerStep2.style.display = 'flex';
    
    // Update suit name display
    suitNameDisplay.textContent = selectedPartnerSuit;
    
    // Populate rank cards
    populateRankSelection();
}

/**
 * Goes back from rank selection to suit selection
 */
function backToSuitSelection() {
    // Clear rank selection
    selectedPartnerRank = null;
    confirmPartnerBtn.setAttribute('disabled', 'true');
    
    // Show step 1, hide step 2
    partnerStep1.style.display = 'flex';
    partnerStep2.style.display = 'none';
}

/**
 * Populates the rank selection with card images
 */
function populateRankSelection() {
    partnerRankSelection.innerHTML = '';
    
    partnerRanks.forEach(rank => {
        const rankDiv = document.createElement('div');
        rankDiv.classList.add('rank-option');
        rankDiv.setAttribute('data-rank', rank);
        rankDiv.style.backgroundImage = `url('./img/${rank}_of_${selectedPartnerSuit}.svg')`;
        rankDiv.title = `${rank.charAt(0).toUpperCase() + rank.slice(1)} of ${selectedPartnerSuit.charAt(0).toUpperCase() + selectedPartnerSuit.slice(1)}`;
        
        partnerRankSelection.appendChild(rankDiv);
    });
}

// In partner_selection.js
/**
 * Handles the final partner card confirmation.
 * This function now performs the solo check or triggers the actual game start.
 */
function confirmPartnerCard() {
    if (!window.selectedPartnerSuit || !window.selectedPartnerRank) {
        window.displayMessage("Please select both a suit and a rank for your partner card.", "message-box");
        return;
    }
    
    // Step 1: Identify who holds the selected partner card and set up initial teams
    // This calls the identifyPartnerPlayer function *within this file* (partner_selection.js)
    identifyPartnerPlayer(); 

    const partnerCardDisplay = `${window.selectedPartnerRank.charAt(0).toUpperCase() + window.selectedPartnerRank.slice(1)} of ${window.selectedPartnerSuit.charAt(0).toUpperCase() + window.selectedPartnerSuit.slice(1)}`;
    window.displayMessage(`${window.formatPlayerDisplayName(window.highestBidder)} has selected the ${partnerCardDisplay} as the partner card!`, "message-box");
    console.log(`Partner card selected: ${partnerCardDisplay}. Held by: ${window.partnerPlayerName}`);

    // Step 2: Check if the bid winner is also the partner (i.e., going solo)
    if (window.partnerPlayerName === window.bidWinnerName) {
        console.log("Bid winner selected themselves as partner. Showing solo confirmation step.");
        // Hide previous steps, show solo confirmation step
        partnerStep1.style.display = 'none';
        partnerStep2.style.display = 'none';
        partnerStep3.style.display = 'flex'; // Show solo confirmation step
        // The partnerModal itself remains visible at this point.
        // soloWarningText.textContent = `You picked your own ${partnerCardDisplay}. This means you will play alone...`; // Optional: dynamic text
    } else {
        // Step 3: Normal partner selection (not solo), proceed directly to game start
        console.log("Partner confirmed (not solo). Proceeding to game start.");
        
        // Signal that partner selection is truly complete and the game can begin
        window.dispatchEvent(new Event('partnerSelectionComplete')); 
        
        // Hide the entire partner modal now that decision is made and game can start
        hidePartnerSelectionModal();

        // Perform other game start actions
        const centerTableArea = document.getElementById('center-table-area');
        if (centerTableArea) {
            centerTableArea.innerHTML = '';
        }
        if (typeof window.updateGameInfoDisplays === 'function') {
            window.updateGameInfoDisplays();
        }
        if (typeof window.startTrick === 'function') {
            window.startTrick();
        } else {
            console.error("startTrick function not found. Cannot begin game play.");
        }
    }
}

/**
 * Identifies the actual player who holds the selected partner card and sets up teams.
 * This should be called by confirmPartnerCard after a partner card is chosen.
 */
function identifyPartnerPlayer() {
    if (!window.selectedPartnerSuit || !window.selectedPartnerRank || !window.hands) {
        console.warn("Cannot identify partner: Partner card not selected or hands not dealt.");
        return;
    }

    // Reset partnerPlayerName before searching for it in case of re-selection or prior errors
    window.partnerPlayerName = null; 

    for (const player of window.players) {
        // **REMOVED: The condition to skip the bid winner (was: if (player === window.bidWinnerName) { continue; })**
        // This function must find who *actually* holds the card, even if it's the bid winner themselves.
        const playerHand = window.hands[player];
        if (playerHand) {
            const hasPartnerCard = playerHand.some(card => 
                card.suit === window.selectedPartnerSuit && card.rank === window.selectedPartnerRank
            );
            if (hasPartnerCard) {
                window.partnerPlayerName = player;
                console.log(`Identified player holding partner card: ${window.partnerPlayerName}`);
                break; // Found the player, no need to continue
            }
        }
    }

    if (!window.partnerPlayerName) {
        console.warn("Partner card not found in any player's hand. This should not happen after dealing.");
        // This is a critical state. You might want to force a re-deal or an error message here.
    }

    // Set up teams based on who holds the partner card
    if (window.partnerPlayerName === window.bidWinnerName) {
        // Solo play: bid winner is alone on their team
        window.bidWinningTeam = [window.bidWinnerName];
        window.partnerRevealed = true; // For solo, assume partner is "revealed" as yourself
        window.opponentTeam = window.players.filter(player => player !== window.bidWinnerName);
        console.log("Team setup: SOLO. Bid Winning Team:", window.bidWinningTeam, "Opponent Team:", window.opponentTeam);

    } else {
        // Normal partner play: bid winner and the card holder form a team
        window.bidWinningTeam = [window.bidWinnerName, window.partnerPlayerName];
        window.opponentTeam = window.players.filter(player => !window.bidWinningTeam.includes(player));
        console.log("Team setup: PARTNER. Bid Winning Team:", window.bidWinningTeam, "Opponent Team:", window.opponentTeam);
    }
}
window.identifyPartnerPlayer = identifyPartnerPlayer; // Expose globally

// Event Listeners for Partner Selection (add this to your existing DOMContentLoaded event listener)
function initializePartnerSelectionEvents() {
    // Assign DOM elements
    partnerModal = document.getElementById('partner-modal');
    partnerStep1 = document.getElementById('partner-step1');
    partnerStep2 = document.getElementById('partner-step2');
    partnerSuitSelection = document.getElementById('partner-suit-selection');
    partnerRankSelection = document.getElementById('partner-rank-selection');
    nextToRankBtn = document.getElementById('next-to-rank-btn');
    backToSuitBtn = document.getElementById('back-to-suit-btn');
    confirmPartnerBtn = document.getElementById('confirm-partner-btn');
    suitNameDisplay = document.getElementById('suit-name');
    partnerStep3 = document.getElementById('partner-step3');
    soloWarningText = document.getElementById('solo-warning-text')
    soloConfirmBtn = document.getElementById('solo-confirm-btn')
    soloCancelBtn = document.getElementById('solo-cancel-btn');


    // Partner Suit Selection Event Listener
    if (partnerSuitSelection) {
        partnerSuitSelection.addEventListener('click', (event) => {
            let target = event.target;
            while (target && !target.classList.contains('suit-option')) {
                target = target.parentNode;
            }

            if (target) {
                // Clear previous selection
                document.querySelectorAll('#partner-suit-selection .suit-option').forEach(suit => {
                    suit.classList.remove('selected');
                });
                
                // Select new suit
                target.classList.add('selected');
                window.selectedPartnerSuit = target.getAttribute('data-suit');
                nextToRankBtn.removeAttribute('disabled');
            }
        });
    }

    // Partner Rank Selection Event Listener
    if (partnerRankSelection) {
        partnerRankSelection.addEventListener('click', (event) => {
            let target = event.target;
            while (target && !target.classList.contains('rank-option')) {
                target = target.parentNode;
            }

            if (target) {
                // Clear previous selection
                document.querySelectorAll('.rank-option').forEach(rank => {
                    rank.classList.remove('selected');
                });
                
                // Select new rank
                target.classList.add('selected');
                window.selectedPartnerRank = target.getAttribute('data-rank');
                confirmPartnerBtn.removeAttribute('disabled');
            }
        });
    }

    // Button Event Listeners
    if (nextToRankBtn) {
        nextToRankBtn.addEventListener('click', moveToRankSelection);
    }

    if (backToSuitBtn) {
        backToSuitBtn.addEventListener('click', backToSuitSelection);
    }

    if (confirmPartnerBtn) {
        confirmPartnerBtn.addEventListener('click', confirmPartnerCard); // Calls the main handler
    }

    // In partner_selection.js, in function initializePartnerSelectionEvents()
// ... (existing code, after confirmPartnerBtn listener) ...

    // NEW: Solo Confirmation Button Listeners (ADD THIS BLOCK)
    if (soloConfirmBtn) {
        soloConfirmBtn.addEventListener('click', () => {
            console.log("Solo confirmed by bid winner. Starting game solo.");
            
            // Teams were already set in identifyPartnerPlayer when solo was detected.

            window.dispatchEvent(new Event('partnerSelectionComplete')); 
            hidePartnerSelectionModal(); // Hide the entire modal now

            // Clear center table area messages
            const centerTableArea = document.getElementById('center-table-area');
            if (centerTableArea) {
                centerTableArea.innerHTML = '';
            }

            if (typeof window.updateGameInfoDisplays === 'function') {
                window.updateGameInfoDisplays();
            }

            if (typeof window.startTrick === 'function') {
                window.startTrick();
            } else {
                console.error("startTrick function not found. Cannot begin game play after solo confirm.");
            }
        });
    }

    if (soloCancelBtn) {
        soloCancelBtn.addEventListener('click', () => {
            console.log("Solo attempt cancelled. Resetting partner selection.");
            window.displayMessage("Solo attempt cancelled. Please choose another partner card.", "message-box");
            resetPartnerModalState(); // Reset partner selection to initial step 1 (will show step 1)
            // The modal (partnerModal) remains visible at step 1.
        });
    }
} // End of initializePartnerSelectionEvents function


// Expose functions globally
window.showPartnerSelectionModal = showPartnerSelectionModal;
window.hidePartnerSelectionModal = hidePartnerSelectionModal;

// Ensure event listeners are initialized after DOM is loaded
// document.addEventListener('DOMContentLoaded', initializePartnerSelectionEvents);