(function (angular) {
    "use strict";
    angular.module('mc.directive.singleselect', [])
        .directive('singleselect', function () {
            return {
                restrict: 'E',
                templateUrl: MapasCulturais.templateUrl.singleselect,
                scope: {
                    'name': '@',
                    'value': '=',
                    'terms': '=',
                    'allowOther': '@',
                    'allowOtherText': '@',
                },
                link: function ($scope, element, attribute) {
                    function sanitize(term){
                        if(!term){
                            term = '';
                        }
                        return term.trim();
                    }

                    $scope.data = {
                        name: $scope.name,
                        value: $scope.value,
                        terms: $scope.terms,
                        allowOther: $scope.allowOther,
                        allowOtherText: $scope.allowOtherText
                    };

                    $scope.clickOther = function(){
                        if(sanitize($scope.data.value) === '' || $scope.terms[sanitize($scope.data.value)]){
                            $scope.data.value = '';
                            $scope.data.showOther = true;
                        }
                    };

                    if($scope.data.value && !$scope.terms[sanitize($scope.data.value)]){
                        $scope.data.showOther = true;
                    }

                    $scope.notOther = function(){
                        $scope.data.showOther = false;
                    };

                    $scope.$watch('data.value', function(a,b){ 
                        $scope.value = $scope.data.value;
                    });
                }
            };
        });
})(angular);