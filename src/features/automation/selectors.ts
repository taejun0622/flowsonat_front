export const IG_SELECTORS = {
  followersLink: 'a[href$="/followers/"]',
  followingLink: 'a[href$="/following/"]',
  dialog: 'div[role="dialog"]',
  scrollContainer: 'div[role="dialog"] div[style*="overflow"]',
  userRow: 'div[role="dialog"] a[href^="/"][role="link"]',
  followBtn: 'button:has-text("Follow")',
  unfollowBtn: 'button:has-text("Following"), button:has-text("Requested")'
};

export const buildProfileUrl = (username: string) => `https://www.instagram.com/${username}/`;
