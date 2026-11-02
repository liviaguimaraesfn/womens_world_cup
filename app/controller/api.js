import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Front-end files (index.html, styles.css, images)
app.use(express.static(join(__dirname, '..', 'view')));

// Bootstrap served locally, so the page works without internet
app.use('/bootstrap', express.static(
  join(__dirname, '..', '..', 'node_modules', 'bootstrap', 'dist')
));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});