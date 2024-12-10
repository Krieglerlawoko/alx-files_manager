import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server'; // Adjust the path to your server file
import { dbClient } from '../utils/db';
import { redisClient } from '../utils/redis';

chai.use(chaiHttp);
const { expect } = chai;

describe('File Management API Tests', () => {
  before(async () => {
    // Ensure database and redis are alive before running tests
    await dbClient.isAlive();
    await redisClient.isAlive();
  });

  // Test GET /status
  describe('GET /status', () => {
    it('should return Redis and DB statuses', (done) => {
      chai.request(app)
        .get('/status')
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('redis').that.is.a('boolean');
          expect(res.body).to.have.property('db').that.is.a('boolean');
          done();
        });
    });
  });

  // Test GET /stats
  describe('GET /stats', () => {
    it('should return the number of users and files', (done) => {
      chai.request(app)
        .get('/stats')
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('users').that.is.a('number');
          expect(res.body).to.have.property('files').that.is.a('number');
          done();
        });
    });
  });

  // Test POST /users
  describe('POST /users', () => {
    it('should create a new user', (done) => {
      const user = { email: 'testuser@example.com', password: 'testpassword' };
      chai.request(app)
        .post('/users')
        .send(user)
        .end((err, res) => {
          expect(res.status).to.equal(201);
          expect(res.body).to.have.property('id').that.is.a('string');
          expect(res.body).to.have.property('email').equal(user.email);
          done();
        });
    });

    it('should not create a user with missing email', (done) => {
      const user = { password: 'testpassword' };
      chai.request(app)
        .post('/users')
        .send(user)
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.property('error').equal('Missing email');
          done();
        });
    });
  });

  // Test PUT /files/:id/publish
  describe('PUT /files/:id/publish', () => {
    it('should publish a file', (done) => {
      const fileId = 'exampleFileId'; // Replace with a valid file ID
      chai.request(app)
        .put(`/files/${fileId}/publish`)
        .set('X-Token', 'exampleToken') // Replace with a valid token
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('isPublic').equal(true);
          done();
        });
    });

    it('should return 404 for non-existent file', (done) => {
      chai.request(app)
        .put('/files/nonExistentId/publish')
        .set('X-Token', 'exampleToken') // Replace with a valid token
        .end((err, res) => {
          expect(res.status).to.equal(404);
          expect(res.body).to.have.property('error').equal('Not found');
          done();
        });
    });
  });

  // Test PUT /files/:id/unpublish
  describe('PUT /files/:id/unpublish', () => {
    it('should unpublish a file', (done) => {
      const fileId = 'exampleFileId'; // Replace with a valid file ID
      chai.request(app)
        .put(`/files/${fileId}/unpublish`)
        .set('X-Token', 'exampleToken') // Replace with a valid token
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('isPublic').equal(false);
          done();
        });
    });
  });

  // Test GET /files/:id/data
  describe('GET /files/:id/data', () => {
    it('should return file data for a public file', (done) => {
      const fileId = 'exampleFileId'; // Replace with a valid file ID
      chai.request(app)
        .get(`/files/${fileId}/data`)
        .end((err, res) => {
          expect(res.status).to.equal(200);
          done();
        });
    });

    it('should return 404 for non-existent file', (done) => {
      chai.request(app)
        .get('/files/nonExistentId/data')
        .end((err, res) => {
          expect(res.status).to.equal(404);
          expect(res.body).to.have.property('error').equal('Not found');
          done();
        });
    });
  });
});
