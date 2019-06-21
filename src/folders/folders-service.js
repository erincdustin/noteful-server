'use strict';

const FoldersService = {
  getFolders(knex){
    return knex
      .select('*')
      .from('folders');
  },

  addFolder(knex, newFolder){
    return knex
      .insert(newFolder)
      .into('folders')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  getbyId(knex, id){
    return knex
      .select('*')
      .from('folders')
      .where('id', id).first();
  },

  deleteFolder(knex, id){
    return knex('folders')
      .where( {id} )
      .delete();
  },

  editFolder(knex, id, newFields){
    return knex('folders')
      .where( {id} )
      .update(newFields);
  }
};

module.exports = FoldersService;