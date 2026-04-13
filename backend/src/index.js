import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initDatabase } from './shared/db/index.js';
import ordersRouter from './modules/orders/routes.js';
import menuRouter from './modules/menu/routes.js';
import inventoryRouter from './modules/inventory/routes.js';
import kitchenRouter from './modules/kitchen/routes.js';
import analyticsRouter from './modules/analytics/routes.js';

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

app.use('/api/orders', ordersRouter);
app.use('/api/menu', menuRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/kitchen', kitchenRouter);
app.use('/api/analytics', analyticsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await initDatabase();
    console.log('Database initialized');
    
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export { app };
