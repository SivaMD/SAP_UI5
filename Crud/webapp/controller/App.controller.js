sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Sorter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/FilterType",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History"
  ],
  function (
    Controller,
    MessageToast,
    MessageBox,
    Sorter,
    Filter,
    FilterOperator,
    FilterType,
    JSONModel,
    History
  ) {
    "use strict";

    return Controller.extend("sap.ui.core.tutorial.odatav4.controller.App", {
      /**
       *  Hook for initializing the controller
       */
      onInit: function () {
        var oMessageManager = sap.ui.getCore().getMessageManager(),
          oMessageModel = oMessageManager.getMessageModel(),
          oMessageModelBinding = oMessageModel.bindList(
            "/",
            undefined,
            [],
            new Filter("technical", FilterOperator.EQ, true)
          ),
          oViewModel = new JSONModel({
            busy: false,
            hasUIChanges: false,
            usernameEmpty: false,
            order: 0,
          });
        this.getView().setModel(oViewModel, "appView");
        this.getView().setModel(oMessageModel, "message");

        oMessageModelBinding.attachChange(this.onMessageBindingChange, this);
        this._bTechnicalErrors = false;
      },

      onCreate : function () {
        var oList = this.byId("peopleList"),
          oBinding = oList.getBinding("items"),
          oContext = oBinding.create({
            "UserName" : "",
            "FirstName" : "",
            "LastName" : "",
            "Age" : "18"
          });
  
        this._setUIChanges();
        this.getView().getModel("appView").setProperty("/usernameEmpty", true);
  
        oList.getItems().some(function (oItem) {
          if (oItem.getBindingContext() === oContext) {
            oItem.focus();
            oItem.setSelected(true);
            return true;
          }
        });
      },

      onRefresh: function () {
        var oBinding = this.byId("peopleList").getBinding("items");

        if (oBinding.hasPendingChanges()) {
          MessageBox.error(this._getText("refreshNotPossibleMessage"));
          return;
        }
        oBinding.refresh();
        MessageToast.show(this._getText("refreshSuccessMessage"));
      },

      onSave : function () {
        var fnSuccess = function () {
          this._setBusy(false);
          MessageToast.show(this._getText("changesSentMessage"));
          this._setUIChanges(false);
        }.bind(this);
  
        var fnError = function (oError) {
          this._setBusy(false);
          this._setUIChanges(false);
          MessageBox.error(oError.message);
        }.bind(this);
  
        this._setBusy(true); // Lock UI until submitBatch is resolved.
        this.getView().getModel().submitBatch("peopleGroup").then(fnSuccess, fnError);
        this._bTechnicalErrors = false; // If there were technical errors, a new save resets them.
      },
      onDelete : function () {
		    var oContext,
		        oSelected = this.byId("peopleList").getSelectedItem(),
		        sUserName;
 
		    if (oSelected) {
		        oContext = oSelected.getBindingContext();
		        sUserName = oContext.getProperty("UserName");
		        oContext.delete().then(function () {
		            MessageToast.show(this._getText("deletionSuccessMessage", sUserName));
		        }.bind(this), function (oError) {
		            this._setUIChanges();
		            if (oError.canceled) {
		                MessageToast.show(this._getText("deletionRestoredMessage", sUserName));
		                return;
		            }
		            MessageBox.error(oError.message + ": " + sUserName);
		        }.bind(this));
		        this._setUIChanges(true);
		    }
		},
      onSort: function () {
        var oView = this.getView(),
          aStates = [undefined, "asc", "desc"],
          aStateTextIds = ["sortNone", "sortAscending", "sortDescending"],
          sMessage,
          iOrder = oView.getModel("appView").getProperty("/order");

        iOrder = (iOrder + 1) % aStates.length;
        var sOrder = aStates[iOrder];

        oView.getModel("appView").setProperty("/order", iOrder);
        oView
          .byId("peopleList")
          .getBinding("items")
          .sort(sOrder && new Sorter("LastName", sOrder === "desc"));

        sMessage = this._getText("sortMessage", [
          this._getText(aStateTextIds[iOrder]),
        ]);
        MessageToast.show(sMessage);
      },
      _setUIChanges : function (bHasUIChanges) {
        if (this._bTechnicalErrors) {
          // If there is currently a technical error, then force 'true'.
          bHasUIChanges = true;
        } else if (bHasUIChanges === undefined) {
          bHasUIChanges = this.getView().getModel().hasPendingChanges();
        }
        var oModel = this.getView().getModel("appView");
        oModel.setProperty("/hasUIChanges", bHasUIChanges);
      },

      _getText: function (sTextId, aArgs) {
        return this.getOwnerComponent()
          .getModel("i18n")
          .getResourceBundle()
          .getText(sTextId, aArgs);
      },

      onPress() {
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter.navTo("detail");
      },

      onMessageBindingChange : function (oEvent) {
        var aContexts = oEvent.getSource().getContexts(),
          aMessages,
          bMessageOpen = false;
  
        if (bMessageOpen || !aContexts.length) {
          return;
        }
  
        // Extract and remove the technical messages
        aMessages = aContexts.map(function (oContext) {
          return oContext.getObject();
        });
        sap.ui.getCore().getMessageManager().removeMessages(aMessages);
  
        this._setUIChanges(true);
        this._bTechnicalErrors = true;
        MessageBox.error(aMessages[0].message, {
          id : "serviceErrorMessageBox",
          onClose : function () {
            bMessageOpen = false;
          }
        });
  
        bMessageOpen = true;
      },

      onResetChanges : function () {
        this.byId("peopleList").getBinding("items").resetChanges();
        this._bTechnicalErrors = false; 
        this._setUIChanges();
      },

      onInputChange : function (oEvt) {
        if (oEvt.getParameter("escPressed")) {
          this._setUIChanges();
        } else {
          this._setUIChanges(true);
          if (oEvt.getSource().getParent().getBindingContext().getProperty("UserName")) {
            this.getView().getModel("appView").setProperty("/usernameEmpty", false);
          }
        }
      },

      onNavBack() {
        const oHistory = History.getInstance();
        const sPreviousHash = oHistory.getPreviousHash();
  
        if (sPreviousHash !== undefined) {
          window.history.go(-1);
        } else {
          const oRouter = this.getOwnerComponent().getRouter();
          oRouter.navTo("overview", {}, true);
        }
      },
      onSearch : function () {
        var oView = this.getView(),
          sValue = oView.byId("searchField").getValue(),
          oFilter = new Filter("LastName", FilterOperator.Contains, sValue);
  
        oView.byId("peopleList").getBinding("items").filter(oFilter, FilterType.Application);
      },
      onFirstNameSearch: function (oEvent) {
        var oView = this.getView(),
            sValue = oEvent.getParameter("newValue"), // Use newValue from liveChange event
            oFilter = new Filter("LastName", FilterOperator.Contains, sValue);
        oView.byId("peopleList").getBinding("items").filter(oFilter, FilterType.Application);
    },

    onCreateCustomer: function(){
      const oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("detail");
    },
  //   onPopupCreateCustomer: function(){
  //     var oTable = new sap.m.Table("stockTable", {
  //       columns: [
  //          new sap.m.Column({ header: new sap.m.Label({ text: "Select" }) }),
  //          new sap.m.Column({ header: new sap.m.Label({ text: "Product Quantity" }) }),
  //          new sap.m.Column({ header: new sap.m.Label({ text: "Product Code" }) }),
  //          new sap.m.Column({ header: new sap.m.Label({ text: "Location" }) }),
  //          new sap.m.Column({ header: new sap.m.Label({ text: "Zip Code" }) })
  //       ]
  //    });
  //    var oTemplate = new sap.m.ColumnListItem({
  //     cells: [
  //        new sap.m.Text({ text: "{productQuantity}" }),
  //        new sap.m.Text({ text: "{productCode}" }),
  //        new sap.m.Text({ text: "{location}" }),
  //        new sap.m.Text({ text: "{zipCode}" })
  //     ]
  //  });

  //  var oModel = new sap.ui.model.json.JSONModel();
  //     var oFlexBox = new sap.m.FlexBox({
  //       justifyContent: sap.m.FlexJustifyContent.End,

  //       items: [
  //          oTable,
  //          new sap.m.Button({
  //             text: "Create Form",
  //             press: function () {
  //                var oFormDialog = new sap.m.Dialog({
  //                   title: "Stock Form",
  //                   content: new sap.ui.layout.form.SimpleForm({
  //                      layout: sap.ui.layout.form.SimpleFormLayout.ResponsiveGridLayout,
  //                      content: [
  //                         new sap.m.Label({ text: "Product Quantity" }),
  //                         new sap.m.Input({ value: "", placeholder: "Enter Product Quantity" }),

  //                         new sap.m.Label({ text: "Product Code" }),
  //                         new sap.m.Input({ value: "", placeholder: "Enter Product Code" }),

  //                         new sap.m.Label({ text: "Location" }),
  //                         new sap.m.Input({ value: "", placeholder: "Enter Location" }),

  //                         new sap.m.Label({ text: "Zip Code" }),
  //                         new sap.m.Input({ value: "", placeholder: "Enter Zip Code" }),
  //                      ]
  //                   })
  //                 })
  //      }
  //      })
  //             ]
  //           })
  //   },

      _setBusy : function (bIsBusy) {
        var oModel = this.getView().getModel("appView");
        oModel.setProperty("/busy", bIsBusy);
      }



    });
  }
);
