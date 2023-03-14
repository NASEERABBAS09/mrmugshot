angular.module("lawdawgs").config(function($urlRouterProvider, $stateProvider, $locationProvider) {
  $locationProvider.html5Mode(true);
  $stateProvider.state('login', {
      url: '/login',
      template: '<app-login></app-login>',
      resolve: {
        currentUser: ($q) => {
          if (Meteor.userId()) {
            return $q.reject('LOGINED');
          } else {
            return $q.resolve();
          }
        }
      }
    }).state('reset-password', {
      url: '/reset-password/:token',
      template: '<app-reset></app-reset>',
      resolve: {
        currentUser: ($q) => {
          if (Meteor.userId()) {
            return $q.reject('LOGINED');
          } else {
            return $q.resolve();
          }
        }
      }
    }).state('logout', {
      url: '/logout',
      resolve: {
        "logout": function($state, $timeout) {
          return Meteor.logout(function(err) {
            $timeout(function() {
              $state.go('login');
            }, 100);
          });
        }
      }
    })
    // Admin
    .state('admin-settings', {
      url: '/admin-settings',
      views: {
        'appContent': {
          template: '<admin-settings></admin-settings>'
        },
        'appNavigation': {
          template: '<admin-navigation></admin-navigation>'
        }
      },
      resolve: {
        user: ($auth) => {
          return $auth.requireValidUser((user) => {
            if (!Roles.userIsInRole(user, 'admin')) {
              return 'FORBIDDEN';
            } else {
              return true;
            }
          });
        }
      }
    }).state('manage-terms-privacy', {
      url: '/manage-terms-privacy/:type',
      views: {
        'appContent': {
          template: '<terms-privacy-management></terms-privacy-management>'
        },
        'appNavigation': {
          template: '<admin-navigation></admin-navigation>'
        }
      },
      resolve: {
        user: ($auth) => {
          return $auth.requireValidUser((user) => {
            if (!Roles.userIsInRole(user, 'admin')) {
              return 'FORBIDDEN';
            } else {
              return true;
            }
          });
        }
      }
    }).state('user-management', {
      url: '/user-management',
      views: {
        'appContent': {
          template: '<user-management></user-management>',
        },
        'appNavigation': {
          template: '<admin-navigation></admin-navigation>'
        }
      },
      resolve: {
        user: ($auth) => {
          return $auth.requireValidUser((user) => {
            if (!Roles.userIsInRole(user, 'admin')) {
              return 'FORBIDDEN';
            } else {
              return true;
            }
          });
        }
      }
    }).state('sheriff-management', {
      url: '/sheriff-management',
      views: {
        'appContent': {
          template: '<sheriff-management></sheriff-management>'
        },
        'appNavigation': {
          template: '<admin-navigation></admin-navigation>'
        }
      },
      resolve: {
        user: ($auth) => {
          return $auth.requireValidUser((user) => {
            if (!Roles.userIsInRole(user, 'admin')) {
              return 'FORBIDDEN';
            } else {
              return true;
            }
          });
        }
      }
    }).state('mugshot-management', {
      url: '/mugshot-management',
      views: {
        'appContent': {
          template: '<mugshot-management></mugshot-management>'
        },
        'appNavigation': {
          template: '<admin-navigation></admin-navigation>'
        }
      },
      resolve: {
        user: ($auth) => {
          return $auth.requireValidUser((user) => {
            if (!Roles.userIsInRole(user, 'admin')) {
              return 'FORBIDDEN';
            } else {
              return true;
            }
          });
        }
      }
    }).state('mugshot-approval-list', {
      url: '/mugshot-approval',
      views: {
        'appContent': {
          template: '<mugshot-approval-list></mugshot-approval-list>'
        },
        'appNavigation': {
          template: '<admin-navigation></admin-navigation>'
        }
      },
      resolve: {
        user: ($auth) => {
          return $auth.requireValidUser((user) => {
            if (!Roles.userIsInRole(user, 'admin')) {
              return 'FORBIDDEN';
            } else {
              return true;
            }
          });
        }
      }
    }).state('mugshot-approval-detail', {
      url: '/mugshot-approval/:id',
      views: {
        'appContent': {
          template: '<mugshot-approval-detail></mugshot-approval-detail>'
        },
        'appNavigation': {
          template: '<admin-navigation></admin-navigation>'
        }
      },
      resolve: {
        user: ($auth) => {
          return $auth.requireValidUser((user) => {
            if (!Roles.userIsInRole(user, 'admin')) {
              return 'FORBIDDEN';
            } else {
              return true;
            }
          });
        }
      }
    })
    // Sheriff
    .state('sheriff-settings', {
      url: '/sheriff-settings',
      views: {
        'appContent': {
          template: '<sheriff-settings></sheriff-settings>'
        },
        'appNavigation': {
          template: '<sheriff-navigation></sheriff-navigation>'
        }
      },
      resolve: {
        user: ($auth) => {
          return $auth.requireValidUser((user) => {
            if (!Roles.userIsInRole(user, 'sheriff')) {
              return 'FORBIDDEN';
            } else {
              return true;
            }
          });
        }
      }
    }).state('upload-mugshot', {
      url: '/upload-mugshot',
      views: {
        'appContent': {
          template: '<upload-mugshot></upload-mugshot>'
        },
        'appNavigation': {
          template: '<sheriff-navigation ></sheriff-navigation>'
        }
      },
      resolve: {
        user: ($auth) => {
          return $auth.requireValidUser((user) => {
            if (!Roles.userIsInRole(user, 'sheriff')) {
              return 'FORBIDDEN';
            } else {
              return true;
            }
          });
        }
      }
    }).state('sheriff-terms', {
      url: '/sheriff-terms',
      views: {
        'appContent': {
          template: '<app-sheriff-terms></app-sheriff-terms>'
        },
        'appNavigation': {
          template: '<sheriff-navigation ></sheriff-navigation>'
        }
      },
      resolve: {
        user: ($auth) => {
          return $auth.requireValidUser((user) => {
            if (!Roles.userIsInRole(user, 'sheriff')) {
              return 'FORBIDDEN';
            } else {
              return true;
            }
          });
        }
      }
    }).state('upload-mugshot-admin', {
      url: '/upload-mugshot-admin',
      views: {
        'appContent': {
          template: '<upload-mugshot></upload-mugshot>'
        },
        'appNavigation': {
          template: '<admin-navigation ></admin-navigation>'
        }
      },
      resolve: {
        user: ($auth) => {
          return $auth.requireValidUser((user) => {
            if (!Roles.userIsInRole(user, 'admin')) {
              return 'FORBIDDEN';
            } else {
              return true;
            }
          });
        }
      }
    });
  $urlRouterProvider.otherwise("/login");
}).run(function($rootScope, $state) {
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams) {
    if ((toState.url == '/login' || toState.url == '/reset-password' || toState.url == '/reset-confirm') && Meteor.userId()) {
      if (Roles.userIsInRole(Meteor.user(), 'admin')) {
        $state.go('admin-settings');
      } else {
        $state.go('sheriff-settings');
      }
    }
  });
  $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
    console.log(error);
    if (error === 'AUTH_REQUIRED') {
      $state.go('login');
    }
    if (error === 'LOGINED') {
      if (Roles.userIsInRole(Meteor.user(), 'admin')) {
        $state.go('admin-settings');
      } else {
        $state.go('sheriff-settings');
      }
    }
    if (error === 'FORBIDDEN') {
      $state.go('logout');
    }
  });
});