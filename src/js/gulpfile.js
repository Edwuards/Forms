var gulp = require('gulp')
var postcss = require('gulp-postcss')
var sass = require('gulp-sass')
var lost = require('lost')
var rollup = require('rollup')

var paths = {
  styles: {src: '../css/index.sass',dest:'../../public/css/'},
  scripts: {src: './', dest:'../../public/js/'}
}

sass.compiler = require('node-sass')

function build(){
  return rollup.rollup({ input: paths.scripts.src+'signup.js' }).then((bundle)=>{
    return bundle.write({
      file: paths.scripts.dest+'signup.js',
      format: 'umd',
      name: 'forms'
    })
  })
}

function styles(){
  return gulp.src(paths.styles.src)
  .pipe(sass.sync().on('error',sass.logError))
  .pipe(postcss([lost()]))
  .pipe(gulp.dest(paths.styles.dest))
}

function watch(){
    gulp.watch(paths.styles.src,styles)
}

function t(){ console.log('working') }

exports.t = t
exports.build = build
exports.styles = styles
exports.watch = watch
