module.exports = function(grunt) {
	grunt.initConfig({
		jshint: {
      files: ['*.js', 'routes/**/*.js'],
      options: {
      	expr: true,
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    }
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	
	// the default task can be run just by typing "grunt" on the command line
	grunt.registerTask('default', ['jshint']);
};
