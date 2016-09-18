const stringSimilarity = require('string-similarity');

const NAME_MATCHING_MIN_CONFIDENCE = 0.7;

module.exports = {

  /**
   * Compares 2 strings using Dice coefficient
   * Returns true if the strings are similar
   */
  namesMatch(str1, str2) {
    return stringSimilarity.compareTwoStrings(str1, str2) >= NAME_MATCHING_MIN_CONFIDENCE;
  }

};