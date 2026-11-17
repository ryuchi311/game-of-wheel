/**
 * ============================================================================
 * CLOUDFLARE WORKER ENTRYPOINT — GAME OF WHEEL
 * Account: ryuchicago@gmail.com (86ed831a03b7600842d0197a8a129547)
 * Domain: https://wheel.chiprojects.com
 * ============================================================================
 */
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const pathname = url.pathname;

        // Healthcheck endpoint
        if (pathname === '/api/health' || pathname === '/healthz') {
            return new Response(
                JSON.stringify({
                    status: 'ok',
                    service: 'game-of-wheel',
                    account: 'ryuchicago@gmail.com',
                    time: Date.now()
                }),
                {
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Cache-Control': 'no-store'
                    }
                }
            );
        }

        // Serve static assets from ./public
        if (env && env.ASSETS) {
            return env.ASSETS.fetch(request);
        }

        return new Response('Not Found', { status: 404 });
    }
};
