import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Aqui definimos quais rotas serão privadas. 
// O asterisco (.*) significa que tudo que estiver dentro dessas pastas é bloqueado para visitantes.
const isProtectedRoute = createRouteMatcher([
  '/gerente(.*)',
  '/dentista(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // Comentado para podermos acessar as rotas livremente enquanto construímos o layout
  // if (isProtectedRoute(req)) {
  //   await auth.protect();
  // }
});

export const config = {
  matcher: [
    // Pula arquivos internos do Next.js e arquivos estáticos, a menos que sejam achados nos search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Roda o middleware sempre nas rotas de API (caso criemos alguma no futuro)
    '/(api|trpc)(.*)',
  ],
};
