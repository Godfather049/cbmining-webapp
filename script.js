// Countdown (8 hours) with localStorage save
const countdownEl = document.getElementById('countdown');
const startButton = document.getElementById('start-mining');

if (startButton) {
  startButton.addEventListener('click', () => {
    const futureTime = Date.now() + 8 * 60 * 60 * 1000;
    localStorage.setItem('cbankCountdown', futureTime);
    updateCountdown();
  });
}

function updateCountdown() {
  const savedTime = localStorage.getItem('cbankCountdown');
  if (!savedTime) return;

  const interval = setInterval(() => {
    const now = Date.now();
    const distance = savedTime - now;

    if (distance <= 0) {
      clearInterval(interval);
      countdownEl.textContent = 'Ready! +100 CB';
      localStorage.removeItem('cbankCountdown');
    } else {
      const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((distance / (1000 * 60)) % 60);
      const seconds = Math.floor((distance / 1000) % 60);
      countdownEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }, 1000);
}

if (localStorage.getItem('cbankCountdown')) {
  updateCountdown();
}

// SPIN WHEEL logic (with 1 free spin per day)
const spinButton = document.getElementById('spin-button');
const spinWheel = document.getElementById('wheel');
const spinResult = document.getElementById('spin-result');

const prizes = [5, 10, 15, 20, 25, 50];

function canSpinToday() {
  const lastSpin = localStorage.getItem('lastSpinDate');
  const today = new Date().toDateString();
  return lastSpin !== today;
}

function setSpinUsed() {
  const today = new Date().toDateString();
  localStorage.setItem('lastSpinDate', today);
}

if (spinButton) {
  spinButton.addEventListener('click', () => {
    if (!canSpinToday()) {
      spinResult.textContent = 'You already used your free spin today!';
      return;
    }

    spinButton.disabled = true;
    spinWheel.style.transition = 'transform 3s ease-out';
    const deg = 360 * 5 + Math.floor(Math.random() * 360);
    spinWheel.style.transform = `rotate(${deg}deg)`;

    setTimeout(() => {
      const prize = prizes[Math.floor(Math.random() * prizes.length)];
      spinResult.textContent = `🎉 You won ${prize} CB!`;
      setSpinUsed();
      spinButton.disabled = false;
    }, 3200);
  });
}

// Referral Count (example logic)
const referralCount = localStorage.getItem('referralCount') || 0;
const referralDisplay = document.getElementById('referral-count');
if (referralDisplay) {
  referralDisplay.textContent = `You invited: ${referralCount} users`;
}
