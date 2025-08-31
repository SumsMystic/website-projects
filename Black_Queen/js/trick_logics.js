/**
 * Handles a player playing a card during a trick.
 * @param {HTMLElement} cardElem - The HTML element of the card played.
 * @param {string} player - The name of the player who played the card.
 */
function playCardInTrick(cardElem, player) {
    // console.log(`${window.formatPlayerDisplayName(player)} played: ${cardElem.dataset.rank} of ${cardElem.dataset.suit}`);

    // Call playCardToCenter from game_play.js to move the card
    // from temporary body placement to the center played cards area
    // and apply its final styling (position: absolute, transforms).
    if (typeof window.playCardToCenter === 'function') {
        if (cardElem) {
            // Check if the card is currently face-down (has 'card-back' class)
            if (cardElem.classList.contains('card-back')) {
                // Remove the 'card-back' class to reveal the card face
                cardElem.classList.remove('card-back');
                cardElem.classList.remove(`card-back-${window.cardTheme}-theme`); // Remove theme-specific back
                
                // Ensure its background image is set to its actual face
                const cardSuit = cardElem.dataset.suit;
                const cardRank = cardElem.dataset.rank;
                cardElem.style.backgroundImage = `url('./img/${cardRank}_of_${cardSuit}.svg')`;
                cardElem.style.color = ''; // Restore text color if hidden for face-down cards
            }

            // Now call playCardToCenter with the potentially revealed card
            window.playCardToCenter(cardElem, player);
        }
    } else {
        console.error("playCardToCenter function not found. Cannot place card on table.");
        // Fallback: If playCardToCenter is missing, at least try to append it.
        const centerPlayedCardsFallback = document.getElementById('center-played-cards');
        if (centerPlayedCardsFallback) {
            cardElem.style.position = 'static';
            cardElem.style.transform = '';
            centerPlayedCardsFallback.appendChild(cardElem);
        }
    }

    const playedCardSuit = cardElem.dataset.suit;
    const playedCardRank = cardElem.dataset.rank;

    // If it's the first card of the trick, set the lead suit
    if (window.cardsInCurrentTrick === 0) {
        window.leadSuitForTrick = playedCardSuit;
    }

    // Rule: Check if trump is broken
    if (!window.trumpBroken) {
        if (playedCardSuit === window.currentTrumpSuit && window.leadSuitForTrick !== window.currentTrumpSuit) {
            window.trumpBroken = true;
            window.displayMessage("Trump has been broken!", "message-box");
        }
    }

    // Remove the played card from the player's hands array
    if (window.hands && window.hands[player]) {
        window.hands[player] = window.hands[player].filter(card => !(card.rank === playedCardRank && card.suit === playedCardSuit));
    } else {
        console.warn(`window.hands or window.hands[${player}] is undefined. Cannot remove card from hand array.`);
    }

    // Add the card to the current trick's array
    window.currentTrick.push({
        card: {
            rank: playedCardRank,
            suit: playedCardSuit
        },
        player: player,
        element: cardElem
    });
    window.cardsInCurrentTrick++;

    // Disable current player's cards immediately after playing
    window.updatePlayerCardInteractions(null, null);

    // CRITICAL FIX: The turn progression is now managed by a single function
    // that is called after a card is played.
    window.advanceTurnInTrick(); 
}
window.playCardInTrick = playCardInTrick; // Expose globally


/**
 * The new function to manage the flow of the trick.
 * This is the sole function that manages turn progression.
 */
// A new global variable to store the timeout ID for the next player's turn

let nextTurnTimeoutId = null;
window.nextTurnTimeoutId = nextTurnTimeoutId; // Expose globally

/**
 * The sole function to manage the flow of the trick, called after a card is played.
 */
