'use strict';

const NotesService = {
  getNotes(knex){
    return knex
      .select('*')
      .from('notes');
  },

  addNote(knex, newNote){
    return knex
      .insert(newNote)
      .into('notes')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  getbyId(knex, id){
    return knex
      .select('*')
      .from('notes')
      .where('id', id).first();
  },

  deleteNote(knex, id){
    return knex('notes')
      .where( {id} )
      .delete();
  },

  editNote(knex, id, newFields){
    return knex('notes')
      .where( {id} )
      .update(newFields);
  }
};

module.exports = NotesService;