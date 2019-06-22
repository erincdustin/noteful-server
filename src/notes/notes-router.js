'use strict';

const express = require('express');
const path = require('path');
const xss = require('xss');
const notesService = require('./notes-service');

const noteRouter = express.Router();
const bodyParser = express.json();

const serializeNote = note => ({
  id: note.id,
  name: xss(note.name),
  modified: note.modified,
  content: xss(note.content),
  folderid: Number(note.folderid)
});

noteRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    notesService.getNotes(knexInstance)
      .then(notes => {
        res.json(notes.map(serializeNote));
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const { name, content, folderid } = req.body;
    const newNote = { name, content, folderid };
    const knexInstance = req.app.get('db');

    for (const [key, value] of Object.entries(newNote))
      if (value == null)
        return res.status(400).json({ error: { message: `Please provide ${key} in request body`}}); 
  
    notesService.addNote(knexInstance, newNote)
      .then(note => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${newNote.id}`))
          .json(serializeNote(note));
      })
      .catch(next);
  });

noteRouter
  .route('/:note_id')
  .all((req, res, next) => {
    const knexInstance = req.app.get('db');
    notesService.getbyId(knexInstance, req.params.note_id)
      .then(note => {
        if(!note) {
          return res.status(404).json({ 
            error: { message: 'Note not found' }
          });
        }
        res.note = note;
        next();
      })
      .catch(next);
  })
  .get((req,res,next) => {
    res.json(serializeNote(res.note));
  })
  .delete((req, res, next) => {
    const knexInstance = req.app.get('db');
    notesService.deleteNote(knexInstance, req.params.note_id)
      .then(note => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(bodyParser, (req, res, next) => {
    const knexInstance = req.app.get('db');
    const { name, content, folderid } = req.body;
    const newFields = { name, content, folderid };

    const numValues = Object.values(newFields).filter(Boolean).length;
    if(numValues === 0) 
      return res.status(400).json({
        error: { message: 'Request body must include either name, content, or folderid'}
      });

    notesService.editNote(knexInstance, req.params.note_id, newFields)
      .then(folder => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = noteRouter;