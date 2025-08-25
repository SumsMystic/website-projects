// ai_logic.js

// Expose AI functions globally for game_logic.js to call
window.ai = {};

/**
 * A helper function to evaluate the "strength" of a player's hand for bidding.
 * This is a simplified logic. More advanced AIs would use complex algorithms.
 * @param {Array<Object>} hand - The player's hand.
 * @returns {number} - A numerical representation of hand strength.
 */
function getHandStrength(hand) {
    let strength = 0;
    const suitCounts = {};

    hand.forEach(card => {
        // Accumulate points for high-value cards
        strength += window.getCardPoints(card) || 0;

        // Count cards per suit for potential long suits
        suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    });

    // Add bonus for long suits (potential for trumps)
    for (const suit in suitCounts) {
        if (suitCounts[suit] >= 5) { // Bonus for 5 or more cards in a suit
            strength += (suitCounts[suit] - 4) * 5; // +5 for 5th card, +10 for 6th, etc.
        }
    }

    return strength;
}

/**
 * AI logic for making a bid during the bidding phase.
 * @param {string} player - The name of the AI player (e.g., 'north', 'east', 'west').
 * @param {number} currentHighestBid - The current highest bid placed.
 * @param {Array<Object>} playerHand - The AI player's hand.
 * @returns {number|string} - The AI's bid amount, or 'pass'.
 */
window.ai.aiMakeBid = function(player, currentHighestBid, playerHand) {
    const handStrength = getHandStrength(playerHand);
    console.log(`${window.formatPlayerDisplayName(player)}'s hand strength: ${handStrength}`);

    const MIN_BID = window.MIN_BID || 170; // Use global MIN_BID from game_logic.js
    const BID_INCREMENT = window.BID_INCREMENT || 5; // Use global BID_INCREMENT

    // Realistic bidding strategy based on hand strength:
    // These thresholds are subjective and can be fine-tuned.
    // They aim to make AI bid more conservatively for weaker hands.

    let desiredBid = 0;
    let baseBid = currentHighestBid + BID_INCREMENT; // Always increment by BID_INCREMENT

    if (handStrength >= 100) {
        // Very Strong Hand: Can confidently bid higher, aiming for a win.
        desiredBid = Math.max(baseBid, 200); // Ensure bid is at least 200 if confident
        desiredBid = Math.min(desiredBid, 240); // Cap aggressive bids at 240
    } else if (handStrength >= 85) {
        // Strong Hand (Upper Moderate): Can bid, but with more caution.
        desiredBid = Math.max(baseBid, MIN_BID + 10); // Bid slightly above minimum
        desiredBid = Math.min(desiredBid, 220); // More conservative cap
    } else if (handStrength >= 55) {
        // Moderate Hand (Lower Moderate): Bid only if the current bid is low and they have decent strength.
        desiredBid = Math.max(baseBid, MIN_BID); // Start at MIN_BID if higher than current
        desiredBid = Math.min(desiredBid, 200); // Cap at 200
    } else if (handStrength >= 35) {
        // Weak-Moderate Hand: Bid only if the current bid is very low (e.g., still at 170)
        // This is primarily for the very first bidder with a weak-moderate hand.
        if (currentHighestBid < 185) { // Only bid if current bid is very low
            desiredBid = Math.max(baseBid, MIN_BID);
            desiredBid = Math.min(desiredBid, 190); // Smallest possible increment, low cap
        } else {
            return 'pass'; // Pass if bid is already getting high
        }
    } else {
        // Weak Hand: Always pass.
        return 'pass';
    }

    // Ensure the bid is always a multiple of BID_INCREMENT
    desiredBid = Math.ceil(desiredBid / BID_INCREMENT) * BID_INCREMENT;
    
    // Final check to ensure the bid is valid (higher than current and within MAX_BID)
    if (desiredBid <= currentHighestBid) {
        return 'pass'; // Cannot make a valid higher bid, so pass
    }
    
    // Ensure bid doesn't exceed MAX_BID overall (though internal caps should handle most of this)
    desiredBid = Math.min(desiredBid, MAX_BID); 

    // If this is the very first bid (currentHighestBid is 0) and the calculated desiredBid
    // is somehow still less than MIN_BID, ensure it at least bids MIN_BID if it decided to bid.
    // This can happen if handStrength is in the 35-55 range and baseBid is too low.
    if (currentHighestBid === 0 && desiredBid < MIN_BID && desiredBid !== 'pass') {
        return MIN_BID;
    }


    console.log(`${window.formatPlayerDisplayName(player)} decided to bid: ${desiredBid}`);
    return desiredBid;
};

