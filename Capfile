# default deploy_config_path is 'config/deploy.rb'
set :deploy_config_path, '.cap/deploy.rb'
# default stage_config_path is 'config/deploy'
set :stage_config_path, '.cap/deploy'

# Load DSL and set up stages
require "capistrano/setup"

# Include default deployment tasks
require "capistrano/deploy"

# Include tasks from other gems included in your Gemfile
#
# For documentation on these, see for example:
#
#   https://github.com/capistrano/rvm
#   https://github.com/capistrano/rbenv
#   https://github.com/capistrano/chruby
#   https://github.com/capistrano/bundler
#   https://github.com/capistrano/rails
#   https://github.com/capistrano/passenger
#
# require 'capistrano/rvm'
# require 'capistrano/rbenv'
# require 'capistrano/chruby'
# require 'capistrano/bundler'
# require 'capistrano/rails/assets'
# require 'capistrano/rails/migrations'
# require 'capistrano/passenger'


# default tasks path is `lib/capistrano/tasks/*.rake`
# (note that you can also change the file extensions)
# Load custom tasks from `lib/capistrano/tasks` if you have any defined
# Dir.glob("lib/capistrano/tasks/*.rake").each { |r| import r }
Dir.glob('.cap/tasks/*.rb').each { |r| import r }
