import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Don't advertise the framework (small security hardening step)
app.disable('x-powered-by');

// Front-end files (index.html, styles.css, images)
app.use(express.static(join(__dirname, '..', 'view')));

// Bootstrap served locally, so the page works without internet
app.use('/bootstrap', express.static(
  join(__dirname, '..', '..', 'node_modules', 'bootstrap', 'dist')
));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// First REST-style JSON route; the real API routes (teams, players...) come later
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'WWC Archive' });
});

// Anything not matched above
app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the other server or run: PORT=3001 npm start`);
  } else {
    console.error(err);
  }
  process.exit(1);
});