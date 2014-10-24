describe('Query history service', function() {
    var $scope;
    var $cookies;
    var controller;

    beforeEach(module('graphConsole'));

    beforeEach(inject(function($rootScope, $controller) {
        controller = $controller;
        $cookies = {};
        $scope = $rootScope.$new();
    }));

    it('Query history contains only the current command when no cookie is present', function() {
        $scope.command = 'out.path.scatter';
        controller('GremlinCtrl', { $scope: $scope, $cookies: $cookies });
        expect($scope.history.history.length).toBe(1);
        expect($scope.history.history[0]).toBe($scope.command);
    });

    it('Current command is saved to cookie only when it is not identical to prior command in history', function() {
        controller('GremlinCtrl', { $scope: $scope, $cookies: $cookies });
        var svc = $scope.history;

        $scope.command = 'out.path.scatter'; $scope.$apply();
        expect(svc.history.length).toBe(1);

        $scope.command = svc.saveHistory(); $scope.$apply();
        expect(svc.history.length).toBe(2); // the last entry is not yet persisted

        $scope.command = svc.saveHistory(); $scope.$apply();
        expect(svc.history.length).toBe(2); // the last entry is blank, so nothing is saved

        $scope.command = 'has(..)'; $scope.$apply();
        $scope.command = svc.saveHistory(); $scope.$apply();
        expect(svc.history.length).toBe(3);
    });

    it('Query history is stored up to a specified maximum number of elements', function() {
        controller('GremlinCtrl', { $scope: $scope, $cookies: $cookies });
        var svc = $scope.history;
        for(var i = 0; i < svc.maxHistory+10; i++) {
            $scope.command = '' + i;
            $scope.command = svc.saveHistory();
        }
        expect(svc.history.length).toBe(svc.maxHistory + 1); // +1 is current command
    });
});