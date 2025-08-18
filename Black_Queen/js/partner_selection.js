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

/**
 * Handles the final partner card confirmation
 */
function confirmPartnerCard() {
    if (!selectedPartnerSuit || !selectedPartnerRank) return;
    
    const partnerCard = `${selectedPartnerRank} of ${selectedPartnerSuit}`;
    displayMessage(`${formatPlayerDisplayName(highestBidder)} has selected the ${partnerCard} as the partner card!`, "message-box");
    
    hidePartnerSelectionModal();
    
    // TODO: Add logic for the next phase (actual gameplay)
    console.log(`Partner card selected: ${partnerCard}`);
    
    // For now, just show completion message
    setTimeout(() => {
        displayMessage("Partner selection complete! Game ready to begin...", "message-box");
    }, 2000);
}

/**
 * Identifies the actual player who holds the selected partner card.
 * This should be called after cards are dealt and partner card is chosen.
 */
function identifyPartnerPlayer() {
    if (!window.selectedPartnerSuit || !window.selectedPartnerRank || !window.hands) {
        console.warn("Cannot identify partner: Partner card not selected or hands not dealt.");
        return;
    }

    for (const player of window.players) {
        if (player === window.bidWinnerName) continue; // Bid winner cannot be their own partner

        const playerHand = window.hands[player];
        if (playerHand) {
            const hasPartnerCard = playerHand.some(card => 
                card.suit === window.selectedPartnerSuit && card.rank === window.selectedPartnerRank
            );
            if (hasPartnerCard) {
                window.partnerPlayerName = player;
                console.log(`Identified partner: ${window.partnerPlayerName}`);
                break; // Found the partner, no need to continue
            }
        }
    }

    if (!window.partnerPlayerName) {
        console.warn("Partner card not found in any player's hand. This should not happen after dealing.");
        // Fallback: If partner not found (e.g., due to a bug), might assign a random partner or display error.
        // For robustness, ensure the selected partner card *always* exists in someone's hand.
    }

    // Set up teams now that partner is identified
    window.bidWinningTeam = [window.bidWinnerName];
    if (window.partnerPlayerName) {
        window.bidWinningTeam.push(window.partnerPlayerName);
    }
    
    window.opponentTeam = window.players.filter(player => !window.bidWinningTeam.includes(player));

    console.log("Bid Winning Team:", window.bidWinningTeam);
    console.log("Opponent Team:", window.opponentTeam);
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
        confirmPartnerBtn.addEventListener('click', () => {
            confirmPartnerCard();
            partnerModal.style.display = 'none';
            
            // ADDED: Identify the partner player based on the selected card
            if (typeof window.identifyPartnerPlayer === 'function') {
                window.identifyPartnerPlayer();
            } else {
                console.error("identifyPartnerPlayer function not found.");
            }

            window.dispatchEvent(new Event('partnerSelectionComplete'));

            // Clear center table area messages
            const centerTableArea = document.getElementById('center-table-area');
            if (centerTableArea) {
                centerTableArea.innerHTML = '';
            }

            // After partner selection is confirmed, update the persistent game info displays
            if (typeof window.updateGameInfoDisplays === 'function') {
                window.updateGameInfoDisplays(); // ADDED: Call this to update the display
            }

            // After partner selection is confirmed, start the first trick!
            if (typeof window.startTrick === 'function') {
                window.startTrick();
            } else {
                console.error("startTrick function not found. Cannot begin game play.");
            }
        });
    }
}

// Expose functions globally
window.showPartnerSelectionModal = showPartnerSelectionModal;
window.hidePartnerSelectionModal = hidePartnerSelectionModal;

// Ensure event listeners are initialized after DOM is loaded
// document.addEventListener('DOMContentLoaded', initializePartnerSelectionEvents);