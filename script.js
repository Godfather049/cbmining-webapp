// ================== KONFİQURASİYA ================== //
const BOT_CONFIG = {
  username: "cbmining_bot",
  token: "7336956953:AAE_jU8Qd2CNhe9hfSDTzG9zp17FXBFY0Ys",
  adminWallet: "UQB7Qq8821NNJJ5JGp4GbnV66sLWxEDFCtpUUYOaBbW2RpIL",
  tokenContract: "EQARYZBkWrdBMLFROALHaUHVm1ng7CnY2DH-9YirsL-nIzu2",
  channel: "https://t.me/cbankmining",
  apiUrl: "https://cbank-mining.netlify.app/.netlify/functions",
  tokenRate: 100,
  miningDuration: 8
};

// ================== ƏSAS KOD ================== //
let miningSession;
let tgWebApp;
let userData = {
  id: null,
  username: null,
  balance: 0,
  referrals: 0
};

document.addEventListener('DOMContentLoaded', async () => {
  // Telegram WebApp init
  if (window.Telegram && Telegram.WebApp) {
    tgWebApp = Telegram.WebApp;
    tgWebApp.expand();
    tgWebApp.enableClosingConfirmation();
    await initTelegramUser();
  } else {
    console.warn('Telegram WebApp not detected, running in browser mode');
    initBrowserMode();
  }

  initUI();
  loadUserData();
  checkOngoingMining();
});

// ================== İSTİFADƏÇİ İDARƏETMƏ ================== //
async function initTelegramUser() {
  const tgUser = tgWebApp.initDataUnsafe.user;
  if (!tgUser) return;

  userData = {
    id: tgUser.id,
    username: tgUser.username || `user_${tgUser.id}`,
    balance: parseInt(localStorage.getItem('cbank_balance')) || 0,
    referrals: parseInt(localStorage.getItem('cbank_referrals')) || 0
  };

  // Referral sistemini yoxla
  const startParam = tgWebApp.initDataUnsafe.start_param;
  if (startParam && startParam !== userData.id.toString()) {
    await handleReferral(startParam);
  }

  // İstifadəçi məlumatlarını yadda saxla
  localStorage.setItem('cbank_user_id', userData.id);
  localStorage.setItem('cbank_username', userData.username);
}

// ================== MİNİNG SİSTEMİ ================== //
function checkOngoingMining() {
  const savedSession = localStorage.getItem('cbank_mining_session');
  if (savedSession) {
    miningSession = JSON.parse(savedSession);
    const remaining = Math.max(0, miningSession.endTime - Date.now());
    
    if (remaining > 0) {
      startCountdown(remaining);
      document.getElementById('start-mining').textContent = 'Mining...';
    } else {
      completeMining();
    }
  }
}

function startMining() {
  if (miningSession) return;
  
  const endTime = Date.now() + (BOT_CONFIG.miningDuration * 60 * 60 * 1000);
  miningSession = {
    startTime: Date.now(),
    endTime: endTime,
    completed: false
  };
  
  localStorage.setItem('cbank_mining_session', JSON.stringify(miningSession));
  startCountdown(BOT_CONFIG.miningDuration * 60 * 60 * 1000);
  document.getElementById('start-mining').textContent = 'Mining...';
  
  // Backend-ə bildir
  if (tgWebApp) {
    tgWebApp.sendData(JSON.stringify({
      action: 'start_mining',
      userId: userData.id,
      duration: BOT_CONFIG.miningDuration
    }));
  }
}

function completeMining() {
  if (!miningSession || miningSession.completed) return;
  
  userData.balance += BOT_CONFIG.tokenRate;
  miningSession.completed = true;
  
  localStorage.setItem('cbank_balance', userData.balance);
  localStorage.setItem('cbank_mining_session', JSON.stringify(miningSession));
  
  updateBalance();
  showNotification(`⛏️ Mining tamamlandı! +${BOT_CONFIG.tokenRate} CB əlavə edildi`);
  document.getElementById('start-mining').textContent = 'Start Mining';
}

