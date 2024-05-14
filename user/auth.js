import jwt from 'jsonwebtoken';
async function authuser(cookieHeader) {
  if (!cookieHeader) {
    throw new Error('Cookie header is missing');
  }

  const cookies = cookieHeader.split(';');

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');

    if (name === 'token') {
      try {
        const decodedToken = jwt.verify(value, 'your_secret_key');
        return decodedToken;
      } catch (error) {
        throw new Error('Failed to verify token');
      }
    }
  }

  throw new Error('Admin token not found');
}
export default authuser;