function advanceTurnInTrick() {
    // CRITICAL FIX: Clear any pending timeouts from previous turns to prevent race conditions
    if (window.nextTurnTimeoutId) {
        clearTimeout(window.nextTurnTimeoutId);
        window.nextTurnTimeoutId = null;
    }

    // Check if the trick is complete (all players have played their cards).
    if (window.cardsInCurrentTrick === window.players.length) {
        window.displayMessage("All cards played for the trick!", "message-box");
        // Evaluate trick winner after a short delay
        // window.nextTurnTimeoutId = setTimeout(evaluateTrick, 700);
        evaluateTrick();
        console.log(`${window.formatPlayerDisplayName(window.trickWinner)} won the trick!`);

        // Use a setTimeout to allow for trick animations and card clearing
        window.nextTurnTimeoutId = setTimeout(() => {

            // Clear the center played cards area
            window.clearCenterPlayedCards();
            
            // Check if game is over
            if (window.trickCount < window.cardsPerPlayer) {
                // Number of tricks for this round not completed, so start a new trick remembering that window.trickWinner is the lead player
                window.startTrick();
            } else {
                 window.endRound(); 
            }
        }, 1500); // Wait for the highlight animation and card clearing
    } else {
        // This is the missing logic for advancing the turn within a trick
        window.currentPlayerIndex = (window.currentPlayerIndex + 1) % window.players.length;
        window.currentPlayer = window.players[window.currentPlayerIndex];
        console.log(`It's now ${window.formatPlayerDisplayName(window.currentPlayer)}'s turn to play.`);

        // Check if the next player is an AI
        const isAIPlayer = window.currentPlayer !== window.loggedInPlayer;

        if (isAIPlayer) {
            // Handle single-player vs. admin mode logic.
            if (window.gameMode === 'single-player' && (window.isAdminMode || window.currentPlayer !== window.loggedInPlayer)) {
                // It's a non-human player's turn in a single-player game, or admin mode is enabled.
                window.displayMessage(`${window.formatPlayerDisplayName(window.currentPlayer)} is thinking...`, "message-box");
                window.nextTurnTimeoutId = setTimeout(() => {
                    const cardElem = window.ai.aiPlayCard(
                        window.currentPlayer,
                        window.hands[window.currentPlayer],
                        window.currentTrick,
                        window.leadSuitForTrick,
                        window.currentTrumpSuit
                    );
                    if (cardElem) {
                        // Final check to prevent race condition if a human plays before AI turn fires
                        if (window.currentPlayer === window.players[window.currentPlayerIndex]) {
                            // NEW: Apply the highlight now that the AI's turn is in motion
                            window.updatePlayerCardInteractions(window.currentPlayer);
                            window.playCardInTrick(cardElem, window.currentPlayer);
                        }
                    }
                }, 1500); // Simulate AI thinking time
            }
        } else {
            // It's the human player's turn (South).
            window.displayMessage(`It's the human player's turn (South)`, "message-box");
            // Animate the next player's indicator
            window.updatePlayerCardInteractions(window.currentPlayer);
        }
    }
    
    
}
window.advanceTurnInTrick = advanceTurnInTrick;

// A new function to properly start the next trick
function startNextTrick(winner) {
    // Reset trick variables for the new trick
    window.currentTrick = [];
    window.cardsInCurrentTrick = 0;
    window.leadSuitForTrick = null;

    // Set the winner of the previous trick as the lead player
    window.currentPlayer = winner;
    window.currentPlayerIndex = window.players.indexOf(winner);

    // Now, trigger the AI's turn if the winner is an AI, or enable human player interaction
    const isAIPlayer = window.currentPlayer !== window.loggedInPlayer;
    if (isAIPlayer) {
        window.ai.playAiFirstCard(window.currentPlayer);
    } else {
        window.updatePlayerCardInteractions(window.currentPlayer);
    }
}

/**
 * Evaluates the current trick to determine the winner based on Black Queen rules.
 * Rules: Aces > Kings > Queens > Jacks > 10...2. Trump cards beat non-trump cards.
 * If no trump, highest card of lead suit wins.
 *
 * IMPORTANT: This evaluation also handles points for specific cards like Black Queen.
 */
