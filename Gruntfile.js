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
    less: {
      development: {
        files: {
          'public/stylesheets/main.css': 'public/stylesheets/main.less'
        }
      },
      production: {
        files: {
          'public/stylesheets/main.css': 'public/stylesheets/main.less'
        }
      }
    },
    watch: {
      scripts: {
        files: ['<%= jshint.files %>'],
        tasks: ['jshint']  
      },
      css: {
        files: '**/*.less',
        tasks: ['less']        
      }
    }
	});

  grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-watch');
	
	// the default task can be run just by typing "grunt" on the command line
	grunt.registerTask('default', ['jshint']);
};
