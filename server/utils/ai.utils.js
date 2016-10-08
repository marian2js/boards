const exec = require('child_process').exec;
const Relation = require('models/relation.model');
const Item = require('models/item.model');

module.exports = {

  /**
   * Updates a board with the elements extracted from an image
   */
  updateBoard(board, image) {
    let data;
    return this.processImage(image)
      .then(_data => {
        data = _data;
        return Relation.createOrUpdateRelations(board, data.relations);
      })
      .then(relations => Item.createOrUpdateItems(board, relations, data.items))
      .then(items => {
        data.items = items;
        return data;
      });
  },

  /**
   * Extracts board elements from an image
   */
  processImage(image) {
    return new Promise((resolve, reject) => {
      const cmd = `cd ai; python3 ./process_board.py -i ${image}`;
      exec(cmd, (error, stdout) => {
        if (error) {
          return reject(error);
        }
        try {
          resolve(JSON.parse(stdout.trim()));
        } catch (e) {
          reject(e);
        }
      });
    });
  }

};