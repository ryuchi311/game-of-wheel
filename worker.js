/**
 * ============================================================================
 * CLOUDFLARE WORKER + DURABLE OBJECTS — GAME OF WHEEL
 * Account: ryuchicago@gmail.com (86ed831a03b7600842d0197a8a129547)
 * Domain: https://wheel.chiprojects.com
 *
 * Provides rock-solid, instant HTTP/JSON room creation, QR participant join,
 * and state synchronization across any network (Wi-Fi, 4G/5G, firewalls)
 * without relying on PeerJS or WebRTC NAT traversal.
 * ============================================================================
 */

function normalizeNameForAntiCheat(name) {
    return String(name || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}

/**
 * Durable Object class that stores and coordinates a single 6-letter Room
 * with strong consistency across all Cloudflare edge locations.
 */
export class WheelRoomDO {
    constructor(state, env) {
        this.state = state;
        this.env = env;
        this.room = null;
    }

    async loadRoom(code) {
        if (!this.room) {
            this.room = await this.state.storage.get('room');
        }
        if (!this.room) {
            this.room = {
                code: code || 'GOW123',
                hostToken: crypto.randomUUID(),
                isOpen: true,
                strictOnePerDevice: true,
                participants: [],
                status: 'waiting',
                lastWinner: null,
                createdAt: Date.now()
            };
            await this.state.storage.put('room', this.room);
        }
        return this.room;
    }

    async saveRoom() {
        if (this.room) {
            await this.state.storage.put('room', this.room);
        }
    }

    getPublicState(room) {
        return {
            code: room.code,
            isOpen: room.isOpen,
            strictOnePerDevice: room.strictOnePerDevice !== false,
            participants: (room.participants || []).map(p => ({
                id: p.id,
                name: p.name,
                email: p.email || '',
                phone: p.phone || '',
                joinedAt: p.joinedAt
            })),
            status: room.status || 'waiting',
            lastWinner: room.lastWinner || null,
            createdAt: room.createdAt
        };
    }

    async fetch(request) {
        const url = new URL(request.url);
        const code = (url.searchParams.get('code') || 'GOW123').toUpperCase();
        const action = url.searchParams.get('action') || '';

        const room = await this.loadRoom(code);
        if (room.code !== code) {
            room.code = code;
            await this.saveRoom();
        }

        // 1. Initialize or Resume Room (Host)
        if (action === 'init' && request.method === 'POST') {
            let body = {};
            try { body = await request.json(); } catch (e) {}
            if (body.reset === true) {
                room.participants = [];
                room.isOpen = true;
                room.status = 'waiting';
                room.lastWinner = null;
                room.createdAt = Date.now();
                await this.saveRoom();
            }
            return jsonResponse({
                ...this.getPublicState(room),
                hostToken: room.hostToken
            });
        }

        // 2. Get Room State (Host & Participant polling)
        if (!action && request.method === 'GET') {
            const queryCid = url.searchParams.get('cid') || '';
            const myEntry = (room.strictOnePerDevice !== false && queryCid)
                ? room.participants.find(p => p.clientId === queryCid)
                : null;

            return jsonResponse({
                ...this.getPublicState(room),
                myParticipant: myEntry
                    ? { id: myEntry.id, name: myEntry.name, joinedAt: myEntry.joinedAt }
                    : null
            });
        }

        // 3. Participant Join Request
        if (action === 'join' && request.method === 'POST') {
            if (!room.isOpen) {
                return jsonResponse({ error: 'This room is currently locked by the host.' }, 403);
            }

            let body = {};
            try { body = await request.json(); } catch (e) {}

            const rawName = String(body.name || '')
                .replace(/[\u200B-\u200D\uFEFF]/g, '')
                .trim()
                .replace(/\s+/g, ' ')
                .slice(0, 40);
            const clientId = String(body.clientId || '').trim().slice(0, 64);
            const email = String(body.email || '').trim().slice(0, 80);
            const phone = String(body.phone || '').trim().slice(0, 24);
            const normalizedNewName = normalizeNameForAntiCheat(rawName);

            if (!rawName || normalizedNewName.length < 1) {
                return jsonResponse({ error: 'Please enter a valid display name.' }, 400);
            }

            // Anti-Multi-Tab Check: only block if the SAME browser profile (clientId) already joined in another tab
            const existingEntry = (room.strictOnePerDevice !== false && clientId)
                ? room.participants.find(p => p.clientId === clientId)
                : null;

            if (existingEntry) {
                return jsonResponse({
                    error: `You already joined in another tab as "${existingEntry.name}". Multiple tabs are not allowed!`,
                    alreadyJoined: true,
                    participant: { id: existingEntry.id, name: existingEntry.name, joinedAt: existingEntry.joinedAt },
                    room: this.getPublicState(room)
                }, 409);
            }

            // Anti-Duplicate Name Check (blocks exact or fuzzy lookalike names)
            const duplicateName = room.participants.find(
                p => p.name.toLowerCase() === rawName.toLowerCase() || p.normalizedName === normalizedNewName
            );
            if (duplicateName) {
                return jsonResponse({
                    error: `"${duplicateName.name}" is already on the wheel! Duplicate or lookalike names are blocked.`
                }, 409);
            }

            const participant = {
                id: 'p_' + Math.random().toString(36).slice(2, 10),
                name: rawName,
                normalizedName: normalizedNewName,
                email,
                phone,
                clientId: clientId || null,
                joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            };
            room.participants.push(participant);
            await this.saveRoom();

            return jsonResponse({
                participant: { id: participant.id, name: participant.name, joinedAt: participant.joinedAt },
                room: this.getPublicState(room)
            }, 201);
        }

        // 4. Host Updates Room State (lock/unlock, spinning, winner, remove participant)
        if (action === 'state' && request.method === 'POST') {
            let body = {};
            try { body = await request.json(); } catch (e) {}

            if (typeof body.isOpen === 'boolean') {
                room.isOpen = body.isOpen;
            }
            if (typeof body.strictOnePerDevice === 'boolean') {
                room.strictOnePerDevice = body.strictOnePerDevice;
            }
            if (body.status) {
                room.status = body.status;
            }
            if (body.lastWinner !== undefined) {
                room.lastWinner = body.lastWinner;
            }
            if (body.clearParticipants === true) {
                room.participants = [];
                room.lastWinner = null;
                room.status = 'waiting';
            }
            if (body.removeParticipantName) {
                const target = String(body.removeParticipantName).toLowerCase();
                room.participants = room.participants.filter(p => p.name.toLowerCase() !== target);
            }

            await this.saveRoom();
            return jsonResponse(this.getPublicState(room));
        }

        return jsonResponse({ error: 'Unknown room action' }, 400);
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const pathname = url.pathname;

        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        // 1. Healthcheck endpoint
        if (pathname === '/api/health' || pathname === '/healthz') {
            return jsonResponse({
                status: 'ok',
                service: 'game-of-wheel',
                account: 'ryuchicago@gmail.com',
                hasDurableObjects: !!(env && env.ROOMS_DO),
                time: Date.now()
            });
        }

        // 2. Network Info Endpoint
        if (pathname === '/api/network-info' && request.method === 'GET') {
            return jsonResponse({
                lanIp: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                suggestedOrigin: url.origin
            });
        }

        // 3. Create or Resume Room: POST /api/rooms
        if (pathname === '/api/rooms' && request.method === 'POST') {
            let body = {};
            try { body = await request.json(); } catch (e) {}
            const requestedCode = body.code ? String(body.code).toUpperCase().trim() : '';
            const isValidCode = /^[A-Z0-9]{4,10}$/.test(requestedCode);
            const code = isValidCode ? requestedCode : generateRoomCode();

            if (env && env.ROOMS_DO) {
                const id = env.ROOMS_DO.idFromName(code);
                const stub = env.ROOMS_DO.get(id);
                const doUrl = new URL(request.url);
                doUrl.searchParams.set('code', code);
                doUrl.searchParams.set('action', 'init');
                return stub.fetch(new Request(doUrl.toString(), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reset: !isValidCode })
                }));
            }
        }

        // 4. Room-specific endpoints: /api/rooms/:code[/join|/state]
        const roomMatch = pathname.match(/^\/api\/rooms\/([A-Za-z0-9]{4,10})(?:\/([a-z-]+))?$/);
        if (roomMatch && env && env.ROOMS_DO) {
            const code = roomMatch[1].toUpperCase();
            const action = roomMatch[2] || '';

            const id = env.ROOMS_DO.idFromName(code);
            const stub = env.ROOMS_DO.get(id);
            const doUrl = new URL(request.url);
            doUrl.searchParams.set('code', code);
            if (action) doUrl.searchParams.set('action', action);

            const init = {
                method: request.method,
                headers: request.headers
            };
            if (request.method !== 'GET' && request.method !== 'HEAD') {
                init.body = await request.text();
            }

            return stub.fetch(new Request(doUrl.toString(), init));
        }

        // 5. Serve static assets from ./public
        if (env && env.ASSETS) {
            return env.ASSETS.fetch(request);
        }

        return new Response('Not Found', { status: 404 });
    }
};