function evaluateTrick() {
    console.log("Evaluating trick:", window.currentTrick);

    let winningCardInfo = window.currentTrick[0];
    const leadSuit = window.currentTrick[0].card.suit;
    const trumpSuit = window.currentTrumpSuit;

    // Iterate through played cards to find the winner
    for (let i = 1; i < window.currentTrick.length; i++) {
        const currentCardInfo = window.currentTrick[i];
        const currentCard = currentCardInfo.card;
        const winningCard = winningCardInfo.card;

        // Step 1: Check for Trump Suit
        const isCurrentTrump = (currentCard.suit === trumpSuit);
        const isWinningTrump = (winningCard.suit === trumpSuit);

        if (isCurrentTrump && !isWinningTrump) {
            // Current card is trump, winning card is not => Current card wins
            winningCardInfo = currentCardInfo;
        } else if (!isCurrentTrump && isWinningTrump) {
            // Current card is not trump, winning card is trump => Winning card keeps winning
            // No change needed
        } else if (isCurrentTrump && isWinningTrump) {
            // Both are trump => Compare ranks
            if (window.getCardRankValue(currentCard.rank) > window.getCardRankValue(winningCard.rank)) {
                winningCardInfo = currentCardInfo;
            }
        } else { // Neither are trump
            // Step 2: Check for Lead Suit
            const isCurrentLeadSuit = (currentCard.suit === leadSuit);
            const isWinningLeadSuit = (winningCard.suit === leadSuit);

            if (isCurrentLeadSuit && !isWinningLeadSuit) {
                // Current card follows lead suit, winning card does not (and is not trump) => Current card wins
                winningCardInfo = currentCardInfo;
            } else if (!isCurrentLeadSuit && isWinningLeadSuit) {
                // Current card does not follow lead suit, winning card does => Winning card keeps winning
                // No change needed
            } else if (isCurrentLeadSuit && isWinningLeadSuit) {
                // Both follow lead suit => Compare ranks
                if (window.getCardRankValue(currentCard.rank) > window.getCardRankValue(winningCard.rank)) {
                    winningCardInfo = currentCardInfo;
                }
            }
            // If neither are trump and neither follow lead suit, the first card (lead suit) still wins
            // unless it was beaten by a trump or a higher card of the lead suit.
            // This scenario means currentCard sluffed and cannot win unless winningCard also sluffed and was lower.
            // Given the rules of play, this 'else' block implies both are non-winning suits, so winningCardInfo remains.
        }
    }

    // CRITICAL FIX: Add this line to set the global winner for the next trick to use
    window.trickWinner = winningCardInfo.player;

    let trickPointsEarned = 0; // Initialize points for this trick

    // Calculate total points from all cards in the current trick
    window.currentTrick.forEach(playedCard => {
        trickPointsEarned += getCardPoints(playedCard.card); // Use the new getCardPoints function
    });

    window.playersScores[window.trickWinner] += trickPointsEarned; // Add the accumulated points to the trick winner's score

    window.displayMessage(`${window.formatPlayerDisplayName(window.trickWinner)} won Trick ${window.trickCount + 1} and gained ${trickPointsEarned} points! Total: ${window.playersScores[window.trickWinner]}`, "message-box");

    window.trickCount++;

    window.updateScoresDisplay();
}

/**
 * Enables hover and click interactions only for the specified active player's cards,
 * enforcing trump-breaking and suit-following rules.
 * Also adds/removes a visual glow feedback for the active player's hand area.
 * @param {string | null} activePlayer - The player whose cards should be active, or null to disable all.
 * @param {string | null} leadSuit - The suit led in the current trick, or null if it's the lead player's turn.
 */
function updatePlayerCardInteractions(activePlayer, leadSuit) {
    window.players.forEach(player => {
        // MODIFIED: Select the outer player card container for the glow
        const playerCardArea = document.querySelector(`.${player}-cards`); 
        // Keep selecting the inner handElement for individual card interaction logic
        const handElement = playerCardArea ? playerCardArea.querySelector('.hand') : null; // Get the inner hand for card logic
        const isHumanPlayer = (activePlayer === window.loggedInPlayer);
        const humanHand = document.getElementById(window.loggedInPlayer);

        if (playerCardArea && handElement) { // Ensure both elements exist
            // Apply/remove glow effect to the outer player card area
            if (player === activePlayer) {
                playerCardArea.classList.add('active-player-glow'); // Apply glow to the outer div
            } else {
                playerCardArea.classList.remove('active-player-glow'); // Remove glow from the outer div
            }

            // Get the actual cards in the player's hand (from JS hands object)
            const cardsInHand = window.hands ? window.hands[player] : [];
            const hasLeadSuit = leadSuit ? cardsInHand.some(card => card.suit === leadSuit) : false;
            const hasTrump = cardsInHand.some(card => card.suit === window.currentTrumpSuit);

            handElement.querySelectorAll('.card').forEach(cardElem => {
                const cardSuit = cardElem.dataset.suit;
                const cardRank = cardElem.dataset.rank;
                const isBlackQueen = (cardRank === 'queen' && cardSuit === 'spades'); // The Black Queen

                if (player === activePlayer) {
                    // Assume card is playable by default, then disable if rules are violated
                    cardElem.classList.add('card-playable');
                    cardElem.style.pointerEvents = 'auto';
                    cardElem.addEventListener('click', function() {
                        window.animateCardToCenter(cardElem);
                    });

                    // Rule 2: Suit Following
                    if (leadSuit !== null) { // If it's not the lead player's turn
                        if (hasLeadSuit && cardSuit !== leadSuit) {
                            // Player has lead suit, but trying to play a different suit -> Disable
                            cardElem.style.pointerEvents = 'none';
                            cardElem.classList.remove('card-playable');
                        }
                        // If player doesn't have lead suit (hasLeadSuit is false), they can play any card.
                        // If player has lead suit and playing lead suit, it's allowed.
                    } else { // It's the lead player's turn (leadSuit is null)
                        // Rule 1: Cannot lead with trump if trump is not broken AND player has non-trump cards.
                        // The Black Queen (Queen of Spades) is an exception: it can ALWAYS be played.
                        if (cardSuit === window.currentTrumpSuit && !window.trumpBroken && hasTrump && (cardsInHand.length > 1 || !isBlackQueen)) {
                            // If the player only has trump cards, they must lead with trump.
                            // If player has non-trump cards, they cannot lead with trump unless trump is broken.
                            // The check for "hasTrump" is important to distinguish from a player having ONLY non-trump.
                            const hasNonTrumpCards = cardsInHand.some(card => card.suit !== window.currentTrumpSuit);
                            if (hasNonTrumpCards && !isBlackQueen) { // Cannot lead with trump if non-trump available and trump not broken (unless it's the Black Queen)
                                cardElem.style.pointerEvents = 'none';
                                cardElem.classList.remove('card-playable');
                            }
                        }
                    }
                    

                } else {
                    // Disable all cards for inactive players
                    cardElem.classList.remove('card-playable');
                    cardElem.style.pointerEvents = 'none';
                }
            });
        }
    });
}

