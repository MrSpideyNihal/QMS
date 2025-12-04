const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    // Initialize Socket.io
    const io = new Server(server, {
        cors: {
            origin: process.env.NEXT_PUBLIC_SOCKET_URL || `http://localhost:${port}`,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        path: '/socket.io',
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });

        socket.on('join-queue', () => {
            socket.join('queue');
            console.log('Client joined queue room:', socket.id);
        });

        socket.on('leave-queue', () => {
            socket.leave('queue');
            console.log('Client left queue room:', socket.id);
        });
    });

    // Make io accessible globally
    global.io = io;

    server
        .once('error', (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
            console.log(`> Socket.io server running`);
        });
});
