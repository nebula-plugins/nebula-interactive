function QueryHistory($scope, $cookies) {
    var self = this

    this.history = loadHistoryFromCookie()
    this.history.push($scope.command)

    this.historyIndex = this.history.length-1

    this.defaultCommand = ''
    this.maxHistory = 30

    function loadHistoryFromCookie() {
        return $cookies.queryHistory ? $cookies.queryHistory.split("|||") : []
    }

    this.saveHistory = function() {
        var newHistory = d3.set(loadHistoryFromCookie())

        // we want to ensure that the last executed command is always latest in history
        newHistory.remove($scope.command) // remove any prior incarnations of command
        if($scope.command.length > 0)
            newHistory.add($scope.command) // add the command to the end of history

        this.history = newHistory.values()
        if(this.history.length > this.maxHistory)
            this.history.shift()

        $cookies.queryHistory = this.history.join("|||")

        this.history.push(this.defaultCommand)

        this.historyIndex = this.history.length-1

        return this.defaultCommand
    }

    $scope.previousQuery = function() {
        if(self.historyIndex > 0) {
            self.historyIndex--
            $scope.command = self.history[self.historyIndex]
            $scope.$apply()
        }
    }

    $scope.nextQuery = function() {
        if(self.historyIndex < self.history.length - 1) {
            self.historyIndex++
            $scope.command = self.history[self.historyIndex]
            $scope.$apply()
        }
    }

    $scope.$watch('command', function() {
        self.history[self.historyIndex] = $scope.command
    }, true)
}