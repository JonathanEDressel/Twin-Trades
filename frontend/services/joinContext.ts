/**
 * joinContext — module-level singleton that survives the OAuth browser redirect.
 *
 * When the user initiates a brokerage OAuth connection from inside the join flow,
 * we store the target portfolio ID here before opening the external browser.
 * After the OAuth callback lands, `oauth/callback.tsx` reads this value and
 * navigates back to `/join/<portfolioId>` instead of to Settings.
 */

let _pendingJoinPortfolioId: number | null = null;

export function setPendingJoin(portfolioId: number | null): void {
  _pendingJoinPortfolioId = portfolioId;
}

export function getPendingJoin(): number | null {
  return _pendingJoinPortfolioId;
}
