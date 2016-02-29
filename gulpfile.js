var gulp = require('gulp');
var clean = require('gulp-clean');
var webserver = require('gulp-webserver');
var watch = require('gulp-watch');
var imagemin = require('gulp-imagemin');
var pnqquant = require('imagemin-pngquant');
var cache = require('gulp-cache');
var changed = require('gulp-changed');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
//var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var concat = require('gulp-concat');

// PATHS
var pathTo = {
  'app':      'src/app/',
  'dist':     'dist',
  'html':     'src/app/*.html',
  'imgSrc':   'src/img/**/*.+(jpeg|jpg|png)',
  'images':   'src/app/img/',
  'scripts':  'src/app/js/**/*.js',
  'styles':   'src/app/css/**/*.css'
};

var _gulpsrc = gulp.src;
gulp.src = function() {
    return _gulpsrc.apply(gulp, arguments)
    .pipe(plumber({
        errorHandler: function(err) {
            notify.onError({
                title:    "Gulp Error",
                message:  "Error: <%= error.message %>",
            })(err);
            this.emit('end');
        }
    }));
};

gulp.task('webserver', function() {
  return gulp.src(pathTo.app)
    .pipe(webserver({
      livereload: true,
      //directoryListing: true,
      open: true
    }));
});

gulp.task('clear', function (done) {
  return cache.clearAll(done);
});

gulp.task('images', function() {
  return gulp.src(pathTo.imgSrc)
    // cache images so only images not already in src/img/.. are processed
    .pipe(cache(imagemin({
      progressive: true,
      svgoPlugins: [
          {removeViewBox: false},
          {cleanupIDs: false}
      ],
      use: [pnqquant()]
    })))
    .pipe(gulp.dest(pathTo.images));
});

gulp.task('html', function() {
  return gulp.src(pathTo.html);
});

gulp.task('scripts', function() {
  return gulp.src(pathTo.scripts);
});

gulp.task('styles', function() {
  return gulp.src(pathTo.styles);
});

// Removes all files from ./dist/
gulp.task('clean', function() {
  return gulp.src('./dist/**/*', {
      read: false
    })
    .pipe(clean());
});

// watch task
gulp.task('watch', function() {
  gulp.watch(pathTo.html, ['html']);
  gulp.watch(pathTo.scripts, ['scripts']);
  gulp.watch(pathTo.styles, ['styles']);
});

// Default Task
gulp.task('default', ['webserver', 'watch']);
