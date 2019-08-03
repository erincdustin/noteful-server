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

function makeNotesArray() {
  return [
    {
      id: 1,
      name: 'note 1',
      content: 'hello',
      folderid: 1,
      modified: '2019-08-02T21:04:13.866Z'
    },
    {
      id: 2,
      name: 'note 2',
      content: 'hello',
      folderid: 1,
      modified: '2019-08-02T21:04:13.866Z'
    },
    {
      id: 3,
      name: 'note 3',
      content: 'hello',
      folderid: 1,
      modified: '2019-08-02T21:04:13.866Z'
    }
  ];
}

describe.only('Notes Endpoints', function() {
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

  describe('GET /api/notes', () => {
    context('Given no notes', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/notes')
          .expect(200, []);
      });
    });

    context('Given there are notes in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach('insert folders and notes', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('notes')
              .insert(testNotes);
          });
      });

      it('responds with 200 and all of the notes', () => {
        return supertest(app)
          .get('/api/notes')
          .expect(200, testNotes);
      });
    });
  });

  describe('GET /api/notes/:note_id', () => {
    context('Given no notes', () => {
      it('responds with 404', () => {
        const noteId = 123;
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .expect(404, { error: { message: 'Note not found' } });
      });
    });

    context('Given there are notes in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach('insert folders and notes', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('notes')
              .insert(testNotes);
          });
      });

      it('responds with 200 and the specified note', () => {
        const noteId = 2;
        const expectedNote = testNotes[noteId - 1];
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .expect(200, expectedNote);
      });
    });
  });

  describe('POST /api/notes', () => {
    const testFolders = makeFoldersArray();

    beforeEach('insert folders', () => {
      return db
        .into('folders')
        .insert(testFolders);
    });

    it('creates a note, responding with 201 and the new note', () => {
      const newNote = {
        name: 'Test new note',
        content: 'hello',
        folderid: 1
      };

      return supertest(app)
        .post('/api/notes')
        .send(newNote)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(newNote.name);
          expect(res.body.content).to.eql(newNote.content);
          expect(res.body.folderid).to.eql(newNote.folderid);
          expect(res.body).to.have.property('id');
          const expected = new Date().toLocaleString();
          const actual = new Date(res.body.modified).toLocaleString();
          expect(actual).to.eql(expected);
          expect(res.headers.location).to.eql(`/api/notes/${newNote.id}`);
        })
        .then(res =>
          supertest(app)
            .get(`/api/notes/${res.body.id}`)
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

  describe('DELETE /api/notes/:note_id', () => {
    context('Given no notes', () => {
      it('responds with 404', () => {
        const noteId = 123456;
        return supertest(app)
          .delete(`/api/notes/${noteId}`)
          .expect(404, { error: { message: 'Note not found' } });
      });
    });

    context('Given there are articles in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach('insert folders and notes', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('notes')
              .insert(testNotes);
          });
      });

      it('responds with 204 and removes the article', () => {
        const idToRemove = 1;
        const expectedNotes = testNotes.filter(note => note.id !== idToRemove);
        return supertest(app)
          .delete(`/api/notes/${idToRemove}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get('/api/notes')
              .expect(expectedNotes)
          );
      });
    });
  });

});