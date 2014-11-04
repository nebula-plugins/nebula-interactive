module.exports = function(grunt) {
    grunt.initConfig({
        jasmine: {
          src: [
            'src/main/resources/static/algorithms/**/*.js',
            'src/main/resources/static/services/**/*.js',
            'src/main/resources/static/controllers/**/*.js'
          ],
          options: {
            vendor: [ // third party includes that are depended on by specs and their SUTs
                'src/main/resources/static/bower_components/jquery/dist/jquery.min.js',
                'src/main/resources/static/bower_components/angular/angular.js',
                'src/main/resources/static/bower_components/angular-route/angular-route.min.js',
                'src/main/resources/static/bower_components/angular-mocks/angular-mocks.js',
                'src/main/resources/static/bower_components/angular-cookies/angular-cookies.min.js',
                'src/main/resources/static/bower_components/restangular/dist/restangular.js',
                'src/main/resources/static/bower_components/codemirror/lib/codemirror.js',
                'src/main/resources/static/bower_components/d3/d3.min.js',
                'src/main/resources/static/bower_components/webcola/WebCola/cola.v3.min.js',
                'src/main/resources/static/bower_components/lodash/dist/lodash.min.js',
                'src/main/resources/static/bower_components/codemirror/addon/hint/show-hint.js',
                'src/main/resources/static/bower_components/colorbrewer/colorbrewer.js'
            ],
            specs: 'src/test/resources/static/jasmine/**/*.js',
            keepRunner: true
          }
        },
        watch: {
          scripts: {
            files: [
                'src/main/resources/static/**/*.js',
                'src/test/resources/static/jasmine/**/*.js'
            ],
            tasks: ['jasmine'],
            options: { spawn: false }
          }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('test', ['jasmine']);
    grunt.registerTask('default', ['test']);
};