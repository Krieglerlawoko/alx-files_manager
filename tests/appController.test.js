import { expect } from 'chai';
import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server';  // Assuming your Express app is exported from server.js

chai.use(chaiHttp);

describe('AppController', () => {
  it('GET /status should return the status of Redis and DB', (done) => {
    chai.request(app)
      .get('/status')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('redis');
        expect(res.body).to.have.property('db');
        done();
      });
  });

  it('GET /stats should return the number of users and files', (done) => {
    chai.request(app)
      .get('/stats')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('users');
        expect(res.body).to.have.property('files');
        done();
      });
  });
});
