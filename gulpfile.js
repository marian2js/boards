const gulp = require('gulp');
const gls = require('gulp-live-server');
const jasmine = require('gulp-jasmine');

gulp.task('serve', function() {
  const serverFiles = 'server/**/*.js';

  const server = gls('./server/bin/www');
  server.start();

  gulp.watch(serverFiles, file => {
    server.start();
    server.notify.apply(server, [file]);
  });
});

gulp.task('test', () => {
  gulp.src('test/server/unit/**/*.spec.js')
    .pipe(jasmine())
});