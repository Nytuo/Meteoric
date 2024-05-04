import {
  NgModel
} from "./chunk-2KW7VPYM.js";
import {
  CommonModule
} from "./chunk-2JDBUETV.js";
import {
  ChangeDetectorRef,
  Directive,
  ElementRef,
  HostListener,
  NgModule,
  Optional,
  setClassMetadata,
  ɵɵclassProp,
  ɵɵdefineDirective,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵlistener
} from "./chunk-CTXW4UYG.js";

// node_modules/primeng/fesm2022/primeng-inputtext.mjs
var InputText = class _InputText {
  el;
  ngModel;
  cd;
  filled;
  constructor(el, ngModel, cd) {
    this.el = el;
    this.ngModel = ngModel;
    this.cd = cd;
  }
  ngAfterViewInit() {
    this.updateFilledState();
    this.cd.detectChanges();
  }
  ngDoCheck() {
    this.updateFilledState();
  }
  onInput() {
    this.updateFilledState();
  }
  updateFilledState() {
    this.filled = this.el.nativeElement.value && this.el.nativeElement.value.length || this.ngModel && this.ngModel.model;
  }
  static ɵfac = function InputText_Factory(t) {
    return new (t || _InputText)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(NgModel, 8), ɵɵdirectiveInject(ChangeDetectorRef));
  };
  static ɵdir = ɵɵdefineDirective({
    type: _InputText,
    selectors: [["", "pInputText", ""]],
    hostAttrs: [1, "p-inputtext", "p-component", "p-element"],
    hostVars: 2,
    hostBindings: function InputText_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("input", function InputText_input_HostBindingHandler($event) {
          return ctx.onInput($event);
        });
      }
      if (rf & 2) {
        ɵɵclassProp("p-filled", ctx.filled);
      }
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(InputText, [{
    type: Directive,
    args: [{
      selector: "[pInputText]",
      host: {
        class: "p-inputtext p-component p-element",
        "[class.p-filled]": "filled"
      }
    }]
  }], () => [{
    type: ElementRef
  }, {
    type: NgModel,
    decorators: [{
      type: Optional
    }]
  }, {
    type: ChangeDetectorRef
  }], {
    onInput: [{
      type: HostListener,
      args: ["input", ["$event"]]
    }]
  });
})();
var InputTextModule = class _InputTextModule {
  static ɵfac = function InputTextModule_Factory(t) {
    return new (t || _InputTextModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _InputTextModule,
    declarations: [InputText],
    imports: [CommonModule],
    exports: [InputText]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [CommonModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(InputTextModule, [{
    type: NgModule,
    args: [{
      imports: [CommonModule],
      exports: [InputText],
      declarations: [InputText]
    }]
  }], null, null);
})();

export {
  InputText,
  InputTextModule
};
//# sourceMappingURL=chunk-C62SZI2J.js.map
