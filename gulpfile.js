const gulp = require('gulp');
const gls = require('gulp-live-server');

gulp.task('serve', function() {
  const serverFiles = 'server/**/*.js';

  const server = gls('./server/bin/www');
  server.start();

  gulp.watch(serverFiles, file => {
    server.start();
    server.notify.apply(server, [file]);
  });
});