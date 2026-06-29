import app, { connectDatabase } from './server/src/app.js';

const port = process.env.PORT || 5050;

await connectDatabase();

app.listen(port, () => {
  console.log(`Release Intelligence running on http://localhost:${port}`);
});
