var app=angular.module("myApp", ['ui.router', 'ngToast', 'textAngular']);
app.config(function($stateProvider, $locationProvider, $urlRouterProvider){
    Stamplay.init("blogwt");
   // localStorage.removeItem("http://127.0.0.1:8080-jwt");
    $locationProvider.hashPrefix('');
    $stateProvider
    .state('home',{url:'/',templateUrl:'templates/home.html', controller:"HomeCtrl"})
    .state('login',{url:'/login',templateUrl:'templates/login.html', controller:"LoginCtrl"})
    .state('signup',{url:'/signup',templateUrl:'templates/signup.html',controller:"SignUpCtrl"})
    .state('MyBlogs',{url:'/myBlogs', templateUrl:'templates/myBlogs.html', controller:"MyBlogsCtrl"})
    .state('Create',{url:'/create', templateUrl:'templates/create.html', controller:"CreateCtrl", authenticate:true})
    //:id will be used as a parameter and can be retrieved in the edit controller
    .state('Edit',{url:'/edit/:id', templateUrl:'templates/edit.html', controller:"EditCtrl", authenticate:true})
    .state('View',{url:'/view/:id', templateUrl:'templates/view.html', controller:"ViewCtrl"});
    $urlRouterProvider.otherwise("/"); //if we try to access a non existent state this takes us to the home page
});
app.run(function($rootScope, AuthService, $state, $transitions){
      /* Stamplay.User.currentUser()
       .then(function(res){
           if(res.user){
               $rootScope.loggedIn=true;
               console.log($rootScope.loggedIn);
           }else{
               $rootScope.loggedIn=false;
               console.log($rootScope.loggedIn);
           }
       }, function(err){
           console.log("an error occurred while finding current user");
       });*/
     $transitions.onStart({}, function(transition){
       if(transition.$to().self.authenticate==true){
                   AuthService.isAuthenticated()
                   .then(function(res){
            console.log(res);
            if(res==false){
                $state.go('login');
            }
                   });
       }
     })
});
app.factory('AuthService', function($q, $rootScope){
 
 return{
     isAuthenticated : function(){
        var defer=$q.defer();
         Stamplay.User.currentUser(function(err, res){ //callback function
             if(err){
                 defer.resolve(false);
                 $rootScope.loggedIn=false;
             }
             if(res.user){
         defer.resolve(true);
         $rootScope.loggedIn=true;
             }else{
                 defer.resolve(false);
                 $rootScope.loggedIn=false;
             }
         });
         return defer.promise;
     }
 }
});
app.controller('CreateCtrl', function(taOptions, $scope, $state, $timeout, ngToast){
    $scope.newPost={};
    taOptions.toolbar = [
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
        ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear'],
        ['justifyLeft', 'justifyCenter', 'justifyRight', 'indent', 'outdent'],
        ['html', 'insertImage','insertLink', 'insertVideo', 'wordcount', 'charcount']
    ];
$scope.create=function(){
    Stamplay.User.currentUser()
    .then(function(res){
        if(res.user){
            //proceed with creation of post
            Stamplay.Object("blogs").save($scope.newPost)
            .then(function(res){
                $timeout(function(){
                    ngToast.create("Post created successfully");
                });
                $state.go('MyBlogs');
            }, function(err){
                $timeout(function(){
                    ngToast.create("An error occurred while creating the post. Please try later");
                });
             
               console.log(err);
            });
        }else{
            //proceed with login
            $state.go('login');
        }
    }, function(err){
        $timeout(function(){
            ngToast.create("An error occurred. Please try later");
        });
     
       console.log(err);
    });
}
});
app.controller('EditCtrl', function($scope, $state, $stateParams, $timeout, ngToast, taOptions){
    $scope.Post={};
    taOptions.toolbar = [
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
        ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear'],
        ['justifyLeft', 'justifyCenter', 'justifyRight', 'indent', 'outdent'],
        ['html', 'insertImage','insertLink', 'insertVideo', 'wordcount', 'charcount']
    ];
    Stamplay.Object("blogs").get({_id: $stateParams.id}) //unique id obtained from the url. this service is provided by angular ui router
    .then(function(res){
  console.log(res);
  $scope.Post=res.data[0];
  $scope.$apply(); //makes sure that view gets updated
  console.log($scope.Post);
    }, function(err){
console.log(err);
    });
    $scope.update=function(){
        Stamplay.User.currentUser()
    .then(function(res){
              if(res.user){
        if(res.user._id== $scope.Post.owner){
              Stamplay.Object("blogs").update($stateParams.id, $scope.Post)
              .then(function(response){
               console.log(response);
               $state.go("MyBlogs");
              }, function(error){
    console.log(error);
              });
        }else{
            $state.go("login");
        }
              }else{
                  $state.go("login");
              }
    }, function(err){
     console.log(err);
    });
}
});
app.filter('htmlToPlainText', function(){
 return function(text){
     return text? String(text).replace(/<[^>]+>/gm,''): '';
 }
});
app.controller('ViewCtrl', function($scope, $state, $stateParams, $timeout, ngToast){
  $scope.upVoteCount=0;
  $scope.downVoteCount=5;
  Stamplay.Object("blogs").get({_id:$stateParams.id})
  .then(function(response){
      console.log(response);
    $scope.blog=response.data[0];
    $scope.upVoteCount=$scope.blog.actions.votes.users_upvote.length;
    $scope.downVoteCount=$scope.blog.actions.votes.users_downvote.length;
    $scope.$apply();
  }, function(err){
      console.log(err);
  });

  $scope.postComment=function(){
      Stamplay.Object("blogs").comment($stateParams.id, $scope.comment)
      .then(function(res){
        console.log(res);
        $scope.blog=res;
        $scope.comment="";
        $scope.$apply();
      }, function(err){
          console.log(err);
          if(err.code==403){
              console.log("Login first!");
              $timeout(function(){
       ngToast.create('<a href="#/login" class="">Please login before posting comments!</a>');
              });
          }
      });
  }
  $scope.upVote=function(){
      Stamplay.Object("blogs").upVote($stateParams.id)
      .then(function(res){
        console.log(res);
        $scope.blog=res;
        $scope.comment="";
        $scope.upVoteCount=$scope.blog.actions.votes.users_upvote.length;
        $scope.$apply();
      }, function(err){
     console.log(err);
     if(err.code==403){
         console.log("Login First!");
         $timeout(function(){
            ngToast.create('<a href="#/login" class="">Please login before posting comments!</a>');
         });
        
     }
     if(err.code==406){
         console.log("Already voted!");
         $timeout(function(){
            ngToast.create("You have already voted on this post");
         });
        
     }
      });
  }

  $scope.downVote=function(){
    Stamplay.Object("blogs").downVote($stateParams.id)
    .then(function(res){
      console.log(res);
      $scope.blog=res;
      $scope.comment="";
      $scope.downVoteCount=$scope.blog.actions.votes.users_downvote.length;
      $scope.$apply();
    }, function(err){
   console.log(err);
   if(err.code==403){
       console.log("Login First!");
       $timeout(function(){
          ngToast.create('<a href="#/login" class="">Please login before posting comments!</a>');
       });
      
   }
   if(err.code==406){
       console.log("Already voted!");
       $timeout(function(){
          ngToast.create("You have already voted on this post");
       });
      
   }
    });
}
});
app.controller('HomeCtrl', function($scope, $http){
Stamplay.Object("blogs").get({sort:"-dt_create"})
.then(function(res){
console.log(res);
$scope.latestBlogs=res.data;
$scope.$apply();
console.log($scope.latestBlogs);
}, function(err){
console.log(err);
});
});
//this state shows posts created by only logged in users
app.controller('MyBlogsCtrl', function($scope, $state){
  Stamplay.User.currentUser()
  .then(function(res){
      if(res.user){
 Stamplay.Object("blogs").get({owner:res.user._id, sort:"-dt_create"})//json object which will display the posts created by
                                                        //the logged in user in reverse chronological order.ie latest post is displayed first 
 .then(function(response){
    $scope.userBlogs=response.data;
    $scope.$apply();
    console.log($scope.userBlogs);
 }, function(err){
     console.log(err);
 });
      }else{
          $state.go('login');
      }
  }, function(err){
       console.log(err);
  });
});
app.controller('MainCtrl', function($scope, $rootScope, $timeout){
$scope.logout=function(){
console.log("logout called");
//Stamplay.User.logout(true, function(){
    localStorage.removeItem('http://127.0.0.1:8080-jwt');
console.log("Logged Out!");
$timeout(function(){
    $rootScope.loggedIn=false;
});
}
});
app.controller('LoginCtrl', function($scope, $state, $timeout, $rootScope, ngToast){
$scope.login=function(){
    Stamplay.User.currentUser()
    .then(function(res){
        console.log(res);
        if(res.user){
            //user already logged in
            //to push it up in the priority stack wrap it in timeout function
            $rootScope.loggedIn=true;
            $rootScope.displayName=res.user.firstName+" "+res.user.lastName;
            $timeout(function(){
               $state.go('MyBlogs');
            });
           
        }else{
            //proceed to login
            Stamplay.User.login($scope.user)
            .then(function(res){
              console.log("logged in" +res);
              $rootScope.loggedIn=true;
              $timeout(function(){
                ngToast.create("Login successful!");
              });
              
              $rootScope.displayName=res.firstName+" "+res.lastName;
              $timeout(function(){
                  $state.go('MyBlogs');
              });
            }, function(err){
               $timeout(function(){
                ngToast.create("Login failed!");
               })
console.log(err);
            })
        }
    }, function(err){
       $timeout(function(){ ngToast.create("An error occurred. Please try again later.");});
        console.log(err);
        $rootScope.loggedIn=false;
    });
}
});
app.controller('SignUpCtrl', function($scope, ngToast){
$scope.newUser={};
$scope.signup= function(){
    $scope.newUser.displayName= $scope.newUser.firstName+" "+$scope.newUser.lastName;
    if($scope.newUser.firstName && $scope.newUser.lastName && $scope.newUser.email && $scope.newUser.password && $scope.newUser.confirmPassword){
        console.log("All fields are valid");
        if($scope.newUser.password==$scope.newUser.confirmPassword){
            console.log("All good! sign in");
            Stamplay.User.signup($scope.newUser)
            .then(function(response){
               $timeout(function(){ ngToast.create("Your account has been created. Please login!");});
                console.log(response);
            }, function(err){
               $timeout(function(){ ngToast.create("An error occurred. Please try again later.");});
                console.log(err);
            });
        }else{
            $timeout(function(){ngToast.create("Passwords do not match");});
            console.log("passwords do not match");
        }
    }else{
       $timeout(function(){ ngToast.create("some fields are invalid");});
        console.log("invalid fields");
    }
}
});

