/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/backbone/backbone.d.ts" />
/// <reference path="typings/backbone/backbone.mine.d.ts" />
/// <reference path="spiro.models.ts" />
/// <reference path="spiro.models.helpers.ts" />

Backbone.EventsMixin = (<any>function () { });
_.extend(Backbone.EventsMixin.prototype, (<any>Backbone).Events);

module Spiro.Modern {

    export interface Presentation extends Backbone.HasEvents {
        element: JQuery;
        draw(errors?: ErrorMap): void;
        draw(models?: Backbone.Model[]): void;
        clear(): void;
    }

    export interface ModernOptions extends Backbone.ViewOptions {
        nest?: bool;
        row?: bool;
        table?: bool;
        list?: bool;
        edit?: bool;
        doNotNavigate?: bool;
        actingController?: Backbone.View; // todo remove 
        controllerEvent?: (controller: Backbone.View) => void;
    }

    export interface PresentationFactory {
        CreatePresentation(model: Backbone.Model, options: ModernOptions): Presentation;
        PagePresentation(model?: Backbone.Model): Presentation;
    }

    export var presentationFactory: PresentationFactory;
}