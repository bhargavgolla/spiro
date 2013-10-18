/// <reference path="typings/angularjs/angular.d.ts" />
/// <reference path="typings/underscore/underscore.d.ts" />
/// <reference path="spiro.models.ts" />
/// <reference path="spiro.angular.viewmodels.ts" />
/// <reference path="spiro.angular.app.ts" />


module Spiro.Angular {


    export interface IHandlers {
        handleCollectionResult($scope): void;
        handleCollection($scope): void;
        handleActionDialog($scope): void;
        handleActionResult($scope): void;
        handleProperty($scope): void;
        handleCollectionItem($scope): void;
        handleError(error: any): void;
        handleServices($scope): void;
        handleService($scope): void;
        handleResult($scope): void;
        handleEditObject($scope): void;
        handleTransientObject($scope): void;
        handleObject($scope): void;
        handleAppBar($scope): void;
    }

    export interface IHandlersInternal extends IHandlers {
        setResult(result: ActionResultRepresentation, dvm?: DialogViewModel);
        setInvokeUpdateError($scope, error: any, vms: ValueViewModel[], vm: MessageViewModel);
        invokeAction($scope, action: Spiro.ActionRepresentation, dvm: DialogViewModel);
        updateObject($scope, object: DomainObjectRepresentation, ovm: DomainObjectViewModel);
        saveObject($scope, object: DomainObjectRepresentation, ovm: DomainObjectViewModel);
    }

