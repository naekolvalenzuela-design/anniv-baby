// ============================================================
// "HOW WELL DO YOU KNOW US?" QUIZ
// To fix an answer or wording, edit the QUESTIONS array below.
// For the two photo questions, change the "img" path to your
// real photo file once you've added it to the /photos folder.
// ============================================================

const QUESTIONS = [
  {
    type: 'mcq',
    prompt: 'What date did we match on Telegram?',
    options: ['July 19', 'July 31', 'June 21', 'August 5'],
    correct: 0
  },
  {
    type: 'mcq',
    prompt: 'When did I first come visit you?',
    options: ['December 25', 'November 21', 'October 10', 'January 1'],
    correct: 1
  },
  {
    type: 'photo-mcq',
    prompt: 'Which one is our favorite picture together?',
    options: [
      'photos/fave 1.jpg',
      'photos/fave 2.jpg',
      'photos/fave 3.jpg'
    ],
    correct: 2
  },
  {
    type: 'photo-mcq',
    prompt: 'Which one is my favorite picture of you?',
    options: [
      'photos/u 1.jpg',
      'photos/u 2.jpg',
      'photos/u 3.jpg'
    ],
    correct: 2
  },
  {
    type: 'mcq',
    prompt: 'When was my 2nd visit?',
    options: ['March 3', 'February 11', 'April 4', 'January 30'],
    correct: 1
  },
  {
    type: 'mcq',
    prompt: 'When was my 3rd visit?',
    options: ['June 6', 'April 21', 'May 22', 'July 7'],
    correct: 2
  },
  {
    type: 'mcq',
    prompt: 'What are the 2 movies I really love?',
    options: [
      'Marvel & DC',
      'Resident Evil & All the bright places',
      'Transformers & Harry Potter',
      'Frozen & Moana'
    ],
    correct: 2
  },
  {
    type: 'mcq',
    prompt: "What's my favorite thing to do when I'm with you?",
    options: [
      'Arguing',
      'Cuddling and kissing',
      'Playing Roblox all day',
      'Sleeping the whole time'
    ],
    correct: 1
  },
  {
    type: 'mcq',
    prompt: "I'm happy when I...",
    options: [
      'Win a video game',
      'Get free food',
      'See you eat',
      'Sleep in late'
    ],
    correct: 2
  },
  {
    type: 'mcq',
    prompt: 'I like when we try...',
    options: [
      'Skydiving together',
      'New food together',
      'Solving world hunger',
      'Learning chess'
    ],
    correct: 1
  },
  {
    type: 'mcq',
    prompt: "What's my favorite part of you?",
    options: ['Your elbows', 'Your eyebrows', 'Your eyes', 'Your left pinky toe'],
    correct: 2
  },
  {
    type: 'mcq',
    prompt: 'What do I do when I feel jealous?',
    options: ['I go quiet', 'I start a fight', 'I post cryptic tweets', 'I sleep'],
    correct: 0
  }
];

const CORRECT_MSGS = ['Yes! 🎉', 'Correct, cutie! 💕', 'Tama! You know me so well.', 'Ding ding ding! ✨'];
const WRONG_MSGS = ["Oops, try again 😅", "Hindi yan — subukan ulit!", "Close, but no. Try again!", "Hmm, not quite 🤔"];

let current = 0;
let answered = false;

const cardEl = document.getElementById('quizCard');
const stepLabelEl = document.getElementById('quizStepLabel');
const progressBarEl = document.getElementById('quizProgressBar');

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function updateProgress() {
  stepLabelEl.textContent = current < QUESTIONS.length
    ? `Question ${current + 1} of ${QUESTIONS.length}`
    : 'All done!';
  const pct = Math.min(100, (current / QUESTIONS.length) * 100);
  progressBarEl.style.width = pct + '%';
}

function renderQuestion() {
  answered = false;
  updateProgress();

  if (current >= QUESTIONS.length) {
    renderResults();
    return;
  }

  const q = QUESTIONS[current];

  if (q.type === 'photo-mcq') {
    const optionsHtml = q.options.map((src, i) => `
      <button class="quiz-photo-option" data-index="${i}">
        <img src="${src}" alt="Option ${i + 1}" onerror="this.closest('.quiz-photo-option').classList.add('quiz-photo-missing'); this.style.display='none';">
        <div class="quiz-photo-fallback">📷<br><code>${src}</code></div>
      </button>
    `).join('');

    cardEl.innerHTML = `
      <div class="quiz-prompt">${q.prompt}</div>
      <div class="quiz-photo-options">${optionsHtml}</div>
      <div class="quiz-feedback" id="quizFeedback"></div>
    `;

    const buttons = cardEl.querySelectorAll('.quiz-photo-option');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => handleAnswer(btn, buttons, q));
    });
    return;
  }

  // mcq
  const optionsHtml = q.options.map((opt, i) =>
    `<button class="quiz-option" data-index="${i}">${opt}</button>`
  ).join('');

  cardEl.innerHTML = `
    <div class="quiz-prompt">${q.prompt}</div>
    <div class="quiz-options">${optionsHtml}</div>
    <div class="quiz-feedback" id="quizFeedback"></div>
  `;

  const buttons = cardEl.querySelectorAll('.quiz-option');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => handleAnswer(btn, buttons, q));
  });
}

function handleAnswer(btn, buttons, q) {
  const idx = Number(btn.getAttribute('data-index'));
  const feedback = document.getElementById('quizFeedback');

  if (idx === q.correct) {
    answered = true;
    buttons.forEach((b) => b.disabled = true);
    btn.classList.add('correct');
    feedback.textContent = pickRandom(CORRECT_MSGS);
    feedback.className = 'quiz-feedback show correct-text';
    launchMiniConfetti();
    setTimeout(nextQuestion, 1100);
  } else {
    btn.classList.add('wrong');
    btn.classList.add('shake');
    setTimeout(() => btn.classList.remove('shake'), 400);
    feedback.textContent = pickRandom(WRONG_MSGS);
    feedback.className = 'quiz-feedback show wrong-text';
    btn.disabled = true;
  }
}

function nextQuestion() {
  current++;
  renderQuestion();
}

function renderResults() {
  localStorage.setItem('heartsUnlocked', '1');
  launchMiniConfetti(24);
  setTimeout(() => {
    window.location.href = 'letter.html?unlocked=1';
  }, 1200);
}

function launchMiniConfetti(count) {
  const chars = ['💗', '💕', '✨', '♡'];
  const n = count || 14;
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-heart';
    c.textContent = chars[Math.floor(Math.random() * chars.length)];
    c.style.left = Math.random() * 100 + 'vw';
    c.style.animationDuration = (2.2 + Math.random() * 1.6) + 's';
    c.style.fontSize = (14 + Math.random() * 12) + 'px';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4200);
  }
}

renderQuestion();