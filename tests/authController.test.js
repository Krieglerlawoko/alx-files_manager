import { expect } from 'chai';
import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import sha1 from 'sha1';

chai.use(chaiHttp);

describe('AuthController', () => {
  before(async () => {
    await dbClient.client.connect();
    await dbClient.client.db().collection('users').deleteMany({});
    await dbClient.client.db().collection('users').insertOne({ email: 'test@user.com', password: sha1('12345') });
  });

  it('GET /connect should authenticate a user and return a token', (done) => {
    chai.request(app)
      .get('/connect')
      .set('Authorization', 'Basic ' + Buffer.from('test@user.com:12345').toString('base64'))
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('token');
        done();
      });
  });

  it('GET /disconnect should log out a user', (done) => {
    chai.request(app)
      .get('/disconnect')
      .set('X-Token', 'test-token')  // You should replace 'test-token' with a valid token obtained after logging in
      .end((err, res) => {
        expect(res).to.have.status(204);
        done();
      });
  });
});
