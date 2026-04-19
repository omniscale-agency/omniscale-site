import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session if needed (important pour cookies à jour)
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.pathname;
  const isAuthPage = url === '/login' || url === '/signup';
  const isProtectedClient = url.startsWith('/dashboard');
  const isProtectedAdmin = url.startsWith('/admin');

  // Pas connecté + page protégée → login
  if (!user && (isProtectedClient || isProtectedAdmin)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Connecté + page d'auth → dashboard
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - _next/static (fichiers statiques)
     * - _next/image (images optimisées)
     * - favicon.ico, fichiers publics
     */
    '/((?!_next/static|_next/image|favicon|videos|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
