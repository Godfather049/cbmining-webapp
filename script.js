let balance = parseInt(localStorage.getItem("balance")) || 0;

// Balans göstəricisi
document.addEventListener("DOMContentLoaded", () => {
  const balanceEl = document.getElementById("balance");
  if (balanceEl) balanceEl.innerText = balance;

  const walletDisplay = document.getElementById("wallet-address");
  if (walletDisplay) {
    const walletAddress = localStorage.getItem("walletAddress") || "Not connected yet";
    walletDisplay.innerText = walletAddress;
  }
});

function startMining() {
  const now = Math.floor(Date.now() / 1000);
  const miningTime = 8 * 60 * 60; // 8 saat
  const nextMineTime = localStorage.getItem("nextMineTime");

  if (nextMineTime && now < nextMineTime) {
    alert("You are already mining!");
    startCountdown(nextMineTime);
    return;
  }

  localStorage.setItem("nextMineTime", now + miningTime);
  startCountdown(now + miningTime);
}

function startCountdown(targetTime) {
  const countdownEl = document.getElementById("countdown");
  clearInterval(window.miningInterval);

  window.miningInterval = setInterval(() => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = targetTime - now;

    if (remaining <= 0) {
      clearInterval(window.miningInterval);
      balance += 100;
      localStorage.setItem("balance", balance);
      document.getElementById("balance").innerText = balance;
      countdownEl.innerText = "✅ Mining Complete!";
      localStorage.removeItem("nextMineTime");
      alert("🎉 You earned 100 CBANK.");
    } else {
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      countdownEl.innerText = `⏳ ${hours}h ${minutes}m ${seconds}s`;
    }
  }, 1000);
}

function connectTonWallet() {
  const cbankTokenLink = "https://t.me/BlumCryptoBot/app?startapp=ref_1208457251&token_address=EQARYZBkWrdBMLFROALHaUHVm1ng7CnY2DH-9YirsL-nIzu2";

  if (localStorage.getItem("walletAddress")) {
    alert("Already connected:\n" + localStorage.getItem("walletAddress"));
    return;
  }

  window.open(cbankTokenLink, '_blank');
}

function saveManualAddress() {
  const input = document.getElementById("manual-wallet");
  const address = input.value.trim();

  if (!address) {
    alert("Please enter a valid TON address.");
    return;
  }

  localStorage.setItem("walletAddress", address);
  document.getElementById("wallet-address").innerText = address;
  alert("✅ Wallet address saved!");
}
