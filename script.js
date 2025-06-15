function spinWheel() {
  const segments = ["CBANK x10", "CBANK x5", "Try Again", "CBANK x2"];
  const result = segments[Math.floor(Math.random() * segments.length)];
  document.getElementById("result").innerText = "Result: " + result;
}
