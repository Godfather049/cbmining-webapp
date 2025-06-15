// Mining Countdown Logic
let countdownElement = document.getElementById("countdown");
let miningButton = document.getElementById("start-mining");

let miningInterval;
let miningTime = 8 * 60 * 60; // 8 hours in seconds

function startCountdown() {
  miningButton.disabled = true;
  miningButton.innerText = "Mining...";
  updateCountdown();

  miningInterval = setInterval(() => {
    miningTime--;
    updateCountdown();

    if (miningTime <= 0) {
      clearInterval(miningInterval);
      miningButton.disabled = false;
      miningButton.innerText = "Start Mining";
      countdownElement.innerText = "You earned 100 CBANK!";
      miningTime = 8 * 60 * 60; // Reset for next mining
    }
  }, 1000);
}

function updateCountdown() {
  let hours = Math.floor(miningTime / 3600);
  let minutes = Math.floor((miningTime % 3600) / 60);
  let seconds = miningTime % 60;

  countdownElement.innerText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function pad(num) {
  return num.toString().padStart(2, '0');
}

if (miningButton) {
  miningButton.addEventListener("click", startCountdown);
}
