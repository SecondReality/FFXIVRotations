module.exports = function(grunt)
{
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      dist: {
      files: {
        'build/ffxiv-rotations.js': 'src/ffxiv-rotations.js',
        'build/js.cookie.js': 'src/js.cookie.js',
        'build/db.js': 'src/db.js',
      }
    }
  },

  typescript: {
    base: {
      src: ['src/ffxiv-rotations.ts'],
      dest: 'src',
      options: {
        module: 'amd',
        target: 'es5',
        basePath: 'src',
        sourceMap: true,
        declaration: true
      }
    }
  },

  exec: {
    generateJson: {
      cwd: '../database',
      command: 'python generateJson.py'
    },
  },

  watch: {

  databaseWatch: {
    files: ['../database/skills.db', '../database/generateJson.py'],
    tasks: ['exec'],
    options: {
      interrupt: true,
    },
  },

  typescriptWatch: {
    files: 'src/ffxiv-rotations.ts',
    tasks: ['typescript'],
    options: {
      interrupt: true,
    },
  },

  sassWatch: {
    files: 'src/ffxiv-rotations.sass',
    tasks: ['sass'],
    options: {
      interrupt: true,
    },
  },

  },

  sass: {
    options: {
        sourceMap: true
    },
    dist: {
        files: {
            'src/ffxiv-rotations.css': 'src/ffxiv-rotations.sass'
        }
    }
},

cssmin: {
  options: {
    shorthandCompacting: false,
    roundingPrecision: -1
  },
  target: {
    files: {
      'build/ffxiv-rotations.css': ['src/ffxiv-rotations.css']
    }
  }
},

htmlmin: {
    dist: {
      options: {
        removeComments: true,
        collapseWhitespace: true
      },
      files: {
        'build/index.html': 'src/index.html',
      }
    }
}


});

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');

    grunt.registerTask('default', ['typescript', 'exec', 'uglify', 'sass', 'cssmin', 'htmlmin']);
};