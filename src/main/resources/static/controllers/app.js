var app = angular.module('graphConsole', [
    'ngRoute',
    'ngCookies',
    'restangular'/*,
    'cfp.hotkeys'*/
])

app.config(function($routeProvider, RestangularProvider) {
    // 1.  adds a property on the response that represents the "unrestangularized" response
    // 2.  useful when you need to treat the response as a map and iterate over the keys
    // 3.  see https://github.com/mgonto/restangular/issues/100
    RestangularProvider.setResponseExtractor(function(response) {
        var newResponse = response;
        newResponse.pure = angular.copy(response);
        return newResponse
    })

    $routeProvider
        .when('/gremlin', {
            templateUrl : 'partials/gremlin.html',
            controller : 'GremlinCtrl'
        })
        .otherwise({ redirectTo : '/gremlin' })
})

app.directive('uiCodemirror', function($timeout) {
    return {
        restrict: 'A',
        scope: {
            model: '=',
            onEnterKey: '&onEnterKey',
            onUpKey: '&onUpKey',
            onDownKey: '&onDownKey'
        },
        link: function(scope, element) {
            var cm = CodeMirror.fromTextArea(element[0], {
                mode: "text/x-groovy",
                extraKeys: {
                    "Ctrl-Space": "autocomplete",
                    "Up": scope.onUpKey,
                    "Down": scope.onDownKey
                }
            })

            cm.setOption('lineWrapping', true)
            cm.setSize('100%', cm.defaultTextHeight()*3 + 10)

            cm.on("beforeChange", function(cm, change) {
                if (change.text && change.text.length > 1) {
                    // suppress new lines, which are represented in codemirror as ["",""] for some reason...
                    change.update(change.from, change.to, [change.text.join("")]);
                    if(scope.onEnterKey != null)
                        scope.onEnterKey()
                }
            })

            cm.on("changes", function() {
                $timeout(function() {
                    scope.model = cm.getValue()
                    scope.$apply()
                })
            })

            scope.$watch('model', function() {
                if(cm.getValue() != scope.model) {
                    cm.setValue(scope.model)
                    CodeMirror.commands.goDocEnd(cm)
                }
            }, true)
        }
    }
})

app.directive('uiMultiselect', function($timeout){
    return {
        restrict: 'E',
        scope: {
            options: '=',
            affectedList: '='
        },
        template: '<select multiple="multiple" class="multiselect"><option ng-repeat="option in options" ng-value="option">{{option}}</option></select>',
        link: function(scope, element) {
            $timeout(function() { // use $timeout to make sure ng-repeat is REALLY finished
                $(element).children() // select the single `select` element created by the template
                    .multiselect({
                        includeSelectAllOption: true,
                        includeSelectAllDivider: true,
                        selectAllText: 'select all',
                        onChange: function(element, checked) {
                            scope.affectedList = scope.options.filter(function(option) {
                                var htmlOpts = $(element).parent().children()
                                for(var i = 0; i < htmlOpts.length; i++)
                                    if(htmlOpts[i].value == option)
                                        return htmlOpts[i]['selected']
                                return false
                            })
                            scope.$apply() // necessary since this is inside a $timeout call
                        }
                    })
                    .multiselect('select', ['multiselect-all'].concat(scope.options)) // select all by default
            })
        }
    }
})

function isIE() { return ((navigator.appName == 'Microsoft Internet Explorer') || ((navigator.appName == 'Netscape') && (new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent) != null))); }