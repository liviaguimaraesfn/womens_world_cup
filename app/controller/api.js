import express from 'express';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(__dirname + '/../view'));
app.use(express.json());

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));