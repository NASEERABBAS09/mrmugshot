# config valid only for current version of Capistrano
lock '3.6.1'

set :application, 'admin-site'

# Default branch is :master
# ask :branch, `git rev-parse --abbrev-ref HEAD`.chomp

# Default deploy_to directory is /var/www/my_app_name
set :deploy_to, '/home/ubuntu/mrmugshots/admin-site'

# Default value for :scm is :git
set :repository, "."
set :deploy_via, :copy


# Default value for :format is :airbrussh.
set :format, :pretty

# You can configure the Airbrussh format using :format_options.
# These are the defaults.
# set :format_options, command_output: true, log_file: 'log/capistrano.log', color: :auto, truncate: :auto

# Default value for :pty is false
# set :pty, true

# Default value for :linked_files is []
# append :linked_files, 'config/database.yml', 'config/secrets.yml'

# Default value for linked_dirs is []
# append :linked_dirs, 'log', 'tmp/pids', 'tmp/cache', 'tmp/sockets', 'public/system'

# Default value for default_env is {}
# set :default_env, { path: "/opt/ruby/bin:$PATH" }

# Default value for keep_releases is 5
set :keep_releases, 5

# We will tell a white lie to Capistrano
set :scm, :git

# release id is just the commit hash used to create the tarball.
set :project_release_id, `git log --pretty=format:'%h' -n 1 HEAD`
# the same path is used local and remote... just to make things simple for who wrote this.
set :project_tarball_path, "/tmp/#{fetch(:application)}-#{fetch(:project_release_id)}.tar.gz"
set :build_tarball_path, "/tmp/#{fetch(:application)}-#{fetch(:project_release_id)}"

# We create a Git Strategy and tell Capistrano to use it, our Git Strategy has a simple rule: Don't use git.
module NoGitStrategy
  def check
    true
  end

  def test
    # Check if the tarball was uploaded.
    test! " [ -f #{fetch(:project_tarball_path)} ] "
  end

  def clone
    true
  end

  def update
    true
  end

  def release
    # Unpack the tarball uploaded by deploy:upload_tarball task.
    context.execute "tar -xf #{fetch(:project_tarball_path)} -C #{release_path}"
    # Remove it just to keep things clean.
    context.execute :rm, fetch(:project_tarball_path)
  end

  def fetch_revision
    # Return the tarball release id, we are using the git hash of HEAD.
    fetch(:project_release_id)
  end
end

# Capistrano will use the module in :git_strategy property to know what to do on some Capistrano operations.
set :git_strategy, NoGitStrategy

# Finally we need a task to create the tarball and upload it,
namespace :deploy do
  desc 'Update monit files'
  task :update_monit_files do |task, args|
    tarball_path = fetch(:project_tarball_path)
    build_path = fetch(:build_tarball_path)
    app_name = fetch(:application)
    default_environment =  fetch(:default_environment)
    on roles(:app) do
      start_script = <<-EOF
#!/bin/bash
echo "Start NodeJS App:"
echo "  [+] Enter directory && install npm"
cd #{current_path}/bundle/programs/server && npm install --production
echo "  [+] Run Meteor script"
cd #{current_path}/bundle && PORT=#{default_environment[:PORT]} MONGO_URL=#{default_environment[:MONGO_URL]} ROOT_URL=#{default_environment[:ROOT_URL]} METEOR_SETTINGS=$(cat #{shared_path}/#{default_environment[:METEOR_SETTINGS]}) forever start -a -l #{shared_path}/log/production.log -e #{shared_path}/log/error.log --pidFile #{shared_path}/tmp/pids/app.pid #{current_path}/bundle/main.js
      EOF
      location = fetch(:template_dir, ".cap/deploy") + "/#{fetch(:application)}_start.sh"
      File.open(location,'w+') {|f| f.write start_script }
      upload! "#{location}", "#{shared_path}/#{fetch(:application)}_start.sh"

      stop_script = <<-EOF
#!/bin/bash
echo "Stop NodeJS App:"
echo "  [+] Enter directory and run stop script"
cd #{current_path}/bundle && forever stop #{current_path}/bundle/main.js || true
      EOF

      location = fetch(:template_dir, ".cap/deploy") + "/#{fetch(:application)}_stop.sh"
      File.open(location,'w+') {|f| f.write stop_script }
      upload! "#{location}", "#{shared_path}/#{fetch(:application)}_stop.sh"

      execute :sudo, "monit reload"
    end
  end

  desc 'Create and upload project tarball'
  task :upload_tarball do |task, args|
    tarball_path = fetch(:project_tarball_path)
    build_path = fetch(:build_tarball_path)
    app_name = fetch(:application)
    default_environment =  fetch(:default_environment)
    p "Building packages...."
    # This will create a project tarball from HEAD, stashed and not committed changes wont be released.
   `meteor build  #{build_path} --architecture os.linux.x86_64 --server #{default_environment[:ROOT_URL]}; mv #{build_path}/#{app_name}.tar.gz #{tarball_path}`
    raise 'Error creating tarball.'if $? != 0

    on roles(:all) do
      upload! tarball_path, tarball_path, recursive: true
      upload! "#{default_environment[:METEOR_SETTINGS]}", "#{shared_path}/#{default_environment[:METEOR_SETTINGS]}"
    end
  end

    #TODO: Add stop task in upstart
  desc "Start Forever"
  task :start do
    on roles(:app) do
      default_environment =  fetch(:default_environment)
      execute "PORT=#{default_environment[:PORT]} MONGO_URL=#{default_environment[:MONGO_URL]} ROOT_URL=#{default_environment[:ROOT_URL]} METEOR_SETTINGS=$(cat #{shared_path}/#{default_environment[:METEOR_SETTINGS]}) forever start -a -l #{shared_path}/log/production.log -e #{shared_path}/log/error.log --pidFile #{shared_path}/tmp/pids/app.pid #{current_path}/bundle/main.js"
    end
  end


  desc 'Restart application'
  task :restart do
    on roles(:app), in: :sequence, wait: 5 do
      default_environment =  fetch(:default_environment)
      execute "forever stop #{current_path}/bundle/main.js || true"
      # execute "cp #{shared_path}/tmp/pids/app.pid #{shared_path}/tmp/pids/app.pid.old || true"
      execute "PORT=#{default_environment[:PORT]} MONGO_URL=#{default_environment[:MONGO_URL]} ROOT_URL=#{default_environment[:ROOT_URL]} METEOR_SETTINGS=$(cat #{shared_path}/#{default_environment[:METEOR_SETTINGS]}) forever start -a -l #{shared_path}/log/production.log -e #{shared_path}/log/error.log --pidFile #{shared_path}/tmp/pids/app.pid #{current_path}/bundle/main.js"
      # execute "kill -15 `cat #{shared_path}/tmp/pids/app.pid.old` || true"
    end
  end

  desc 'Restart application'
  task :stop do
    on roles(:app), in: :sequence, wait: 5 do
      execute "forever stop #{current_path}/bundle/main.js || true"
      # execute "kill -15 `cat #{shared_path}/tmp/pids/app.pid.old` || true"
      # execute "kill -15 `cat #{shared_path}/tmp/pids/app.pid` || true"
    end
  end

  desc "Build bundle app"
  task :npm_install do
    on roles(:app) do
      execute "cd #{current_path}/bundle/programs/server; npm install --production;"
    end
  end

  before :restart, 'deploy:npm_install'

end
before 'deploy:updating', 'deploy:upload_tarball'
after 'deploy:finished', 'deploy:update_monit_files'
after 'deploy:update_monit_files', 'deploy:restart'