// ================== ÖDƏNİŞ SİSTEMİ ================== //
function connectWallet() {
  if (tgWebApp) {
    tgWebApp.openInvoice({
      currency: 'TON',
      amount: 1000000000, // 1 TON in nanoTON
      description: 'CBANK Mining Deposit',
      payload: JSON.stringify({
        userId: userData.id,
        wallet: BOT_CONFIG.adminWallet,
        tokenContract: BOT_CONFIG.tokenContract
      })
    });
  } else {
    window.open(`https://app.tonkeeper.com/transfer/${BOT_CONFIG.adminWallet}`, '_blank');
  }
}

function buyTokens() {
  const message = `💳 Token almaq üçün ${BOT_CONFIG.adminWallet} ünvanına TON göndərin\n\n` +
                 `📝 Qeyd edin: ${userData.id}`;
  
  if (tgWebApp) {
    tgWebApp.showAlert(message);
  } else {
    alert(message);
  }
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
      const data = await response.json();
      userData.referrals = data.referralCount || userData.referrals;
      localStorage.setItem('cbank_referrals', userData.referrals);
      updateReferralUI();
    }
  } catch (error) {
    console.error('Referral error:', error);
  }
}

// ================== İNTERFEYS FUNKSİYALARI ================== //
function initUI() {
  // Mining button
  const miningBtn = document.getElementById('start-mining');
  if (miningBtn) {
    miningBtn.addEventListener('click', startMining);
  }

  // Wallet button
  const walletBtn = document.getElementById('wallet-btn');
  if (walletBtn) {
    walletBtn.addEventListener('click', connectWallet);
  }

  // Buy Tokens button
  const buyBtn = document.getElementById('buy-tokens');
  if (buyBtn) {
    buyBtn.addEventListener('click', buyTokens);
  }

  // Clan button text fix
  const clanBtn = document.querySelector('[href="clan.html"]');
  if (clanBtn) {
    clanBtn.querySelector('span').textContent = 'Clana Qoşul';
  }

  // Update referral link
  updateReferralLink();
}

function updateReferralLink() {
  const referralEl = document.getElementById('referral-link');
  if (referralEl) {
    referralEl.value = `https://t.me/${BOT_CONFIG.username}?start=${userData.id}`;
  }
}

function updateBalance() {
  const balanceElement = document.getElementById('balance');
  if (balanceElement) {
    balanceElement.textContent = `CB: ${userData.balance}`;
  }
}

function updateReferralUI() {
  const referralCountEl = document.getElementById('referral-count');
  if (referralCountEl) {
    referralCountEl.textContent = `Referrallar: ${userData.referrals}`;
  }
}

// ================== KÖMƏKÇİ FUNKSİYALAR ================== //
function startCountdown(durationMs) {
  const timerElement = document.getElementById('countdown');
  if (!timerElement) return;

  let remaining = durationMs;
  
  const interval = setInterval(() => {
    remaining -= 1000;
    
    if (remaining <= 0) {
      clearInterval(interval);
      completeMining();
      timerElement.textContent = '00:00:00';
      return;
    }
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    timerElement.textContent = 
      `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
}

function showNotification(message) {
  if (tgWebApp) {
    tgWebApp.showAlert(message);
  } else {
    alert(message);
  }
}

function loadUserData() {
  userData.balance = parseInt(localStorage.getItem('cbank_balance')) || 0;
  userData.referrals = parseInt(localStorage.getItem('cbank_referrals')) || 0;
  
  updateBalance();
  updateReferralUI();
}

// ================== BROWSER MODE ================== //
function initBrowserMode() {
  console.log('Browser modunda işləyir');
  userData = {
    id: Math.floor(Math.random() * 1000000),
    username: 'demo_user',
    balance: parseInt(localStorage.getItem('cbank_balance')) || 0,
    referrals: parseInt(localStorage.getItem('cbank_referrals')) || 0
  };
  
  // Demo məlumatlar
  if (!localStorage.getItem('cbank_balance')) {
    localStorage.setItem('cbank_balance', '500');
    userData.balance = 500;
  }
    }
