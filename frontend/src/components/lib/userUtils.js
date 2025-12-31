import db from './db';

export const getUserId = (user) => user?.user_id ?? user?.id ?? null;

// Ensure there is a row in `users` for the current account.
export const ensureUserRow = async (user) => {
  const userId = getUserId(user);
  if (!userId) return null;

  const email = user?.email || '';
  const nickname = user?.nickname || (email ? email.split('@')[0] : 'User');
  const provider = user?.provider || 'local';

  try {
    await db.execute(
      `
      INSERT INTO users (user_id, provider, email, nickname, role, is_active, password)
      VALUES (?, ?, ?, ?, 'user', 1, 'SOCIAL_LOGIN')
      ON DUPLICATE KEY UPDATE 
        email = VALUES(email),
        nickname = VALUES(nickname)
    `,
      [userId, provider, email, nickname]
    );
    return userId;
  } catch (error) {
    console.error('사용자 동기화 실패:', error);
    return null;
  }
};

