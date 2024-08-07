mport { expect } from 'chai';
import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

chai.use(chaiHttp);

describe('UsersController', () => {
  before(async () => {
    await dbClient.client.connect();
    await dbClient.client.db().collection('users').deleteMany({});
  });

  it('POST /users should create a new user', (done) => {
    chai.request(app)
      .post('/users')
      .send({ email: 'test@user.com', password: '12345' })
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('email').eql('test@user.com');
        done();
      });
  });

  it('POST /users should not create a user with the same email', (done) => {
    chai.request(app)
      .post('/users')
      .send({ email: 'test@user.com', password: '12345' })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('error').eql('Already exist');
        done();
      });
  });

  it('GET /users/me should return the authenticated user', (done) => {
    chai.request(app)
      .get('/users/me')
      .set('X-Token', 'test-token')  // You should replace 'test-token' with a valid token obtained after logging in
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('email').eql('test@user.com');
        done();
      });
  });
});
