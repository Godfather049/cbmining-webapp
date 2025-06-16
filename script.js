// ================== KONFİQURASİYA ================== //
const BOT_CONFIG = {
  username: "cbmining_bot",
  adminWallet: "UQB7Qq8821NNJJ5JGp4GbnV66sLWxEDFCtpUUYOaBbW2RpIL",
  tokenContract: "EQARYZBkWrdBMLFROALHaUHVm1ng7CnY2DH-9YirsL-nIzu2",
  apiUrl: "https://cbank-mining.netlify.app/.netlify/functions",
  miningRate: 100,
  miningDuration: 8
};

// ================== GLOBAL DƏYİŞƏNLƏR ================== //
let miningInterval;
let tgWebApp;
let userData = {
  id: null,
  username: "Guest",
  balance: 0,
  referrals: 0,
  mining: false
};

// ================== İNİTİALİZASİYA ================== //
document.addEventListener('DOMContentLoaded', async () => {
  initTelegramWebApp();
  loadUserData();
  initUI();
  checkOngoingMining();
  removeDuplicateButtons(); // Təkrar düymələri sil
  checkIcons(); // İkonları yoxla
});

// ================== TELEGRAM INTEGRASİYASI ================== //
function initTelegramWebApp() {
  if (window.Telegram?.WebApp) {
    tgWebApp = Telegram.WebApp;
    tgWebApp.expand();
    tgWebApp.enableClosingConfirmation();
    
    const tgUser = tgWebApp.initDataUnsafe.user;
    if (tgUser) {
      userData.id = tgUser.id;
      userData.username = tgUser.username || `user_${tgUser.id}`;
      
      // Referral sistemini yoxla
      const startParam = tgWebApp.initDataUnsafe.start_param;
      if (startParam && startParam !== userData.id.toString()) {
        handleReferral(startParam);
      }
    }
  } else {
    initBrowserMode();
  }
}

// ================== MİNİNG SİSTEMİ ================== //
function checkOngoingMining() {
  const savedSession = localStorage.getItem('cbank_mining_session');
  if (savedSession) {
    const session = JSON.parse(savedSession);
    const remaining = session.endTime - Date.now();
    
    if (remaining > 0) {
      startMiningUI(session.endTime);
    } else {
      completeMining();
    }
  }
}

function startMining() {
  if (userData.mining) return;

  const endTime = Date.now() + (BOT_CONFIG.miningDuration * 60 * 60 * 1000);
  userData.mining = true;
  
  localStorage.setItem('cbank_mining_session', JSON.stringify({
    startTime: Date.now(),
    endTime: endTime,
    completed: false
  }));

  startMiningUI(endTime);
  showNotification("⛏️ Mining başladı! 8 saat sonra 100 CB qazanacaqsınız");
}

function completeMining() {
  userData.balance += BOT_CONFIG.miningRate;
  userData.mining = false;
  
  localStorage.setItem('cbank_balance', userData.balance);
  localStorage.removeItem('cbank_mining_session');
  
  updateUI();
  showNotification(`✅ Mining tamamlandı! +${BOT_CONFIG.miningRate} CB əlavə edildi`);
}

function startMiningUI(endTime) {
  userData.mining = true;
  updateUI();
  startCountdown(endTime - Date.now());
}

// ================== REFERRAL SİSTEMİ ================== //
async function handleReferral(referrerId) {
  if (!userData.id || userData.id.toString() === referrerId) return;

  try {
    const response = await fetch(`${BOT_CONFIG.apiUrl}/referral`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userData.id,
        referrerId: referrerId
      })
    });

    if (response.ok) {
      userData.referrals++;
      userData.balance += 50;
      localStorage.setItem('cbank_referrals', userData.referrals);
      localStorage.setItem('cbank_balance', userData.balance);
      updateUI();
    }
  } catch (error) {
    console.error("Referral error:", error);
  }
}

async function generateReferralLink() {
  try {
    const response = await fetch(`${BOT_CONFIG.apiUrl}/referral-link?userId=${userData.id || 0}`);
    if (response.ok) {
      const data = await response.json();
      return data.link || `https://t.me/${BOT_CONFIG.username}?start=ref${userData.id || 0}`;
    }
  } catch (error) {
    console.warn("Referral link error:", error);
  }
  return `https://t.me/${BOT_CONFIG.username}?start=ref${userData.id || 0}`;
}

// ================== WALLET & TOKEN SİSTEMİ ================== //
function connectWallet() {
  if (tgWebApp) {
    tgWebApp.openInvoice({
      currency: 'TON',
      amount: 1000000000,
      description: 'CBANK Token Purchase',
      payload: JSON.stringify({
        userId: userData.id,
        wallet: BOT_CONFIG.adminWallet,
        tokenContract: BOT_CONFIG.tokenContract
      })
    });
  } else {
    window.open(`ton://transfer/${BOT_CONFIG.adminWallet}`, '_blank');
  }
}