/**
 * AI logic for choosing the trump suit after winning the bid.
 * @param {string} player - The AI player who won the bid.
 * @param {Array<Object>} playerHand - The AI player's hand.
 * @returns {string} - The chosen trump suit.
 */
window.ai.aiChooseTrump = function(player, playerHand) {
    const suitCounts = {};
    window.suits.forEach(suit => suitCounts[suit] = 0); // Initialize counts for all suits

    playerHand.forEach(card => {
        suitCounts[card.suit]++;
    });

    // Find the suit with the most cards (longest suit)
    let chosenTrump = null;
    let maxCount = -1;
    for (const suit in suitCounts) {
        if (suitCounts[suit] > maxCount) {
            maxCount = suitCounts[suit];
            chosenTrump = suit;
        }
    }
    console.log(`${window.formatPlayerDisplayName(player)} chose ${chosenTrump} as trump.`);
    return chosenTrump;
};

/**
 * AI logic for choosing a partner card.
 * A very simple strategy: pick the Ace of a suit that the AI itself does NOT hold,
 * or if it holds all Aces, pick a King of a suit it doesn't hold.
 * Or if all high cards are in its hand, it goes solo by picking one of its own cards.
 * @param {string} player - The AI player who won the bid.
 * @param {Array<Object>} playerHand - The AI player's hand.
 * @returns {Object} - An object {suit: string, rank: string} representing the partner card.
 */
