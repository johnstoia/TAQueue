


var app = angular.module('TaqApp', ['ui.bootstrap', 'ngRoute', 'firebase']);
	  var config = {
	    apiKey: "AIzaSyAwgQtuPD0nfS5lMbgge621nEYlK_3k34c",
	    authDomain: "cs436taq-65bef.firebaseapp.com",
	    databaseURL: "https://cs436taq-65bef.firebaseio.com",
	    storageBucket: "cs436taq-65bef.appspot.com",
	    messagingSenderId: "661801305352"
	  };

  	var application = firebase.initializeApp(config);
	var database = application.database();
	var auth = application.auth();
	var storage = application.storage();
	var	queueObject = database.ref().child('class');
	var taNote = database.ref().child('note');
	var classList = database.ref().child('class');
	var teacherList = database.ref().child('teacherList');
	var taList = database.ref().child('taList');

	var provider = new firebase.auth.GoogleAuthProvider();

	app.controller('SignInController', function($scope, $uibModal, SignInHandler, $location, $rootScope){

		application.auth().getRedirectResult().then(function(result) {
		  if (result.credential) {
		    // This gives you a Google Access Token. You can use it to access the Google API.
		    var token = result.credential.accessToken;
		    // ...
		  }
		  // The signed-in user info.
		  var user = result.user;
		  if (user) {
		  	$location.path('/student');
		  	$scope.$apply();

		  }
		}).catch(function(error) {
		  // Handle Errors here.
		  var errorCode = error.code;
		  var errorMessage = error.message;
		  // The email of the user's account used.
		  var email = error.email;
		  // The firebase.auth.AuthCredential type that was used.
		  var credential = error.credential;
		  // ...
		});

		application.auth().onAuthStateChanged(function(user) {
		  if (user) {
		  	$location.path('/student');
		  	$scope.$apply();

		  } else {
		  	application.auth().signInWithRedirect(provider);
		  }
		});

		$scope.signOut = function(){
			$location.path('/signout');
			$scope.$apply();
		}

		

	});

	app.controller('PageController', function($scope){
		var page = 1;

		this.setPage = function(newPage){
			page = newPage;
		}
		this.getPage = function(){
			return page;
		}
	});

	app.controller('TabController', function($scope){
			var tab = 1;

			this.setTab = function(newTab){
				tab = newTab;
			}
			this.getTab = function(){
				return tab;
			}

	});

	app.service("SignInHandler", function(){
		
		var name = "";

		this.setName = function(newName){
			name = newName;
		}

		this.getName = function(){
			return name;
		}

	});


	app.config(['$routeProvider',function($routeProvider){
		$routeProvider
			// route for the student view
			.when("/student", {
				templateUrl : "./pages/student.html",
				controller  : "StudentController",
			})

			// route for the ta view
			.when("/teacher", {
				templateUrl : "./pages/teacher.html",
				controller  : 'TeacherController'
			})
			//route for the teacher view
			.when("/teacher", {
				templateUrl : "./pages/teacher.html",
				controller  : 'TeacherController'
			})
			.when("/signout",{
				templateUrl : "./pages/signout.html",
				controller : 'SignoutController'
			})
	}]);

	app.controller('SignoutController', function($location, $route, $scope, $location){
		$scope.reloadPage = function(){
			application.auth().signOut().then(function() {
			}, function(error) {
			  // An error happened.
			});
		}
	})
	// create the controller and inject Angular's $scope
	app.controller('StudentController', function($scope, $rootScope, SignInHandler, $timeout, $location, $route, $firebaseArray, $firebaseObject, $interval) {

		$scope.students = [];
		$scope.notes = "Look here for TA Notes.";

		var user = application.auth().currentUser;

    	// create a query for the most recent 25 messages on the server
    	var query = classList.orderByChild("timestamp").limitToLast(200);
    	var taQuery = taList.orderByChild("timestamp").limitToLast(200);
    	var teacherQuery = teacherList.orderByChild("timestamp").limitToLast(200);
    	//alert(user.email);
    	var taClassQuery = taList.orderByChild("email").equalTo(user.email).limitToLast(200);
    	
    	$scope.listOfClasses = $firebaseArray(query);
    	$scope.listOfTAs = $firebaseArray(taQuery);
    	$scope.listOfTeachers = $firebaseArray(teacherQuery);
    	$scope.listOfTAClasses = $firebaseArray(taClassQuery);
    	
    	$scope.isTA = false;
    	$scope.studentView = true;
    	$scope.isTA = false;
    	$scope.taView = false;
    	$scope.taList = [];


		$scope.listOfTeachers.$loaded().then(function(data) {

			angular.forEach(data, function(value, key) {
				//alert(value.email);
				if(value.email == user.email){
					$location.path('/teacher');
					$scope.isTA = true;
				}

		 	});
		});




		$scope.listOfTAs.$loaded().then(function(data) {

			angular.forEach(data, function(value, key) {
				//alert(value.email);
				if(value.email == user.email){
					$location.path('/student');
					$scope.isTA = true;
				}

		 	});
		});

    	$scope.$watch('currentClass', function(newValue, oldValue) {
    		    $scope.taView = false;
    			$scope.studentView = true;
    			var classNoteQueue = queueObject.child($scope.currentClass.className);
		  		var queueList = queueObject.child($scope.currentClass.className).child('queue');
		  		var query = queueList.orderByChild("timestamp").limitToLast(100);
		  		var classNote = classNoteQueue.child('note');
	  			$scope.note = $firebaseObject(classNote);
	    		// the $firebaseArray service properly handles database queries as well
	    		$scope.students = $firebaseArray(query);
		});


		$scope.$watch('currentTAClass', function(newValue, oldValue) {
				$scope.taView = true;
    			$scope.studentView = false;
    			var classNoteQueue = queueObject.child($scope.currentTAClass.class);
		  		var queueList = queueObject.child($scope.currentTAClass.class).child('queue');
		  		var query = queueList.orderByChild("timestamp").limitToLast(100);
		  		var classNote = classNoteQueue.child('note');
	  			$scope.note = $firebaseObject(classNote);
	    		// the $firebaseArray service properly handles database queries as well
	    		$scope.students = $firebaseArray(query);
		});

		$interval(function () {
			var user = application.auth().currentUser;
			for(var i = 0; i < $scope.students.length; i++){
					if(user.email === $scope.students[i].email){
						$scope.students[i].time = $scope.students[i].time - 1;
						$scope.students.$save(i);
						if($scope.students[i].time < 1){
							$scope.students[i].time = 0;
							$scope.students.$save(i);
						}
					}
				}
	    }, 1000);

		$scope.calculateStudentWaitTime = function(){
			var studentCount = $scope.students.length;
			var queueTime = studentCount * 300;
			return queueTime;
		}

		$scope.removeSelf = function(){
			var user = application.auth().currentUser;
			if(user == null){
				application.auth().signInWithPopup(provider);
			}
			else{
				for(var i = 0; i < $scope.students.length; i++){
					if(user.email === $scope.students[i].email){
						$scope.students.$remove(i);
					}
				}
			}
		}

		$scope.teacherView = function(){
			$location.path('/teacher');

		}

		$scope.addSelf = function(){

			var user = application.auth().currentUser;
			var queueList = queueObject.child($scope.currentClass.className).child('queue');
			
			if(user == null){
				application.auth().signInWithPopup(provider);
			}
			for(var i = 0; i < $scope.students.length; i++){
				if(user.email === $scope.students[i].email){
					alert("You are already in the queue!");
					return;
				}
			}
			var time = $scope.calculateStudentWaitTime() + 300;

			queueList.push().set({first: user.displayName , email: user.email , time: time});
		}

	});


	app.controller('TeacherController', function($scope, $rootScope, SignInHandler, $timeout, $location, $route, $firebaseArray, $firebaseObject) {
		$scope.message = 'This is the Teacher';
		$scope.className = "";
		$scope.studentName = "";

		var query = classList.orderByChild("timestamp").limitToLast(100);
		$scope.listOfClasses = $firebaseArray(query);

		var teacherQuery = teacherList.orderByChild("timestamp").limitToLast(200);
		$scope.listOfTeachers = $firebaseArray(teacherQuery);
		
		//var taQuery = taList.orderByChild("timestamp").limitToLast(100);

		$scope.addStudent = function(){
			if($scope.studentName == "" || $scope.className == ""){
				alert("Please Enter a Name");
			}
			else{
				taList.push().set({class: $scope.className , email: $scope.studentName});
				alert("Student Email: \n" + $scope.studentName + "\n was added successfully to\n class: " + $scope.className);
			}
		}

		$scope.removeStudent = function(){

			var user = application.auth().currentUser;

			var taQuery = taList.orderByChild("timestamp").limitToLast(100);
			
			$scope.listOfTAs = $firebaseArray(taQuery);

			var isSelf = false;

			$scope.listOfTAs.$loaded().then(function(data) {

				angular.forEach(data, function(value, key) {
					if($scope.removeTAStudent == user.email){
						isSelf = true;
					}
					if(value.email == $scope.removeTAStudent && value.class == $scope.removeTAClass.className && !isSelf){
						$scope.listOfTAs.$remove(key);

					}

			 	});

				if(isSelf){
					alert("You cannot delete yourself!");
				}
				
			});
		}

		$scope.addTeacher = function(){
			if($scope.teacherName == ""){
				alert("Please Enter a Name");
			}
			else{
				teacherList.push().set({email: $scope.teacherEmail, name: $scope.teacherName});
				alert("Teacher Email: \n" + $scope.teacherEmail + "\nwas added successfully");
			}

		}

		$scope.removeTeacher = function(){
			var user = application.auth().currentUser;

			var isSelf = false;

			$scope.listOfTeachers.$loaded().then(function(data) {

				angular.forEach(data, function(value, key) {
					if($scope.removeTeacherEmail == user.email){
						isSelf = true;
					}
					if(value.email == $scope.removeTeacherEmail.email && !isSelf){
						$scope.listOfTeachers.$remove(key);
					}

			 	});

				if(isSelf){
					alert("You cannot delete yourself!");
				}
				
			});

		}

		$scope.$watch('removeTAClass', function(newValue, oldValue){
			$scope.class =  $scope.removeTAClass.className;

			$scope.taDropList = [];

			var taQuery = taList.orderByChild("timestamp").limitToLast(100);
			
			$scope.listOfTAs = $firebaseArray(taQuery);
			
			$scope.listOfTAs.$loaded().then(function(data) {

				angular.forEach(data, function(value, key) {
					//alert(value.email);
					if(value.class == $scope.class){
						//alert(value.email);
						$scope.taDropList.push(value.email);
					}

		 	});
		});

		});
		$scope.$watch('removeTAStudent', function(newValue, oldValue){
			$scope.taList =  $scope.RemoveTAStudent.email;
		});

		$scope.$watch('removeTeacherEmail', function(newValue, oldValue){
			$scope.teacherList =  $scope.removeTeacherEmail.email;
		});

		$scope.$watch('addTAClass', function(newValue, oldValue) {
	  		$scope.className = $scope.addTAClass.className;
	  		//alert($scope.className);
		});


	});

app.filter('secondsToDateTime', [function() {
    return function(seconds) {
        return new Date(1970, 0, 1).setSeconds(seconds);
    };
}])
