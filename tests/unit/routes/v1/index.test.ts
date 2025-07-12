import express from 'express';
import request from 'supertest';

import router from '../../../../src/routes/v1/index.ts';

const app = express();
app.use(router);

describe('GET /', () => {
  it('should return a 200 status and a list of endpoints', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      endpoints: ['/process-events', '/record-linkages', '/systems', '/system-records']
    });
  });
});
