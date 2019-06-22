'use strict';

const express = require('express');
const path = require('path');
const xss = require('xss');
const foldersService = require('./folders-service');

const folderRouter = express.Router();
const bodyParser = express.json();

const serializeFolder = folder => ({
  id: folder.id,
  name: xss(folder.name),
});

folderRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    foldersService.getFolders(knexInstance)
      .then(folders => {
        res.json(folders.map(serializeFolder));
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const { name } = req.body;
    const newFolder = { name };
    const knexInstance = req.app.get('db');

    if (!name) 
      return res.status(400).json({ error: { message: 'Please provide a folder name'}}); 
  
    foldersService.addFolder(knexInstance, newFolder)
      .then(folder => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${newFolder.id}`))
          .json(serializeFolder(folder));
      })
      .catch(next);
  });

folderRouter
  .route('/:folder_id')
  .all((req, res, next) => {
    const knexInstance = req.app.get('db');
    foldersService.getbyId(knexInstance, req.params.folder_id)
      .then(folder => {
        if(!folder) {
          return res.status(404).json({ 
            error: { message: 'Folder not found' }
          });
        }
        res.folder = folder;
        next();
      })
      .catch(next);
  })
  .get((req,res,next) => {
    res.json(serializeFolder(res.folder));
  })
  .delete((req, res, next) => {
    const knexInstance = req.app.get('db');
    foldersService.deleteFolder(knexInstance, req.params.folder_id)
      .then(folder => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(bodyParser, (req, res, next) => {
    const knexInstance = req.app.get('db');
    const { name } = req.body;
    const newField = { name };

    if(!name) {
      return res.status(400).json({
        error: { message: 'Request body must include name'}
      });
    }

    foldersService.editFolder(knexInstance, req.params.folder_id, newField)
      .then(folder => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = folderRouter;

