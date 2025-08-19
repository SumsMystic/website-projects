/**
 * Handles a player playing a card during a trick.
 * @param {HTMLElement} cardElem - The HTML element of the card played.
 * @param {string} player - The name of the player who played the card.
 */
function playCardInTrick(cardElem, player) {
    console.log(`${window.formatPlayerDisplayName(player)} played: ${cardElem.dataset.rank} of ${cardElem.dataset.suit}`);

    // CRITICAL: Call playCardToCenter from game_play.js to move the card
    // from temporary body placement to the center played cards area
    // and apply its final styling (position: absolute, transforms).
    if (typeof window.playCardToCenter === 'function') {
        window.playCardToCenter(cardElem, player); // This moves and styles the card
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
    console.log(`DEBUG: Played Card: Suit -> ${playedCardSuit}  Rank: ${playedCardRank}`);
    console.log(`DEBUG: Selected Partner Card Suit -> ${window.selectedPartnerSuit} Rank: ${window.selectedPartnerRank}`);
    console.log(`DEBUG: Partner Revealed Flag -> ${window.partnerRevealed}`);
    console.log(`DEBUG: Lead Suit for Trick -> ${window.leadSuitForTrick}`);
    console.log(`DEBUG: window.currentTrumpSuit -> ${window.currentTrumpSuit} `);

    // Rule: Check if trump is broken
    // Trump is broken if a trump card is played when the lead suit is NOT trump,
    // and the player HAD a card of the lead suit but chose to play trump (sluffing trump).
    // OR if a player *leads* with trump after it was previously broken.
    if (!window.trumpBroken) {
        if (playedCardSuit === window.currentTrumpSuit && window.leadSuitForTrick !== window.currentTrumpSuit) {
            // If a trump card is played, and it's not the lead suit, trump is now broken.
            // This assumes the play was valid (i.e., player didn't have lead suit, or it's allowed to play trump)
            window.trumpBroken = true;
            window.displayMessage("Trump has been broken!", "message-box");
        }
    }


    // Remove the played card from the player's hand DOM
    // cardElem.parentNode.removeChild(cardElem); // This line was causing the card to vanish.
    // It's removed from the hand array below, which is sufficient.

    // Remove the played card from the player's hands array
    // (This part is crucial for AI and game state accuracy)
    // IMPORTANT: window.hands is assumed to be initialized in script.js
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
        element: cardElem // Keep a reference to the element for trick evaluation/collection
    });
    window.cardsInCurrentTrick++;

    // ADDED: Check if the played card is the partner card and reveal partner
    if (!window.partnerRevealed &&
        playedCardSuit === window.selectedPartnerSuit &&
        playedCardRank === window.selectedPartnerRank) {
        
        window.partnerRevealed = true; // Set flag to true
        // The player who played the partner card is the partner
        // (This should match window.partnerPlayerName, which is identified in game_logic.js)
        showPartnerRevealMessage();
        window.displayMessage(`The partner card (${playedCardRank} of ${playedCardSuit}) has been played!`, "message-box");
    }

    // Disable current player's cards immediately after playing
    window.updatePlayerCardInteractions(null, null);

    // Check if the trick is complete (all 4 players have played)
    if (window.cardsInCurrentTrick === window.players.length) {
        window.displayMessage("All cards played for the trick!", "message-box");
        // Evaluate trick winner after a short delay to let the last card animation settle
        setTimeout(evaluateTrick, 700);
    } else {
        // Advance to the next player's turn in the trick
        advanceTrickTurn();
        const nextPlayer = window.players[window.currentPlayerIndex];
        window.displayMessage(`${window.formatPlayerDisplayName(nextPlayer)}'s turn to play.`, "message-box");
        
        // Enable next player's cards, passing the lead suit for suit-following rule
        window.updatePlayerCardInteractions(nextPlayer, window.leadSuitForTrick);
    }
}


/**
 * Advances the turn to the next player in the trick sequence.
 */
function advanceTrickTurn() {
    // This is a simplified turn order. In a real game, it follows lead player.
    // For now, it just goes clockwise from the previous player.
    window.currentPlayerIndex = (window.currentPlayerIndex + 1) % window.players.length;
    // Skip players who have already played in this trick (if logic becomes more complex)
    // For a simple 4-card trick, this sequential advance is usually fine.
}

/**
 * Calculates the points for a given card based on the game's scoring rules.
 * @param {object} card - The card object {suit: string, rank: string}.
 * @returns {number} The point value of the card.
 */
function getCardPoints(card) {
    const { rank, suit } = card;
    if (rank === 'ace') {
        return 20;
    } else if (rank === 'jack' || rank === 'king') {
        return 10;
    } else if (rank === 'queen') {
        if (suit === 'spades') { // Queen of Spades (Black Queen)
            return 30;
        }
        return 10; // Other Queens
    } else if (rank === '10') {
        return 10;
    } else if (rank === '5') {
        return 5;
    }
    return 0; // All other cards (2,3,4,6,7,8,9)
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

    // Define card rank order for comparison (higher number is better)
    const rankOrder = {
        "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
        "jack": 11, "queen": 12, "king": 13, "ace": 14
    };

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
            if (rankOrder[currentCard.rank] > rankOrder[winningCard.rank]) {
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
                if (rankOrder[currentCard.rank] > rankOrder[winningCard.rank]) {
                    winningCardInfo = currentCardInfo;
                }
            }
            // If neither are trump and neither follow lead suit, the first card (lead suit) still wins
            // unless it was beaten by a trump or a higher card of the lead suit.
            // This scenario means currentCard sluffed and cannot win unless winningCard also sluffed and was lower.
            // Given the rules of play, this 'else' block implies both are non-winning suits, so winningCardInfo remains.
        }
    }

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

    // Clear center cards (face down) and start next trick after a delay
    setTimeout(() => {
        if (typeof window.clearCenterPlayedCards === 'function') {
            window.clearCenterPlayedCards(true);
        }

        // CRITICAL FIX: Change 13 to window.cardsPerPlayer to correctly identify end of round
        if (window.trickCount < window.cardsPerPlayer) { 
            window.startTrick(); // Call the global startTrick
        } else {
            // CRITICAL FIX: Call endRound() here instead of endGame()
            window.endRound(); 
        }
    }, 1000);
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
    }
}

// Expose globally
window.updatePlayerCardInteractions = updatePlayerCardInteractions;
window.playCardInTrick = playCardInTrick;
