import app, { connectDatabase } from '../server/src/app.js';

await connectDatabase();

export default app;
