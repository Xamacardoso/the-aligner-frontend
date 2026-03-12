import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/sign-in', '/'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Verificar se o caminho é público ou é um arquivo estático (imagens, fonts, etc)
    const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith('/public')) || 
                        /\.(jpe?g|png|svg|gif|webp|ico)$/i.test(pathname);

    // Peguntar pelo token nos cookies
    const token = request.cookies.get('auth_token')?.value;

    if (!token && !isPublicPath) {
        // Redirecionar para login se não estiver autenticado em rota privada
        const url = request.nextUrl.clone();
        url.pathname = '/sign-in';
        return NextResponse.redirect(url);
    }

    if (token && isPublicPath && pathname !== '/') {
        // Redirecionar para o dashboard se já estiver logado e tentar acessar login
        // Como não sabemos o role aqui facilmente (precisaria decodificar o JWT), 
        // vamos deixar passar ou redirecionar para uma rota base
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
