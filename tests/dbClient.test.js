import { expect } from 'chai';
import dbClient from '../utils/db';

describe('DB Client', () => {
  before(async () => {
    await dbClient.client.connect();
  });

  it('should be alive', () => {
    expect(dbClient.isAlive()).to.be.true;
  });

  it('should return number of users', async () => {
    const users = await dbClient.nbUsers();
    expect(users).to.be.a('number');
  });

  it('should return number of files', async () => {
    const files = await dbClient.nbFiles();
    expect(files).to.be.a('number');
  });
});
