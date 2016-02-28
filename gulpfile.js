var gulp = require('gulp');
var clean = require('gulp-clean');
var webserver = require('gulp-webserver');
var watch = require('gulp-watch');

// PATHS
var pathTo = {
  'app': ['src/app/'],
  'dist': ['dist'],
  'html': ['src/app/*.html'],
  'scripts': ['src/app/js/**/*.js'],
  'styles': ['src/app/css/**/*.css']
};

gulp.task('webserver', function() {
  gulp.src(pathTo.app)
    .pipe(webserver({
      livereload: true,
      //directoryListing: true,
      open: true
    }));
});

gulp.task('html', function() {
  gulp.src(pathTo.html);
  //.pipe(connect.reload());
  console.log('html task..');
});

gulp.task('scripts', function() {
  gulp.src(pathTo.scripts);
  console.log('scripts task..');
});

gulp.task('styles', function() {
  gulp.src(pathTo.styles);
  console.log('styles task..');
});


gulp.task('watch', function() {
  gulp.watch(pathTo.html, ['html']);
  gulp.watch(pathTo.scripts, ['scripts']);
  gulp.watch(pathTo.styles, ['styles']);
});

// Removes all files from ./dist/
gulp.task('clean', function() {
  return gulp.src('./dist/**/*', {
      read: false
    })
    .pipe(clean());
});

// Default Task
gulp.task('default', ['webserver', 'watch']);
