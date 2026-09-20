// ============================================================
// HOMEPAGE: live counter of time since the anniversary date.
// To change the date, edit the line below.
//
// "Days" = full days elapsed since START (midnight-to-midnight).
// "Hours/Min/Sec" = time remaining until the next 12:00 NN — since
// that's the exact time she answered a year ago, the countdown
// always points toward that moment (today's noon if it hasn't
// happened yet, otherwise tomorrow's noon).
// ============================================================
(function () {
  const el = document.getElementById('annivCounter');
  if (!el) return;

  const START = new Date(2025, 8, 21, 0, 0, 0); // September 21, 2025 (month is 0-indexed: 8 = Sept)

  const daysEl = document.getElementById('cDays');
  const hoursEl = document.getElementById('cHours');
  const minutesEl = document.getElementById('cMinutes');
  const secondsEl = document.getElementById('cSeconds');

  function pad(n, len) {
    return String(n).padStart(len, '0');
  }

  function setDigit(elm, value) {
    if (elm.textContent === value) return;
    elm.textContent = value;
    elm.classList.remove('flip');
    // restart the flip animation on change
    void elm.offsetWidth;
    elm.classList.add('flip');
  }

  // returns a Date for the next upcoming 12:00 NN — today's, if it
  // hasn't happened yet, otherwise tomorrow's
  function getNextNoon(now) {
    const noonToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    if (now < noonToday) return noonToday;
    const noonTomorrow = new Date(noonToday);
    noonTomorrow.setDate(noonTomorrow.getDate() + 1);
    return noonTomorrow;
  }

  function update() {
    const now = new Date();
    let diff = Math.floor((now - START) / 1000); // seconds elapsed since START
    if (diff < 0) diff = 0; // in case the page is viewed before the date

    const days = Math.floor(diff / 86400);

    const nextNoon = getNextNoon(now);
    const secondsUntilNoon = Math.max(0, Math.floor((nextNoon - now) / 1000));

    const hours = Math.floor(secondsUntilNoon / 3600);
    const minutes = Math.floor((secondsUntilNoon % 3600) / 60);
    const seconds = secondsUntilNoon % 60;

    setDigit(daysEl, pad(days, 3));
    setDigit(hoursEl, pad(hours, 2));
    setDigit(minutesEl, pad(minutes, 2));
    setDigit(secondsEl, pad(seconds, 2));

    const statDays = document.getElementById('statDays');
    if (statDays) statDays.textContent = days;
  }

  update();
  setInterval(update, 1000);
})();