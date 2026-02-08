/**
 * BadgeSystem - Enhanced Game-Specific Badge Tracking
 * One badge per game from the 29-game collection
 */

const BadgeSystem = (() => {
    const STORAGE_KEY = 'infinityNexus_gameBadges';
    const STORAGE_PROGRESS = 'infinityNexus_badgeProgress';

    // All 29 games with their badges
    const BADGES = [
        // Games Section (17 games)
        {
            id: 'click_me',
            name: 'Reality Bender',
            icon: '🖱️',
            game: 'Click Me',
            description: 'Master the art of clicking reality itself',
            flavor: 'When you click enough times, reality begins to question itself.',
            category: 'game',
            rarity: 'uncommon',
            points: 25,
            progress: { current: 0, total: 5000, label: 'clicks' },
            reward: { description: 'Reality manipulation +1', points: 25 }
        },
        {
            id: 'clicker_quest',
            name: 'Incremental Legend',
            icon: '👆',
            game: 'Clicker Quest+ Pro',
            description: 'Reach 10,000,000 gold in the infinite realm',
            flavor: 'Numbers grow ever larger. Time loses meaning.',
            category: 'game',
            rarity: 'epic',
            points: 100,
            progress: { current: 0, total: 10000000, label: 'gold' },
            reward: { description: 'Prestige Power +50%', points: 100 }
        },
        {
            id: 'do_not_press',
            name: 'The Brave One',
            icon: '🔘',
            game: 'DO NOT PRESS',
            description: 'Press the forbidden button 100 times',
            flavor: 'They said not to press it. You did anyway.',
            category: 'game',
            rarity: 'rare',
            points: 40,
            progress: { current: 0, total: 100, label: 'presses' },
            reward: { description: 'Chaos Resistance', points: 40 }
        },
        {
            id: 'geometric_dash',
            name: 'Geometric Master',
            icon: '🟦',
            game: 'Geometric Dash Pro',
            description: 'Navigate 10,000 points of geometric obstacles',
            flavor: 'Shapes bend to your will. You are one with the geometry.',
            category: 'game',
            rarity: 'rare',
            points: 50,
            progress: { current: 0, total: 10000, label: 'points' },
            reward: { description: 'Shape Mastery', points: 50 }
        },
        {
            id: 'pokemon_nova',
            name: 'Pokémon Champion',
            icon: '⚡',
            game: 'Pokémon Nova Enhanced',
            description: 'Catch and train 30 unique Pokémon',
            flavor: 'The bond between trainer and Pokémon transcends worlds.',
            category: 'game',
            rarity: 'rare',
            points: 75,
            progress: { current: 0, total: 30, label: 'pokémon caught' },
            reward: { description: 'Poké Ball Factory', points: 75 }
        },
        {
            id: 'puzzle_master',
            name: 'Puzzle Prodigy',
            icon: '🧩',
            game: 'Puzzle Master',
            description: 'Complete 25 puzzles on all difficulty levels',
            flavor: 'Every piece finds its place in your mind.',
            category: 'game',
            rarity: 'uncommon',
            points: 35,
            progress: { current: 0, total: 25, label: 'puzzles' },
            reward: { description: 'Spatial IQ +20', points: 35 }
        },
        {
            id: 'pyramid',
            name: 'Ancient Explorer',
            icon: '🏜️',
            game: 'Pyramid',
            description: 'Unlock all secrets of the pyramid',
            flavor: 'The ancient structure finally reveals its mysteries to you.',
            category: 'game',
            rarity: 'uncommon',
            points: 40,
            progress: null,
            reward: { description: 'Archaeology Mastery', points: 40 }
        },
        {
            id: 'space_game',
            name: 'Space Warrior',
            icon: '🚀',
            game: 'Space Game',
            description: 'Survive 15 waves of cosmic threats',
            flavor: 'You are the last shield between Earth and the void.',
            category: 'game',
            rarity: 'rare',
            points: 55,
            progress: { current: 0, total: 15, label: 'waves' },
            reward: { description: 'Galactic Defense', points: 55 }
        },
        {
            id: 'box_game',
            name: 'Box Architect',
            icon: '📦',
            game: 'The Box',
            description: 'Solve all layers and reach the final truth',
            flavor: 'Reality is a series of nested revelations.',
            category: 'game',
            rarity: 'epic',
            points: 90,
            progress: null,
            reward: { description: 'Truth Unveiled', points: 90 }
        },
        {
            id: 'the_impossible',
            name: 'Impossible Victor',
            icon: '😵',
            game: 'The Impossible Game',
            description: 'Complete all remade levels with flawless precision',
            flavor: 'You have conquered what was deemed impossible.',
            category: 'game',
            rarity: 'legendary',
            points: 150,
            progress: null,
            reward: { description: 'Legendary Status', points: 150 }
        },
        {
            id: 'tower_defense_plus',
            name: 'Tower Strategist',
            icon: '🛡️',
            game: 'Tower Defense+',
            description: 'Defend against 25 waves on challenging maps',
            flavor: 'Your towers stand eternal against the endless waves.',
            category: 'game',
            rarity: 'rare',
            points: 60,
            progress: { current: 0, total: 25, label: 'waves' },
            reward: { description: 'Defense Mastery', points: 60 }
        },
        {
            id: 'tower_defense_2',
            name: 'Advanced Commander',
            icon: '🏰',
            game: 'Tower Defense 2+',
            description: 'Master all 4 maps with optimal strategy',
            flavor: 'War itself bows to your strategic brilliance.',
            category: 'game',
            rarity: 'epic',
            points: 100,
            progress: { current: 0, total: 4, label: 'maps mastered' },
            reward: { description: 'Strategic Genius', points: 100 }
        },
        {
            id: 'wizard_battle',
            name: 'Arcane Master',
            icon: '🧙',
            game: 'Wizard Battle',
            description: 'Cast 500 devastating spells in duels',
            flavor: 'Magic flows through you like an endless river.',
            category: 'game',
            rarity: 'rare',
            points: 65,
            progress: { current: 0, total: 500, label: 'spells cast' },
            reward: { description: 'Arcane Power', points: 65 }
        },
        {
            id: 'zombie_survival',
            name: 'Undead Slayer',
            icon: '🧟',
            game: 'Zombie Survival',
            description: 'Annihilate 1000 zombies and survive the horde',
            flavor: 'The undead fear your name and the sound of your guns.',
            category: 'game',
            rarity: 'rare',
            points: 70,
            progress: { current: 0, total: 1000, label: 'zombies killed' },
            reward: { description: 'Zombie Exterminator', points: 70 }
        },
        {
            id: 'dig_deep',
            name: 'Deep Miner',
            icon: '⛏️',
            game: 'Dig Deep',
            description: 'Excavate to depth 100 and find precious gems',
            flavor: 'The deeper you dig, the richer the treasures you find.',
            category: 'game',
            rarity: 'rare',
            points: 55,
            progress: { current: 0, total: 100, label: 'depth' },
            reward: { description: 'Diamond Prospector', points: 55 }
        },
        {
            id: 'worlds_dumbest',
            name: 'Persistent Clicker',
            icon: '🤦',
            game: "The World's Dumbest Game",
            description: 'Reach level 30 and embrace the chaos',
            flavor: 'The game knows you\'re not smart. You click anyway.',
            category: 'game',
            rarity: 'uncommon',
            points: 30,
            progress: { current: 0, total: 30, label: 'levels' },
            reward: { description: 'Chaos Embraced', points: 30 }
        },

        // Casino Section (5 games)
        {
            id: 'blackjack_plus',
            name: 'Card Sharp',
            icon: '♠️',
            game: 'Blackjack+',
            description: 'Win 50 hands of blackjack and beat the dealer',
            flavor: 'You know when to hit and when to stand.',
            category: 'casino',
            rarity: 'uncommon',
            points: 35,
            progress: { current: 0, total: 50, label: 'wins' },
            reward: { description: 'House Edge -5%', points: 35 }
        },
        {
            id: 'cursed_dice',
            name: 'Luck Defier',
            icon: '🎲',
            game: 'Cursed Dice',
            description: 'Roll the cursed dice 200 times and survive',
            flavor: 'The dice are cursed, but your luck transcends fate.',
            category: 'casino',
            rarity: 'rare',
            points: 50,
            progress: { current: 0, total: 200, label: 'rolls' },
            reward: { description: 'Curse Immunity', points: 50 }
        },
        {
            id: 'poker',
            name: 'Poker Legend',
            icon: '🃏',
            game: 'Poker',
            description: 'Accumulate 5,000,000 chips in Texas Hold\'em',
            flavor: 'You read every tell. Every bluff is transparent to you.',
            category: 'casino',
            rarity: 'epic',
            points: 95,
            progress: { current: 0, total: 5000000, label: 'chips' },
            reward: { description: 'Poker Mastery', points: 95 }
        },
        {
            id: 'roulette',
            name: 'Fortune\'s Favorite',
            icon: '🎡',
            game: 'Roulette',
            description: 'Win big on roulette with perfect timing',
            flavor: 'The wheel spins in your favor. Always.',
            category: 'casino',
            rarity: 'uncommon',
            points: 40,
            progress: { current: 0, total: 20, label: 'big wins' },
            reward: { description: 'Lucky Aura', points: 40 }
        },
        {
            id: 'slot_machine',
            name: 'Jackpot King',
            icon: '🎰',
            game: 'Slot Machine',
            description: 'Hit the jackpot 5 times on the slots',
            flavor: 'The reels align. The bells ring. Victory is yours.',
            category: 'casino',
            rarity: 'rare',
            points: 60,
            progress: { current: 0, total: 5, label: 'jackpots' },
            reward: { description: 'Slot Master', points: 60 }
        },

        // Simulations Section (5 games)
        {
            id: 'great_empire',
            name: 'Empire Builder',
            icon: '👑',
            game: 'Great Empire',
            description: 'Build an empire spanning multiple territories',
            flavor: 'From humble beginnings, you forge an empire for the ages.',
            category: 'sim',
            rarity: 'epic',
            points: 85,
            progress: null,
            reward: { description: 'Royal Title', points: 85 }
        },
        {
            id: 'metropolis',
            name: 'Metropolis Mayor',
            icon: '🏙️',
            game: 'Metropolis Builder',
            description: 'Grow your city to 50,000 population',
            flavor: 'Your city has become a beacon of civilization.',
            category: 'sim',
            rarity: 'rare',
            points: 70,
            progress: { current: 0, total: 50000, label: 'population' },
            reward: { description: 'Urban Planner', points: 70 }
        },
        {
            id: 'mini_empire',
            name: 'Defender\'s Glory',
            icon: '🛡️',
            game: 'Mini Empire: Defenders',
            description: 'Defend your 10x10 empire against all threats',
            flavor: 'Small but mighty. Your empire never falls.',
            category: 'sim',
            rarity: 'uncommon',
            points: 45,
            progress: null,
            reward: { description: 'Impenetrable Defense', points: 45 }
        },
        {
            id: 'supply_demand',
            name: 'Economic Tycoon',
            icon: '💼',
            game: 'Supply & Demand',
            description: 'Build a profitable shop with 100,000 gold revenue',
            flavor: 'Supply meets demand. Profit flows like water.',
            category: 'sim',
            rarity: 'rare',
            points: 65,
            progress: { current: 0, total: 100000, label: 'gold' },
            reward: { description: 'Market Dominator', points: 65 }
        },
        {
            id: 'wealth_builder',
            name: 'Money Magnet',
            icon: '💰',
            game: 'Wealth Builder',
            description: 'Accumulate 1,000,000 in passive wealth',
            flavor: 'Money makes more money. You\'ve achieved financial nirvana.',
            category: 'sim',
            rarity: 'epic',
            points: 100,
            progress: { current: 0, total: 1000000, label: 'wealth' },
            reward: { description: 'Financial Genius', points: 100 }
        },

        // Monthly Challenges (2 games)
        {
            id: 'january_challenge',
            name: 'January Victor',
            icon: '❄️',
            game: 'January Challenge',
            description: 'Complete the January platformer challenge',
            flavor: 'Winter challenges forged your indomitable spirit.',
            category: 'challenge',
            rarity: 'uncommon',
            points: 50,
            progress: null,
            reward: { description: 'Seasonal Champion', points: 50 }
        },
        {
            id: 'february_challenge',
            name: 'February Warrior',
            icon: '❤️',
            game: 'February Challenge',
            description: 'Complete the February challenge with flying colors',
            flavor: 'Love and determination carried you through.',
            category: 'challenge',
            rarity: 'uncommon',
            points: 50,
            progress: null,
            reward: { description: 'Monthly Legend', points: 50 }
        },

        // Special Badges
        {
            id: 'completionist',
            name: '🌟 True Nexus Master',
            icon: '✨',
            game: 'All 29 Games',
            description: 'Earn badges from all 29 games in the collection',
            flavor: 'You have conquered every challenge. You are the ultimate gamer.',
            category: 'special',
            rarity: 'legendary',
            points: 500,
            progress: { current: 0, total: 29, label: 'games mastered' },
            reward: { description: 'Infinity Nexus Crown', points: 500 }
        }
    ];

    function init() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
            localStorage.setItem(STORAGE_PROGRESS, JSON.stringify({}));
        }
    }

    function getAllBadges() {
        return BADGES.map(badge => {
            const progress = JSON.parse(localStorage.getItem(STORAGE_PROGRESS) || '{}')[badge.id];
            return {
                ...badge,
                progress: badge.progress ? {
                    ...badge.progress,
                    current: progress?.current || 0
                } : null
            };
        });
    }

    function getEarnedBadges() {
        const earned = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return BADGES.filter(badge => earned.includes(badge.id));
    }

    function isBadgeEarned(badgeId) {
        const earned = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return earned.includes(badgeId);
    }

    function unlockBadge(badgeId) {
        if (isBadgeEarned(badgeId)) return false;

        const earned = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        earned.push(badgeId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(earned));

        window.dispatchEvent(new CustomEvent('badgeEarned', { detail: { badgeId } }));

        const badge = BADGES.find(b => b.id === badgeId);
        if (badge) {
            showBadgeNotification(badge);
        }

        return true;
    }

    function updateProgress(badgeId, current, total = null) {
        const progress = JSON.parse(localStorage.getItem(STORAGE_PROGRESS) || '{}');
        progress[badgeId] = { current, total };
        localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(progress));

        const badge = BADGES.find(b => b.id === badgeId);
        if (badge && badge.progress && current >= badge.progress.total) {
            unlockBadge(badgeId);
        }

        // Check completionist badge
        const allEarned = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (allEarned.length === 29) {
            unlockBadge('completionist');
        }
    }

    function incrementProgress(badgeId, amount = 1) {
        const progress = JSON.parse(localStorage.getItem(STORAGE_PROGRESS) || '{}');
        const current = (progress[badgeId]?.current || 0) + amount;

        const badge = BADGES.find(b => b.id === badgeId);
        if (badge && badge.progress) {
            updateProgress(badgeId, current, badge.progress.total);
        }
    }

    function getProgress(badgeId) {
        const progress = JSON.parse(localStorage.getItem(STORAGE_PROGRESS) || '{}');
        return progress[badgeId] || { current: 0, total: 0 };
    }

    function showBadgeNotification(badge) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #6e8efb 0%, #a777e3 100%);
            color: white;
            padding: 25px 35px;
            border-radius: 18px;
            box-shadow: 0 15px 40px rgba(110, 142, 251, 0.4),
                        0 0 60px rgba(167, 119, 227, 0.2);
            z-index: 10000;
            font-weight: 700;
            animation: slideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
            max-width: 380px;
            font-family: 'DM Sans', Arial, sans-serif;
            border: 2px solid rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
        `;

        const rarity = badge.rarity;
        let rarityColor = '#4ade80';
        if (rarity === 'rare') rarityColor = '#a777e3';
        if (rarity === 'epic') rarityColor = '#ffd700';
        if (rarity === 'legendary') rarityColor = '#ff4757';

        notification.innerHTML = `
            <div style="display: flex; gap: 15px; align-items: center;">
                <div style="font-size: 3em; line-height: 1;">${badge.icon}</div>
                <div>
                    <div style="font-size: 1.3em; margin-bottom: 5px; letter-spacing: 0.5px;">BADGE UNLOCKED!</div>
                    <div style="font-size: 1.1em; margin-bottom: 5px; font-weight: 800;">${badge.name}</div>
                    <div style="font-size: 0.85em; opacity: 0.9; margin-bottom: 5px;">${badge.game}</div>
                    <div style="font-size: 0.9em; color: ${rarityColor}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">+${badge.points || 10} Points • ${rarity}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease-out forwards';
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }

    return {
        init,
        getAllBadges,
        getEarnedBadges,
        isBadgeEarned,
        unlockBadge,
        updateProgress,
        incrementProgress,
        getProgress
    };
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', BadgeSystem.init);
} else {
    BadgeSystem.init();
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(500px) scale(0.8);
            opacity: 0;
        }
        to {
            transform: translateX(0) scale(1);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0) scale(1);
            opacity: 1;
        }
        to {
            transform: translateX(500px) scale(0.8);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
