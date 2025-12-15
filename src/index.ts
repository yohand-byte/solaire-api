import dotenv from 'dotenv';
dotenv.config();
import { createApp } from './app';
import { initializeFirebase } from './config/firebase';
initializeFirebase();
const app = createApp();
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`✅ Server on http://localhost:${PORT}`));
export { app };
