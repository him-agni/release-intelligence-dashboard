import app, { connectDatabase } from '../../server/src/app.js';

export const config = {
  api: {
    bodyParser: false
  }
};

await connectDatabase();

export default app;
