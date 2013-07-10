var Spiro;
(function (Spiro) {
    (function (Angular) {
        function hashCode(toHash) {
            var hash = 0, i, char;
            if (toHash.length == 0)
                return hash;
            for (i = 0; i < toHash.length; i++) {
                char = toHash.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash;
        }
        ;

        function getColourMapValues(dt) {
            var map = dt ? colourMap[dt] : defaultColour;
            if (!map) {
                var hash = Math.abs(hashCode(dt));
                var index = hash % 18;
                map = defaultColourArray[index];
                colourMap[dt] = map;
            }
            return map;
        }

        function typeFromUrl(url) {
            var typeRegex = /(objects|services)\/([\w|\.]+)/;
            var results = (typeRegex).exec(url);
            return (results && results.length > 2) ? results[2] : "";
        }

        function toColorFromHref(href) {
            var type = typeFromUrl(href);
            return "bg-color-" + getColourMapValues(type)["backgroundColor"];
        }

        function toColorFromType(type) {
            return "bg-color-" + getColourMapValues(type)["backgroundColor"];
        }

        function toAppUrl(href) {
            var urlRegex = /(objects|services)\/(.*)/;
            var results = (urlRegex).exec(href);
            return (results && results.length > 2) ? "#/" + results[1] + "/" + results[2] : "";
        }

        var LinkViewModel = (function () {
            function LinkViewModel() {
            }
            LinkViewModel.create = function (linkRep) {
                var linkViewModel = new LinkViewModel();
                linkViewModel.title = linkRep.title();
                linkViewModel.href = toAppUrl(linkRep.href());
                linkViewModel.color = toColorFromHref(linkRep.href());
                return linkViewModel;
            };
            return LinkViewModel;
        })();
        Angular.LinkViewModel = LinkViewModel;

        var ActionViewModel = (function () {
            function ActionViewModel() {
            }
            ActionViewModel.create = function (actionRep) {
                var actionViewModel = new ActionViewModel();
                actionViewModel.title = actionRep.extensions().friendlyName;
                actionViewModel.href = toAppUrl(actionRep.detailsLink().href());
                return actionViewModel;
            };
            return ActionViewModel;
        })();
        Angular.ActionViewModel = ActionViewModel;

        var PropertyViewModel = (function () {
            function PropertyViewModel() {
            }
            PropertyViewModel.create = function (propertyRep) {
                var propertyViewModel = new PropertyViewModel();
                propertyViewModel.title = propertyRep.extensions().friendlyName;
                propertyViewModel.value = propertyRep.value().toString();
                propertyViewModel.type = propertyRep.isScalar() ? "scalar" : "ref";
                propertyViewModel.returnType = propertyRep.extensions().returnType;
                propertyViewModel.href = toAppUrl(propertyRep.isScalar() ? "" : propertyRep.detailsLink().href());
                propertyViewModel.color = toColorFromType(propertyRep.extensions().returnType);

                return propertyViewModel;
            };
            return PropertyViewModel;
        })();
        Angular.PropertyViewModel = PropertyViewModel;

        var CollectionViewModel = (function () {
            function CollectionViewModel() {
            }
            CollectionViewModel.create = function (collectionRep) {
                var collectionViewModel = new CollectionViewModel();
                collectionViewModel.title = collectionRep.extensions().friendlyName;
                collectionViewModel.size = collectionRep.size();
                collectionViewModel.pluralName = collectionRep.extensions().pluralName;
                return collectionViewModel;
            };
            return CollectionViewModel;
        })();
        Angular.CollectionViewModel = CollectionViewModel;

        var ServicesViewModel = (function () {
            function ServicesViewModel() {
            }
            ServicesViewModel.create = function (servicesRep) {
                var servicesViewModel = new ServicesViewModel();
                var links = servicesRep.value().models;
                servicesViewModel.title = "Services";
                servicesViewModel.color = "bg-color-darkBlue";
                servicesViewModel.items = _.map(links, function (link) {
                    return LinkViewModel.create(link);
                });
                return servicesViewModel;
            };
            return ServicesViewModel;
        })();
        Angular.ServicesViewModel = ServicesViewModel;

        var ServiceViewModel = (function () {
            function ServiceViewModel() {
            }
            ServiceViewModel.create = function (serviceRep) {
                var serviceViewModel = new ServiceViewModel();
                var actions = serviceRep.actionMembers();
                serviceViewModel.serviceId = serviceRep.serviceId();
                serviceViewModel.title = serviceRep.title();
                serviceViewModel.actions = _.map(actions, function (action) {
                    return ActionViewModel.create(action);
                });
                serviceViewModel.color = toColorFromType(serviceRep.serviceId());

                return serviceViewModel;
            };
            return ServiceViewModel;
        })();
        Angular.ServiceViewModel = ServiceViewModel;

        var DomainObjectViewModel = (function () {
            function DomainObjectViewModel() {
            }
            DomainObjectViewModel.create = function (objectRep) {
                var objectViewModel = new DomainObjectViewModel();

                var properties = objectRep.propertyMembers();
                var collections = objectRep.collectionMembers();
                var actions = objectRep.actionMembers();

                objectViewModel.domainType = objectRep.domainType();
                objectViewModel.title = objectRep.title();

                objectViewModel.color = toColorFromType(objectRep.domainType());

                objectViewModel.properties = _.map(properties, function (property) {
                    return PropertyViewModel.create(property);
                });
                objectViewModel.collections = _.map(collections, function (collection) {
                    return CollectionViewModel.create(collection);
                });

                objectViewModel.actions = _.map(actions, function (action) {
                    return ActionViewModel.create(action);
                });

                return objectViewModel;
            };
            return DomainObjectViewModel;
        })();
        Angular.DomainObjectViewModel = DomainObjectViewModel;
    })(Spiro.Angular || (Spiro.Angular = {}));
    var Angular = Spiro.Angular;
})(Spiro || (Spiro = {}));
//@ sourceMappingURL=spiro.angular.viewmodels.js.map