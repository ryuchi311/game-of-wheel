const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PORT = process.env.PORT || 3010;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

/**
 * In-Memory Live Host Rooms Store
 * Keyed by 6-character uppercase room code (e.g., "GOW742")
 */
const rooms = new Map();

function getLocalLanIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return rooms.has(code) ? generateRoomCode() : code;
}

function sendJson(res, statusCode, payload, extraHeaders = {}) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        ...extraHeaders
    });
    res.end(JSON.stringify(payload));
}

function parseCookies(req) {
    const list = {};
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return list;
    cookieHeader.split(';').forEach(cookie => {
        const parts = cookie.split('=');
        const key = parts.shift().trim();
        const val = decodeURIComponent(parts.join('='));
        if (key) list[key] = val;
    });
    return list;
}

/**
 * Normalizes a participant name for anti-cheat duplicate comparison:
 * strips accents/diacritics, removes invisible characters, punctuation, and spaces,
 * so "Alex!", "A l e x", "a.l.e.x", and "Álex" all normalize to "alex".
 */
function normalizeNameForAntiCheat(name) {
    return String(name || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

/**
 * Computes a server-side hardware/network signature from client IP + User-Agent + Device Info
 */
function getDeviceNetworkHash(req, bodyDeviceFp = '') {
    const forwarded = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const remoteIp = forwarded || req.socket.remoteAddress || 'unknown-ip';
    const ua = req.headers['user-agent'] || 'unknown-ua';
    return crypto
        .createHash('sha256')
        .update(`${remoteIp}|${ua}|${bodyDeviceFp}`)
        .digest('hex')
        .slice(0, 24);
}

function parseJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            if (body.length > 64 * 1024) {
                req.destroy();
                reject(new Error('Payload too large'));
            }
        });
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
    });
}

function broadcastToRoom(room, eventName, data) {
    const msg = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const clientRes of room.clients) {
        try {
            clientRes.write(msg);
        } catch (e) {
            room.clients.delete(clientRes);
        }
    }
}