window.ai.aiChoosePartner = function(player, playerHand) {
    const aiHasCard = (suit, rank) => playerHand.some(c => c.suit === suit && c.rank === rank);

    // Try to pick an Ace not in hand
    for (const suit of window.suits) {
        if (!aiHasCard(suit, 'ace')) {
            console.log(`${window.formatPlayerDisplayName(player)} chose Ace of ${suit} as partner.`);
            return { suit: suit, rank: 'ace' };
        }
    }

    // If all Aces are in AI's hand, try to pick a King not in hand
    for (const suit of window.suits) {
        if (!aiHasCard(suit, 'king')) {
            console.log(`${window.formatPlayerDisplayName(player)} chose King of ${suit} as partner.`);
            return { suit: suit, rank: 'king' };
        }
    }

    // If AI has all Aces and Kings (highly unlikely but possible in debug small hands), or
    // if a more complex situation arises where it can't find a high card outside its hand,
    // it will pick its highest card to 'go solo' (partner with itself).
    // This part ensures a valid card is always returned.
    const highestRankedCardInHand = playerHand.reduce((prev, current) => {
        const rankOrder = { "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "jack": 11, "queen": 12, "king": 13, "ace": 14 };
        return (rankOrder[current.rank] > rankOrder[prev.rank]) ? current : prev;
    }, playerHand[0]);

    if (highestRankedCardInHand) {
        console.log(`${window.formatPlayerDisplayName(player)} decided to go solo with ${highestRankedCardInHand.rank} of ${highestRankedCardInHand.suit}.`);
        return highestRankedCardInHand;
    }

    // Fallback: This should ideally not be reached if hand is not empty
    console.warn(`${window.formatPlayerDisplayName(player)} could not find a suitable partner card, choosing first card in hand.`);
    return playerHand[0];
};

/**
 * AI logic for playing a card during a trick.
 * @param {string} player - The name of the AI player.
 * @param {Array<Object>} playerHand - The AI player's current hand.
 * @param {Array<Object>} currentTrick - Cards already played in the current trick: [{cardElem, player}].
 * @param {string|null} leadSuit - The suit of the first card played in the trick.
 * @param {string|null} trumpSuit - The current trump suit.
 * @returns {HTMLElement} - The HTML element of the card the AI decided to play.
 */
window.ai.aiPlayCard = function(player, playerHand, currentTrick, leadSuit, trumpSuit) {
    const playableCards = window.getPlayableCards(playerHand, leadSuit, trumpSuit);
    let cardToPlay = null;

    if (playableCards.length === 0) {
        console.error(`${window.formatPlayerDisplayName(player)}: No playable cards! This should not happen.`);
        // Fallback: play any card if no playable cards are found (emergency)
        return playerHand[0] ? document.querySelector(`.hand[data-player="${player}"] .card[data-suit="${playerHand[0].suit}"][data-rank="${playerHand[0].rank}"]`) : null;
    }

    // Find the card element in handElements that matches the given card's suit and rank.
    function getCardElement(card) {
        // Convert hand objects to card elements for selection
        const handElements = Array.from(document.querySelectorAll(`.${player}-cards .hand .card`));
        // console.log(`Hand elements for ${window.formatPlayerDisplayName(player)}:`, handElements);
        for (let i = 0; i < handElements.length; i++) {
            const elem = handElements[i];
            // console.log(`Checking card element: ${elem.dataset.rank} of ${elem.dataset.suit} against ${card.rank} of ${card.suit}`);
            if (elem.dataset.suit === card.suit && elem.dataset.rank === card.rank) {
                return elem;
            }
        }
        
        // If no matching element is found, return undefined.
        console.warn(`Card element not found in hand for ${card.rank} of ${card.suit}`);
        return undefined;
    }

    // --- Strategy for playing a card ---

    // 1. If leading the trick: Play a low card to save high cards, or a high card to establish lead.
    // AI is the leading player
    if (leadSuit === null) {
        // --- NEW: AI LEADING STRATEGY ---
        // Strategy: Lead with the highest card from the longest suit to try and draw out opponents' high cards.
        const suitCounts = {};
        playerHand.forEach(card => {
            suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
        });

        let longestSuit = null;
        let maxCount = 0;
        for (const suit in suitCounts) {
            if (suitCounts[suit] > maxCount) {
                maxCount = suitCounts[suit];
                longestSuit = suit;
            }
        }

        if (longestSuit) {
            const longestSuitCards = playableCards.filter(card => card.suit === longestSuit);
            // Play the highest card from the longest suit
            cardToPlay = longestSuitCards.sort((a, b) => window.getCardRankValue(b.rank) - window.getCardRankValue(a.rank))[0];
        } else {
            // Fallback strategy if no long suit: play the lowest point card to save high cards.
            cardToPlay = playableCards.sort((a, b) => window.getCardPoints(a) - window.getCardPoints(b))[0];
        }

    } else { // AI is not leading, must follow suit or trump/slough
        const cardsOfLeadSuit = playableCards.filter(card => card.suit === leadSuit);
        const trumpCards = playableCards.filter(card => card.suit === trumpSuit);

        // Determine if current winning card is beatable by a non-trump lead suit card
        // const currentWinningCardInfo = window.determineTrickWinner(currentTrick, trumpSuit);
        // Correct logic to find the current winning card in the trick
        let currentWinningCardInfo = currentTrick[0];
        let currentWinningCard = currentWinningCardInfo.card;
        for (let i = 1; i < currentTrick.length; i++) {
            const card = currentTrick[i].card;
            console.log("Comparing cards:", currentWinningCardInfo.card, "vs", card);
            currentWinningCard = window.compareCards(currentWinningCardInfo.card, card, leadSuit, trumpSuit);
        }
        const canBeatWithLeadSuit = cardsOfLeadSuit.some(card => 
            window.compareCards(card, currentWinningCard, leadSuit, trumpSuit) > 0
        );
        const canBeatWithTrump = trumpCards.some(card => 
            window.compareCards(card, currentWinningCard, leadSuit, trumpSuit) > 0
        );

        if (cardsOfLeadSuit.length > 0) { // Has cards of the lead suit
            if (canBeatWithLeadSuit) {
                // Play lowest card of lead suit that can win the trick
                const winningLeadCards = cardsOfLeadSuit.filter(card => 
                    window.compareCards(card, currentWinningCardInfo.card, leadSuit, trumpSuit) > 0
                );
                cardToPlay = winningLeadCards.sort((a, b) => window.getCardRankValue(a.rank) - window.getCardRankValue(b.rank))[0];
            } else {
                // Cannot win with lead suit, play lowest card of lead suit to save high cards
                cardToPlay = cardsOfLeadSuit.sort((a, b) => window.getCardRankValue(a.rank) - window.getCardRankValue(b.rank))[0];
            }
        } else { // Cannot follow suit
            if (trumpCards.length > 0) { // Has trumps
                if (canBeatWithTrump) {
                    // Play lowest trump that can win, if it's a valuable trick
                    // For basic AI, just trump if it can win and if trick value is high (e.g., > 10 points already)
                    const trickValue = currentTrick.reduce((sum, c) => sum + window.getCardPoints(c.card), 0);
                    if (trickValue >= 10 || currentWinningCardInfo.player === window.partnerPlayerName) { // Trump if trick is valuable or partner is winning
                         const winningTrumps = trumpCards.filter(card => 
                            window.compareCards(card, currentWinningCardInfo.card, leadSuit, trumpSuit) > 0
                        );
                        if (winningTrumps.length > 0) {
                           cardToPlay = winningTrumps.sort((a, b) => window.getCardRankValue(a.rank) - window.getCardRankValue(b.rank))[0];
                        } else {
                           // Can't win with trumps, just play lowest trump to save high trumps
                           cardToPlay = trumpCards.sort((a, b) => window.getCardRankValue(a.rank) - window.getCardRankValue(b.rank))[0];
                        }
                    } else {
                        // Play lowest trump to save higher trumps if trick is not valuable
                        cardToPlay = trumpCards.sort((a, b) => window.getCardRankValue(a.rank) - window.getCardRankValue(b.rank))[0];
                    }
                } else {
                    // Cannot win with trump, play lowest trump to save higher trumps
                    cardToPlay = trumpCards.sort((a, b) => window.getCardRankValue(a.rank) - window.getCardRankValue(b.rank))[0];
                }
            } else { // No cards of lead suit, no trumps - must slough
                // Play the lowest value card (non-scoring if possible)
                cardToPlay = playableCards.sort((a, b) => window.getCardPoints(getCardElement(a)) - window.getCardPoints(getCardElement(b)))[0];
            }
        }
    }

    // Ensure cardToPlay is never null and is one of the playable cards
    if (!cardToPlay && playableCards.length > 0) {
        cardToPlay = playableCards[0]; // Fallback to first playable card
    } else if (!cardToPlay && playerHand.length > 0) {
         // Ultimate fallback: if getPlayableCards returns nothing valid, just play the first card in hand
        cardToPlay = playerHand[0];
    }
    console.log(`[AI Logic] AI Player ${player} has selected: ${cardToPlay ? `${cardToPlay.rank} of ${cardToPlay.suit}` : 'NO CARD SELECTED!'}`);
     // Return the actual HTML element

    if (cardToPlay) {
        return getCardElement(cardToPlay);
    } else {
        console.warn("AI tried to play a card not found in hand:", cardToPlay);
    }
    
};

