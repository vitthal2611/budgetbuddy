import React, { useState, useEffect } from 'react';
import habitService from '../services/habitService';
import './HabitTracker.css';

const HabitTracker = () => {
  const [data, setData] = useState({ habits: [], completions: {}, missed: {} });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  
  const [formTrigger, setFormTrigger] = useState('');
  const [formAction, setFormAction] = useState('');
  const [formStartDate, setFormStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [formTime, setFormTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formIdentity, setFormIdentity] = useState('');
  const [formReward, setFormReward] = useState('');
  const [formMakeObvious, setFormMakeObvious] = useState('');
  const [showActionSuggestions, setShowActionSuggestions] = useState(false);
  const [showMakeObviousSuggestions, setShowMakeObviousSuggestions] = useState(false);
  const [showRewardSuggestions, setShowRewardSuggestions] = useState(false);
  const [showIdentitySuggestions, setShowIdentitySuggestions] = useState(false);
  const [showTriggerSuggestions, setShowTriggerSuggestions] = useState(false);
  const [showTimeSuggestions, setShowTimeSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [activeField, setActiveField] = useState(null); // Track which field is focused
  
  const [showCustomIdentity, setShowCustomIdentity] = useState(false);
  const [customIdentity, setCustomIdentity] = useState('');
  const [showCustomLocation, setShowCustomLocation] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingHabit, setReviewingHabit] = useState(null);
  const [review, setReview] = useState('');
  
  const [openMenuId, setOpenMenuId] = useState(null);
  const [activeTab, setActiveTab] = useState('today');
  const [todayOffset, setTodayOffset] = useState(0);
  const [dailyQuote, setDailyQuote] = useState('');

  // Motivational quotes inspired by Atomic Habits principles
  const motivationalQuotes = [
    "Small changes create remarkable results",
    "You don't rise to your goals, you fall to your systems",
    "Every action is a vote for the person you want to become",
    "Focus on getting 1% better every day",
    "The most effective way to change is to change your identity",
    "Make it obvious. Make it attractive. Make it easy. Make it satisfying.",
    "Habits are the compound interest of self-improvement",
    "You do not rise to the level of your goals, you fall to the level of your systems",
    "Success is the product of daily habits, not once-in-a-lifetime transformations",
    "The purpose of setting goals is to win the game. The purpose of building systems is to continue playing the game",
    "Your outcomes are a lagging measure of your habits",
    "Time magnifies the margin between success and failure",
    "The most powerful outcomes are delayed",
    "Be patient. Stick with it. Results will come",
    "Fall in love with the process rather than the product",
    "The secret to getting results is to never stop making improvements",
    "Standardize before you optimize",
    "Environment is the invisible hand that shapes behavior",
    "Motivation is overrated. Environment often matters more",
    "Make the cues of good habits obvious in your environment"
  ];

  // AI-powered 2-minute rule suggestions based on action input
  // Covers TOP 20 HABITS OF SUCCESSFUL PEOPLE
  const getTwoMinuteSuggestions = (actionInput) => {
    if (!actionInput || actionInput.trim().length < 2) {
      return [
        'Start with the first step',
        'Do the easiest part first',
        'Prepare the environment',
        'Take one small action',
        'Begin with 2 minutes only'
      ];
    }

    const input = actionInput.toLowerCase().trim();
    
    // TOP 20 HABITS OF SUCCESSFUL PEOPLE
    
    // 1. WAKE UP EARLY / MORNING ROUTINE
    if (input.match(/wake|early|morning|rise|5am|6am|sunrise/)) {
      return [
        'Set alarm across the room',
        'Open curtains immediately',
        'Sit up in bed',
        'Put feet on floor',
        'Splash cold water on face'
      ];
    }
    
    // 2. EXERCISE / PHYSICAL FITNESS
    if (input.match(/exercise|workout|gym|fitness|train|run|jog|walk|cardio|sport|athletic/)) {
      return [
        'Put on workout clothes',
        'Do 1 pushup or squat',
        'Walk to the gym door',
        'Put on running shoes',
        'Do 5 jumping jacks'
      ];
    }
    
    // 3. MEDITATION / MINDFULNESS
    if (input.match(/meditate|mindful|breathe|calm|relax|zen|peace|quiet time/)) {
      return [
        'Sit on meditation cushion',
        'Take 3 deep breaths',
        'Close eyes for 30 seconds',
        'Open meditation app',
        'Set timer for 2 minutes'
      ];
    }
    
    // 4. READING / CONTINUOUS LEARNING
    if (input.match(/read|book|novel|article|study|literature|learn|knowledge/)) {
      return [
        'Open book to bookmark',
        'Read one page',
        'Read one paragraph',
        'Sit in reading chair',
        'Turn off TV and pick up book'
      ];
    }
    
    // 5. GOAL SETTING / PLANNING
    if (input.match(/goal|plan|schedule|task|todo|list|agenda|prioritize|objective/)) {
      return [
        'Write tomorrow\'s top task',
        'Open planner or calendar',
        'Write down one priority',
        'Review today\'s tasks',
        'Set one reminder'
      ];
    }
    
    // 6. JOURNALING / REFLECTION
    if (input.match(/journal|reflect|diary|gratitude|write thoughts|document/)) {
      return [
        'Open journal and date page',
        'Write one sentence',
        'Write 3 things grateful for',
        'Reflect on one moment',
        'Write down one lesson learned'
      ];
    }
    
    // 7. HEALTHY EATING / NUTRITION
    if (input.match(/eat|meal|cook|food|healthy|nutrition|prepare|recipe|diet/)) {
      return [
        'Wash one vegetable',
        'Chop one ingredient',
        'Open healthy cookbook',
        'Put fruit in visible spot',
        'Prepare one healthy snack'
      ];
    }
    
    // 8. HYDRATION / DRINKING WATER
    if (input.match(/water|hydrate|drink|beverage|fluid/)) {
      return [
        'Fill glass with water',
        'Take one sip of water',
        'Place water bottle on desk',
        'Add ice to water bottle',
        'Drink half a glass'
      ];
    }
    
    // 9. TIME MANAGEMENT / PRODUCTIVITY
    if (input.match(/time|manage|productive|efficient|focus|concentrate|deep work/)) {
      return [
        'Set timer for 25 minutes',
        'Close unnecessary tabs',
        'Turn off notifications',
        'Clear desk workspace',
        'Write one priority task'
      ];
    }
    
    // 10. NETWORKING / RELATIONSHIP BUILDING
    if (input.match(/network|connect|relationship|reach out|call|text|message|contact|email/)) {
      return [
        'Open contact list',
        'Send one text message',
        'Write one sentence to send',
        'Schedule call for later',
        'Reply to one message'
      ];
    }
    
    // 11. LEARNING NEW SKILLS / SELF-IMPROVEMENT
    if (input.match(/learn|skill|course|tutorial|practice|training|education|develop/)) {
      return [
        'Open learning app',
        'Watch 2-minute tutorial',
        'Read one lesson intro',
        'Write down one thing to learn',
        'Review one flashcard'
      ];
    }
    
    // 12. FINANCIAL MANAGEMENT / SAVING MONEY
    if (input.match(/budget|save|invest|money|finance|expense|bill|wealth|financial/)) {
      return [
        'Open budgeting app',
        'Log one expense',
        'Review one transaction',
        'Transfer $1 to savings',
        'Check account balance'
      ];
    }
    
    // 13. POSITIVE THINKING / AFFIRMATIONS
    if (input.match(/affirm|positive|mindset|visualize|manifest|believe|confidence/)) {
      return [
        'Say one affirmation out loud',
        'Write one positive statement',
        'Look in mirror and smile',
        'Think of one success',
        'Visualize goal for 30 seconds'
      ];
    }
    
    // 14. TAKING BREAKS / REST
    if (input.match(/break|rest|pause|recharge|relax|unwind|decompress/)) {
      return [
        'Stand up and stretch',
        'Walk for 2 minutes',
        'Close eyes for 30 seconds',
        'Step away from screen',
        'Take 3 deep breaths'
      ];
    }
    
    // 15. ORGANIZATION / DECLUTTERING
    if (input.match(/organize|clean|tidy|declutter|sort|arrange|order/)) {
      return [
        'Clear one item from desk',
        'Put away one thing',
        'File one document',
        'Wipe down one surface',
        'Make bed'
      ];
    }
    
    // 16. SAYING NO / SETTING BOUNDARIES
    if (input.match(/no|boundary|limit|decline|refuse|prioritize|focus/)) {
      return [
        'Review one commitment',
        'Identify one thing to decline',
        'Write down your priorities',
        'Practice saying "no" once',
        'Evaluate one request'
      ];
    }
    
    // 17. CONTINUOUS FEEDBACK / SELF-ASSESSMENT
    if (input.match(/review|assess|evaluate|feedback|improve|analyze|measure/)) {
      return [
        'Review one completed task',
        'Write one lesson learned',
        'Identify one improvement',
        'Ask for one piece of feedback',
        'Reflect on one decision'
      ];
    }
    
    // 18. CREATIVE THINKING / INNOVATION
    if (input.match(/create|innovate|idea|brainstorm|think|imagine|design/)) {
      return [
        'Write down one idea',
        'Sketch one concept',
        'Ask "what if" question',
        'Combine two ideas',
        'Think of one solution'
      ];
    }
    
    // 19. GRATITUDE PRACTICE
    if (input.match(/gratitude|grateful|thankful|appreciate|blessing|thanks/)) {
      return [
        'Write one thing grateful for',
        'Thank one person',
        'Appreciate one moment',
        'Notice one blessing',
        'Express gratitude to someone'
      ];
    }
    
    // 20. QUALITY SLEEP / BEDTIME ROUTINE
    if (input.match(/sleep|bed|rest|night|bedtime|nap|wind down/)) {
      return [
        'Put phone in another room',
        'Dim bedroom lights',
        'Put on pajamas',
        'Set alarm for tomorrow',
        'Close bedroom curtains'
      ];
    }
    
    // Additional successful habits patterns
    
    // Exercise & Fitness (extended)
    if (input.match(/exercise|workout|gym|fitness|train|run|jog|walk|cardio|sport|athletic/)) {
      return [
        'Put on workout clothes',
        'Do 1 pushup or squat',
        'Walk to the gym door',
        'Put on running shoes',
        'Do 5 jumping jacks'
      ];
    }
    
    if (input.match(/yoga|stretch|flexibility|pose/)) {
      return [
        'Unroll yoga mat',
        'Do one sun salutation',
        'Stretch for 30 seconds',
        'Sit in meditation pose',
        'Take 3 deep breaths'
      ];
    }
    
    if (input.match(/pushup|push-up|strength|lift|weight|muscle|squat|plank/)) {
      return [
        'Do 1 pushup',
        'Pick up one dumbbell',
        'Do 5 bodyweight squats',
        'Hold plank for 10 seconds',
        'Do 3 jumping jacks'
      ];
    }
    
    if (input.match(/swim|pool|water/)) {
      return [
        'Put on swimsuit',
        'Pack swim bag',
        'Do 1 lap',
        'Get in the water',
        'Stretch poolside'
      ];
    }
    
    if (input.match(/bike|cycle|cycling|ride/)) {
      return [
        'Put on cycling gear',
        'Check tire pressure',
        'Ride for 2 minutes',
        'Get bike from garage',
        'Put on helmet'
      ];
    }
    
    // Reading & Learning
    if (input.match(/read|book|novel|article|study|literature/)) {
      return [
        'Open book to bookmark',
        'Read one page',
        'Read one paragraph',
        'Sit in reading chair',
        'Turn off TV and pick up book'
      ];
    }
    
    if (input.match(/learn|course|tutorial|practice|skill|education|training/)) {
      return [
        'Open learning app',
        'Watch 2-minute tutorial',
        'Read one lesson intro',
        'Write down one thing to learn',
        'Review one flashcard'
      ];
    }
    
    if (input.match(/podcast|listen|audio/)) {
      return [
        'Put on headphones',
        'Open podcast app',
        'Listen for 2 minutes',
        'Queue up episode',
        'Press play'
      ];
    }
    
    // Writing & Creativity
    if (input.match(/write|journal|blog|essay|story|note|document/)) {
      return [
        'Write one sentence',
        'Open journal and date page',
        'Write 3 bullet points',
        'Set timer for 2 minutes',
        'Write down one idea'
      ];
    }
    
    if (input.match(/draw|paint|art|sketch|creative|design|illustrate/)) {
      return [
        'Get out art supplies',
        'Draw one line or shape',
        'Open sketchbook',
        'Doodle for 1 minute',
        'Pick up pencil or brush'
      ];
    }
    
    if (input.match(/photo|picture|camera|photography/)) {
      return [
        'Pick up camera',
        'Take one photo',
        'Review camera settings',
        'Clean camera lens',
        'Look for one subject'
      ];
    }
    
    // Health & Nutrition
    if (input.match(/eat|meal|cook|food|healthy|nutrition|prepare|recipe/)) {
      return [
        'Wash one vegetable',
        'Chop one ingredient',
        'Open healthy cookbook',
        'Put fruit in visible spot',
        'Prepare one healthy snack'
      ];
    }
    
    if (input.match(/water|hydrate|drink|beverage/)) {
      return [
        'Fill glass with water',
        'Take one sip of water',
        'Place water bottle on desk',
        'Add ice to water bottle',
        'Drink half a glass'
      ];
    }
    
    if (input.match(/vitamin|supplement|medicine|pill/)) {
      return [
        'Get vitamin bottle',
        'Place vitamins on counter',
        'Fill water glass',
        'Open pill organizer',
        'Set vitamins by breakfast'
      ];
    }
    
    // Meditation & Mindfulness
    if (input.match(/meditate|mindful|breathe|calm|relax|zen|peace/)) {
      return [
        'Sit on meditation cushion',
        'Take 3 deep breaths',
        'Close eyes for 30 seconds',
        'Open meditation app',
        'Set timer for 2 minutes'
      ];
    }
    
    // Sleep & Rest
    if (input.match(/sleep|bed|rest|night|bedtime|nap/)) {
      return [
        'Put phone in another room',
        'Dim bedroom lights',
        'Put on pajamas',
        'Set alarm for tomorrow',
        'Close bedroom curtains'
      ];
    }
    
    // Organization & Productivity
    if (input.match(/organize|clean|tidy|declutter|sort|arrange/)) {
      return [
        'Clear one item from desk',
        'Put away one thing',
        'File one document',
        'Wipe down one surface',
        'Make bed'
      ];
    }
    
    if (input.match(/plan|schedule|task|todo|list|agenda/)) {
      return [
        'Write tomorrow\'s top task',
        'Open planner or calendar',
        'Write down one priority',
        'Review today\'s tasks',
        'Set one reminder'
      ];
    }
    
    // Music & Instruments
    if (input.match(/music|guitar|piano|instrument|practice|play|sing|vocal/)) {
      return [
        'Pick up instrument',
        'Play one scale',
        'Tune instrument',
        'Practice for 2 minutes',
        'Play one song intro'
      ];
    }
    
    // Language Learning
    if (input.match(/language|spanish|french|german|chinese|japanese|speak|translate/)) {
      return [
        'Review 5 vocabulary words',
        'Say one phrase out loud',
        'Open language app',
        'Listen to 2 minutes of audio',
        'Write one sentence'
      ];
    }
    
    // Social & Relationships
    if (input.match(/call|text|message|contact|reach out|connect|email|phone/)) {
      return [
        'Open contact list',
        'Send one text message',
        'Write one sentence to send',
        'Schedule call for later',
        'Reply to one message'
      ];
    }
    
    // Prayer & Spirituality
    if (input.match(/pray|prayer|spiritual|worship|devotion|faith|bible|scripture/)) {
      return [
        'Sit in prayer space',
        'Say one short prayer',
        'Open prayer book',
        'Light a candle',
        'Take moment of silence'
      ];
    }
    
    // Coding & Programming
    if (input.match(/code|program|develop|debug|software|app|website|script/)) {
      return [
        'Open code editor',
        'Write one line of code',
        'Read one function',
        'Fix one small bug',
        'Review one file'
      ];
    }
    
    // Business & Work
    if (input.match(/work|business|project|meeting|presentation|report/)) {
      return [
        'Open project file',
        'Write one task',
        'Review one item',
        'Send one email',
        'Make one phone call'
      ];
    }
    
    // Finance & Money
    if (input.match(/budget|save|invest|money|finance|expense|bill/)) {
      return [
        'Open budgeting app',
        'Log one expense',
        'Review one transaction',
        'Transfer $1 to savings',
        'Check account balance'
      ];
    }
    
    // Home & Garden
    if (input.match(/garden|plant|water|grow|lawn|yard/)) {
      return [
        'Water one plant',
        'Pull one weed',
        'Check soil moisture',
        'Prune one branch',
        'Spend 2 minutes outside'
      ];
    }
    
    // Hobbies & Crafts
    if (input.match(/craft|knit|sew|build|hobby|diy|project/)) {
      return [
        'Get out supplies',
        'Work for 2 minutes',
        'Complete one small step',
        'Organize materials',
        'Review instructions'
      ];
    }
    
    // Pet Care
    if (input.match(/pet|dog|cat|walk|feed|animal/)) {
      return [
        'Get leash',
        'Fill food bowl',
        'Pet for 1 minute',
        'Walk to front door',
        'Prepare pet supplies'
      ];
    }
    
    // PARENTING & FAMILY TIME
    if (input.match(/parent|child|kid|baby|toddler|son|daughter|family time|play with|read to/)) {
      return [
        'Sit down with child',
        'Ask one question about their day',
        'Give one hug',
        'Read one page together',
        'Play for 2 minutes'
      ];
    }
    
    if (input.match(/bedtime|story|tuck in|night routine|lullaby/)) {
      return [
        'Start bedtime routine',
        'Read one page of story',
        'Sing one verse of lullaby',
        'Dim the lights',
        'Sit on edge of bed'
      ];
    }
    
    if (input.match(/homework|study with|help with school|tutor|learning/)) {
      return [
        'Sit at homework table',
        'Review one assignment',
        'Help with one problem',
        'Ask about one subject',
        'Check homework folder'
      ];
    }
    
    if (input.match(/quality time|bond|connect|listen|talk to child/)) {
      return [
        'Put phone away',
        'Make eye contact',
        'Ask one open-ended question',
        'Listen for 2 minutes',
        'Give undivided attention'
      ];
    }
    
    if (input.match(/praise|encourage|affirm|compliment|appreciate child/)) {
      return [
        'Give one specific compliment',
        'Notice one good behavior',
        'Say "I love you"',
        'Give high-five or hug',
        'Write one encouraging note'
      ];
    }
    
    if (input.match(/discipline|teach|guide|correct|set boundary/)) {
      return [
        'Take deep breath first',
        'Get down to child\'s level',
        'State one clear expectation',
        'Explain one consequence',
        'Use calm voice'
      ];
    }
    
    if (input.match(/meal together|family dinner|eat with|breakfast with/)) {
      return [
        'Set table together',
        'Turn off TV',
        'Sit down at table',
        'Ask one dinner question',
        'Share one thing from day'
      ];
    }
    
    if (input.match(/outdoor|outside|park|playground|nature walk/)) {
      return [
        'Put on shoes',
        'Step outside for 2 minutes',
        'Walk to front yard',
        'Point out one thing in nature',
        'Take one lap around block'
      ];
    }
    
    // Generic fallback based on action verbs
    if (input.match(/^(do|complete|finish|work on|start|begin)/)) {
      return [
        'Set up workspace',
        'Gather needed materials',
        'Do the first step',
        'Work for 2 minutes only',
        'Start with easiest part'
      ];
    }
    
    // Universal suggestions based on any input
    // Extract the main noun/activity from input
    const words = input.split(' ');
    const mainActivity = words[words.length - 1]; // Last word often the key activity
    
    return [
      `Start ${mainActivity}`,
      `Prepare for ${mainActivity}`,
      `Do 2 minutes of ${mainActivity}`,
      `Take first step toward ${mainActivity}`,
      `Set up for ${mainActivity}`
    ];
  };

  // AI-powered "Make It Obvious" suggestions based on action (1st Law of Behavior Change)
  const getMakeObviousSuggestions = (actionInput) => {
    if (!actionInput || actionInput.trim().length < 2) {
      return [
        'Place items in visible location',
        'Set out materials the night before',
        'Use visual cues or reminders',
        'Create an obvious trigger',
        'Design environment for success'
      ];
    }

    const input = actionInput.toLowerCase().trim();
    
    // Exercise & Fitness
    if (input.match(/exercise|workout|gym|fitness|train|run|jog|walk|cardio|sport/)) {
      return [
        'Lay out workout clothes on bed',
        'Put running shoes by the door',
        'Set gym bag in visible spot',
        'Place yoga mat in center of room',
        'Put workout playlist on home screen'
      ];
    }
    
    if (input.match(/yoga|stretch|flexibility/)) {
      return [
        'Leave yoga mat unrolled',
        'Put yoga blocks in plain sight',
        'Set meditation cushion in corner',
        'Place stretching guide on wall',
        'Keep yoga app on phone home screen'
      ];
    }
    
    if (input.match(/swim|pool/)) {
      return [
        'Pack swim bag the night before',
        'Put swimsuit on bathroom counter',
        'Place goggles by front door',
        'Set swim towel in visible spot',
        'Put pool pass in wallet'
      ];
    }
    
    // Reading & Learning
    if (input.match(/read|book|novel|article|study/)) {
      return [
        'Place book on pillow',
        'Put book on coffee table',
        'Leave book open to current page',
        'Set book next to morning coffee',
        'Put reading chair in prime spot'
      ];
    }
    
    if (input.match(/learn|course|tutorial|practice|skill/)) {
      return [
        'Pin learning app to home screen',
        'Set course materials on desk',
        'Leave laptop open to course page',
        'Post learning goal on wall',
        'Set daily reminder notification'
      ];
    }
    
    if (input.match(/podcast|listen/)) {
      return [
        'Put headphones on desk',
        'Pin podcast app to home screen',
        'Queue up episode',
        'Set podcast reminder',
        'Place headphones by coffee maker'
      ];
    }
    
    // Writing & Creativity
    if (input.match(/write|journal|blog|essay|story/)) {
      return [
        'Leave journal open on desk',
        'Place pen on top of notebook',
        'Set writing app as default',
        'Put sticky note on laptop',
        'Keep writing space clear and ready'
      ];
    }
    
    if (input.match(/draw|paint|art|sketch|creative/)) {
      return [
        'Leave sketchbook open',
        'Set out art supplies on table',
        'Put blank canvas in view',
        'Place pencils in visible cup',
        'Hang inspiration on wall'
      ];
    }
    
    if (input.match(/photo|camera/)) {
      return [
        'Keep camera charged and ready',
        'Place camera by front door',
        'Set camera bag in visible spot',
        'Put memory card in camera',
        'Hang camera strap on hook'
      ];
    }
    
    // Health & Nutrition
    if (input.match(/eat|meal|cook|food|healthy|nutrition/)) {
      return [
        'Pre-cut vegetables in clear container',
        'Put healthy snacks at eye level',
        'Place fruit bowl on counter',
        'Set out meal prep containers',
        'Post meal plan on fridge'
      ];
    }
    
    if (input.match(/water|hydrate|drink/)) {
      return [
        'Fill water bottle and place on desk',
        'Put glass of water on nightstand',
        'Set water bottles in every room',
        'Use marked water bottle with times',
        'Place water pitcher in plain sight'
      ];
    }
    
    if (input.match(/vitamin|supplement/)) {
      return [
        'Place vitamins next to coffee maker',
        'Put pill organizer on counter',
        'Set vitamins by breakfast plate',
        'Use daily pill reminder box',
        'Keep supplements in visible spot'
      ];
    }
    
    // Meditation & Mindfulness
    if (input.match(/meditate|mindful|breathe|calm|relax/)) {
      return [
        'Set meditation cushion in corner',
        'Place meditation app on home screen',
        'Put calming music playlist ready',
        'Set timer in visible location',
        'Create dedicated meditation space'
      ];
    }
    
    // Sleep & Rest
    if (input.match(/sleep|bed|rest|night|bedtime/)) {
      return [
        'Put phone charger in another room',
        'Set out pajamas on bed',
        'Place sleep mask on nightstand',
        'Set bedtime alarm reminder',
        'Dim lights automatically at 9pm'
      ];
    }
    
    // Organization & Productivity
    if (input.match(/organize|clean|tidy|declutter|sort/)) {
      return [
        'Place donation box in visible spot',
        'Set cleaning supplies on counter',
        'Put organizing bins in room',
        'Leave one clear surface as example',
        'Post decluttering checklist'
      ];
    }
    
    if (input.match(/plan|schedule|task|todo|list/)) {
      return [
        'Leave planner open on desk',
        'Put sticky notes on mirror',
        'Set calendar as default app',
        'Place to-do list on fridge',
        'Keep planning tools in one spot'
      ];
    }
    
    // Music & Instruments
    if (input.match(/music|guitar|piano|instrument|practice|play/)) {
      return [
        'Leave instrument out of case',
        'Put music stand in center of room',
        'Place sheet music on stand',
        'Set instrument in practice corner',
        'Keep tuner and picks visible'
      ];
    }
    
    // Language Learning
    if (input.match(/language|spanish|french|german|chinese|speak/)) {
      return [
        'Put flashcards on bathroom mirror',
        'Set language app on home screen',
        'Post vocabulary words around house',
        'Leave language book open',
        'Set phone/computer to target language'
      ];
    }
    
    // Social & Relationships
    if (input.match(/call|text|message|contact|reach out|connect/)) {
      return [
        'Pin contact to top of phone',
        'Set reminder to call at specific time',
        'Write name on sticky note',
        'Schedule recurring calendar event',
        'Put photo of person on desk'
      ];
    }
    
    // Prayer & Spirituality
    if (input.match(/pray|prayer|spiritual|worship|devotion/)) {
      return [
        'Set prayer book on nightstand',
        'Create dedicated prayer corner',
        'Place prayer mat in visible spot',
        'Set daily prayer reminder',
        'Put spiritual text on coffee table'
      ];
    }
    
    // Coding & Programming
    if (input.match(/code|program|develop|debug|software/)) {
      return [
        'Leave code editor open',
        'Pin project to taskbar',
        'Set coding playlist ready',
        'Post coding goal on monitor',
        'Keep development environment ready'
      ];
    }
    
    // Business & Work
    if (input.match(/work|business|project|meeting/)) {
      return [
        'Set work materials on desk',
        'Pin important files to desktop',
        'Place project notes in view',
        'Set calendar reminder',
        'Keep workspace organized'
      ];
    }
    
    // Finance & Money
    if (input.match(/budget|save|invest|money|finance/)) {
      return [
        'Pin budgeting app to home screen',
        'Place receipts in visible spot',
        'Set financial goal on wallpaper',
        'Keep expense tracker open',
        'Post savings goal on mirror'
      ];
    }
    
    // Home & Garden
    if (input.match(/garden|plant|water|grow/)) {
      return [
        'Place watering can by door',
        'Set gardening gloves in view',
        'Put plant food on counter',
        'Leave gardening tools ready',
        'Set plant care reminder'
      ];
    }
    
    // Pet Care
    if (input.match(/pet|dog|cat|walk|feed/)) {
      return [
        'Hang leash by front door',
        'Place pet food in visible spot',
        'Set feeding bowl in same place',
        'Put pet supplies in basket',
        'Set walk reminder on phone'
      ];
    }
    
    // PARENTING & FAMILY TIME
    if (input.match(/parent|child|kid|baby|toddler|son|daughter|family time|play with|read to/)) {
      return [
        'Set out children\'s books on coffee table',
        'Place toys in designated play area',
        'Put family calendar in visible spot',
        'Set phone reminder for quality time',
        'Create dedicated family space'
      ];
    }
    
    if (input.match(/bedtime|story|tuck in|night routine/)) {
      return [
        'Place bedtime books on nightstand',
        'Set out pajamas before dinner',
        'Put bedtime routine chart on wall',
        'Set alarm for bedtime start',
        'Dim lights at same time nightly'
      ];
    }
    
    if (input.match(/homework|study with|help with school|tutor/)) {
      return [
        'Set up homework station',
        'Place school supplies in visible spot',
        'Post homework schedule on wall',
        'Set homework time reminder',
        'Keep backpack in same place'
      ];
    }
    
    if (input.match(/quality time|bond|connect|listen|talk to child/)) {
      return [
        'Put phone in another room',
        'Set "no phone" zone in house',
        'Create cozy conversation corner',
        'Set daily connection reminder',
        'Place conversation starters visible'
      ];
    }
    
    if (input.match(/praise|encourage|affirm|compliment/)) {
      return [
        'Post affirmation notes around house',
        'Keep encouragement cards ready',
        'Set reminder to give compliments',
        'Place "caught being good" jar visible',
        'Keep praise journal on counter'
      ];
    }
    
    if (input.match(/meal together|family dinner|eat with/)) {
      return [
        'Set table before cooking',
        'Post "no devices at dinner" sign',
        'Place conversation cards on table',
        'Set family dinner time alarm',
        'Keep dining table clear and ready'
      ];
    }
    
    if (input.match(/outdoor|outside|park|playground/)) {
      return [
        'Place outdoor toys by door',
        'Hang jackets on low hooks',
        'Put shoes in visible basket',
        'Set outdoor time reminder',
        'Keep sunscreen by front door'
      ];
    }
    
    // Universal fallback - extract key words and create suggestions
    const words = input.split(' ').filter(w => w.length > 3);
    const mainActivity = words[words.length - 1] || 'activity';
    
    return [
      `Place ${mainActivity} materials in visible spot`,
      `Set up ${mainActivity} space beforehand`,
      `Create visual reminder for ${mainActivity}`,
      `Make ${mainActivity} environment obvious`,
      `Remove barriers to ${mainActivity}`
    ];
  };

  // AI-powered "Reward" suggestions based on action (4th Law of Behavior Change)
  const getRewardSuggestions = (actionInput) => {
    if (!actionInput || actionInput.trim().length < 2) {
      return [
        'Check off habit on tracker',
        'Give yourself a high-five',
        'Enjoy favorite beverage',
        'Take 2-minute break',
        'Celebrate with small treat'
      ];
    }

    const input = actionInput.toLowerCase().trim();
    
    // Exercise & Fitness
    if (input.match(/exercise|workout|gym|fitness|train|run|jog|walk|cardio/)) {
      return [
        'Enjoy post-workout smoothie',
        'Take refreshing shower',
        'Check workout off on calendar',
        'Listen to favorite song',
        'Track progress in fitness app'
      ];
    }
    
    if (input.match(/yoga|stretch|flexibility/)) {
      return [
        'Enjoy moment of stillness',
        'Sip herbal tea mindfully',
        'Mark completion in journal',
        'Feel the relaxation in body',
        'Take calming deep breaths'
      ];
    }
    
    // Reading & Learning
    if (input.match(/read|book|novel|article|study/)) {
      return [
        'Enjoy cup of coffee or tea',
        'Mark page count in tracker',
        'Share interesting insight',
        'Take satisfying break',
        'Add book to "completed" list'
      ];
    }
    
    if (input.match(/learn|course|tutorial|practice|skill/)) {
      return [
        'Mark lesson as complete',
        'Share what you learned',
        'Take 5-minute break',
        'Check off learning goal',
        'Celebrate progress milestone'
      ];
    }
    
    // Writing & Creativity
    if (input.match(/write|journal|blog|essay|story/)) {
      return [
        'Read what you wrote with pride',
        'Track word count achieved',
        'Enjoy favorite beverage',
        'Take creative break',
        'Share your writing progress'
      ];
    }
    
    if (input.match(/draw|paint|art|sketch|creative/)) {
      return [
        'Admire your creation',
        'Take photo of artwork',
        'Share progress with friend',
        'Enjoy creative satisfaction',
        'Add to portfolio or collection'
      ];
    }
    
    // Health & Nutrition
    if (input.match(/eat|meal|cook|food|healthy|nutrition/)) {
      return [
        'Enjoy the healthy meal',
        'Feel proud of choice',
        'Track nutrition goal',
        'Savor the flavors mindfully',
        'Take photo of healthy plate'
      ];
    }
    
    if (input.match(/water|hydrate|drink/)) {
      return [
        'Check off water intake',
        'Feel refreshed and energized',
        'Mark hydration goal complete',
        'Notice improved energy',
        'Track daily water consumption'
      ];
    }
    
    // Meditation & Mindfulness
    if (input.match(/meditate|mindful|breathe|calm|relax/)) {
      return [
        'Notice feeling of calm',
        'Enjoy peaceful moment',
        'Mark meditation complete',
        'Feel centered and present',
        'Track streak in app'
      ];
    }
    
    // Sleep & Rest
    if (input.match(/sleep|bed|rest|night|bedtime/)) {
      return [
        'Enjoy quality sleep',
        'Feel well-rested tomorrow',
        'Track sleep in journal',
        'Notice improved energy',
        'Mark bedtime routine complete'
      ];
    }
    
    // Organization & Productivity
    if (input.match(/organize|clean|tidy|declutter|sort/)) {
      return [
        'Admire clean space',
        'Take before/after photo',
        'Enjoy organized environment',
        'Feel sense of accomplishment',
        'Relax in tidy space'
      ];
    }
    
    if (input.match(/plan|schedule|task|todo|list/)) {
      return [
        'Check task off list',
        'Feel organized and ready',
        'Review completed tasks',
        'Enjoy sense of control',
        'Take productive break'
      ];
    }
    
    // Music & Instruments
    if (input.match(/music|guitar|piano|instrument|practice|play/)) {
      return [
        'Play favorite song for fun',
        'Record practice session',
        'Share progress with friend',
        'Enjoy musical accomplishment',
        'Track practice streak'
      ];
    }
    
    // Language Learning
    if (input.match(/language|spanish|french|german|chinese|speak/)) {
      return [
        'Mark lesson complete in app',
        'Celebrate new words learned',
        'Share progress with friend',
        'Watch short video in language',
        'Track learning streak'
      ];
    }
    
    // Social & Relationships
    if (input.match(/call|text|message|contact|reach out|connect/)) {
      return [
        'Feel connected and fulfilled',
        'Enjoy positive interaction',
        'Mark connection goal complete',
        'Appreciate relationship',
        'Feel good about reaching out'
      ];
    }
    
    // Prayer & Spirituality
    if (input.match(/pray|prayer|spiritual|worship|devotion/)) {
      return [
        'Feel spiritually fulfilled',
        'Enjoy moment of peace',
        'Mark prayer time complete',
        'Notice sense of gratitude',
        'Feel centered and grounded'
      ];
    }
    
    // Coding & Programming
    if (input.match(/code|program|develop|debug|software/)) {
      return [
        'Commit code to repository',
        'Take coding break',
        'Share progress on project',
        'Enjoy problem-solving win',
        'Track coding streak'
      ];
    }
    
    // PARENTING & FAMILY TIME
    if (input.match(/parent|child|kid|baby|toddler|son|daughter|family time|play with|read to/)) {
      return [
        'Enjoy child\'s smile and laughter',
        'Feel connected to child',
        'Notice child\'s happiness',
        'Take photo of moment together',
        'Feel proud of being present'
      ];
    }
    
    if (input.match(/bedtime|story|tuck in|night routine/)) {
      return [
        'Enjoy peaceful bedtime',
        'See child fall asleep calmly',
        'Feel satisfied with routine',
        'Notice child\'s contentment',
        'Appreciate quiet evening moment'
      ];
    }
    
    if (input.match(/homework|study with|help with school|tutor/)) {
      return [
        'See child\'s understanding grow',
        'Celebrate homework completion',
        'Feel proud of supporting learning',
        'Enjoy "aha" moment together',
        'Mark homework time complete'
      ];
    }
    
    if (input.match(/quality time|bond|connect|listen|talk to child/)) {
      return [
        'Feel deeply connected',
        'Enjoy meaningful conversation',
        'Notice child opening up',
        'Appreciate special moment',
        'Feel fulfilled as parent'
      ];
    }
    
    if (input.match(/praise|encourage|affirm|compliment/)) {
      return [
        'See child\'s face light up',
        'Notice increased confidence',
        'Feel good about encouragement',
        'Enjoy positive interaction',
        'Appreciate child\'s response'
      ];
    }
    
    if (input.match(/meal together|family dinner|eat with/)) {
      return [
        'Enjoy family conversation',
        'Savor meal together',
        'Feel connected as family',
        'Appreciate shared time',
        'Notice family bonding'
      ];
    }
    
    if (input.match(/outdoor|outside|park|playground/)) {
      return [
        'Enjoy fresh air together',
        'See child\'s joy outdoors',
        'Feel energized from activity',
        'Appreciate nature time',
        'Notice child\'s excitement'
      ];
    }
    
    // Default suggestions
    return [
      'Check off habit on tracker',
      'Give yourself a high-five',
      'Take 2-minute enjoyable break',
      'Feel proud of showing up',
      'Celebrate small win'
    ];
  };

  useEffect(() => {
    // Select a quote based on the day of the year for consistency
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const quoteIndex = dayOfYear % motivationalQuotes.length;
    setDailyQuote(motivationalQuotes[quoteIndex]);
  }, []);

  // AI-powered Identity Statement suggestions based on action (Core of Atomic Habits)
  // Focuses on TOP 20 HABITS OF SUCCESSFUL PEOPLE
  const getIdentitySuggestions = (actionInput) => {
    if (!actionInput || actionInput.trim().length < 2) {
      return [
        'I am a person who takes care of myself',
        'I am a person who shows up consistently',
        'I am a person who values growth',
        'I am a person who keeps my commitments',
        'I am a person who invests in myself'
      ];
    }

    const input = actionInput.toLowerCase().trim();
    
    // TOP 20 HABITS OF SUCCESSFUL PEOPLE - IDENTITY STATEMENTS
    
    // 1. WAKE UP EARLY / MORNING ROUTINE
    if (input.match(/wake|early|morning|rise|5am|6am|sunrise/)) {
      return [
        'I am an early riser',
        'I am a person who starts the day with energy',
        'I am a person who owns my mornings',
        'I am a person who values morning time',
        'I am a person who wakes up with purpose'
      ];
    }
    
    // 2. EXERCISE / PHYSICAL FITNESS
    if (input.match(/exercise|workout|gym|fitness|train|run|jog|walk|cardio/)) {
      return [
        'I am a person who exercises daily',
        'I am a person who prioritizes fitness',
        'I am an athlete in training',
        'I am a person who moves my body',
        'I am a person who values physical health'
      ];
    }
    
    // 3. MEDITATION / MINDFULNESS
    if (input.match(/meditate|mindful|breathe|calm|relax|zen|peace/)) {
      return [
        'I am a person who meditates',
        'I am a person who practices mindfulness',
        'I am a person who finds inner calm',
        'I am a person who centers myself daily',
        'I am a person who values mental peace'
      ];
    }
    
    // 4. READING / CONTINUOUS LEARNING
    if (input.match(/read|book|novel|article|study/)) {
      return [
        'I am a person who reads daily',
        'I am a reader',
        'I am a person who loves learning',
        'I am a person who expands my mind',
        'I am a person who values knowledge'
      ];
    }
    
    // 5. GOAL SETTING / PLANNING
    if (input.match(/goal|plan|schedule|task|todo|list|prioritize|objective/)) {
      return [
        'I am a person who plans ahead',
        'I am a person who sets clear goals',
        'I am a person who stays organized',
        'I am a productive person',
        'I am a person who manages time well'
      ];
    }
    
    // 6. JOURNALING / REFLECTION
    if (input.match(/journal|reflect|diary|gratitude|write thoughts/)) {
      return [
        'I am a person who journals daily',
        'I am a person who reflects on my life',
        'I am a person who practices gratitude',
        'I am a person who documents my journey',
        'I am a person who learns from experience'
      ];
    }
    
    // 7. HEALTHY EATING / NUTRITION
    if (input.match(/eat|meal|cook|food|healthy|nutrition|diet/)) {
      return [
        'I am a person who eats healthy',
        'I am a person who nourishes my body',
        'I am a person who makes healthy choices',
        'I am a person who cooks nutritious meals',
        'I am a person who values good nutrition'
      ];
    }
    
    // 8. HYDRATION / DRINKING WATER
    if (input.match(/water|hydrate|drink/)) {
      return [
        'I am a person who stays hydrated',
        'I am a person who drinks water regularly',
        'I am a person who takes care of my body',
        'I am a person who prioritizes hydration',
        'I am a person who maintains healthy habits'
      ];
    }
    
    // 9. TIME MANAGEMENT / PRODUCTIVITY
    if (input.match(/time|manage|productive|efficient|focus|concentrate|deep work/)) {
      return [
        'I am a person who manages time wisely',
        'I am a highly productive person',
        'I am a person who focuses deeply',
        'I am a person who gets things done',
        'I am a person who values efficiency'
      ];
    }
    
    // 10. NETWORKING / RELATIONSHIP BUILDING
    if (input.match(/network|connect|relationship|reach out|call|text|message|contact/)) {
      return [
        'I am a person who stays connected',
        'I am a person who nurtures relationships',
        'I am a person who reaches out to others',
        'I am a person who values connections',
        'I am a person who maintains friendships'
      ];
    }
    
    // 11. LEARNING NEW SKILLS / SELF-IMPROVEMENT
    if (input.match(/learn|skill|course|tutorial|practice|training|education|develop/)) {
      return [
        'I am a person who learns continuously',
        'I am a lifelong learner',
        'I am a person who develops new skills',
        'I am a person who invests in education',
        'I am a person who grows every day'
      ];
    }
    
    // 12. FINANCIAL MANAGEMENT / SAVING MONEY
    if (input.match(/budget|save|invest|money|finance|expense|wealth|financial/)) {
      return [
        'I am a person who manages money wisely',
        'I am a person who saves consistently',
        'I am a person who invests in my future',
        'I am a person who builds wealth',
        'I am a person who makes smart financial choices'
      ];
    }
    
    // 13. POSITIVE THINKING / AFFIRMATIONS
    if (input.match(/affirm|positive|mindset|visualize|manifest|believe|confidence/)) {
      return [
        'I am a person with a positive mindset',
        'I am a person who believes in myself',
        'I am a person who thinks positively',
        'I am a person who visualizes success',
        'I am a confident person'
      ];
    }
    
    // 14. TAKING BREAKS / REST
    if (input.match(/break|rest|pause|recharge|relax|unwind/)) {
      return [
        'I am a person who takes care of myself',
        'I am a person who rests when needed',
        'I am a person who recharges regularly',
        'I am a person who values balance',
        'I am a person who respects my limits'
      ];
    }
    
    // 15. ORGANIZATION / DECLUTTERING
    if (input.match(/organize|clean|tidy|declutter|sort/)) {
      return [
        'I am a person who stays organized',
        'I am a person who keeps a clean space',
        'I am a person who values order',
        'I am a person who maintains my environment',
        'I am a person who lives clutter-free'
      ];
    }
    
    // 16. SAYING NO / SETTING BOUNDARIES
    if (input.match(/no|boundary|limit|decline|refuse|prioritize/)) {
      return [
        'I am a person who sets healthy boundaries',
        'I am a person who says no when needed',
        'I am a person who protects my time',
        'I am a person who prioritizes what matters',
        'I am a person who respects my limits'
      ];
    }
    
    // 17. CONTINUOUS FEEDBACK / SELF-ASSESSMENT
    if (input.match(/review|assess|evaluate|feedback|improve|analyze|measure/)) {
      return [
        'I am a person who seeks feedback',
        'I am a person who reflects on my progress',
        'I am a person who continuously improves',
        'I am a person who learns from mistakes',
        'I am a person who measures my growth'
      ];
    }
    
    // 18. CREATIVE THINKING / INNOVATION
    if (input.match(/create|innovate|idea|brainstorm|think|imagine|design/)) {
      return [
        'I am a creative person',
        'I am a person who thinks innovatively',
        'I am a person who generates ideas',
        'I am a person who solves problems creatively',
        'I am a person who embraces creativity'
      ];
    }
    
    // 19. GRATITUDE PRACTICE
    if (input.match(/gratitude|grateful|thankful|appreciate|blessing|thanks/)) {
      return [
        'I am a person who practices gratitude',
        'I am a person who appreciates life',
        'I am a grateful person',
        'I am a person who counts my blessings',
        'I am a person who expresses thanks'
      ];
    }
    
    // 20. QUALITY SLEEP / BEDTIME ROUTINE
    if (input.match(/sleep|bed|rest|night|bedtime/)) {
      return [
        'I am a person who sleeps well',
        'I am a person who prioritizes rest',
        'I am a person who values quality sleep',
        'I am a person who maintains a bedtime routine',
        'I am a person who respects my body\'s need for rest'
      ];
    }
    
    // Additional patterns for successful habits
    
    // Music & Instruments
    if (input.match(/music|guitar|piano|instrument|practice|play|musician/)) {
      return [
        'I am a musician',
        'I am a person who plays music daily',
        'I am a person who practices my instrument',
        'I am a person who values musical expression',
        'I am a person who develops my musical skills'
      ];
    }
    
    // Language Learning
    if (input.match(/language|spanish|french|german|chinese|speak|bilingual/)) {
      return [
        'I am a person who learns languages',
        'I am a multilingual person',
        'I am a person who practices daily',
        'I am a person who embraces new cultures',
        'I am a person who communicates globally'
      ];
    }
    
    // Social & Relationships
    if (input.match(/call|text|message|contact|reach out|connect|friend|family/)) {
      return [
        'I am a person who stays connected',
        'I am a person who nurtures relationships',
        'I am a person who reaches out to others',
        'I am a person who values connections',
        'I am a person who maintains friendships'
      ];
    }
    
    // Prayer & Spirituality
    if (input.match(/pray|prayer|spiritual|worship|devotion|faith/)) {
      return [
        'I am a person of faith',
        'I am a person who prays daily',
        'I am a spiritual person',
        'I am a person who seeks guidance',
        'I am a person who values my spiritual life'
      ];
    }
    
    // Coding & Programming
    if (input.match(/code|program|develop|debug|software|developer/)) {
      return [
        'I am a developer',
        'I am a person who codes daily',
        'I am a person who builds software',
        'I am a person who solves problems',
        'I am a person who creates with code'
      ];
    }
    
    // Money & Finance
    if (input.match(/save|budget|invest|money|finance|wealth/)) {
      return [
        'I am a person who manages money wisely',
        'I am a person who saves consistently',
        'I am a person who invests in my future',
        'I am a person who builds wealth',
        'I am a person who makes smart financial choices'
      ];
    }
    
    // PARENTING & FAMILY
    if (input.match(/parent|child|kid|baby|toddler|son|daughter|family time|play with|read to/)) {
      return [
        'I am a present parent',
        'I am a person who prioritizes my children',
        'I am a person who shows up for my family',
        'I am a person who listens to my children',
        'I am a person who creates quality time'
      ];
    }
    
    if (input.match(/bedtime|story|tuck in|night routine/)) {
      return [
        'I am a person who maintains bedtime routines',
        'I am a person who reads to my children',
        'I am a person who creates calm evenings',
        'I am a person who values bedtime connection',
        'I am a nurturing parent'
      ];
    }
    
    if (input.match(/homework|study with|help with school|tutor/)) {
      return [
        'I am a person who supports my child\'s education',
        'I am a person who helps with homework',
        'I am a person who values learning',
        'I am an involved parent',
        'I am a person who encourages academic growth'
      ];
    }
    
    if (input.match(/quality time|bond|connect|listen|talk to child/)) {
      return [
        'I am a person who gives undivided attention',
        'I am a person who truly listens',
        'I am a person who connects with my children',
        'I am a present and engaged parent',
        'I am a person who values quality time'
      ];
    }
    
    if (input.match(/praise|encourage|affirm|compliment|appreciate child/)) {
      return [
        'I am a person who encourages my children',
        'I am a person who notices the good',
        'I am a person who affirms my children',
        'I am a positive parent',
        'I am a person who builds confidence'
      ];
    }
    
    if (input.match(/discipline|teach|guide|correct|set boundary/)) {
      return [
        'I am a person who guides with patience',
        'I am a person who sets clear boundaries',
        'I am a person who disciplines with love',
        'I am a calm and consistent parent',
        'I am a person who teaches life lessons'
      ];
    }
    
    if (input.match(/meal together|family dinner|eat with|breakfast with/)) {
      return [
        'I am a person who eats meals with family',
        'I am a person who values family dinners',
        'I am a person who creates mealtime connection',
        'I am a person who prioritizes family time',
        'I am a person who shares meals together'
      ];
    }
    
    if (input.match(/outdoor|outside|park|playground|nature walk/)) {
      return [
        'I am a person who takes kids outside',
        'I am a person who values outdoor time',
        'I am a person who explores nature with family',
        'I am an active parent',
        'I am a person who creates outdoor adventures'
      ];
    }
    
    // Default suggestions
    return [
      'I am a person who shows up daily',
      'I am a person who keeps commitments',
      'I am a person who values consistency',
      'I am a person who invests in myself',
      'I am a person who takes action'
    ];
  };


  // AI-powered Trigger suggestions based on action (Habit Stacking)
  const getTriggerSuggestions = (actionInput) => {
    if (!actionInput || actionInput.trim().length < 2) {
      return [
        'After I wake up',
        'After I brush my teeth',
        'After I have breakfast',
        'After I arrive at work',
        'After I finish lunch'
      ];
    }

    const input = actionInput.toLowerCase().trim();
    
    if (input.match(/exercise|workout|gym|fitness|train|run|jog|walk/)) {
      return [
        'After I wake up',
        'After I have my morning coffee',
        'After I finish work',
        'After I change into workout clothes',
        'After I set my alarm'
      ];
    }
    
    if (input.match(/read|book/)) {
      return [
        'After I get into bed',
        'After I have breakfast',
        'After I finish dinner',
        'After I sit on the couch',
        'After I pour my coffee'
      ];
    }
    
    if (input.match(/meditate|mindful/)) {
      return [
        'After I wake up',
        'After I finish my morning routine',
        'After I arrive at work',
        'After I finish lunch',
        'Before I go to bed'
      ];
    }
    
    if (input.match(/write|journal/)) {
      return [
        'After I have my morning coffee',
        'After I wake up',
        'Before I go to bed',
        'After I finish dinner',
        'After I sit at my desk'
      ];
    }
    
    if (input.match(/water|hydrate|drink/)) {
      return [
        'After I wake up',
        'After each meal',
        'After I use the bathroom',
        'After I sit at my desk',
        'After I finish a task'
      ];
    }
    
    // PARENTING & FAMILY TIME
    if (input.match(/parent|child|kid|play with|read to|quality time/)) {
      return [
        'After I get home from work',
        'After dinner',
        'After kids finish homework',
        'Before bedtime',
        'After I put my phone away'
      ];
    }
    
    if (input.match(/bedtime|story|tuck in/)) {
      return [
        'After dinner',
        'After bath time',
        'After brushing teeth',
        'After putting on pajamas',
        'After turning off TV'
      ];
    }
    
    if (input.match(/homework|study with|help with school/)) {
      return [
        'After kids get home from school',
        'After snack time',
        'After they change clothes',
        'Before dinner',
        'After I finish work'
      ];
    }
    
    if (input.match(/meal together|family dinner|eat with/)) {
      return [
        'After I finish cooking',
        'After everyone gets home',
        'After setting the table',
        'After washing hands',
        'After turning off TV'
      ];
    }
    
    return [
      'After I wake up',
      'After I have breakfast',
      'After I finish work',
      'Before I go to bed',
      'After I complete my morning routine'
    ];
  };

  // AI-powered Time suggestions based on action
  const getTimeSuggestions = (actionInput) => {
    if (!actionInput || actionInput.trim().length < 2) {
      return ['06:00', '07:00', '12:00', '18:00', '21:00'];
    }

    const input = actionInput.toLowerCase().trim();
    
    if (input.match(/exercise|workout|gym|fitness|train|run|jog|walk/)) {
      return ['06:00', '06:30', '07:00', '17:00', '18:00'];
    }
    
    if (input.match(/read|book/)) {
      return ['07:00', '12:00', '20:00', '21:00', '22:00'];
    }
    
    if (input.match(/meditate|mindful/)) {
      return ['06:00', '07:00', '12:00', '17:00', '21:00'];
    }
    
    if (input.match(/write|journal/)) {
      return ['06:00', '07:00', '21:00', '22:00', '23:00'];
    }
    
    if (input.match(/breakfast|morning/)) {
      return ['06:00', '07:00', '07:30', '08:00', '08:30'];
    }
    
    if (input.match(/lunch/)) {
      return ['12:00', '12:30', '13:00', '13:30', '14:00'];
    }
    
    if (input.match(/dinner|evening/)) {
      return ['18:00', '18:30', '19:00', '19:30', '20:00'];
    }
    
    if (input.match(/sleep|bed|night/)) {
      return ['21:00', '21:30', '22:00', '22:30', '23:00'];
    }
    
    // PARENTING & FAMILY TIME
    if (input.match(/parent|child|kid|play with|read to|quality time/)) {
      return ['17:00', '17:30', '18:00', '19:00', '19:30'];
    }
    
    if (input.match(/bedtime|story|tuck in/)) {
      return ['19:00', '19:30', '20:00', '20:30', '21:00'];
    }
    
    if (input.match(/homework|study with|help with school/)) {
      return ['15:00', '15:30', '16:00', '16:30', '17:00'];
    }
    
    if (input.match(/meal together|family dinner|breakfast with/)) {
      return ['07:00', '07:30', '18:00', '18:30', '19:00'];
    }
    
    if (input.match(/outdoor|outside|park|playground/)) {
      return ['10:00', '15:00', '16:00', '17:00', '17:30'];
    }
    
    return ['07:00', '12:00', '18:00', '21:00', '22:00'];
  };

  // AI-powered Location suggestions based on action
  const getLocationSuggestions = (actionInput) => {
    if (!actionInput || actionInput.trim().length < 2) {
      return ['Bedroom', 'Kitchen', 'Living Room', 'Office', 'Bathroom'];
    }

    const input = actionInput.toLowerCase().trim();
    
    if (input.match(/exercise|workout|gym|fitness|train|yoga|stretch/)) {
      return ['Gym', 'Bedroom', 'Living Room', 'Outdoors', 'Home gym'];
    }
    
    if (input.match(/read|book/)) {
      return ['Bedroom', 'Living Room', 'Office', 'Reading nook', 'Couch'];
    }
    
    if (input.match(/meditate|mindful/)) {
      return ['Bedroom', 'Living Room', 'Office', 'Meditation corner', 'Quiet space'];
    }
    
    if (input.match(/write|journal/)) {
      return ['Office', 'Bedroom', 'Desk', 'Kitchen table', 'Study'];
    }
    
    if (input.match(/cook|meal|eat/)) {
      return ['Kitchen', 'Dining room', 'Kitchen table', 'Breakfast nook', 'Outdoor kitchen'];
    }
    
    if (input.match(/sleep|bed|rest/)) {
      return ['Bedroom', 'Bed', 'Master bedroom', 'Guest room', 'Sleeping area'];
    }
    
    if (input.match(/clean|organize|tidy/)) {
      return ['Living Room', 'Bedroom', 'Kitchen', 'Office', 'Entire home'];
    }
    
    if (input.match(/work|task|productive/)) {
      return ['Office', 'Desk', 'Home office', 'Study', 'Workspace'];
    }
    
    // PARENTING & FAMILY TIME
    if (input.match(/parent|child|kid|play with|read to|quality time/)) {
      return ['Living Room', 'Playroom', 'Child\'s bedroom', 'Family room', 'Couch'];
    }
    
    if (input.match(/bedtime|story|tuck in/)) {
      return ['Child\'s bedroom', 'Bedroom', 'Reading chair', 'Bed', 'Nursery'];
    }
    
    if (input.match(/homework|study with|help with school/)) {
      return ['Kitchen table', 'Desk', 'Dining room', 'Study area', 'Home office'];
    }
    
    if (input.match(/meal together|family dinner|eat with/)) {
      return ['Dining room', 'Kitchen table', 'Breakfast nook', 'Dining table', 'Kitchen'];
    }
    
    if (input.match(/outdoor|outside|park|playground/)) {
      return ['Backyard', 'Park', 'Playground', 'Front yard', 'Outdoors'];
    }
    
    return ['Bedroom', 'Kitchen', 'Living Room', 'Office', 'Bathroom'];
  };

  const getWeek = (offset) => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(monday.getDate() + diff + (offset * 7));
    monday.setHours(0, 0, 0, 0);
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(date.getDate() + i);
      week.push(date);
    }
    return week;
  };

  const getMonth = (offset) => {
    const today = new Date();
    const targetMonth = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    targetMonth.setHours(0, 0, 0, 0);
    
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    
    // Get first and last day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const monthDays = [];
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      monthDays.push(date);
    }
    
    return monthDays;
  };

  const currentWeek = getWeek(weekOffset);
  const currentMonth = getMonth(weekOffset);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const getTodayDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + todayOffset);
    date.setHours(0, 0, 0, 0);
    return date;
  };
  
  const currentTodayDate = getTodayDate();

  useEffect(() => {
    const unsubscribe = habitService.subscribeToHabits((habitData) => {
      setData(habitData);
      setLoading(false);
    });

    const timeout = setTimeout(() => {
      if (loading) {
        console.error('Habit loading timeout');
        setLoading(false);
      }
    }, 3000);

    // Close menu when clicking outside
    const handleClickOutside = (e) => {
      if (!e.target.closest('.habit-menu-btn') && !e.target.closest('.habit-menu-dropdown')) {
        setOpenMenuId(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);

    return () => {
      clearTimeout(timeout);
      unsubscribe();
      document.removeEventListener('click', handleClickOutside);
    };
  }, [loading]);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDayLabel = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]} ${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
  };

  const isCompleted = (habitId, date) => {
    const dateStr = formatDate(date);
    return data.completions[dateStr]?.includes(habitId) || false;
  };

  const toggleCompletion = async (habitId, date) => {
    const dateStr = formatDate(date);
    const newCompletions = { ...data.completions };
    const newMissed = { ...data.missed };
    
    if (!newCompletions[dateStr]) {
      newCompletions[dateStr] = [];
    }
    
    if (newCompletions[dateStr].includes(habitId)) {
      newCompletions[dateStr] = newCompletions[dateStr].filter(id => id !== habitId);
    } else {
      newCompletions[dateStr].push(habitId);
      // Remove from missed if marking as completed
      if (newMissed[dateStr]) {
        newMissed[dateStr] = newMissed[dateStr].filter(id => id !== habitId);
      }
    }
    
    const newData = { ...data, completions: newCompletions, missed: newMissed };
    setData(newData);
    await habitService.saveHabits(newData);
  };

  const isMissed = (habitId, date) => {
    const dateStr = formatDate(date);
    return data.missed?.[dateStr]?.includes(habitId) || false;
  };

  const toggleMissed = async (habitId, date) => {
    const dateStr = formatDate(date);
    const newMissed = { ...data.missed };
    const newCompletions = { ...data.completions };
    
    if (!newMissed[dateStr]) {
      newMissed[dateStr] = [];
    }
    
    if (newMissed[dateStr].includes(habitId)) {
      newMissed[dateStr] = newMissed[dateStr].filter(id => id !== habitId);
    } else {
      newMissed[dateStr].push(habitId);
      // Remove from completed if marking as missed
      if (newCompletions[dateStr]) {
        newCompletions[dateStr] = newCompletions[dateStr].filter(id => id !== habitId);
      }
    }
    
    const newData = { ...data, completions: newCompletions, missed: newMissed };
    setData(newData);
    await habitService.saveHabits(newData);
  };

  const getCurrentStreak = (habitId) => {
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit || !habit.startDate) return 0;
    
    const [year, month, day] = habit.startDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    startDate.setHours(0, 0, 0, 0);
    
    // Don't calculate streak if start date is in the future
    if (startDate > today) return 0;
    
    let streak = 0;
    let checkDate = new Date(today);
    
    while (checkDate >= startDate) {
      const dateStr = formatDate(checkDate);
      if (data.completions[dateStr]?.includes(habitId)) {
        streak++;
      } else {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return streak;
  };

  const getBestStreak = (habitId) => {
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit || !habit.startDate) return 0;
    
    const [year, month, day] = habit.startDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    startDate.setHours(0, 0, 0, 0);
    
    // Don't calculate if start date is in the future
    if (startDate > today) return 0;
    
    let maxStreak = 0;
    let currentStreak = 0;
    let checkDate = new Date(startDate);
    
    while (checkDate <= today) {
      const dateStr = formatDate(checkDate);
      if (data.completions[dateStr]?.includes(habitId)) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
    
    return maxStreak;
  };

  const getWeekCompletions = (habitId) => {
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit || !habit.startDate) return 0;
    
    const [year, month, day] = habit.startDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    startDate.setHours(0, 0, 0, 0);
    
    let count = 0;
    currentWeek.forEach(date => {
      // Only count days after start date
      if (date >= startDate && isCompleted(habitId, date)) {
        count++;
      }
    });
    return count;
  };

  const getWeekPercentage = (habitId) => {
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit || !habit.startDate) return 0;
    
    const [year, month, day] = habit.startDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    startDate.setHours(0, 0, 0, 0);
    
    // Count eligible days (days in current week that are after start date)
    let eligibleDays = 0;
    currentWeek.forEach(date => {
      if (date >= startDate) {
        eligibleDays++;
      }
    });
    
    if (eligibleDays === 0) return 0;
    
    const completions = getWeekCompletions(habitId);
    return Math.round((completions / eligibleDays) * 100);
  };

  const getDaysMissedThisWeek = (habitId) => {
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit || !habit.startDate) return 0;
    
    const [year, month, day] = habit.startDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    startDate.setHours(0, 0, 0, 0);
    
    let missed = 0;
    currentWeek.forEach(date => {
      // Only count days that are: past/today AND after start date
      if (date <= today && date >= startDate && !isCompleted(habitId, date)) {
        missed++;
      }
    });
    return missed;
  };

  const getMonthCompletions = (habitId) => {
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit || !habit.startDate) return { completed: 0, total: 0 };
    
    const [year, month, day] = habit.startDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    startDate.setHours(0, 0, 0, 0);
    
    // Get current month's first and last day
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    lastDayOfMonth.setHours(0, 0, 0, 0);
    
    // Determine the actual start date for counting (either habit start or month start, whichever is later)
    const countStartDate = startDate > firstDayOfMonth ? startDate : firstDayOfMonth;
    
    // Determine the end date (either today or last day of month, whichever is earlier)
    const countEndDate = today < lastDayOfMonth ? today : lastDayOfMonth;
    
    // If habit hasn't started yet this month, return 0/0
    if (countStartDate > countEndDate) {
      return { completed: 0, total: 0 };
    }
    
    let completed = 0;
    let total = 0;
    
    // Count from start date to end date
    const checkDate = new Date(countStartDate);
    while (checkDate <= countEndDate) {
      total++;
      if (isCompleted(habitId, checkDate)) {
        completed++;
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
    
    return { completed, total };
  };

  const parseTimeFromAction = (action) => {
    const timePatterns = [
      /(\d{1,2}):(\d{2})\s*(am|pm)/i,
      /(\d{1,2})\s*(am|pm)/i,
      /(\d{1,2}):(\d{2})/
    ];
    
    for (const pattern of timePatterns) {
      const match = action.match(pattern);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const meridiem = match[3]?.toLowerCase();
        
        if (meridiem === 'pm' && hours !== 12) hours += 12;
        if (meridiem === 'am' && hours === 12) hours = 0;
        
        return hours * 60 + minutes;
      }
    }
    return 9999;
  };

  const getSortedHabits = () => {
    const filtered = data.habits.filter(habit => {
      if (!habit.startDate) return false;
      
      const [year, month, day] = habit.startDate.split('-').map(Number);
      const startDate = new Date(year, month - 1, day);
      startDate.setHours(0, 0, 0, 0);
      
      // Get the last day of the current viewing week
      const lastDayOfWeek = currentWeek[currentWeek.length - 1];
      
      // Only show habit if start date is on or before the last day of viewing week
      return startDate <= lastDayOfWeek;
    });
    
    return filtered.sort((a, b) => {
      const timeA = a.time || '23:59';
      const timeB = b.time || '23:59';
      return timeA.localeCompare(timeB);
    });
  };

  const getOverallInsights = () => {
    const totalHabits = data.habits.length;
    if (totalHabits === 0) return null;

    let totalPossible = 0;
    let totalCompleted = 0;
    let mostConsistent = { name: '', percentage: 0 };
    const atRisk = [];

    data.habits.forEach(habit => {
      // Only include habits that have started
      if (!habit.startDate) return;
      
      const [year, month, day] = habit.startDate.split('-').map(Number);
      const startDate = new Date(year, month - 1, day);
      startDate.setHours(0, 0, 0, 0);
      
      if (startDate > today) return;
      
      // Count eligible days for this habit in current week
      let eligibleDays = 0;
      currentWeek.forEach(date => {
        if (date >= startDate) {
          eligibleDays++;
        }
      });
      
      const weekCompletions = getWeekCompletions(habit.id);
      const weekPercentage = getWeekPercentage(habit.id);
      
      totalPossible += eligibleDays;
      totalCompleted += weekCompletions;

      if (weekPercentage > mostConsistent.percentage) {
        mostConsistent = { name: habit.trigger, percentage: weekPercentage };
      }

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Only mark at risk if habit was active yesterday
      if (yesterday >= startDate && !isCompleted(habit.id, yesterday) && !isCompleted(habit.id, today)) {
        atRisk.push(habit.trigger);
      }
    });

    const overallRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    return {
      totalHabits,
      overallRate,
      mostConsistent: mostConsistent.name || 'None',
      atRisk: atRisk.length > 0 ? atRisk : ['None']
    };
  };

  const handleAddHabit = async () => {
    if (!formTrigger.trim() || !formAction.trim()) {
      alert('Please fill in Trigger and Action fields');
      return;
    }

    if (!formIdentity.trim()) {
      alert('Please fill in Identity Statement');
      return;
    }

    if (!formStartDate) {
      alert('Please select a start date');
      return;
    }

    if (!formTime) {
      alert('Please select a time');
      return;
    }

    const finalLocation = formLocation.trim();
    if (!finalLocation) {
      alert('Please select a location');
      return;
    }

    const newHabit = {
      id: `h_${Date.now()}`,
      trigger: formTrigger.trim(),
      action: formAction.trim(),
      identity: formIdentity.trim(),
      startDate: formStartDate,
      time: formTime,
      location: finalLocation,
      reward: formReward.trim(),
      makeObvious: formMakeObvious.trim(),
      createdAt: formatDate(new Date()),
      review: ''
    };

    const newData = {
      ...data,
      habits: [...data.habits, newHabit]
    };
    
    setData(newData);
    await habitService.saveHabits(newData);
    
    setFormTrigger('');
    setFormAction('');
    setFormIdentity('');
    setFormStartDate('');
    setFormTime('');
    setFormLocation('');
    setFormReward('');
    setFormMakeObvious('');
    setShowCustomIdentity(false);
    setCustomIdentity('');
    
    setShowActionSuggestions(false);
    setShowMakeObviousSuggestions(false);
    setShowRewardSuggestions(false);
    setShowIdentitySuggestions(false);
    setShowTriggerSuggestions(false);
    setShowTimeSuggestions(false);
    setShowLocationSuggestions(false);
    setShowAddModal(false);
  };

  const handleEditHabit = async () => {
    if (!formTrigger.trim() || !formAction.trim()) {
      alert('Please fill in Trigger and Action fields');
      return;
    }

    if (!formIdentity.trim()) {
      alert('Please fill in Identity Statement');
      return;
    }

    if (!formStartDate) {
      alert('Please select a start date');
      return;
    }

    if (!formTime) {
      alert('Please select a time');
      return;
    }

    const finalLocation = formLocation.trim();
    if (!finalLocation) {
      alert('Please select a location');
      return;
    }

    const updatedHabit = {
      ...editingHabit,
      trigger: formTrigger.trim(),
      action: formAction.trim(),
      identity: formIdentity.trim(),
      startDate: formStartDate,
      time: formTime,
      location: finalLocation,
      reward: formReward.trim(),
      makeObvious: formMakeObvious.trim()
    };

    const newData = {
      ...data,
      habits: data.habits.map(h => h.id === editingHabit.id ? updatedHabit : h)
    };
    
    setData(newData);
    await habitService.saveHabits(newData);
    
    setShowEditModal(false);
    setEditingHabit(null);
    setFormTrigger('');
    setFormAction('');
    setFormIdentity('');
    setFormStartDate('');
    setFormTime('');
    setFormLocation('');
    setFormReward('');
    setFormMakeObvious('');
    setShowCustomIdentity(false);
    setCustomIdentity('');
    
    setShowActionSuggestions(false);
    setShowMakeObviousSuggestions(false);
    setShowRewardSuggestions(false);
    setShowIdentitySuggestions(false);
    setShowTriggerSuggestions(false);
    setShowTimeSuggestions(false);
    setShowLocationSuggestions(false);
  };

  const handleDeleteHabit = async (habitId) => {
    if (!window.confirm('Delete this habit?')) return;

    const newData = {
      ...data,
      habits: data.habits.filter(h => h.id !== habitId)
    };
    
    setData(newData);
    await habitService.saveHabits(newData);
    setOpenMenuId(null);
  };

  const openEditModal = (habit) => {
    setEditingHabit(habit);
    setFormTrigger(habit.trigger);
    setFormAction(habit.action);
    setFormIdentity(habit.identity || '');
    setFormStartDate(habit.startDate || '');
    setFormTime(habit.time || '');
    setFormReward(habit.reward || '');
    setFormMakeObvious(habit.makeObvious || '');
    
    // Check if location is a predefined option
    const predefinedLocations = ['Bedroom', 'Kitchen', 'Living Room', 'Office', 'Gym', 'Bathroom', 'Outdoors', 'Car'];
    
    if (predefinedLocations.includes(habit.location)) {
      setFormLocation(habit.location);
      
    } else {
      setFormLocation('custom');
      setShowCustomLocation(true);
      setCustomLocation(habit.location || '');
    }
    
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const openReviewModal = (habit) => {
    setReviewingHabit(habit);
    setReview(habit.review || '');
    setShowReviewModal(true);
    setOpenMenuId(null);
  };

  const toggleMenu = (habitId) => {
    setOpenMenuId(openMenuId === habitId ? null : habitId);
  };

  const goToPreviousDay = () => setTodayOffset(prev => prev - 1);
  const goToNextDay = () => setTodayOffset(prev => prev + 1);
  const goToToday = () => setTodayOffset(0);
  const isToday = todayOffset === 0;

  const getTodayLabel = () => {
    if (todayOffset === 0) return 'Today';
    if (todayOffset === -1) return 'Yesterday';
    if (todayOffset === 1) return 'Tomorrow';
    
    const date = currentTodayDate;
    return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
  };

  const getIncompleteTodayHabits = () => {
    return getSortedHabits().filter(habit => {
      // Check if habit has started
      if (!habit.startDate) return false;
      
      const [year, month, day] = habit.startDate.split('-').map(Number);
      const startDate = new Date(year, month - 1, day);
      startDate.setHours(0, 0, 0, 0);
      
      // Only show if habit has started by current viewing date
      if (startDate > currentTodayDate) return false;
      
      // Check if not completed and not missed today
      return !isCompleted(habit.id, currentTodayDate) && !isMissed(habit.id, currentTodayDate);
    });
  };

  const getCompletedTodayHabits = () => {
    return getSortedHabits().filter(habit => {
      // Check if habit has started
      if (!habit.startDate) return false;
      
      const [year, month, day] = habit.startDate.split('-').map(Number);
      const startDate = new Date(year, month - 1, day);
      startDate.setHours(0, 0, 0, 0);
      
      // Only show if habit has started by current viewing date
      if (startDate > currentTodayDate) return false;
      
      // Check if completed today
      return isCompleted(habit.id, currentTodayDate);
    });
  };

  const getMissedTodayHabits = () => {
    return getSortedHabits().filter(habit => {
      // Check if habit has started
      if (!habit.startDate) return false;
      
      const [year, month, day] = habit.startDate.split('-').map(Number);
      const startDate = new Date(year, month - 1, day);
      startDate.setHours(0, 0, 0, 0);
      
      // Only show if habit has started by current viewing date
      if (startDate > currentTodayDate) return false;
      
      // Check if missed today
      return isMissed(habit.id, currentTodayDate);
    });
  };

  const getTodayInsights = () => {
    const allHabits = getSortedHabits().filter(habit => {
      if (!habit.startDate) return false;
      const [year, month, day] = habit.startDate.split('-').map(Number);
      const startDate = new Date(year, month - 1, day);
      startDate.setHours(0, 0, 0, 0);
      return startDate <= currentTodayDate;
    });

    const totalHabits = allHabits.length;
    const completedHabits = allHabits.filter(h => isCompleted(h.id, currentTodayDate)).length;
    const remainingHabits = totalHabits - completedHabits;
    const completionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

    // Calculate current streaks
    const activeStreaks = allHabits.filter(h => getCurrentStreak(h.id) > 0).length;
    
    // Find longest streak today
    const longestStreak = allHabits.reduce((max, h) => {
      const streak = getCurrentStreak(h.id);
      return streak > max ? streak : max;
    }, 0);

    return {
      totalHabits,
      completedHabits,
      remainingHabits,
      completionRate,
      activeStreaks,
      longestStreak
    };
  };

  const handleSaveReview = async () => {
    if (!reviewingHabit) return;

    const updatedHabit = {
      ...reviewingHabit,
      review: review.trim()
    };

    const newData = {
      ...data,
      habits: data.habits.map(h => h.id === reviewingHabit.id ? updatedHabit : h)
    };

    setData(newData);
    await habitService.saveHabits(newData);

    setShowReviewModal(false);
    setReviewingHabit(null);
    setReview('');
  };

  const goToPreviousWeek = () => setWeekOffset(prev => prev - 1);
  const goToNextWeek = () => setWeekOffset(prev => prev + 1);
  const goToCurrentWeek = () => setWeekOffset(0);
  const isCurrentWeek = weekOffset === 0;

  const getWeekLabel = () => {
    if (weekOffset === 0) return 'This Month';
    if (weekOffset === -1) return 'Last Month';
    if (weekOffset === 1) return 'Next Month';
    
    const firstDay = currentMonth[0];
    const monthName = firstDay.toLocaleString('default', { month: 'long', year: 'numeric' });
    return monthName;
  };

  if (loading) {
    return (
      <div className="habit-tracker">
        <div className="habit-loading">Loading habits...</div>
      </div>
    );
  }

  const sortedHabits = getSortedHabits();
  const insights = getOverallInsights();
  const incompleteTodayHabits = getIncompleteTodayHabits();
  const completedTodayHabits = getCompletedTodayHabits();
  const missedTodayHabits = getMissedTodayHabits();
  const todayInsights = getTodayInsights();

  return (
    <div className="habit-tracker">
      <div className="habit-header">
        <h1 className="habit-title">Habit Tracker</h1>
        <button className="habit-add-btn" onClick={() => setShowAddModal(true)}>
          + Add
        </button>
      </div>

      <div className="habit-tabs">
        <button 
          className={`habit-tab ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          Today
        </button>
        <button 
          className={`habit-tab ${activeTab === 'week' ? 'active' : ''}`}
          onClick={() => setActiveTab('week')}
        >
          Week
        </button>
      </div>

      {activeTab === 'today' ? (
        <div className="habit-today-view">
          <div className="habit-week-nav">
            <button className="habit-week-arrow" onClick={goToPreviousDay}>‹</button>
            <div className="habit-week-label">
              <span>{getTodayLabel()}</span>
              {!isToday && (
                <button className="habit-today-btn" onClick={goToToday}>Today</button>
              )}
            </div>
            <button className="habit-week-arrow" onClick={goToNextDay}>›</button>
          </div>

          <div className="habit-today-insights">
            <div className="habit-today-stats">
              <div className="habit-today-stat">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-value">{todayInsights.completedHabits}/{todayInsights.totalHabits}</div>
                  <div className="stat-label">Completed</div>
                </div>
              </div>
              <div className="habit-today-stat">
                <div className="stat-icon">🔥</div>
                <div className="stat-content">
                  <div className="stat-value">{todayInsights.activeStreaks}</div>
                  <div className="stat-label">Active Streaks</div>
                </div>
              </div>
              <div className="habit-today-stat">
                <div className="stat-icon">🏆</div>
                <div className="stat-content">
                  <div className="stat-value">{todayInsights.longestStreak}</div>
                  <div className="stat-label">Best Streak</div>
                </div>
              </div>
            </div>
          </div>

          <div className="habit-list">
            {incompleteTodayHabits.length === 0 && completedTodayHabits.length === 0 && missedTodayHabits.length === 0 ? (
              <div className="habit-empty">
                <p>No habits scheduled for {getTodayLabel().toLowerCase()}!</p>
              </div>
            ) : (
              <>
                {/* Incomplete Habits */}
                {incompleteTodayHabits.length > 0 && (
                  <>
                    {incompleteTodayHabits.map(habit => (
                      <div key={habit.id} className="habit-today-card">
                        <label className="habit-checkbox-wrapper">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => toggleCompletion(habit.id, currentTodayDate)}
                            className="habit-checkbox-input"
                          />
                          <span className="habit-checkbox-custom"></span>
                        </label>
                        <div className="habit-today-content">
                          <span className="habit-today-time">{habit.time}</span>
                          <span className="habit-today-action">{habit.action}</span>
                          <span className="habit-today-identity-small">{habit.identity}</span>
                        </div>
                        <div className="habit-today-right">
                          <div className="habit-today-streak">
                            <span className="habit-today-streak-icon">🔥</span>
                            <span className="habit-today-streak-count">{getCurrentStreak(habit.id)}</span>
                          </div>
                          <button 
                            className="habit-miss-btn"
                            onClick={() => toggleMissed(habit.id, currentTodayDate)}
                            title="Mark as missed"
                          >
                            Miss
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Completed Habits */}
                {completedTodayHabits.length > 0 && (
                  <>
                    {incompleteTodayHabits.length > 0 && (
                      <div className="habit-section-divider">
                        <span className="habit-section-label">Completed ({completedTodayHabits.length})</span>
                      </div>
                    )}
                    {completedTodayHabits.map(habit => (
                      <div key={habit.id} className="habit-today-card habit-today-card-completed">
                        <label className="habit-checkbox-wrapper">
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => toggleCompletion(habit.id, currentTodayDate)}
                            className="habit-checkbox-input"
                          />
                          <span className="habit-checkbox-custom"></span>
                        </label>
                        <div className="habit-today-content">
                          <span className="habit-today-time">{habit.time}</span>
                          <span className="habit-today-action">{habit.action}</span>
                          <span className="habit-today-identity-small">{habit.identity}</span>
                        </div>
                        <div className="habit-today-streak">
                          <span className="habit-today-streak-icon">🔥</span>
                          <span className="habit-today-streak-count">{getCurrentStreak(habit.id)}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Missed Habits */}
                {missedTodayHabits.length > 0 && (
                  <>
                    {(incompleteTodayHabits.length > 0 || completedTodayHabits.length > 0) && (
                      <div className="habit-section-divider">
                        <span className="habit-section-label">Missed ({missedTodayHabits.length})</span>
                      </div>
                    )}
                    {missedTodayHabits.map(habit => (
                      <div key={habit.id} className="habit-today-card habit-today-card-missed">
                        <label className="habit-checkbox-wrapper">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => toggleCompletion(habit.id, currentTodayDate)}
                            className="habit-checkbox-input"
                          />
                          <span className="habit-checkbox-custom"></span>
                        </label>
                        <div className="habit-today-content">
                          <span className="habit-today-time">{habit.time}</span>
                          <span className="habit-today-action">{habit.action}</span>
                          <span className="habit-today-identity-small">{habit.identity}</span>
                        </div>
                        <div className="habit-today-right">
                          <div className="habit-today-streak">
                            <span className="habit-today-streak-icon">🔥</span>
                            <span className="habit-today-streak-count">{getCurrentStreak(habit.id)}</span>
                          </div>
                          <button 
                            className="habit-unmiss-btn"
                            onClick={() => toggleMissed(habit.id, currentTodayDate)}
                            title="Undo missed"
                          >
                            Undo
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* All Complete Message */}
                {incompleteTodayHabits.length === 0 && completedTodayHabits.length > 0 && missedTodayHabits.length === 0 && (
                  <div className="habit-all-complete">
                    <p>🎉 All habits completed for {getTodayLabel().toLowerCase()}!</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="habit-week-nav">
            <button className="habit-week-arrow" onClick={goToPreviousWeek}>‹</button>
            <div className="habit-week-label">
              <span>{getWeekLabel()}</span>
              {!isCurrentWeek && (
                <button className="habit-today-btn" onClick={goToCurrentWeek}>This Month</button>
              )}
            </div>
            <button className="habit-week-arrow" onClick={goToNextWeek}>›</button>
          </div>

          {insights && (
            <div className="habit-insights-card">
              <div className="habit-insights-row">
                <div className="habit-insight-item">
                  <span className="habit-insight-label">Total Habits</span>
                  <span className="habit-insight-value">{insights.totalHabits}</span>
                </div>
                <div className="habit-insight-item">
                  <span className="habit-insight-label">Completion Rate</span>
                  <span className="habit-insight-value">{insights.overallRate}%</span>
                </div>
              </div>
            </div>
          )}

          <div className="habit-list">
        {sortedHabits.length === 0 ? (
          <div className="habit-empty">
            <p>No habits yet. Tap "+ Add" to start tracking!</p>
          </div>
        ) : (
          sortedHabits.map(habit => (
            <div key={habit.id} className="habit-card">
              <button className="habit-menu-btn" onClick={() => toggleMenu(habit.id)}>
                ⋮
              </button>
              {openMenuId === habit.id && (
                <div className="habit-menu-dropdown">
                  <button className="habit-menu-item" onClick={() => openEditModal(habit)}>
                    ✏️ Edit
                  </button>
                  <button className="habit-menu-item" onClick={() => openReviewModal(habit)}>
                    📝 Review
                  </button>
                  <button className="habit-menu-item habit-menu-delete" onClick={() => handleDeleteHabit(habit.id)}>
                    🗑️ Delete
                  </button>
                </div>
              )}
              
              <div className="habit-streak-header">
                <div className="habit-streak-badge">
                  🔥 {getCurrentStreak(habit.id)} Day Streak
                </div>
              </div>
              
              <div className="habit-week-card-content">
                <div className="habit-week-info">
                  <div className="habit-week-time">{habit.time}</div>
                  <div className="habit-week-action">{habit.action}</div>
                  <div className="habit-week-identity">{habit.identity}</div>
                </div>
                
                <div className="habit-week-stats-row">
                  <div className="habit-week-stat">
                    <span className="habit-week-stat-label">This Month</span>
                    <span className="habit-week-stat-value">{getMonthCompletions(habit.id).completed}/{getMonthCompletions(habit.id).total}</span>
                  </div>
                  <div className="habit-week-stat">
                    <span className="habit-week-stat-label">Best Streak</span>
                    <span className="habit-week-stat-value">{getBestStreak(habit.id)}</span>
                  </div>
                </div>
              </div>

              <div className="habit-month-calendar">
                {(() => {
                  // Group days into weeks
                  const weeks = [];
                  let currentWeekDays = [];
                  
                  // Add empty cells for days before the first day of month
                  const firstDayOfMonth = currentMonth[0];
                  const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
                  const startDay = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1; // Convert to Monday = 0
                  
                  for (let i = 0; i < startDay; i++) {
                    currentWeekDays.push(null);
                  }
                  
                  // Add all days of the month
                  currentMonth.forEach((date) => {
                    currentWeekDays.push(date);
                    
                    // If we have 7 days, start a new week
                    if (currentWeekDays.length === 7) {
                      weeks.push([...currentWeekDays]);
                      currentWeekDays = [];
                    }
                  });
                  
                  // Add remaining days to last week
                  if (currentWeekDays.length > 0) {
                    // Fill remaining days with null
                    while (currentWeekDays.length < 7) {
                      currentWeekDays.push(null);
                    }
                    weeks.push(currentWeekDays);
                  }
                  
                  return weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="habit-week-row">
                      {week.map((date, dayIndex) => {
                        if (!date) {
                          return <div key={dayIndex} className="habit-day-col empty"></div>;
                        }
                        
                        const completed = isCompleted(habit.id, date);
                        const dayOfMonth = date.getDate();
                        const dayName = date.toLocaleString('default', { weekday: 'short' });
                        
                        // Check if date is before habit start date
                        const [year, month2, day] = habit.startDate.split('-').map(Number);
                        const startDate = new Date(year, month2 - 1, day);
                        startDate.setHours(0, 0, 0, 0);
                        const isBeforeStart = date < startDate;
                        
                        // Check if date is in the future
                        const isFuture = date > today;
                        const isDisabled = isBeforeStart || isFuture;
                        
                        return (
                          <div key={dayIndex} className="habit-day-col">
                            <div className="habit-day-name">{dayName}</div>
                            <div className="habit-day-date">{dayOfMonth}</div>
                            <label className={`habit-checkbox-wrapper ${isDisabled ? 'disabled' : ''}`}>
                              <input
                                type="checkbox"
                                checked={completed}
                                onChange={() => !isDisabled && toggleCompletion(habit.id, date)}
                                className="habit-checkbox-input"
                                disabled={isDisabled}
                              />
                              <span className="habit-checkbox-custom"></span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>

            </div>
          ))
        )}
          </div>
        </>
      )}

      {showAddModal && (
        <div className="habit-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="habit-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="habit-modal-title">Add New Habit</h2>
            <div className="habit-form">
              <div className="habit-form-group">
                <label className="habit-form-label">Identity Statement *</label>
                <div className="habit-form-action-wrapper">
                  <input
                    type="text"
                    className="habit-form-input"
                    placeholder="I am a person who..."
                    value={formIdentity}
                    onChange={(e) => setFormIdentity(e.target.value)}
                    onFocus={() => setShowIdentitySuggestions(true)}
                    onBlur={() => setTimeout(() => setShowIdentitySuggestions(false), 200)}
                    required
                  />
                  {showIdentitySuggestions && (
                    <div className="habit-suggestions-dropdown">
                      <div className="habit-suggestions-header">
                        ?? Identity-Based Suggestions
                      </div>
                      {getIdentitySuggestions(formAction).map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="habit-suggestion-item"
                          onClick={() => {
                            setFormIdentity(suggestion);
                            setShowIdentitySuggestions(false);
    setShowTriggerSuggestions(false);
    setShowTimeSuggestions(false);
    setShowLocationSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="habit-suggestions-close"
                        onClick={() => setShowIdentitySuggestions(false)}
                      >
                        Close suggestions
                      </button>
                    </div>
                  )}
                </div>
                <div className="habit-form-hint">
                  ?? Suggestions based on your Action above.
                </div>
              </div>
              
              <div className="habit-form-section">
                <div className="habit-form-section-title">📍 When & Where (Implementation Intention)</div>
                <div className="habit-form-preview">
                  After <strong> {formTrigger || '[trigger]'} </strong>, I will <strong> {formAction || '[action]'} </strong> at <strong> {formTime || '[time]'} </strong> in <strong> {formLocation || '[location]'} </strong>
                </div>
                
                <div className="habit-form-group">
                  <label className="habit-form-label">Trigger (Habit Stacking) *</label>
                  <div className="habit-form-action-wrapper">
                    <input
                      type="text"
                      className="habit-form-input"
                      placeholder="e.g., After I wake up..."
                      value={formTrigger}
                      onChange={(e) => setFormTrigger(e.target.value)}
                      onFocus={() => setShowTriggerSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowTriggerSuggestions(false), 200)}
                      required
                    />
                    {showTriggerSuggestions && (
                      <div className="habit-suggestions-dropdown">
                        <div className="habit-suggestions-header">
                          ⚡ Trigger Suggestions
                        </div>
                        {getTriggerSuggestions(formAction).map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            className="habit-suggestion-item"
                            onClick={() => {
                              setFormTrigger(suggestion);
                              setShowTriggerSuggestions(false);
                            }}
                          >
                            {suggestion}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="habit-suggestions-close"
                          onClick={() => setShowTriggerSuggestions(false)}
                        >
                          Close suggestions
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="habit-form-hint">
                    ⚡ Suggestions based on your Action above.
                  </div>
                </div>
                <div className="habit-form-group">
                  <label className="habit-form-label">Action (2-Minute Version) *</label>
                  <div className="habit-form-action-wrapper">
                    <input
                      type="text"
                      className="habit-form-input"
                      placeholder="e.g., exercise, read, meditate, write..."
                      value={formAction}
                      onChange={(e) => setFormAction(e.target.value)}
                      onFocus={() => setShowActionSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowActionSuggestions(false), 200)}
                      required
                    />
                    {showActionSuggestions && (
                      <div className="habit-suggestions-dropdown">
                        <div className="habit-suggestions-header">
                          💡 2-Minute Rule Suggestions
                        </div>
                        {getTwoMinuteSuggestions(formAction).map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            className="habit-suggestion-item"
                            onClick={() => {
                              setFormAction(suggestion);
                              setShowActionSuggestions(false);
                            }}
                          >
                            {suggestion}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="habit-suggestions-close"
                          onClick={() => setShowActionSuggestions(false)}
                        >
                          Close suggestions
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="habit-form-hint">
                    💡 Make it so easy you can't say no. Start with just 2 minutes.
                  </div>
                </div>
                <div className="habit-form-row">
                  <div className="habit-form-group habit-form-half">
                    <label className="habit-form-label">Time *</label>
                    <div className="habit-form-action-wrapper">
                      <input
                        type="time"
                        className="habit-form-input"
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                        onFocus={() => setShowTimeSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowTimeSuggestions(false), 200)}
                        required
                      />
                      {showTimeSuggestions && (
                        <div className="habit-suggestions-dropdown">
                          <div className="habit-suggestions-header">
                            🕐 Time Suggestions
                          </div>
                          {getTimeSuggestions(formAction).map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              className="habit-suggestion-item"
                              onClick={() => {
                                setFormTime(suggestion);
                                setShowTimeSuggestions(false);
                              }}
                            >
                              {suggestion}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="habit-suggestions-close"
                            onClick={() => setShowTimeSuggestions(false)}
                          >
                            Close suggestions
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="habit-form-group habit-form-half">
                    <label className="habit-form-label">Location *</label>
                    <div className="habit-form-action-wrapper">
                      <input
                        type="text"
                        className="habit-form-input"
                        placeholder="e.g., Bedroom, Kitchen..."
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        onFocus={() => setShowLocationSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                        required
                      />
                      {showLocationSuggestions && (
                        <div className="habit-suggestions-dropdown">
                          <div className="habit-suggestions-header">
                            📍 Location Suggestions
                          </div>
                          {getLocationSuggestions(formAction).map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              className="habit-suggestion-item"
                              onClick={() => {
                                setFormLocation(suggestion);
                                setShowLocationSuggestions(false);
                              }}
                            >
                              {suggestion}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="habit-suggestions-close"
                            onClick={() => setShowLocationSuggestions(false)}
                          >
                            Close suggestions
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
              </div>
<div className="habit-form-group">
                <label className="habit-form-label">Make It Obvious (1st Law)</label>
                <div className="habit-form-action-wrapper">
                  <input
                    type="text"
                    className="habit-form-input"
                    placeholder="e.g., Place items in visible location..."
                    value={formMakeObvious}
                    onChange={(e) => setFormMakeObvious(e.target.value)}
                    onFocus={() => setShowMakeObviousSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowMakeObviousSuggestions(false), 200)}
                  />
                  {showMakeObviousSuggestions && (
                    <div className="habit-suggestions-dropdown">
                      <div className="habit-suggestions-header">
                        👁️ Make It Obvious Suggestions
                      </div>
                      {getMakeObviousSuggestions(formAction).map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="habit-suggestion-item"
                          onClick={() => {
                            setFormMakeObvious(suggestion);
                            setShowMakeObviousSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="habit-suggestions-close"
                        onClick={() => setShowMakeObviousSuggestions(false)}
                      >
                        Close suggestions
                      </button>
                    </div>
                  )}
                </div>
                <div className="habit-form-hint">
                  👁️ Suggestions based on your Action above.
                </div>
              </div>
              <div className="habit-form-group">
                <label className="habit-form-label">Reward (4th Law)</label>
                <div className="habit-form-action-wrapper">
                  <input
                    type="text"
                    className="habit-form-input"
                    placeholder="e.g., Enjoy favorite beverage..."
                    value={formReward}
                    onChange={(e) => setFormReward(e.target.value)}
                    onFocus={() => setShowRewardSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowRewardSuggestions(false), 200)}
                  />
                  {showRewardSuggestions && (
                    <div className="habit-suggestions-dropdown">
                      <div className="habit-suggestions-header">
                        🎁 Reward Suggestions
                      </div>
                      {getRewardSuggestions(formAction).map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="habit-suggestion-item"
                          onClick={() => {
                            setFormReward(suggestion);
                            setShowRewardSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="habit-suggestions-close"
                        onClick={() => setShowRewardSuggestions(false)}
                      >
                        Close suggestions
                      </button>
                    </div>
                  )}
                </div>
                <div className="habit-form-hint">
                  🎁 Suggestions based on your Action above.
                </div>
              </div>
              <div className="habit-form-group">
                <label className="habit-form-label">Start Date *</label>
                <input
                  type="date"
                  className="habit-form-input"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="habit-modal-actions">
              <button className="habit-modal-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="habit-modal-save" onClick={handleAddHabit}>Add Habit</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="habit-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="habit-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="habit-modal-title">Edit Habit</h2>
            <div className="habit-form">
              <div className="habit-form-group">
                <label className="habit-form-label">Identity Statement *</label>
                <div className="habit-form-action-wrapper">
                  <input
                    type="text"
                    className="habit-form-input"
                    placeholder="I am a person who..."
                    value={formIdentity}
                    onChange={(e) => setFormIdentity(e.target.value)}
                    onFocus={() => setShowIdentitySuggestions(true)}
                    onBlur={() => setTimeout(() => setShowIdentitySuggestions(false), 200)}
                    required
                  />
                  {showIdentitySuggestions && (
                    <div className="habit-suggestions-dropdown">
                      <div className="habit-suggestions-header">
                        ?? Identity-Based Suggestions
                      </div>
                      {getIdentitySuggestions(formAction).map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="habit-suggestion-item"
                          onClick={() => {
                            setFormIdentity(suggestion);
                            setShowIdentitySuggestions(false);
    setShowTriggerSuggestions(false);
    setShowTimeSuggestions(false);
    setShowLocationSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="habit-suggestions-close"
                        onClick={() => setShowIdentitySuggestions(false)}
                      >
                        Close suggestions
                      </button>
                    </div>
                  )}
                </div>
                <div className="habit-form-hint">
                  ?? Suggestions based on your Action above.
                </div>
              </div>
              
              <div className="habit-form-section">
                <div className="habit-form-section-title">📍 When & Where (Implementation Intention)</div>
                <div className="habit-form-preview">
                  After <strong> {formTrigger || '[trigger]'} </strong>, I will <strong> {formAction || '[action]'} </strong> at <strong> {formTime || '[time]'} </strong> in <strong> {formLocation || '[location]'} </strong>
                </div>
                
                <div className="habit-form-group">
                  <label className="habit-form-label">Trigger (Habit Stacking) *</label>
                  <div className="habit-form-action-wrapper">
                    <input
                      type="text"
                      className="habit-form-input"
                      placeholder="e.g., After I wake up..."
                      value={formTrigger}
                      onChange={(e) => setFormTrigger(e.target.value)}
                      onFocus={() => setShowTriggerSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowTriggerSuggestions(false), 200)}
                      required
                    />
                    {showTriggerSuggestions && (
                      <div className="habit-suggestions-dropdown">
                        <div className="habit-suggestions-header">
                          ⚡ Trigger Suggestions
                        </div>
                        {getTriggerSuggestions(formAction).map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            className="habit-suggestion-item"
                            onClick={() => {
                              setFormTrigger(suggestion);
                              setShowTriggerSuggestions(false);
                            }}
                          >
                            {suggestion}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="habit-suggestions-close"
                          onClick={() => setShowTriggerSuggestions(false)}
                        >
                          Close suggestions
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="habit-form-hint">
                    ⚡ Suggestions based on your Action above.
                  </div>
                </div>
                <div className="habit-form-group">
                  <label className="habit-form-label">Action (2-Minute Version) *</label>
                  <div className="habit-form-action-wrapper">
                    <input
                      type="text"
                      className="habit-form-input"
                      placeholder="e.g., exercise, read, meditate, write..."
                      value={formAction}
                      onChange={(e) => setFormAction(e.target.value)}
                      onFocus={() => setShowActionSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowActionSuggestions(false), 200)}
                      required
                    />
                    {showActionSuggestions && (
                      <div className="habit-suggestions-dropdown">
                        <div className="habit-suggestions-header">
                          💡 2-Minute Rule Suggestions
                        </div>
                        {getTwoMinuteSuggestions(formAction).map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            className="habit-suggestion-item"
                            onClick={() => {
                              setFormAction(suggestion);
                              setShowActionSuggestions(false);
                            }}
                          >
                            {suggestion}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="habit-suggestions-close"
                          onClick={() => setShowActionSuggestions(false)}
                        >
                          Close suggestions
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="habit-form-hint">
                    💡 Make it so easy you can't say no. Start with just 2 minutes.
                  </div>
                </div>
                <div className="habit-form-row">
                  <div className="habit-form-group habit-form-half">
                    <label className="habit-form-label">Time *</label>
                    <div className="habit-form-action-wrapper">
                      <input
                        type="time"
                        className="habit-form-input"
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                        onFocus={() => setShowTimeSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowTimeSuggestions(false), 200)}
                        required
                      />
                      {showTimeSuggestions && (
                        <div className="habit-suggestions-dropdown">
                          <div className="habit-suggestions-header">
                            🕐 Time Suggestions
                          </div>
                          {getTimeSuggestions(formAction).map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              className="habit-suggestion-item"
                              onClick={() => {
                                setFormTime(suggestion);
                                setShowTimeSuggestions(false);
                              }}
                            >
                              {suggestion}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="habit-suggestions-close"
                            onClick={() => setShowTimeSuggestions(false)}
                          >
                            Close suggestions
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="habit-form-group habit-form-half">
                    <label className="habit-form-label">Location *</label>
                    <div className="habit-form-action-wrapper">
                      <input
                        type="text"
                        className="habit-form-input"
                        placeholder="e.g., Bedroom, Kitchen..."
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        onFocus={() => setShowLocationSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                        required
                      />
                      {showLocationSuggestions && (
                        <div className="habit-suggestions-dropdown">
                          <div className="habit-suggestions-header">
                            📍 Location Suggestions
                          </div>
                          {getLocationSuggestions(formAction).map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              className="habit-suggestion-item"
                              onClick={() => {
                                setFormLocation(suggestion);
                                setShowLocationSuggestions(false);
                              }}
                            >
                              {suggestion}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="habit-suggestions-close"
                            onClick={() => setShowLocationSuggestions(false)}
                          >
                            Close suggestions
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
              </div>
<div className="habit-form-group">
                <label className="habit-form-label">Make It Obvious (1st Law)</label>
                <div className="habit-form-action-wrapper">
                  <input
                    type="text"
                    className="habit-form-input"
                    placeholder="e.g., Place items in visible location..."
                    value={formMakeObvious}
                    onChange={(e) => setFormMakeObvious(e.target.value)}
                    onFocus={() => setShowMakeObviousSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowMakeObviousSuggestions(false), 200)}
                  />
                  {showMakeObviousSuggestions && (
                    <div className="habit-suggestions-dropdown">
                      <div className="habit-suggestions-header">
                        👁️ Make It Obvious Suggestions
                      </div>
                      {getMakeObviousSuggestions(formAction).map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="habit-suggestion-item"
                          onClick={() => {
                            setFormMakeObvious(suggestion);
                            setShowMakeObviousSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="habit-suggestions-close"
                        onClick={() => setShowMakeObviousSuggestions(false)}
                      >
                        Close suggestions
                      </button>
                    </div>
                  )}
                </div>
                <div className="habit-form-hint">
                  👁️ Suggestions based on your Action above.
                </div>
              </div>
              <div className="habit-form-group">
                <label className="habit-form-label">Reward (4th Law)</label>
                <div className="habit-form-action-wrapper">
                  <input
                    type="text"
                    className="habit-form-input"
                    placeholder="e.g., Enjoy favorite beverage..."
                    value={formReward}
                    onChange={(e) => setFormReward(e.target.value)}
                    onFocus={() => setShowRewardSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowRewardSuggestions(false), 200)}
                  />
                  {showRewardSuggestions && (
                    <div className="habit-suggestions-dropdown">
                      <div className="habit-suggestions-header">
                        🎁 Reward Suggestions
                      </div>
                      {getRewardSuggestions(formAction).map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="habit-suggestion-item"
                          onClick={() => {
                            setFormReward(suggestion);
                            setShowRewardSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="habit-suggestions-close"
                        onClick={() => setShowRewardSuggestions(false)}
                      >
                        Close suggestions
                      </button>
                    </div>
                  )}
                </div>
                <div className="habit-form-hint">
                  🎁 Suggestions based on your Action above.
                </div>
              </div>
              <div className="habit-form-group">
                <label className="habit-form-label">Start Date *</label>
                <input
                  type="date"
                  className="habit-form-input"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="habit-modal-actions">
              <button className="habit-modal-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="habit-modal-save" onClick={handleEditHabit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="habit-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="habit-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="habit-modal-title">Review</h2>
            <p className="habit-modal-subtitle">{reviewingHabit?.identity}</p>
            <div className="habit-form">
              <div className="habit-form-group">
                <label className="habit-form-label">Notes & Reflections</label>
                <textarea
                  className="habit-form-textarea"
                  placeholder="Reflect on your progress, challenges, and wins..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows="5"
                />
              </div>
            </div>
            <div className="habit-modal-actions">
              <button className="habit-modal-cancel" onClick={() => setShowReviewModal(false)}>Cancel</button>
              <button className="habit-modal-save" onClick={handleSaveReview}>Save Review</button>
            </div>
          </div>
        </div>
      )}
      
      <div className="habit-footer">
        <div className="habit-quote-icon">💡</div>
        <div className="habit-quote-text">{dailyQuote}</div>
      </div>
    </div>
  );
};

export default HabitTracker;