function getRoomPublicState(room) {
    return {
        code: room.code,
        isOpen: room.isOpen,
        strictOnePerDevice: room.strictOnePerDevice !== false,
        participants: room.participants.map(p => ({
            id: p.id,
            name: p.name,
            joinedAt: p.joinedAt
        })),
        status: room.status,
        lastWinner: room.lastWinner,
        createdAt: room.createdAt
    };
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // 1. Network Info Endpoint (returns LAN IP & Port so QR codes work on phones)
    if (pathname === '/api/network-info' && req.method === 'GET') {
        const lanIp = getLocalLanIp();
        return sendJson(res, 200, {
            lanIp,
            port: PORT,
            suggestedOrigin: `http://${lanIp}:${PORT}`
        });
    }

    // 2. Create or Resume a Live Room (Host)
    if (pathname === '/api/rooms' && req.method === 'POST') {
        try {
            const body = await parseJsonBody(req);
            const requestedCode = body.code ? String(body.code).toUpperCase().trim() : '';

            if (requestedCode && rooms.has(requestedCode)) {
                const existing = rooms.get(requestedCode);
                if (!body.hostToken || existing.hostToken === body.hostToken) {
                    return sendJson(res, 200, {
                        ...getRoomPublicState(existing),
                        hostToken: existing.hostToken
                    });
                }
            }

            const code = generateRoomCode();
            const hostToken = crypto.randomBytes(16).toString('hex');
            const room = {
                code,
                hostToken,
                isOpen: true,
                strictOnePerDevice: true,
                participants: [],
                status: 'waiting', // 'waiting' | 'spinning' | 'winner'
                lastWinner: null,
                createdAt: Date.now(),
                clients: new Set()
            };
            rooms.set(code, room);

            return sendJson(res, 201, {
                ...getRoomPublicState(room),
                hostToken
            });
        } catch (err) {
            return sendJson(res, 400, { error: 'Invalid request body' });
        }
    }

    // 3. Room-Specific Endpoints: /api/rooms/:code[...]
    const roomMatch = pathname.match(/^\/api\/rooms\/([A-Za-z0-9]{4,10})(?:\/([a-z-]+))?$/);
    if (roomMatch) {
        const code = roomMatch[1].toUpperCase();
        const action = roomMatch[2] || '';
        const room = rooms.get(code);

        if (!room) {
            return sendJson(res, 404, { error: 'Room not found or expired.' });
        }

        // GET /api/rooms/:code — Get current room state (plus caller's existing entry if already joined)
        if (!action && req.method === 'GET') {
            const cookies = parseCookies(req);
            const cookieToken = cookies[`gow_p_${code}`] || '';
            const queryCid = parsedUrl.searchParams.get('cid') || '';
            const queryFp = parsedUrl.searchParams.get('fp') || '';
            const netHash = getDeviceNetworkHash(req, queryFp);

            const myEntry = room.participants.find(p =>
                (cookieToken && p.cookieToken === cookieToken) ||
                (queryCid && p.clientId === queryCid) ||
                (room.strictOnePerDevice !== false && p.netHash === netHash)
            );

            return sendJson(res, 200, {
                ...getRoomPublicState(room),
                myParticipant: myEntry ? { id: myEntry.id, name: myEntry.name, joinedAt: myEntry.joinedAt } : null
            });
        }

        // GET /api/rooms/:code/events — Server-Sent Events (SSE) stream for real-time updates
        if (action === 'events' && req.method === 'GET') {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            });

            res.write(`event: room_state\ndata: ${JSON.stringify(getRoomPublicState(room))}\n\n`);
            room.clients.add(res);

            const keepAlive = setInterval(() => {
                try {
                    res.write(': ping\n\n');
                } catch (e) {
                    clearInterval(keepAlive);
                    room.clients.delete(res);
                }
            }, 20000);

            req.on('close', () => {
                clearInterval(keepAlive);
                room.clients.delete(res);
            });
            return;
        }

        // POST /api/rooms/:code/join — Participant submits their name via QR code page (with Anti-Cheat & Multi-Tab Lock)
        if (action === 'join' && req.method === 'POST') {
            try {
                if (!room.isOpen) {
                    return sendJson(res, 403, { error: 'This room is currently locked by the host.' });
                }

                const body = await parseJsonBody(req);
                const rawName = String(body.name || '')
                    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Strip zero-width invisible characters
                    .trim()
                    .replace(/\s+/g, ' ')
                    .slice(0, 40);
                const clientId = String(body.clientId || '').trim().slice(0, 64);
                const deviceFp = String(body.deviceFp || '').trim().slice(0, 128);
                const normalizedNewName = normalizeNameForAntiCheat(rawName);

                if (!rawName || normalizedNewName.length < 1) {
                    return sendJson(res, 400, { error: 'Please enter a valid display name.' });
                }

                const cookies = parseCookies(req);
                let cookieToken = cookies[`gow_p_${code}`];
                const netHash = getDeviceNetworkHash(req, deviceFp);

                // 1. Check if this device/browser/tab already has a registered entry in this room
                const existingEntry = room.participants.find(p =>
                    (cookieToken && p.cookieToken === cookieToken) ||
                    (clientId && p.clientId === clientId) ||
                    (room.strictOnePerDevice !== false && p.netHash === netHash)
                );

                if (existingEntry) {
                    // Lock entry: once joined, opening another tab or re-submitting cannot add a second slice or rename to someone else
                    if (body.allowRename !== true) {
                        return sendJson(res, 409, {
                            error: `You have already joined this room as "${existingEntry.name}". Only 1 entry per participant/device is allowed!`,
                            alreadyJoined: true,
                            participant: { id: existingEntry.id, name: existingEntry.name, joinedAt: existingEntry.joinedAt },
                            room: getRoomPublicState(room)
                        });
                    }
                }

                // 2. Anti-Cheat Fuzzy Duplicate Name Check (blocks "Alex", "alex", "A l e x", "Alex!", etc.)
                const duplicateName = room.participants.find(p =>
                    (!existingEntry || p.id !== existingEntry.id) &&
                    (p.name.toLowerCase() === rawName.toLowerCase() || p.normalizedName === normalizedNewName)
                );
                if (duplicateName) {
                    return sendJson(res, 409, {
                        error: `"${duplicateName.name}" is already on the wheel! Duplicate or lookalike names are blocked.`
                    });
                }

                if (!cookieToken) {
                    cookieToken = crypto.randomBytes(16).toString('hex');
                }
                const cookieHeader = {
                    'Set-Cookie': `gow_p_${code}=${encodeURIComponent(cookieToken)}; Path=/; Max-Age=86400; SameSite=Lax; HttpOnly`
                };

                const participant = {
                    id: crypto.randomBytes(6).toString('hex'),
                    name: rawName,
                    normalizedName: normalizedNewName,
                    clientId: clientId || null,
                    cookieToken,
                    netHash,
                    joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                };
                room.participants.push(participant);

                broadcastToRoom(room, 'participant_joined', {
                    participant: { id: participant.id, name: participant.name, joinedAt: participant.joinedAt },
                    room: getRoomPublicState(room)
                });

                return sendJson(res, 201, {
                    participant: { id: participant.id, name: participant.name, joinedAt: participant.joinedAt },
                    room: getRoomPublicState(room)
                }, cookieHeader);
            } catch (e) {
                return sendJson(res, 400, { error: 'Invalid join request.' });
            }
        }

        // POST /api/rooms/:code/state — Host updates room status (open/locked, strictOnePerDevice, spinning, winner, or clear)
        if (action === 'state' && req.method === 'POST') {
            try {
                const body = await parseJsonBody(req);
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

                broadcastToRoom(room, 'room_state', getRoomPublicState(room));
                return sendJson(res, 200, getRoomPublicState(room));
            } catch (e) {
                return sendJson(res, 400, { error: 'Invalid state update.' });
            }
        }
    }

    // 4. Static File Serving (/join routes to join.html)
    let reqPath = pathname === '/' ? '/index.html' : pathname;
    if (reqPath === '/join' || reqPath === '/join/') {
        reqPath = '/join.html';
    }

    const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(PUBLIC_DIR, safePath);

    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(PORT, () => {
    const lanIp = getLocalLanIp();
    console.log(`Game of Wheel web app running at:`);
    console.log(`  Local:   http://localhost:${PORT}`);
    console.log(`  Network: http://${lanIp}:${PORT}`);
});