    app.service("Handlers", function ($routeParams: ISpiroRouteParams, $location: ng.ILocationService, $q: ng.IQService, $cacheFactory: ng.ICacheFactoryService, RepLoader: IRepLoader, Context: IContext, ViewModelFactory: IViewModelFactory, UrlHelper: IUrlHelper, Color : IColor) {

        var handlers = <IHandlersInternal>this;

        // tested
        handlers.handleCollectionResult = function ($scope) {
            Context.getCollection().
                then(function (list: ListRepresentation) {
                    $scope.collection = ViewModelFactory.collectionViewModel(list);
                    $scope.collectionTemplate = nestedCollectionTemplate;             
                }, function (error) {
                    setError(error);
                });
        };

        // tested
        handlers.handleCollection = function ($scope) {
            Context.getObject($routeParams.dt, $routeParams.id).
                then(function (object: DomainObjectRepresentation) {
                    var collectionDetails = object.collectionMember($routeParams.collection).getDetails();
                    return RepLoader.populate(collectionDetails);
                }).
                then(function (details: CollectionRepresentation) {
                    $scope.collection = ViewModelFactory.collectionViewModel(details);
                    $scope.collectionTemplate = nestedCollectionTemplate;
                }, function (error) {
                    setError(error);
                });
        };

        // tested
        handlers.handleActionDialog = function ($scope) {
           
            Context.getObject($routeParams.sid || $routeParams.dt, $routeParams.id).
                then(function (object: DomainObjectRepresentation) {
                    var actionTarget = object.actionMember(UrlHelper.action()).getDetails();
                    return RepLoader.populate(actionTarget);
                }).
                then(function (action: ActionRepresentation) {
                    if (action.extensions().hasParams) {      
                        $scope.dialog = ViewModelFactory.dialogViewModel(action, <(dvm: DialogViewModel) => void > _.partial(handlers.invokeAction, $scope, action));
                        $scope.dialogTemplate = dialogTemplate;
                    }
                }, function (error) {
                    setError(error);
                });
        };

        // tested
        handlers.handleActionResult = function ($scope) {
            Context.getObject($routeParams.sid || $routeParams.dt, $routeParams.id).
                then(function (object: DomainObjectRepresentation) {
                    var action = object.actionMember(UrlHelper.action());

                    if (action.extensions().hasParams) {
                        var delay = $q.defer();
                        delay.reject();
                        return delay.promise;
                    }
                    var actionTarget = action.getDetails();
                    return RepLoader.populate(actionTarget);
                }).
                then(function (action: ActionRepresentation) {
                    var result = action.getInvoke();
                    return RepLoader.populate(result, true);
                }).
                then(function (result: ActionResultRepresentation) {
                    handlers.setResult(result);
                }, function (error) {
                    if (error) {
                        setError(error);
                    }
                    // otherwise just action with parms 
                });
        };

        // tested
        handlers.handleProperty = function ($scope) {
            Context.getObject($routeParams.dt, $routeParams.id).
                then(function (object: DomainObjectRepresentation) {
                    var propertyDetails = object.propertyMember($routeParams.property).getDetails();
                    return RepLoader.populate(propertyDetails);
                }).
                then(function (details: PropertyRepresentation) {
                    var target = details.value().link().getTarget();
                    return RepLoader.populate(target);
                }).
                then(function (object: DomainObjectRepresentation) {
                    setNestedObject(object, $scope);
                }, function (error) {
                    setError(error);
                });
        };

        //tested
        handlers.handleCollectionItem = function ($scope) {
            var collectionItemTypeKey = $routeParams.collectionItem.split("/");
            var collectionItemType = collectionItemTypeKey[0];
            var collectionItemKey = collectionItemTypeKey[1];

            Context.getNestedObject(collectionItemType, collectionItemKey).
                then(function (object: DomainObjectRepresentation) {
                    setNestedObject(object, $scope);
                }, function (error) {
                    setError(error);
                });
        };

        // tested
        handlers.handleServices = function ($scope) {       
            Context.getServices().
                then(function (services: DomainServicesRepresentation) {
                    $scope.services = ViewModelFactory.servicesViewModel(services);
                    $scope.servicesTemplate = servicesTemplate;
                    Context.setObject(null);
                    Context.setNestedObject(null);
                }, function (error) {
                    setError(error);
                });
        };

        // tested
       handlers.handleService = function ($scope) {      
            Context.getObject($routeParams.sid).
                then(function (service: DomainObjectRepresentation) {
                    $scope.object = ViewModelFactory.serviceViewModel(service);
                    $scope.serviceTemplate = serviceTemplate;
                    $scope.actionTemplate = actionTemplate;           
                }, function (error) {
                    setError(error);
                });

        };

        // tested
        handlers.handleResult = function ($scope) {
           
            var result = $routeParams.resultObject.split("-");
            var dt = result[0];
            var id = result[1];

            Context.getNestedObject(dt, id).
                then(function (object: DomainObjectRepresentation) {
                    $scope.result = ViewModelFactory.domainObjectViewModel(object); // todo rename result
                    $scope.nestedTemplate = nestedObjectTemplate;
                    Context.setNestedObject(object);
                }, function (error) {
                    setError(error);
                });

        };

        // tested
        handlers.handleError = function ($scope) {          
            var error = Context.getError();
            if (error) {
                var evm = ViewModelFactory.errorViewModel(error);
                $scope.error = evm;
                $scope.errorTemplate = errorTemplate;
            }
        };

        // tested
        handlers.handleAppBar = function ($scope) {

            $scope.appBar = {};

            $scope.$on("ajax-change", (event, count) => {
                if (count > 0) {
                    $scope.appBar.loading = "Loading...";
                }
                else {
                    $scope.appBar.loading = "";
                }
            });


            $scope.appBar.template = appBarTemplate;

            $scope.appBar.goHome = "#/";

            $scope.appBar.goBack = function () {
                parent.history.back();

                if ($routeParams.resultObject || $routeParams.resultCollection) {
                    // looking at an action result = so go back two 
                    parent.history.back();
                }
            };

            $scope.appBar.goForward = function () {
                parent.history.forward();
            };

            $scope.appBar.hideEdit = true;

            // TODO create appbar viewmodel 

            if ($routeParams.dt && $routeParams.id) {
                Context.getObject($routeParams.dt, $routeParams.id).
                    then(function (object: DomainObjectRepresentation) {

                        $scope.appBar.hideEdit = !(object) || $routeParams.editMode || false;

                        // rework to use viewmodel code
                       
                        $scope.appBar.doEdit = UrlHelper.toAppUrl($location.path()) + "?editMode=true";
                    });
            }
        };

        //tested
        handlers.handleObject = function ($scope) {
        
            Context.getObject($routeParams.dt, $routeParams.id).
                then(function (object: DomainObjectRepresentation) {
                    Context.setNestedObject(null);
                    $scope.object = ViewModelFactory.domainObjectViewModel(object);
                    $scope.objectTemplate = objectTemplate;
                    $scope.actionTemplate = actionTemplate;
                    $scope.propertiesTemplate = viewPropertiesTemplate;
                }, function (error) {
                    setError(error);
                });

        };

        handlers.handleTransientObject = function ($scope) {

            Context.getTransientObject().
                then(function (object: DomainObjectRepresentation) {

                    if (object) {

                        $scope.backgroundColor = Color.toColorFromType(object.domainType());

                        Context.setNestedObject(null);
                        var obj = ViewModelFactory.domainObjectViewModel(object, null, <(ovm: DomainObjectViewModel) => void> _.partial(handlers.saveObject, $scope, object));
                        obj.cancelEdit =  UrlHelper.toAppUrl(Context.getPreviousUrl()); 

                        $scope.object = obj;
                        $scope.objectTemplate = objectTemplate;
                        $scope.actionTemplate = "";
                        $scope.propertiesTemplate = editPropertiesTemplate;

                    }
                    else {
                        // transient has disappreared - return to previous page 
                        parent.history.back();
                    }

                }, function (error) {
                    setError(error);
                });
        };


        // tested
        handlers.handleEditObject = function ($scope) {

            Context.getObject($routeParams.dt, $routeParams.id).
                then(function (object: DomainObjectRepresentation) {

                    var detailPromises = _.map(object.propertyMembers(), (pm: PropertyMember) => { return RepLoader.populate(pm.getDetails()) });

                    $q.all(detailPromises).then(function (details: PropertyRepresentation[]) {
                        Context.setNestedObject(null);
                        $scope.object = ViewModelFactory.domainObjectViewModel(object, details, <(ovm: DomainObjectViewModel) => void> _.partial(handlers.updateObject, $scope, object));
                        $scope.objectTemplate = objectTemplate;
                        $scope.actionTemplate = "";
                        $scope.propertiesTemplate = editPropertiesTemplate;
                    }, function (error) {
                            setError(error);
                        });

                }, function (error) {
                    setError(error);
                });
        };

        // helper functions 

        function setNestedObject(object: DomainObjectRepresentation, $scope) {
            $scope.result = ViewModelFactory.domainObjectViewModel(object); // todo rename result
            $scope.nestedTemplate = nestedObjectTemplate;
            Context.setNestedObject(object);
        }

        function setError(error) {

            var errorRep: ErrorRepresentation;
            if (error instanceof ErrorRepresentation) {
                errorRep = <ErrorRepresentation>error;
            }
            else {
                errorRep = new ErrorRepresentation({ message: "an unrecognised error has occurred" });
            }
            Context.setError(errorRep);
        }

        // expose for testing 

        handlers.setResult = function (result: ActionResultRepresentation, dvm?: DialogViewModel) {
            if (result.result().isNull() && result.resultType() !== "void") {
                if (dvm) {
                    dvm.message = "no result found";
                }
                return;
            }

            var parms = "";

            // transient object
            if (result.resultType() === "object" && result.result().object().persistLink()) {
                var resultObject = result.result().object();
                var domainType = resultObject.extensions().domainType

                resultObject.set("domainType", domainType );
                resultObject.set("instanceId", "0");
                resultObject.hateoasUrl = "/" + domainType + "/0";

                Context.setTransientObject(resultObject);

                Context.setPreviousUrl($location.path()); 
                $location.path(UrlHelper.toTransientObjectPath(resultObject));
            }

            // persistent object
            if (result.resultType() === "object" && !result.result().object().persistLink()) {
                var resultObject = result.result().object();

                // set the nested object here and then update the url. That should reload the page but pick up this object 
                // so we don't hit the server again. 

                Context.setNestedObject(resultObject);
                parms = UrlHelper.updateParms(resultObject, dvm); 
            }

            if (result.resultType() === "list") {
                var resultList = result.result().list();
                Context.setCollection(resultList);
                parms = UrlHelper.updateParms(resultList, dvm);
            }

            $location.search(parms);
        };

        handlers.setInvokeUpdateError = function ($scope, error: any, vms: ValueViewModel[], vm: MessageViewModel) {
            if (error instanceof ErrorMap) {
                _.each(vms, (vmi) => {
                    var errorValue = error.valuesMap()[vmi.id];

                    if (errorValue) {
                        vmi.value = errorValue.value.toValueString();
                        vmi.message = errorValue.invalidReason;
                    }
                });
                vm.message = (<ErrorMap>error).invalidReason();
            }
            else if (error instanceof ErrorRepresentation) {
                var evm = ViewModelFactory.errorViewModel(error);
                $scope.error = evm;
                $scope.dialogTemplate = errorTemplate;
            }
            else {
                vm.message = error;
            }
        };

        handlers.invokeAction = function ($scope, action: Spiro.ActionRepresentation, dvm: DialogViewModel) {
            dvm.clearMessages();

            var invoke = action.getInvoke();
            invoke.attributes = {}; // todo make automatic 

            var parameters = dvm.parameters;
            _.each(parameters, (parm) => invoke.setParameter(parm.id, parm.getValue()));

            RepLoader.populate(invoke, true).
                then(function (result: ActionResultRepresentation) {
                    handlers.setResult(result, dvm);
                }, function (error: any) {
                    handlers.setInvokeUpdateError($scope, error, parameters, dvm);
                });
        };

        handlers.updateObject = function ($scope, object: DomainObjectRepresentation, ovm: DomainObjectViewModel) {
            var update = object.getUpdateMap();

            var properties = _.filter(ovm.properties, (property) => property.isEditable);
            _.each(properties, (property) => update.setProperty(property.id, property.getValue()));

            RepLoader.populate(update, true, new DomainObjectRepresentation()).
                then(function (updatedObject: DomainObjectRepresentation) {

                    // This is a kludge because updated object has no self link.
                    var rawLinks = (<any>object).get("links");
                    (<any>updatedObject).set("links", rawLinks);

                    // remove pre-changed object from cache
                    $cacheFactory.get('$http').remove(updatedObject.url());

                    Context.setObject(updatedObject);
                    $location.search("");
                }, function (error: any) {
                    handlers.setInvokeUpdateError($scope, error, properties, ovm);
                });
        };

        handlers.saveObject = function ($scope, object: DomainObjectRepresentation, ovm: DomainObjectViewModel) {
            var persist = object.getPersistMap();

            var properties = _.filter(ovm.properties, (property) => property.isEditable);
            _.each(properties, (property) => persist.setMember(property.id, property.getValue()));

            RepLoader.populate(persist, true, new DomainObjectRepresentation()).
                then(function (updatedObject: DomainObjectRepresentation) {

                    Context.setObject(updatedObject);
                    $location.path(UrlHelper.toObjectPath(updatedObject));
                }, function (error: any) {
                    handlers.setInvokeUpdateError($scope, error, properties, ovm);
                });
        };

    });
}