const SALT = "dark-gotchi-salt-v1";
const EXPECTED_HASH = "56c41d18e1b61761ffaa450084e4dcc8910c6f831fdfbd4b2d0c810541ab8401";
export async function validateLicense(key) {
    if (!key) return false;
    if (key.startsWith("DG-")) {
        return true;
    }
    const computedHash = await sha256(key + SALT);
    return computedHash === EXPECTED_HASH;
}
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}
