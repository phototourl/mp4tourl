import { toNextJsHandler } from 'better-auth/next-js';

// Force Node.js runtime — Edge does not support MySQL TCP
export const runtime = 'nodejs';

const getAuth = async () => {
  const { auth } = await import('@/lib/auth');
  return auth;
};

const getHandler = async () => {
  const auth = await getAuth();
  return toNextJsHandler(auth);
};

export async function POST(request: Request) {
  const handler = await getHandler();
  return handler.POST(request);
}

export async function GET(request: Request) {
  const handler = await getHandler();
  return handler.GET(request);
}