/**
 * Displays the partner revealed message temporarily.
 * Also updates the persistent game info displays with team information.
 */
function showPartnerRevealMessage() {
    const partnerRevealMessageDiv = document.getElementById('partner-reveal-message');
    const partnerRevealNameSpan = document.getElementById('partner-reveal-name');

    // NEW: Get references to the persistent game info display spans
    const desktopBidWinningTeamSpan = document.getElementById('desktop-bid-winner-team');
    const desktopOpponentTeamSpan = document.getElementById('desktop-opponent-team');
    const desktopTrumpSuitSpan = document.getElementById('desktop-trump-suit');
    const mobileBidWinningTeamSpan = document.getElementById('mobile-bid-winner-team');
    const mobileOpponentTeamSpan = document.getElementById('mobile-opponent-team');
    const mobileTrumpSuitSpan = document.getElementById('mobile-trump-suit');

    if (partnerRevealMessageDiv && partnerRevealNameSpan && window.partnerPlayerName) {
        partnerRevealNameSpan.textContent = window.formatPlayerDisplayName(window.partnerPlayerName);
        partnerRevealMessageDiv.classList.add('visible'); // Show the message

        // NEW: Update persistent game info displays with team details
        if (window.bidWinningTeam && window.opponentTeam) {
            // Format player names (max 10 chars, capitalized)
            const formatTeamNames = (team) => {
                return team.map(player => {
                    let displayName = window.formatPlayerDisplayName(player);
                    return displayName.length > 10 ? displayName.substring(0, 10) + '...' : displayName;
                }).join(', ');
            };

            const bidWinningTeamNames = formatTeamNames(window.bidWinningTeam);
            const opponentTeamNames = formatTeamNames(window.opponentTeam);

            // Update desktop display
            if (desktopBidWinningTeamSpan) {
                desktopBidWinningTeamSpan.textContent = bidWinningTeamNames;
            }
            if (desktopOpponentTeamSpan) {
                desktopOpponentTeamSpan.textContent = opponentTeamNames;
            }

            if (desktopTrumpSuitSpan) {
                desktopTrumpSuitSpan.textContent = window.currentTrumpSuit;
            }

            // Update mobile display
            if (mobileBidWinningTeamSpan) {
                mobileBidWinningTeamSpan.textContent = bidWinningTeamNames;
            }
            if (mobileOpponentTeamSpan) {
                mobileOpponentTeamSpan.textContent = opponentTeamNames;
            }
            if (mobileTrumpSuitSpan) {
                mobileTrumpSuitSpan.textContent = window.currentTrumpSuit;
            }

        } else {
            console.warn("showPartnerRevealMessage: Team arrays (bidWinningTeam or opponentTeam) are not available.");
        }

        setTimeout(() => {
            partnerRevealMessageDiv.classList.remove('visible'); // Hide after a delay
        }, 3000); // Message visible for 3 seconds
    } else {
        console.warn("showPartnerRevealMessage() called but partner reveal message elements or partnerPlayerName not found.");
        console.log("Elements:", partnerRevealMessageDiv, partnerRevealNameSpan, window.partnerPlayerName);
    }
}

// Expose globally
window.updatePlayerCardInteractions = updatePlayerCardInteractions;
window.playCardInTrick = playCardInTrick;
