module.exports = (grunt) ->

  # configuration
  grunt.initConfig

    # grunt coffee
    coffee:
      compile:
        files:
          'core/jquery.shapeshift.js': 'core/jquery.shapeshift.coffee',

    # grunt watch (or simply grunt)
    watch:
      coffee:
        files: 'core/jquery.shapeshift.coffee'
        tasks: ['coffee']

  # load plugins
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  # tasks
  grunt.registerTask 'default', ['coffee', 'watch']