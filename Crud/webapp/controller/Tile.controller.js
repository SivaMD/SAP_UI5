sap.ui.define(
  [
    "sap/ui/core/mvc/Controller"
  ],
  function (
    Controller
  ) {
    "use strict";

    return Controller.extend("sap.ui.core.tutorial.odatav4.controller.Tile", {
      onPress() {
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter.navTo("user");
      },

      onclick() {
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter.navTo("customer");
      }



    });
  });