// ================== İNTERFEYS FUNKSİYALARI ================== //
function initUI() {
  // Mining button
  const miningBtn = document.getElementById('start-mining');
  if (miningBtn) {
    miningBtn.addEventListener('click', startMining);
    miningBtn.disabled = userData.mining;
  }

  // Wallet button
  const walletBtn = document.getElementById('wallet-btn');
  if (walletBtn) {
    walletBtn.addEventListener('click', connectWallet);
  }

  // Referral copy button
  const copyBtn = document.getElementById('copy-referral');
  if (copyBtn) {
    copyBtn.addEventListener('click', copyReferralLink);
  }

  updateUI();
}

function updateUI() {
  // Balans
  const balanceEl = document.getElementById('balance');
  if (balanceEl) balanceEl.textContent = `CB: ${userData.balance}`;

  // Referral
  updateReferralUI();

  // Mining button
  const miningBtn = document.getElementById('start-mining');
  if (miningBtn) {
    miningBtn.textContent = userData.mining ? "Mining..." : "Start Mining";
    miningBtn.disabled = userData.mining;
  }
}

async function updateReferralUI() {
  const referralEl = document.getElementById('referral-link');
  if (referralEl) {
    referralEl.value = await generateReferralLink();
  }

  const referralCountEl = document.getElementById('referral-count');
  if (referralCountEl) {
    referralCountEl.textContent = `Referrallar: ${userData.referrals}`;
  }
}

// ================== İKON PROBLEMLƏRİ ÜÇÜN ================== //
function checkIcons() {
  const navIcons = document.querySelectorAll('.nav-icon');
  if (navIcons.length === 0) {
    loadFallbackIcons();
    return;
  }

  // SVG yüklənməyibsə, fallback emoji istifadə et
  navIcons.forEach(icon => {
    if (!icon.clientWidth) {
      const parent = icon.closest('.nav-item');
      if (parent) {
        const span = parent.querySelector('span');
        if (span) {
          const emoji = getFallbackEmoji(span.textContent);
          parent.innerHTML = `${emoji}<span>${span.textContent}</span>`;
        }
      }
    }
  });
}

function getFallbackEmoji(text) {
  const emojiMap = {
    'Home': '🏠',
    'Earn': '💰',
    'Wallet': '💳',
    'Clan': '👥',
    'Referral': '👥'
  };
  return emojiMap[text] || '🔘';
}

function loadFallbackIcons() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    const span = item.querySelector('span');
    if (span) {
      const emoji = getFallbackEmoji(span.textContent);
      item.innerHTML = `${emoji}<span>${span.textContent}</span>`;
    }
  });
}

// ================== TƏKRAR DÜYMƏLƏR ÜÇÜN ================== //
function removeDuplicateButtons() {
  const buttons = document.querySelectorAll('button');
  const uniqueButtons = new Set();

  buttons.forEach(button => {
    const buttonText = button.textContent.trim();
    if (uniqueButtons.has(buttonText)) {
      button.remove();
    } else {
      uniqueButtons.add(buttonText);
    }
  });
}

// ================== KÖMƏKÇİ FUNKSİYALAR ================== //
function startCountdown(durationMs) {
  const timerEl = document.getElementById('countdown');
  if (!timerEl) return;

  let remaining = durationMs;
  
  const interval = setInterval(() => {
    remaining -= 1000;
    
    if (remaining <= 0) {
      clearInterval(interval);
      completeMining();
      timerEl.textContent = "00:00:00";
      return;
    }
    
    const hours = Math.floor(remaining / (3600 * 1000));
    const mins = Math.floor((remaining % (3600 * 1000)) / (60 * 1000));
    const secs = Math.floor((remaining % (60 * 1000)) / 1000);
    
    timerEl.textContent = 
      `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, 1000);
}

function showNotification(message) {
  if (tgWebApp?.showAlert) {
    tgWebApp.showAlert(message);
  } else {
    alert(message);
  }
}

function copyReferralLink() {
  const referralInput = document.getElementById('referral-link');
  if (!referralInput) return;

  referralInput.select();
  document.execCommand('copy');
  showNotification("Referral linki kopyalandı!");
}

function loadUserData() {
  userData.balance = parseInt(localStorage.getItem('cbank_balance')) || 0;
  userData.referrals = parseInt(localStorage.getItem('cbank_referrals')) || 0;
  userData.mining = localStorage.getItem('cbank_mining_session') !== null;
}

function initBrowserMode() {
  userData = {
    id: Math.floor(Math.random() * 1000000),
    username: "demo_user",
    balance: parseInt(localStorage.getItem('cbank_balance')) || 500,
    referrals: parseInt(localStorage.getItem('cbank_referrals')) || 0,
    mining: false
  };
  
  if (!localStorage.getItem('cbank_balance')) {
    localStorage.setItem('cbank_balance', '500');
  }
}
