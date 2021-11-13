export function timeSinceLastMiddleFinger(lastMiddleFingerDate) {
  // choosing 15 as 15 minutes is the cooldown determined by the contract
  return Math.floor(15 - (new Date() - lastMiddleFingerDate)/60000);
}