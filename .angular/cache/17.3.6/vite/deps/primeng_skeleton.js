import {
  CommonModule,
  NgClass,
  NgStyle
} from "./chunk-2JDBUETV.js";
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  NgModule,
  ViewEncapsulation$1,
  setClassMetadata,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵdefineComponent,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵelement,
  ɵɵproperty
} from "./chunk-CTXW4UYG.js";
import "./chunk-WSA2QMXP.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-J4B6MK7R.js";

// node_modules/primeng/fesm2022/primeng-skeleton.mjs
var Skeleton = class _Skeleton {
  /**
   * Class of the element.
   * @group Props
   */
  styleClass;
  /**
   * Inline style of the element.
   * @group Props
   */
  style;
  /**
   * Shape of the element.
   * @group Props
   */
  shape = "rectangle";
  /**
   * Type of the animation.
   * @gruop Props
   */
  animation = "wave";
  /**
   * Border radius of the element, defaults to value from theme.
   * @group Props
   */
  borderRadius;
  /**
   * Size of the Circle or Square.
   * @group Props
   */
  size;
  /**
   * Width of the element.
   * @group Props
   */
  width = "100%";
  /**
   * Height of the element.
   * @group Props
   */
  height = "1rem";
  containerClass() {
    return {
      "p-skeleton p-component": true,
      "p-skeleton-circle": this.shape === "circle",
      "p-skeleton-none": this.animation === "none"
    };
  }
  containerStyle() {
    if (this.size)
      return __spreadProps(__spreadValues({}, this.style), {
        width: this.size,
        height: this.size,
        borderRadius: this.borderRadius
      });
    else
      return __spreadProps(__spreadValues({}, this.style), {
        width: this.width,
        height: this.height,
        borderRadius: this.borderRadius
      });
  }
  static ɵfac = function Skeleton_Factory(t) {
    return new (t || _Skeleton)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _Skeleton,
    selectors: [["p-skeleton"]],
    hostAttrs: [1, "p-element"],
    inputs: {
      styleClass: "styleClass",
      style: "style",
      shape: "shape",
      animation: "animation",
      borderRadius: "borderRadius",
      size: "size",
      width: "width",
      height: "height"
    },
    decls: 1,
    vars: 7,
    consts: [[3, "ngClass", "ngStyle"]],
    template: function Skeleton_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵelement(0, "div", 0);
      }
      if (rf & 2) {
        ɵɵclassMap(ctx.styleClass);
        ɵɵproperty("ngClass", ctx.containerClass())("ngStyle", ctx.containerStyle());
        ɵɵattribute("data-pc-name", "skeleton")("aria-hidden", true)("data-pc-section", "root");
      }
    },
    dependencies: [NgClass, NgStyle],
    styles: ['@layer primeng{.p-skeleton{position:relative;overflow:hidden}.p-skeleton:after{content:"";animation:p-skeleton-animation 1.2s infinite;height:100%;left:0;position:absolute;right:0;top:0;transform:translate(-100%);z-index:1}.p-skeleton.p-skeleton-circle{border-radius:50%}.p-skeleton-none:after{animation:none}}@keyframes p-skeleton-animation{0%{transform:translate(-100%)}to{transform:translate(100%)}}\n'],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Skeleton, [{
    type: Component,
    args: [{
      selector: "p-skeleton",
      template: ` <div [ngClass]="containerClass()" [class]="styleClass" [ngStyle]="containerStyle()" [attr.data-pc-name]="'skeleton'" [attr.aria-hidden]="true" [attr.data-pc-section]="'root'"></div> `,
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation$1.None,
      host: {
        class: "p-element"
      },
      styles: ['@layer primeng{.p-skeleton{position:relative;overflow:hidden}.p-skeleton:after{content:"";animation:p-skeleton-animation 1.2s infinite;height:100%;left:0;position:absolute;right:0;top:0;transform:translate(-100%);z-index:1}.p-skeleton.p-skeleton-circle{border-radius:50%}.p-skeleton-none:after{animation:none}}@keyframes p-skeleton-animation{0%{transform:translate(-100%)}to{transform:translate(100%)}}\n']
    }]
  }], null, {
    styleClass: [{
      type: Input
    }],
    style: [{
      type: Input
    }],
    shape: [{
      type: Input
    }],
    animation: [{
      type: Input
    }],
    borderRadius: [{
      type: Input
    }],
    size: [{
      type: Input
    }],
    width: [{
      type: Input
    }],
    height: [{
      type: Input
    }]
  });
})();
var SkeletonModule = class _SkeletonModule {
  static ɵfac = function SkeletonModule_Factory(t) {
    return new (t || _SkeletonModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _SkeletonModule,
    declarations: [Skeleton],
    imports: [CommonModule],
    exports: [Skeleton]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [CommonModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SkeletonModule, [{
    type: NgModule,
    args: [{
      imports: [CommonModule],
      exports: [Skeleton],
      declarations: [Skeleton]
    }]
  }], null, null);
})();
export {
  Skeleton,
  SkeletonModule
};
//# sourceMappingURL=primeng_skeleton.js.map
