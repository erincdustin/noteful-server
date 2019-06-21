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

module.exports = folderRouter;

// folderRouter
//   .route('/:folder_id')
//   .get()
//   .delete()
//   .patch();