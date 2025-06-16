// ================== CONFIGURATION ================== //
const BOT_CONFIG = {
  username: "cbmining_bot",
  adminWallet: "UQB7Qq8821NNJJ5JGp4GbnV66sLWxEDFCtpUUYOaBbW2RpIL",
  tokenContract: "EQARYZBkWrdBMLFROALHaUHVm1ng7CnY2DH-9YirsL-nIzu2",
  miningRate: 100,
  miningDuration: 8 // hours
};

// ================== USER MANAGEMENT ================== //
function getUserId() {
  if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
    return Telegram.WebApp.initDataUnsafe.user.id.toString();
  }
  return localStorage.getItem('cbank_user_id') || generateUserId();
}

function generateUserId() {
  const newId = 'user_' + Math.floor(Math.random() * 1000000);
  localStorage.setItem('cbank_user_id', newId);
  return newId;
}

function getUserData() {
  const userId = getUserId();
  const balance = parseInt(localStorage.getItem(`cbank_balance_${userId}`)) || 0;
  const referrals = parseInt(localStorage.getItem(`cbank_referrals_${userId}`)) || 0;
  const miningSession = JSON.parse(localStorage.getItem(`cbank_mining_${userId}`)) || null;

  return {
    userId,
    username: Telegram?.WebApp?.initDataUnsafe?.user?.username || `User_${userId.slice(-4)}`,
    balance,
    referrals,
    mining: miningSession ? !miningSession.completed : false
  };
}

// ================== MINING SYSTEM ================== //
function checkOngoingMining() {
  const user = getUserData();
  const miningSession = JSON.parse(localStorage.getItem(`cbank_mining_${user.userId}`));
  
  if (!miningSession) {
    document.getElementById('countdown').textContent = '08:00:00';
    return;
  }

  const remaining = miningSession.endTime - Date.now();
  
  if (remaining > 0) {
    startCountdown(remaining);
    document.getElementById('start-mining').textContent = "Mining...";
  } else {
    completeMining(user.userId);
  }
}

function startMining() {
  const user = getUserData();
  if (user.mining) return;

  const endTime = Date.now() + (BOT_CONFIG.miningDuration * 60 * 60 * 1000);
  const session = {
    startTime: Date.now(),
    endTime: endTime,
    completed: false
  };

  localStorage.setItem(`cbank_mining_${user.userId}`, JSON.stringify(session));
  startCountdown(endTime - Date.now());
  updateUI();
}

function completeMining(userId) {
  const balance = parseInt(localStorage.getItem(`cbank_balance_${userId}`)) || 0;
  const newBalance = balance + BOT_CONFIG.miningRate;
  
  localStorage.setItem(`cbank_balance_${userId}`, newBalance);
  localStorage.setItem(`cbank_mining_${userId}`, JSON.stringify({
    completed: true,
    completedAt: Date.now()
  }));

  updateUI();
  showNotification(`Mining completed! +${BOT_CONFIG.miningRate} CB added`);
}

// ================== UI FUNCTIONS ================== //
function updateUI() {
  const user = getUserData();
  
  // Update balance
  document.getElementById('balance').textContent = `CB: ${user.balance}`;
  
  // Update mining button
  const miningBtn = document.getElementById('start-mining');
  if (miningBtn) {
    miningBtn.textContent = user.mining ? "Mining..." : "Start Mining";
    miningBtn.disabled = user.mining;
  }
  
  // Update referral info if on invite page
  if (document.getElementById('referral-link')) {
    document.getElementById('referral-link').value = `https://t.me/${BOT_CONFIG.username}?start=ref_${user.userId}`;
    document.getElementById('invited-count').textContent = user.referrals;
    document.getElementById('earned-bonus').textContent = `${user.referrals * 50} CB`;
  }
}

function startCountdown(durationMs) {
  const timerElement = document.getElementById('countdown');
  if (!timerElement) return;

  let remaining = durationMs;
  
  const interval = setInterval(() => {
    remaining -= 1000;
    
    if (remaining <= 0) {
      clearInterval(interval);
      completeMining(getUserId());
      timerElement.textContent = "00:00:00";
      return;
    }
    
    const hours = Math.floor(remaining / (3600 * 1000));
    const mins = Math.floor((remaining % (3600 * 1000)) / (60 * 1000));
    const secs = Math.floor((remaining % (60 * 1000)) / 1000);
    
    timerElement.textContent = 
      `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, 1000);
}

// ================== INITIALIZATION ================== //
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Telegram WebApp if available
  if (window.Telegram?.WebApp) {
    Telegram.WebApp.expand();
    Telegram.WebApp.enableClosingConfirmation();
    
    // Process referral if exists
    const startParam = Telegram.WebApp.initDataUnsafe.start_param;
    if (startParam && startParam.startsWith('ref_') && startParam !== `ref_${getUserId()}`) {
      processReferral(startParam.replace('ref_', ''));
    }
  }

  // Initialize UI
  updateUI();
  checkOngoingMining();
  
  // Setup mining button
  const miningBtn = document.getElementById('start-mining');
  if (miningBtn) {
    miningBtn.addEventListener('click', startMining);
  }
  
  // Setup copy button if on invite page
  const copyBtn = document.getElementById('copy-referral');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const linkInput = document.getElementById('referral-link');
      linkInput.select();
      document.execCommand('copy');
      showNotification("Referral link copied!");
    });
  }
});

// ================== UTILITY FUNCTIONS ================== //
function processReferral(referrerId) {
  const user = getUserData();
  if (user.referrals > 0) return; // Prevent multiple bonuses

  // Give bonus to referred user
  user.balance += 50;
  localStorage.setItem(`cbank_balance_${user.userId}`, user.balance);
  
  // Update referrer's count (in a real app, this would be server-side)
  const referrerReferrals = parseInt(localStorage.getItem(`cbank_referrals_${referrerId}`)) || 0;
  localStorage.setItem(`cbank_referrals_${referrerId}`, referrerReferrals + 1);
  
  // Update UI
  updateUI();
  showNotification("You received 50 CB bonus via referral!");
}

function showNotification(message) {
  if (window.Telegram?.WebApp?.showAlert) {
    Telegram.WebApp.showAlert(message);
  } else {
    alert(message);
  }
}
