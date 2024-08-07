import { expect } from 'chai';
import redisClient from '../utils/redis';

describe('Redis Client', () => {
  before((done) => {
    redisClient.client.on('connect', done);
  });

  it('should be alive', () => {
    expect(redisClient.isAlive()).to.be.true;
  });

  it('should set and get a key', async () => {
    await redisClient.set('test_key', 'test_value', 10);
    const value = await redisClient.get('test_key');
    expect(value).to.equal('test_value');
  });

  it('should delete a key', async () => {
    await redisClient.set('test_key', 'test_value', 10);
    await redisClient.del('test_key');
    const value = await redisClient.get('test_key');
    expect(value).to.be.null;
  });
});
