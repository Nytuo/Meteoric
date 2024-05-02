import {
  ObjectUtils
} from "./chunk-WQXH3QF5.js";
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  InputFlags,
  ViewEncapsulation$1,
  booleanAttribute,
  setClassMetadata,
  ɵɵInputTransformsFeature,
  ɵɵStandaloneFeature,
  ɵɵdefineComponent,
  ɵɵprojection,
  ɵɵprojectionDef
} from "./chunk-CTXW4UYG.js";

// node_modules/primeng/fesm2022/primeng-baseicon.mjs
var _c0 = ["*"];
var BaseIcon = class _BaseIcon {
  label;
  spin = false;
  styleClass;
  role;
  ariaLabel;
  ariaHidden;
  ngOnInit() {
    this.getAttributes();
  }
  getAttributes() {
    const isLabelEmpty = ObjectUtils.isEmpty(this.label);
    this.role = !isLabelEmpty ? "img" : void 0;
    this.ariaLabel = !isLabelEmpty ? this.label : void 0;
    this.ariaHidden = isLabelEmpty;
  }
  getClassNames() {
    return `p-icon ${this.styleClass ? this.styleClass + " " : ""}${this.spin ? "p-icon-spin" : ""}`;
  }
  static ɵfac = function BaseIcon_Factory(t) {
    return new (t || _BaseIcon)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _BaseIcon,
    selectors: [["ng-component"]],
    hostAttrs: [1, "p-element", "p-icon-wrapper"],
    inputs: {
      label: "label",
      spin: [InputFlags.HasDecoratorInputTransform, "spin", "spin", booleanAttribute],
      styleClass: "styleClass"
    },
    standalone: true,
    features: [ɵɵInputTransformsFeature, ɵɵStandaloneFeature],
    ngContentSelectors: _c0,
    decls: 1,
    vars: 0,
    template: function BaseIcon_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef();
        ɵɵprojection(0);
      }
    },
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BaseIcon, [{
    type: Component,
    args: [{
      template: ` <ng-content></ng-content> `,
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation$1.None,
      host: {
        class: "p-element p-icon-wrapper"
      }
    }]
  }], null, {
    label: [{
      type: Input
    }],
    spin: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    styleClass: [{
      type: Input
    }]
  });
})();

export {
  BaseIcon
};
//# sourceMappingURL=chunk-ES2WXWOB.js.map
