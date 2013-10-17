var Spiro;
(function (Spiro) {
    /// <reference path="typings/angularjs/angular.d.ts" />
    /// <reference path="typings/underscore/underscore.d.ts" />
    /// <reference path="spiro.models.ts" />
    /// <reference path="spiro.angular.viewmodels.ts" />
    /// <reference path="spiro.angular.app.ts" />
    (function (Angular) {
        Angular.app.service("Handlers", function ($routeParams, $location, $q, $cacheFactory, RepLoader, Context, ViewModelFactory, UrlHelper, Color) {
            var handlers = this;

            // tested
            handlers.handleCollectionResult = function ($scope) {
                Context.getCollection().then(function (list) {
                    $scope.collection = ViewModelFactory.collectionViewModel(list);
                    $scope.collectionTemplate = Angular.nestedCollectionTemplate;
                }, function (error) {
                    setError(error);
                });
            };

            // tested
            handlers.handleCollection = function ($scope) {
                Context.getObject($routeParams.dt, $routeParams.id).then(function (object) {
                    var collectionDetails = object.collectionMember($routeParams.collection).getDetails();
                    return RepLoader.populate(collectionDetails);
                }).then(function (details) {
                    $scope.collection = ViewModelFactory.collectionViewModel(details);
                    $scope.collectionTemplate = Angular.nestedCollectionTemplate;
                }, function (error) {
                    setError(error);
                });
            };

            // tested
            handlers.handleActionDialog = function ($scope) {
                Context.getObject($routeParams.sid || $routeParams.dt, $routeParams.id).then(function (object) {
                    var actionTarget = object.actionMember(UrlHelper.action()).getDetails();
                    return RepLoader.populate(actionTarget);
                }).then(function (action) {
                    if (action.extensions().hasParams) {
                        $scope.dialog = ViewModelFactory.dialogViewModel(action, _.partial(handlers.invokeAction, $scope, action));
                        $scope.dialogTemplate = Angular.dialogTemplate;
                    }
                }, function (error) {
                    setError(error);
                });
            };

            // tested
            handlers.handleActionResult = function ($scope) {
                Context.getObject($routeParams.sid || $routeParams.dt, $routeParams.id).then(function (object) {
                    var action = object.actionMember(UrlHelper.action());

                    if (action.extensions().hasParams) {
                        var delay = $q.defer();
                        delay.reject();
                        return delay.promise;
                    }
                    var actionTarget = action.getDetails();
                    return RepLoader.populate(actionTarget);
                }).then(function (action) {
                    var result = action.getInvoke();
                    return RepLoader.populate(result, true);
                }).then(function (result) {
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
                Context.getObject($routeParams.dt, $routeParams.id).then(function (object) {
                    var propertyDetails = object.propertyMember($routeParams.property).getDetails();
                    return RepLoader.populate(propertyDetails);
                }).then(function (details) {
                    var target = details.value().link().getTarget();
                    return RepLoader.populate(target);
                }).then(function (object) {
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

                Context.getNestedObject(collectionItemType, collectionItemKey).then(function (object) {
                    setNestedObject(object, $scope);
                }, function (error) {
                    setError(error);
                });
            };

            // tested
            handlers.handleServices = function ($scope) {
                Context.getServices().then(function (services) {
                    $scope.services = ViewModelFactory.servicesViewModel(services);
                    $scope.servicesTemplate = Angular.servicesTemplate;
                    Context.setObject(null);
                    Context.setNestedObject(null);
                }, function (error) {
                    setError(error);
                });
            };

            // tested
            handlers.handleService = function ($scope) {
                Context.getObject($routeParams.sid).then(function (service) {
                    $scope.object = ViewModelFactory.serviceViewModel(service);
                    $scope.serviceTemplate = Angular.serviceTemplate;
                    $scope.actionTemplate = Angular.actionTemplate;
                }, function (error) {
                    setError(error);
                });
            };

            // tested
            handlers.handleResult = function ($scope) {
                var result = $routeParams.resultObject.split("-");
                var dt = result[0];
                var id = result[1];

                Context.getNestedObject(dt, id).then(function (object) {
                    $scope.result = ViewModelFactory.domainObjectViewModel(object);
                    $scope.nestedTemplate = Angular.nestedObjectTemplate;
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
                    $scope.errorTemplate = Angular.errorTemplate;
                }
            };

            // tested
            handlers.handleAppBar = function ($scope) {
                $scope.appBar = {};

                $scope.$on("ajax-change", function (event, count) {
                    if (count > 0) {
                        $scope.appBar.loading = "Loading...";
                    } else {
                        $scope.appBar.loading = "";
                    }
                });

                $scope.appBar.template = Angular.appBarTemplate;

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

                if ($routeParams.dt && $routeParams.id) {
                    Context.getObject($routeParams.dt, $routeParams.id).then(function (object) {
                        $scope.appBar.hideEdit = !(object) || $routeParams.editMode || false;

                        // rework to use viewmodel code
                        $scope.appBar.doEdit = UrlHelper.toAppUrl($location.path()) + "?editMode=true";
                    });
                }
            };

            //tested
            handlers.handleObject = function ($scope) {
                Context.getObject($routeParams.dt, $routeParams.id).then(function (object) {
                    Context.setNestedObject(null);
                    $scope.object = ViewModelFactory.domainObjectViewModel(object);
                    $scope.objectTemplate = Angular.objectTemplate;
                    $scope.actionTemplate = Angular.actionTemplate;
                    $scope.propertiesTemplate = Angular.viewPropertiesTemplate;
                }, function (error) {
                    setError(error);
                });
            };

            handlers.handleTransientObject = function ($scope) {
                Context.getTransientObject().then(function (object) {
                    if (object) {
                        $scope.backgroundColor = Color.toColorFromType(object.domainType());

                        Context.setNestedObject(null);
                        var obj = ViewModelFactory.domainObjectViewModel(object, null, _.partial(handlers.saveObject, $scope, object));
                        obj.cancelEdit = UrlHelper.toAppUrl(Context.getPreviousUrl());

                        $scope.object = obj;
                        $scope.objectTemplate = Angular.objectTemplate;
                        $scope.actionTemplate = "";
                        $scope.propertiesTemplate = Angular.editPropertiesTemplate;
                    } else {
                        // transient has disappreared - return to previous page
                        parent.history.back();
                    }
                }, function (error) {
                    setError(error);
                });
            };

            // tested
            handlers.handleEditObject = function ($scope) {
                Context.getObject($routeParams.dt, $routeParams.id).then(function (object) {
                    var detailPromises = _.map(object.propertyMembers(), function (pm) {
                        return RepLoader.populate(pm.getDetails());
                    });

                    $q.all(detailPromises).then(function (details) {
                        Context.setNestedObject(null);
                        $scope.object = ViewModelFactory.domainObjectViewModel(object, details, _.partial(handlers.updateObject, $scope, object));
                        $scope.objectTemplate = Angular.objectTemplate;
                        $scope.actionTemplate = "";
                        $scope.propertiesTemplate = Angular.editPropertiesTemplate;
                    }, function (error) {
                        setError(error);
                    });
                }, function (error) {
                    setError(error);
                });
            };

            // helper functions
            function setNestedObject(object, $scope) {
                $scope.result = ViewModelFactory.domainObjectViewModel(object);
                $scope.nestedTemplate = Angular.nestedObjectTemplate;
                Context.setNestedObject(object);
            }

            function setError(error) {
                var errorRep;
                if (error instanceof Spiro.ErrorRepresentation) {
                    errorRep = error;
                } else {
                    errorRep = new Spiro.ErrorRepresentation({ message: "an unrecognised error has occurred" });
                }
                Context.setError(errorRep);
            }

            // expose for testing
            handlers.setResult = function (result, dvm) {
                if (result.result().isNull() && result.resultType() !== "void") {
                    if (dvm) {
                        dvm.message = "no result found";
                    }
                    return;
                }

                var parms = "";

                if (result.resultType() === "object" && result.result().object().persistLink()) {
                    var resultObject = result.result().object();
                    var domainType = resultObject.extensions().domainType;

                    resultObject.set("domainType", domainType);
                    resultObject.set("instanceId", "0");
                    resultObject.hateoasUrl = "/" + domainType + "/0";

                    Context.setTransientObject(resultObject);

                    Context.setPreviousUrl($location.path());
                    $location.path(UrlHelper.toTransientObjectPath(resultObject));
                }

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

            handlers.setInvokeUpdateError = function ($scope, error, vms, vm) {
                if (error instanceof Spiro.ErrorMap) {
                    _.each(vms, function (vmi) {
                        var errorValue = error.valuesMap()[vmi.id];

                        if (errorValue) {
                            vmi.value = errorValue.value.toValueString();
                            vmi.message = errorValue.invalidReason;
                        }
                    });
                    vm.message = (error).invalidReason();
                } else if (error instanceof Spiro.ErrorRepresentation) {
                    var evm = ViewModelFactory.errorViewModel(error);
                    $scope.error = evm;
                    $scope.dialogTemplate = Angular.errorTemplate;
                } else {
                    vm.message = error;
                }
            };

            handlers.invokeAction = function ($scope, action, dvm) {
                dvm.clearMessages();

                var invoke = action.getInvoke();
                invoke.attributes = {};

                var parameters = dvm.parameters;
                _.each(parameters, function (parm) {
                    return invoke.setParameter(parm.id, parm.getValue());
                });

                RepLoader.populate(invoke, true).then(function (result) {
                    handlers.setResult(result, dvm);
                }, function (error) {
                    handlers.setInvokeUpdateError($scope, error, parameters, dvm);
                });
            };

            handlers.updateObject = function ($scope, object, ovm) {
                var update = object.getUpdateMap();

                var properties = _.filter(ovm.properties, function (property) {
                    return property.isEditable;
                });
                _.each(properties, function (property) {
                    return update.setProperty(property.id, property.getValue());
                });

                RepLoader.populate(update, true, new Spiro.DomainObjectRepresentation()).then(function (updatedObject) {
                    // This is a kludge because updated object has no self link.
                    var rawLinks = (object).get("links");
                    (updatedObject).set("links", rawLinks);

                    // remove pre-changed object from cache
                    $cacheFactory.get('$http').remove(updatedObject.url());

                    Context.setObject(updatedObject);
                    $location.search("");
                }, function (error) {
                    handlers.setInvokeUpdateError($scope, error, properties, ovm);
                });
            };

            handlers.saveObject = function ($scope, object, ovm) {
                var persist = object.getPersistMap();

                var properties = _.filter(ovm.properties, function (property) {
                    return property.isEditable;
                });
                _.each(properties, function (property) {
                    return persist.setMember(property.id, property.getValue());
                });

                RepLoader.populate(persist, true, new Spiro.DomainObjectRepresentation()).then(function (updatedObject) {
                    Context.setObject(updatedObject);
                    $location.path(UrlHelper.toObjectPath(updatedObject));
                }, function (error) {
                    handlers.setInvokeUpdateError($scope, error, properties, ovm);
                });
            };
        });
    })(Spiro.Angular || (Spiro.Angular = {}));
    var Angular = Spiro.Angular;
})(Spiro || (Spiro = {}));
//# sourceMappingURL=spiro.angular.services.handlers.js.map
