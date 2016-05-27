

// Include gulp
var gulp = require('gulp');

// Include all gulp named plugins
var plugins = require("gulp-load-plugins")({
    pattern: ['gulp-*', 'gulp.*'],
    replaceString: /\bgulp[\-.]/
});

// require npm modules
var browserSync = require('browser-sync'),
    del = require('del'),
    runSequence = require('run-sequence'),
    jshintStylish = require('jshint-stylish'),
    htmlStylish = require('htmlhint-stylish'),
    chalk = require('chalk'),
    through2 = require('through2'),
    gulpIf = require('gulp-if');

/* ////////////////////////////////////////////////////////////////////

NOTE: site variable needs to be changed to the url given by 'ngrok http 8080
after running gulp task on local machine

///////////////////////////////////////////////////////////////////////*/

var psi = require('psi'),
    site = 'http://a0a03eb7.ngrok.io/',
    key = '';

////////////////////////////////////////////////////////////////////////

var paths = {
    scripts: ['src/app/js/*.js', 'src/app/js/library/*.js'],
    styles: ['src/app/css/*.css', 'src/app/css/library/*.css'],
    images: 'src/app/img/*.*',
    fonts: 'src/app/fonts/*.*',
    content: ['src/app/*.html'],
    base: 'src'
};

var dist = {
    scripts: 'dist',
    styles: 'dist/app/css/',
    assets: 'dist',
    content: 'dist'
};

///////////////////////////////////////////////////
// define gulp tasks

function customPlumber() {
    return plugins.plumber({
        errorHandler: function (err) {
            console.log(err.stack);
            this.emit('end');
        }
    });
}


gulp.task('fonts', function() {
  return gulp.src(paths.fonts, {
          base: paths.base
      })
      // output to dist directory
      .pipe(gulp.dest(dist.content))
      .pipe(browserSync.reload({
          stream: true
      }));
});

// serve dev version of website locally task
gulp.task('browserSync:dev', function () {
    browserSync({
        server: {
            baseDir: 'src/app/'
        },
        host: 'localhost',
        port: 8080,
        open: true,
        notify: false
    });
});


// serve dist optimized version of website locally task
gulp.task('browserSync:dist', function () {
    browserSync({
        server: {
            baseDir: 'dist'
        },
        host: 'localhost',
        port: 8080,
        open: false,
        notify: false
    });
});

// images task

gulp.task('images', function () {
    return gulp.src(paths.images, {
            base: paths.base
        })
        .pipe(plugins.imagemin({
            optimizationLevel: 5,
            progressive: true,
            interlaced: true
        }))
        .pipe(gulp.dest(dist.images))
        .pipe(browserSync.reload({
            stream: true
        }));
});

// google page speed insights tasks

gulp.task('mobile', function () {
    return psi(site, {
        // key: key
        nokey: 'true',
        strategy: 'mobile',
    }).then(function (data) {
        console.log('Speed score: ' + data.ruleGroups.SPEED.score);
        console.log('Usability score: ' + data.ruleGroups.USABILITY.score);
    });
});

gulp.task('desktop', function () {
    return psi(site, {
        //key: key,
        nokey: 'true',
        strategy: 'desktop',
    }).then(function (data) {
        console.log('Speed score: ' + data.ruleGroups.SPEED.score);
    });
});

// validate html task

gulp.task('validateHtml', function () {
    gulp.src(paths.content)
        .pipe(plugins.w3cjs())
        .pipe(through2.obj(function (file, enc, cb) {
            cb(null, file);
            if (!file.w3cjs.success) {
                console.log(chalk.bgRed.bold('HTML validation error(s) found'));
            }
        }));
});

// validate css task

gulp.task('validateCss', function () {
    gulp.src(paths.styles)
        .pipe(plugins.cssValidator())
        .on('error', function(err) {
            console.log(chalk.bgRed.bold('CSS validation error(s) found'));
        });
});

// WATCH tasks

gulp.task('watch-content', function () {
    gulp.src(paths.content)
        .pipe(browserSync.reload({
            stream: true
        }));
});

gulp.task('watch-styles', function () {
    gulp.src(paths.styles)
        .pipe(browserSync.reload({
            stream: true
        }));
});

gulp.task('watch-scripts', function () {
    gulp.src(paths.scripts)
        .pipe(browserSync.reload({
            stream: true
        }));
});

// Watch Files For Changes
gulp.task('watch', function () {
    gulp.watch(paths.scripts, ['watch-scripts']);
    gulp.watch(paths.content, ['watch-content']);
    gulp.watch(paths.styles, ['watch-styles']);
});


// Lint Task
gulp.task('lint', function () {
    return gulp.src(paths.scripts, {
            base: paths.base
        })
        .pipe(plugins.jshint('.jshintrc'))
        .pipe(plugins.jshint.reporter('jshint-stylish'));
});

// CLEAN Tasks

gulp.task('build-clean', function () {
    return del('dist/*');
});

// gulp.task('cleanCss', function () {
//     return gulp.src(paths.styles, {
//             base: paths.base
//         })
//         // TODO:  task using uncss causes errors
//         // strip out unused CSS rules for site
//         .pipe(plugins.uncss({
//             html: [paths.content]
//         }))
//         .pipe(gulp.dest(dist.styles))
//         .pipe(browserSync.reload({
//             stream: true
//         }));
// });

// BUILD Tasks

gulp.task('build-scripts', function () {
    return gulp.src(paths.scripts, {
            base: paths.base
        })
        .pipe(customPlumber('Error running scripts task'))
        // Minify javascript files
        .pipe(plugins.uglify())
        .pipe(gulp.dest(dist.scripts))
        .pipe(browserSync.reload({
            stream: true
        }));
});

// gulp.task('build-styles', function () {
//     return gulp.src(paths.styles, {
//             base: paths.base
//         })
//         // Minify css files
//         .pipe(plugins.cssnano())
//         .pipe(gulp.dest(dist.styles))
//         .pipe(browserSync.reload({
//             stream: true
//         }));
// });

gulp.task('minicss', function(){
    gulp.src(paths.styles)
        .pipe(plugins.miniCss())
        .pipe(gulp.dest(dist.styles))
        .pipe(browserSync.reload({
            stream: true
        }));
});


gulp.task('build-html', function () {

    return gulp.src(paths.content, {
            base: paths.base
        })
        // inline any js & css resources flaged 'inline' in html file
        .pipe(plugins.debug({
            title: 'before:'
        }))
        // inline css file links using 'smoosher comments' in html file
        .pipe(plugins.smoosher())
        // minify html files
        .pipe(plugins.htmlmin({
            collapseWhitespace: true,
            removeComments: true,
            minifyJS: true,
            minifyCSS: true
        }))
        // output to dist directory
        .pipe(gulp.dest(dist.content))
        .pipe(browserSync.reload({
            stream: true
        }));
});


// lint JS, validate html & CSS task

gulp.task('validate', ['lint', 'validateHtml', 'validateCss']);

// build task

 gulp.task('build', function (callback) {
    runSequence('build-clean', 'fonts', ['build-scripts', 'minicss'],
        'build-html', 'images',
        callback);
});


// serve task

gulp.task('serve:dev', ['browserSync:dev', 'watch']);

gulp.task('serve:dist', ['browserSync:dist', 'watch']);

// default task - run with command 'gulp'

gulp.task('default', ['browserSync:dist', 'watch']);
