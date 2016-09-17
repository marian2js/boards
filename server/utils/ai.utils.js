const exec = require('child_process').exec;
const List = require('models/list.model');
const Task = require('models/task.model');

module.exports = {

  /**
   * Updates a board with the elements extracted from an image
   */
  updateBoard(board, image) {
    let data;
    return this.processImage(image)
      .then(lists => List.createOrUpdateLists(board, lists))
      .then(_data => {
        data = _data;
        return Task.createOrUpdateTasks(board, data.tasks);
      })
      .then(tasks => {
        data.tasks = tasks;
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