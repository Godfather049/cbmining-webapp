// script.js

let countdownTimer; let countdownEndTime;

function startCountdown(duration) { clearInterval(countdownTimer); countdownEndTime = Date.now() + duration * 1000; updateCountdown(); countdownTimer = setInterval(updateCountdown, 1000); localStorage.setItem('cbank_mining_timer', countdownEndTime); }

function updateCountdown() { const remaining = Math.max(0, countdownEndTime - Date.now()); const hours = Math.floor(remaining / (1000 * 60 * 60)); const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)); const seconds = Math.floor((remaining % (1000 * 60)) / 1000); document.getElementById('countdown').textContent = ${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')};

if (remaining <= 0) { clearInterval(countdownTimer); let balance = parseInt(localStorage.getItem('cbank_balance') || '0'); balance += 100; localStorage.setItem('cbank_balance', balance); updateBalance(); } }

function updateBalance() { const balance = parseInt(localStorage.getItem('cbank_balance') || '0'); const balanceElement = document.getElementById('balance'); if (balanceElement) { balanceElement.textContent = Balance: ${balance} CB; } }

function initMining() { const savedEndTime = localStorage.getItem('cbank_mining_timer'); if (savedEndTime && parseInt(savedEndTime) > Date.now()) { countdownEndTime = parseInt(savedEndTime); countdownTimer = setInterval(updateCountdown, 1000); updateCountdown(); } else { localStorage.removeItem('cbank_mining_timer'); document.getElementById('countdown').textContent = '8:00:00'; } updateBalance(); }

document.addEventListener('DOMContentLoaded', () => { const miningBtn = document.getElementById('start-mining'); if (miningBtn) { miningBtn.addEventListener('click', () => startCountdown(8 * 3600)); } initMining();

// Referral link setup const referralEl = document.getElementById('referral-link'); if (referralEl) { const botUsername = 'cbankminingbot'; // Change this to your bot's username const userId = Math.floor(Math.random() * 99999999); // Simulate a user ID referralEl.value = https://t.me/${botUsername}?start=${userId}; }

// Referral count display const referralCountEl = document.getElementById('referral-count'); if (referralCountEl) { const referralCount = localStorage.getItem('cbank_referrals') || '0'; referralCountEl.textContent = Referrals: ${referralCount}; } });

                          
