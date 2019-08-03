'use strict';

const knex = require('knex');
const app = require('../src/app');

function makeFoldersArray() {
  return [
    {
      id: 1,
      name: 'folder 1'
    },
    {
      id: 2,
      name: 'folder 2'
    },
    {
      id: 3,
      name: 'folder 3'
    }
  ];
}

describe('Folders Endpoints', function() {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean the table', () => db.raw('TRUNCATE folders, notes RESTART IDENTITY CASCADE'));

  afterEach('cleanup',() => db.raw('TRUNCATE folders, notes RESTART IDENTITY CASCADE'));

  describe('GET /api/folders', () => {
    context('Given no folders', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/folders')
          .expect(200, []);
      });
    });

    context('Given there are folders in the database', () => {
      const testFolders = makeFoldersArray();

      beforeEach('insert folders', () => {
        return db
          .into('folders')
          .insert(testFolders);
      });

      it('responds with 200 and all of the folders', () => {
        return supertest(app)
          .get('/api/folders')
          .expect(200, testFolders);
      });
    });
  });

  describe('GET /api/folders/:folder_id', () => {
    context('Given no folders', () => {
      it('responds with 404', () => {
        const folderId = 123;
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(404, { error: { message: 'Folder not found' } });
      });
    });

    context('Given there are folders in the database', () => {
      const testFolders = makeFoldersArray();

      beforeEach('insert folders', () => {
        return db
          .into('folders')
          .insert(testFolders);
      });

      it('responds with 200 and the specified folder', () => {
        const folderId = 2;
        const expectedFolder = testFolders[folderId - 1];
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(200, expectedFolder);
      });
    });
  });

  describe('POST /api/folders', () => {
    it('creates a folder, responding with 201 and the new folder', () => {
      const newFolder = {
        name: 'Test new folder'
      };

      return supertest(app)
        .post('/api/folders')
        .send(newFolder)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(newFolder.name);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/api/folders/${newFolder.id}`);
        })
        .then(res =>
          supertest(app)
            .get(`/api/folders/${res.body.id}`)
            .expect(res.body)
        );
    });

    it('responds with 400 and an error message when name is missing', () => {
      const newFolder = {
        title: 'Test new folder'
      };

      return supertest(app)
        .post('/api/folders')
        .send(newFolder)
        .expect(400, {
          error: { message: 'Please provide a folder name' }
        });
    });
  });
});

  
