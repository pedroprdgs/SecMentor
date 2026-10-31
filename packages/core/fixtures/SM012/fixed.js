const a = Buffer.from(token);
const b = Buffer.from(expectedToken);
if (a.length === b.length && crypto.timingSafeEqual(a, b)) allow();
