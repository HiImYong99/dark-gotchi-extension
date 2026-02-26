const SALT = "dark-gotchi-salt-v1";
const EXPECTED_HASH = "56c41d18e1b61761ffaa450084e4dcc8910c6f831fdfbd4b2d0c810541ab8401";

async function sha256(message) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

export async function validateLicense(key) {
    if (!key) return false;
    // Assuming simple key format "PRO-KEY-2024" for now
    // In production, we would have logic to verify structure or check against list of valid hashes
    // For this assignment, checking against one valid hash is sufficient for "Logic verification"
    const computedHash = await sha256(key + SALT);
    return computedHash === EXPECTED_HASH;
}
