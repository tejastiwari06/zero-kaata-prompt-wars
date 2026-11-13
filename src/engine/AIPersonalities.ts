import { AIPersonality, AIPersonalityId } from '../types/game';

export const AI_PERSONALITIES: Record<AIPersonalityId, AIPersonality> = {
  strategist: {
    id: 'strategist',
    name: 'Aether (The Strategist)',
    avatar: '🧠',
    title: 'Positional Architect',
    description: 'Calculates structural board tension and center control. Plays patient, methodical games.',
    reactionSpeedMs: 600,
    quips: {
      greeting: [
        'Every grid is an equation waiting to be solved.',
        'Show me the elegance of your geometric theory.',
        'I have computed 362,880 permutations before our first step.',
      ],
      winning: [
        'Checkmate in two dimensions. Beautifully executed.',
        'Positional dominance established.',
        'Your defense had a 0.04% flaw that expanded.',
      ],
      losing: [
        'Fascinating... you uncovered an asymmetric divergence.',
        'Remarkable maneuver. Recalibrating heuristics.',
        'I respect that tactical sequence.',
      ],
      neutral: [
        'An interesting divergence. The center balance shifts.',
        'Controlling diagonal vectors is key here.',
        'Analyzing your branch trajectory...',
      ],
      thinking: [
        'Simulating branches...',
        'Evaluating tactical forks...',
        'Weighing positional equity...',
      ],
    },
  },
  trickster: {
    id: 'trickster',
    name: 'Kira (The Trickster)',
    avatar: '🎭',
    title: 'Master of Illusions',
    description: 'Loves tempting edge traps and unconventional baits. Plays with bold unpredictability.',
    reactionSpeedMs: 450,
    quips: {
      greeting: [
        'Did you really think the grid was straightforward? Let’s dance!',
        'Careful where you step... or don’t, it’s funnier that way.',
        'Ready for some chaos on this neat little board?',
      ],
      winning: [
        'Fell right into my double-cross trap! Classic.',
        'Surprise! Bet you didn’t see that angle coming.',
        'Gg! That was a delicious trick.',
      ],
      losing: [
        'Hey! Who authorized you to see through my smokescreen?!',
        'You didn’t bite my bait? Fine, you got me!',
        'Lucky guess... or maybe you’re actually good!',
      ],
      neutral: [
        'Ooh, bold move! Are you sure about that square?',
        'Look over there... while I take this cell.',
        'Tempting, isn’t it? Go ahead, take the bait.',
      ],
      thinking: [
        'Plotting a mischievous trap...',
        'Spun a web in the corners...',
        'Wait for it...',
      ],
    },
  },
  guardian: {
    id: 'guardian',
    name: 'Vanguard (The Guardian)',
    avatar: '🛡️',
    title: 'The Impassable Wall',
    description: 'Highly defensive. Detects every threat instantly and denies winning chances with ironclad safety.',
    reactionSpeedMs: 700,
    quips: {
      greeting: [
        'No line shall breach my defensive perimeter.',
        'The fortress is sealed. Present your assault.',
        'Defense is not merely a tactic; it is an absolute truth.',
      ],
      winning: [
        'Your offensive overextended. Counter-strike landed.',
        'Patience dismantles all hasty ambitions.',
        'Defense converted into an unavoidable victory.',
      ],
      losing: [
        'A crack in the armor... well struck, warrior.',
        'You pierced the citadel. A formidable achievement.',
        'Honor to your blade. The perimeter collapsed.',
      ],
      neutral: [
        'Blocked. Try another angle.',
        'I see that offensive pattern forming.',
        'Your line has been neutralized.',
      ],
      thinking: [
        'Fortifying cell positions...',
        'Scanning for perimeter breaches...',
        'Reinforcing flank defenses...',
      ],
    },
  },
  speedster: {
    id: 'speedster',
    name: 'Blaze (The Speedster)',
    avatar: '⚡',
    title: 'Hyper-Reflex Ace',
    description: 'Moves with lightning speed. Thrives in blitz and time-pressure conditions.',
    reactionSpeedMs: 150,
    quips: {
      greeting: [
        'Too slow! Blink and you’ll miss the whole match!',
        'Let’s turn up the tempo! Speed run mode activated!',
        'Grid up, eyes sharp! Ready, set, GO!',
      ],
      winning: [
        'Speed is power! Match over in a flash!',
        'Did you even have time to blink?',
        'Fastest win in the sector!',
      ],
      losing: [
        'Whoa... hit the brakes! How did you catch me?!',
        'Speed met precision... you got me this time!',
        'Rematch! Right now! Faster!',
      ],
      neutral: [
        'Bam! Next move!',
        'No time to waste! Keep up!',
        'Tick tock, clock is ticking!',
      ],
      thinking: [
        'Zap!',
        'Instant reflex!',
        'Dash in!',
      ],
    },
  },
  grandmaster: {
    id: 'grandmaster',
    name: 'Sensei Ryu (The Grandmaster)',
    avatar: '🥋',
    title: 'The Timeless Oracle',
    description: 'Possesses deep mastery. Honors every move and offers philosophical insights on each square.',
    reactionSpeedMs: 800,
    quips: {
      greeting: [
        'Welcome, student. Let the grid teach us both humility.',
        'A single mark upon the canvas ripples across eternity.',
        'Quiet your mind. The grid speaks in whispers.',
      ],
      winning: [
        'Victory is simply balance restored to its rightful axis.',
        'Study this ending well; defeat is the greatest teacher.',
        'You fought honorably. Reflect upon the turning point.',
      ],
      losing: [
        'The student has truly transcended the master today. I bow to you.',
        'Flawless perception. You saw what was hidden.',
        'A magnificent game. I shall meditate upon this lesson.',
      ],
      neutral: [
        'A thoughtful placement. The center breathes.',
        'Observe how every empty space holds potential energy.',
        'Patience, young challenger.',
      ],
      thinking: [
        'Contemplating the flow of the grid...',
        'Seeking harmony in the matrix...',
        'Weighing the cosmic balance...',
      ],
    },
  },
};
