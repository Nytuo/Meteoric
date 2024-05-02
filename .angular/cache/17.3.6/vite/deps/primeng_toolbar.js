import {
  PrimeTemplate
} from "./chunk-WQXH3QF5.js";
import {
  CommonModule,
  NgClass,
  NgIf,
  NgStyle,
  NgTemplateOutlet
} from "./chunk-2JDBUETV.js";
import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  ElementRef,
  Input,
  NgModule,
  ViewEncapsulation$1,
  setClassMetadata,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵcontentQuery,
  ɵɵdefineComponent,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵelementContainer,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵqueryRefresh,
  ɵɵtemplate
} from "./chunk-CTXW4UYG.js";
import "./chunk-WSA2QMXP.js";
import "./chunk-J4B6MK7R.js";

// node_modules/primeng/fesm2022/primeng-toolbar.mjs
var _c0 = ["*"];
function Toolbar_div_2_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function Toolbar_div_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 4);
    ɵɵtemplate(1, Toolbar_div_2_ng_container_1_Template, 1, 0, "ng-container", 5);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵattribute("data-pc-section", "start");
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r0.startTemplate);
  }
}
function Toolbar_div_3_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function Toolbar_div_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 6);
    ɵɵtemplate(1, Toolbar_div_3_ng_container_1_Template, 1, 0, "ng-container", 5);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵattribute("data-pc-section", "center");
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r0.centerTemplate);
  }
}
function Toolbar_div_4_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function Toolbar_div_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 7);
    ɵɵtemplate(1, Toolbar_div_4_ng_container_1_Template, 1, 0, "ng-container", 5);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵattribute("data-pc-section", "end");
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r0.endTemplate);
  }
}
var Toolbar = class _Toolbar {
  el;
  /**
   * Inline style of the component.
   * @group Props
   */
  style;
  /**
   * Style class of the component.
   * @group Props
   */
  styleClass;
  /**
   * Defines a string value that labels an interactive element.
   * @group Props
   */
  ariaLabelledBy;
  templates;
  startTemplate;
  endTemplate;
  centerTemplate;
  constructor(el) {
    this.el = el;
  }
  getBlockableElement() {
    return this.el.nativeElement.children[0];
  }
  ngAfterContentInit() {
    this.templates.forEach((item) => {
      switch (item.getType()) {
        case "start":
        case "left":
          this.startTemplate = item.template;
          break;
        case "end":
        case "right":
          this.endTemplate = item.template;
          break;
        case "center":
          this.centerTemplate = item.template;
          break;
      }
    });
  }
  static ɵfac = function Toolbar_Factory(t) {
    return new (t || _Toolbar)(ɵɵdirectiveInject(ElementRef));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _Toolbar,
    selectors: [["p-toolbar"]],
    contentQueries: function Toolbar_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, PrimeTemplate, 4);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.templates = _t);
      }
    },
    hostAttrs: [1, "p-element"],
    inputs: {
      style: "style",
      styleClass: "styleClass",
      ariaLabelledBy: "ariaLabelledBy"
    },
    ngContentSelectors: _c0,
    decls: 5,
    vars: 9,
    consts: [["role", "toolbar", 3, "ngClass", "ngStyle"], ["class", "p-toolbar-group-left p-toolbar-group-start", 4, "ngIf"], ["class", "p-toolbar-group-center", 4, "ngIf"], ["class", "p-toolbar-group-right p-toolbar-group-end", 4, "ngIf"], [1, "p-toolbar-group-left", "p-toolbar-group-start"], [4, "ngTemplateOutlet"], [1, "p-toolbar-group-center"], [1, "p-toolbar-group-right", "p-toolbar-group-end"]],
    template: function Toolbar_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef();
        ɵɵelementStart(0, "div", 0);
        ɵɵprojection(1);
        ɵɵtemplate(2, Toolbar_div_2_Template, 2, 2, "div", 1)(3, Toolbar_div_3_Template, 2, 2, "div", 2)(4, Toolbar_div_4_Template, 2, 2, "div", 3);
        ɵɵelementEnd();
      }
      if (rf & 2) {
        ɵɵclassMap(ctx.styleClass);
        ɵɵproperty("ngClass", "p-toolbar p-component")("ngStyle", ctx.style);
        ɵɵattribute("aria-labelledby", ctx.ariaLabelledBy)("data-pc-name", "toolbar");
        ɵɵadvance(2);
        ɵɵproperty("ngIf", ctx.startTemplate);
        ɵɵadvance();
        ɵɵproperty("ngIf", ctx.centerTemplate);
        ɵɵadvance();
        ɵɵproperty("ngIf", ctx.endTemplate);
      }
    },
    dependencies: [NgClass, NgIf, NgTemplateOutlet, NgStyle],
    styles: ["@layer primeng{.p-toolbar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap}.p-toolbar-group-start,.p-toolbar-group-center,.p-toolbar-group-end,.p-toolbar-group-left,.p-toolbar-group-right{display:flex;align-items:center}}\n"],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Toolbar, [{
    type: Component,
    args: [{
      selector: "p-toolbar",
      template: `
        <div [ngClass]="'p-toolbar p-component'" [attr.aria-labelledby]="ariaLabelledBy" [ngStyle]="style" [class]="styleClass" role="toolbar" [attr.data-pc-name]="'toolbar'">
            <ng-content></ng-content>
            <div class="p-toolbar-group-left p-toolbar-group-start" *ngIf="startTemplate" [attr.data-pc-section]="'start'">
                <ng-container *ngTemplateOutlet="startTemplate"></ng-container>
            </div>
            <div class="p-toolbar-group-center" *ngIf="centerTemplate" [attr.data-pc-section]="'center'">
                <ng-container *ngTemplateOutlet="centerTemplate"></ng-container>
            </div>
            <div class="p-toolbar-group-right p-toolbar-group-end" *ngIf="endTemplate" [attr.data-pc-section]="'end'">
                <ng-container *ngTemplateOutlet="endTemplate"></ng-container>
            </div>
        </div>
    `,
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation$1.None,
      host: {
        class: "p-element"
      },
      styles: ["@layer primeng{.p-toolbar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap}.p-toolbar-group-start,.p-toolbar-group-center,.p-toolbar-group-end,.p-toolbar-group-left,.p-toolbar-group-right{display:flex;align-items:center}}\n"]
    }]
  }], () => [{
    type: ElementRef
  }], {
    style: [{
      type: Input
    }],
    styleClass: [{
      type: Input
    }],
    ariaLabelledBy: [{
      type: Input
    }],
    templates: [{
      type: ContentChildren,
      args: [PrimeTemplate]
    }]
  });
})();
var ToolbarModule = class _ToolbarModule {
  static ɵfac = function ToolbarModule_Factory(t) {
    return new (t || _ToolbarModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _ToolbarModule,
    declarations: [Toolbar],
    imports: [CommonModule],
    exports: [Toolbar]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [CommonModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ToolbarModule, [{
    type: NgModule,
    args: [{
      imports: [CommonModule],
      exports: [Toolbar],
      declarations: [Toolbar]
    }]
  }], null, null);
})();
export {
  Toolbar,
  ToolbarModule
};
//# sourceMappingURL=primeng_toolbar.js.map
