import { CATEGORIES } from '../background/constants.js';

/**
 * Converts a domain pattern to a RegExp and checks if the given domain matches.
 * Allows matching subdomains automatically.
 * Example: 'google.com' pattern matches 'google.com' and 'www.google.com'
 */
function isDomainMatch(domain, pattern) {
    if (!domain || !pattern) return false;

    // Exact match
    if (domain === pattern) return true;

    // Subdomain match: ensure pattern is a suffix and preceded by a dot
    if (domain.endsWith('.' + pattern)) return true;

    return false;
}

/**
 * Helper to get the category for a given domain/url using wildcard matching.
 */
export function getCategory(domainOrUrl, mapping) {
    if (!domainOrUrl || !mapping) return CATEGORIES.UNKNOWN;

    let domain = domainOrUrl;
    try {
        if (domainOrUrl.includes('://')) {
            domain = new URL(domainOrUrl).hostname;
        }
    } catch (e) {
        // Fallback to treating it as a raw domain
    }

    for (const [key, category] of Object.entries(mapping)) {
        if (isDomainMatch(domain, key)) {
            return category;
        }
    }

    return CATEGORIES.UNKNOWN;
}
