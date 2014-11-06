var app = angular.module('nebulaInteractive', [
    'ngRoute',
    'restangular'
]);

app.config(function($routeProvider, RestangularProvider) {
    // 1.  adds a property on the response that represents the "unrestangularized" response
    // 2.  useful when you need to treat the response as a map and iterate over the keys
    // 3.  see https://github.com/mgonto/restangular/issues/100
    RestangularProvider.setResponseExtractor(function(response) {
        var newResponse = response;
        newResponse.pure = angular.copy(response);
        return newResponse
    });

    $routeProvider
        .when('/dependencyVisual', {
            templateUrl : 'partials/dependencyVisual.html',
            controller : 'DependenciesCtrl'
        })
        .otherwise({ redirectTo : '/dependencyVisual' })
});

function isIE() { return ((navigator.appName == 'Microsoft Internet Explorer') || ((navigator.appName == 'Netscape') && (new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent) != null))); }
