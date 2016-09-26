const pdf = require('phantom-html2pdf');
const ejs = require('ejs');

module.exports = {

  /**
   * Generates a PDF with the printable data of the board
   *
   * @returns {Promise}
   */
  generatePrintableBoard(board, relations, items, options = {}) {
    return this._getPrintableHTML(board, relations, items)
      .then(html => {
        if (options.format === 'html') {
          return html;
        }
        return this._htmlToPdf(html);
      });
  },

  /**
   * Returns HTML after parsing the board data
   *
   * @returns {Promise}
   * @private
   */
  _getPrintableHTML(board, relations, items) {
    return new Promise((resolve, reject) => {
      let filename = './server/views/export/printable.ejs';
      let data = {
        board,
        relations,
        items
      };
      let options = {};
      ejs.renderFile(filename, data, options, (err, html) => {
        if (err) {
          return reject(err);
        }
        resolve(html);
      });
    });
  },

  /**
   * Converts HTML into a PDF
   *
   * @returns {Promise}
   * @private
   */
  _htmlToPdf(html) {
    return new Promise((resolve, reject) => {
      let options = {
        html
      };
      pdf.convert(options, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result.toStream());
      });
    });
  }

};