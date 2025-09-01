(() => {
  const $ = (id) => document.getElementById(id);
  const phrase = $("phrase");
  const pepper = $("pepper");
  const optUpper = $("optUpper");
  const optLower = $("optLower");
  const optNum = $("optNum");
  const optSym = $("optSym");
  const minEl = $("min");
  const maxEl = $("max");
  const btnGen = $("btnGen");
  const btnCopy = $("btnCopy");
  const btnClear = $("btnClear");
  const out = $("out");
  const toggleOut = $("toggleOut");
  const togglePepper = $("togglePepper");
  const modeChip = $("modeChip");
  const modeLabel = $("modeLabel");
  const lenLabel = $("lenLabel");
  const entropyLabel = $("entropyLabel");
  const charsetLabel = $("charsetLabel");
  const bar = $("bar");
  const advice = $("advice");
  const remember = $("remember");

  const U = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const L = "abcdefghijklmnopqrstuvwxyz";
  const N = "0123456789";
  const S = "!@#$%^&*()-_=+[]{};:,./?~|"; // Hindari backtick & quote untuk copy aman

  function currentCharset() {
    let useUpper = optUpper.checked;
    let useLower = optLower.checked;
    let useNum = optNum.checked;
    let useSym = optSym.checked;

    // Jika semua mati, gunakan default
    if (!useUpper && !useLower && !useNum && !useSym) {
      useUpper = useLower = useNum = useSym = true;
    }
    let charset = "";
    if (useUpper) charset += U;
    if (useLower) charset += L;
    if (useNum) charset += N;
    if (useSym) charset += S;
    return { charset, useUpper, useLower, useNum, useSym };
  }

  function decideLength() {
    const min = parseInt(minEl.value, 10);
    const max = parseInt(maxEl.value, 10);
    const hasMin = !Number.isNaN(min);
    const hasMax = !Number.isNaN(max);
    if (!hasMin && !hasMax) return 16;
    if (hasMin && !hasMax) return Math.max(4, Math.min(256, min));
    if (!hasMin && hasMax) return Math.max(4, Math.min(256, max));
    if (min > max) { // swap otomatis
      [minEl.value, maxEl.value] = [max, min];
      return max;
    }
    // Pilih panjang acak dalam rentang, pakai CSPRNG
    const range = max - min + 1;
    const r = crypto.getRandomValues(new Uint32Array(1))[0] / 0xFFFFFFFF;
    return min + Math.floor(r * range);
  }

  function ensureAtLeastOneFromEach(setFlags, prngPick) {
    const pools = [];
    if (setFlags.useUpper) pools.push(U);
    if (setFlags.useLower) pools.push(L);
    if (setFlags.useNum) pools.push(N);
    if (setFlags.useSym) pools.push(S);
    return pools.map(pool => pool[prngPick(pool.length)]);
  }

  function fisherYates(arr, prngPick) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = prngPick(i + 1); // 0..i
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function entropyBits(len, alphabet) {
    // approx bits = len * log2(alphabet)
    const bits = len * Math.log2(Math.max(2, alphabet));
    return Math.round(bits * 10) / 10;
  }

  function setStrengthUI(bits) {
    let pct = Math.min(100, Math.round((bits / 120) * 100)); // 120 bits ~ kuat banget
    if (pct < 10) pct = 10;
    bar.style.width = pct + "%";
    let color = getComputedStyle(document.documentElement).getPropertyValue('--bad');
    if (bits >= 80) color = getComputedStyle(document.documentElement).getPropertyValue('--ok');
    else if (bits >= 60) color = getComputedStyle(document.documentElement).getPropertyValue('--warn');
    bar.style.background = color;
  }

  // --- Deterministic PRNG via SHA-256 stream ---
  async function sha256Bytes(buf) {
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return new Uint8Array(hash);
  }
  function concatBytes(a, b) {
    const out = new Uint8Array(a.length + b.length);
    out.set(a, 0); out.set(b, a.length); return out;
  }
  function textBytes(t) {
    return new TextEncoder().encode(t);
  }
  async function* hashStream(seed) {
    let counter = 0;
    let seedBytes = typeof seed === 'string' ? textBytes(seed) : seed;
    while (true) {
      const ctr = new Uint8Array(4);
      new DataView(ctr.buffer).setUint32(0, counter++, false);
      const block = await sha256Bytes(concatBytes(seedBytes, ctr));
      for (const b of block) yield b;
    }
  }

  function prngFromStream(stream) {
    const buf = [];
    return async function pick(max) {
      // returns integer in [0, max)
      if (max <= 1) return 0;
      // Refill buffer lazily
      while (buf.length < 4) { const { value, done } = await stream.next(); if (done) break; buf.push(value); }
      // Make a 32-bit number from 4 bytes
      while (buf.length < 4) { const { value } = await stream.next(); buf.push(value); }
      const a = buf.shift(), b = buf.shift(), c = buf.shift(), d = buf.shift();
      const num = ((a << 24) >>> 0) ^ (b << 16) ^ (c << 8) ^ d;
      const u = num >>> 0; // unsigned
      return u % max;
    }
  }

  // Random pick using CSPRNG
  function pickCSPRNG(max) {
    if (max <= 1) return 0;
    // Rejection sampling to avoid bias
    const array = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    let x;
    do { crypto.getRandomValues(array); x = array[0]; } while (x >= limit);
    return x % max;
  }

  function buildRuleKey(flags, len) {
    return `${flags.useUpper ? 1 : 0}${flags.useLower ? 1 : 0}${flags.useNum ? 1 : 0}${flags.useSym ? 1 : 0}|${len}`;
  }

  async function generate() {
    // Resolve charset & flags
    const flags = currentCharset();
    let charset = flags.charset;

    const desiredLenRaw = decideLength();
    const minRequired = (flags.useUpper ? 1 : 0) + (flags.useLower ? 1 : 0) + (flags.useNum ? 1 : 0) + (flags.useSym ? 1 : 0);
    const len = Math.max(desiredLenRaw, minRequired || 1);

    // Update labels
    lenLabel.textContent = String(len);
    charsetLabel.textContent = `${charset.length} chars`;

    const useDeterministic = phrase.value.trim().length > 0;
    const mode = useDeterministic ? 'Deterministik' : 'Acak';
    modeChip.textContent = mode; modeLabel.textContent = mode;

    // Build base pool
    if (charset.length === 0) { charset = U + L + N + S; }

    // Mandatory chars (one from each selected set), fill rest with RNG
    let result = new Array(len);

    if (useDeterministic) {
      // Seed uses phrase + pepper + rule key
      const seed = `${phrase.value}\u241f${pepper.value}\u241f${buildRuleKey(flags, len)}`; // use U+241F as separator
      const stream = hashStream(seed);
      const pick = prngFromStream(stream);

      // Mandatory
      const mand = await ensureAtLeastOneFromEachAsync(flags, pick);
      for (let i = 0; i < mand.length && i < len; i++) { result[i] = mand[i]; }
      // Fill remainder
      for (let i = mand.length; i < len; i++) {
        const idx = await pick(charset.length);
        result[i] = charset[idx];
      }
      // Shuffle deterministically
      result = await fisherYatesAsync(result, pick);

    } else {
      // Random (CSPRNG)
      const mand = ensureAtLeastOneFromEach(flags, (m) => pickCSPRNG(m));
      for (let i = 0; i < mand.length && i < len; i++) { result[i] = mand[i]; }
      for (let i = mand.length; i < len; i++) {
        const idx = pickCSPRNG(charset.length);
        result[i] = charset[idx];
      }
      result = fisherYates(result, (m) => pickCSPRNG(m));
    }

    const password = result.join("");
    out.value = password;
    out.type = 'password';
    btnCopy.disabled = password.length === 0;

    // Entropy estimate
    const bits = entropyBits(len, new Set(charset.split('')).size);
    entropyLabel.textContent = bits + ' bits';
    setStrengthUI(bits);

    advice.textContent = useDeterministic
      ? (pepper.value ? 'Deterministik + pepper: bagus. Simpan pepper dengan aman.' : 'Tambahkan pepper rahasia untuk meningkatkan keamanan frasa.')
      : 'Acak: simpan di password manager & aktifkan 2FA.';

    // Remember prefs (not phrase/pepper)
    if (remember.checked) { savePrefs(); }
  }

  async function ensureAtLeastOneFromEachAsync(setFlags, pick) {
    const pools = [];
    if (setFlags.useUpper) pools.push(U);
    if (setFlags.useLower) pools.push(L);
    if (setFlags.useNum) pools.push(N);
    if (setFlags.useSym) pools.push(S);
    const arr = [];
    for (const pool of pools) { const idx = await pick(pool.length); arr.push(pool[idx]); }
    return arr;
  }
  async function fisherYatesAsync(arr, pick) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = await pick(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function clearAll() {
    phrase.value = '';
    pepper.value = '';
    out.value = '';
    btnCopy.disabled = true;
    minEl.value = '';
    maxEl.value = '';
    optUpper.checked = optLower.checked = optNum.checked = optSym.checked = true;
    modeChip.textContent = 'Acak'; modeLabel.textContent = 'Acak';
    lenLabel.textContent = '–'; entropyLabel.textContent = '–'; charsetLabel.textContent = '–';
    setStrengthUI(0); advice.textContent = 'Gunakan pepper untuk frasa deterministik. Jangan daur ulang frasa yang mudah ditebak.';
  }

  function savePrefs() {
    const prefs = {
      optUpper: optUpper.checked,
      optLower: optLower.checked,
      optNum: optNum.checked,
      optSym: optSym.checked,
      min: minEl.value,
      max: maxEl.value
    };
    localStorage.setItem('pwgen_prefs', JSON.stringify(prefs));
    localStorage.setItem('pwgen_remember', remember.checked ? '1' : '0');
  }
  function loadPrefs() {
    const rem = localStorage.getItem('pwgen_remember') === '1';
    remember.checked = rem;
    if (!rem) return;
    try {
      const prefs = JSON.parse(localStorage.getItem('pwgen_prefs') || '{}');
      if ('optUpper' in prefs) optUpper.checked = !!prefs.optUpper;
      if ('optLower' in prefs) optLower.checked = !!prefs.optLower;
      if ('optNum' in prefs) optNum.checked = !!prefs.optNum;
      if ('optSym' in prefs) optSym.checked = !!prefs.optSym;
      if ('min' in prefs) minEl.value = prefs.min || '';
      if ('max' in prefs) maxEl.value = prefs.max || '';
    } catch (_) {/* ignore */ }
  }

  // UI events
  btnGen.addEventListener('click', () => generate());
  btnCopy.addEventListener('click', async () => {
    if (!out.value) return;
    try {
      await navigator.clipboard.writeText(out.value);
      btnCopy.textContent = 'Copied!';
      setTimeout(() => btnCopy.textContent = 'Copy', 1300);
    } catch (_) {
      out.select(); document.execCommand('copy');
      btnCopy.textContent = 'Copied!';
      setTimeout(() => btnCopy.textContent = 'Copy', 1300);
    }
  });
  btnClear.addEventListener('click', clearAll);
  toggleOut.addEventListener('click', () => {
    out.type = out.type === 'password' ? 'text' : 'password';
    toggleOut.textContent = out.type === 'password' ? '🙈' : '🙉';
  });
  togglePepper.addEventListener('click', () => {
    pepper.type = pepper.type === 'password' ? 'text' : 'password';
    togglePepper.textContent = pepper.type === 'password' ? '🙈' : '🙉';
  });

  // Auto-update mode chip when typing phrase
  phrase.addEventListener('input', () => {
    const useDet = phrase.value.trim().length > 0;
    modeChip.textContent = useDet ? 'Deterministik' : 'Acak';
  });

  // Persist prefs on change if remember
  ;[optUpper, optLower, optNum, optSym, minEl, maxEl, remember].forEach(el => {
    el.addEventListener('change', () => { if (remember.checked) savePrefs(); });
  });

  // Initialize toggle icons
  toggleOut.textContent = '🙈';
  togglePepper.textContent = '🙈';

  // Set current year automatically
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  loadPrefs();
})();