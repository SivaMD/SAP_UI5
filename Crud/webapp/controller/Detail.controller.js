sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/FilterType"

], (Controller, History, JSONModel, Filter, FilterOperator, FilterType) => {
	"use strict";

	return Controller.extend("sap.ui.core.tutorial.odatav4.controller.Detail", {

		onInit: function () {
			this.onFindCustomer();
			this.onSaveCustomer();
		},

		onFindCustomer: function () {
			var self = this;
			jQuery.ajax({
				url: "http://localhost:8083/api/v2/customer",
				method: "GET",
				success: function (data) {
					var oModel = new sap.ui.model.json.JSONModel(data);
					self.getView().setModel(oModel, "dataModel");
				},
				error: function (error) {
					console.error("Error loading data:", error);
				}
			});
		},

		onObjectMatched(oEvent) {
			this.getView().bindElement({
				path: "/" + window.decodeURIComponent(oEvent.getParameter("arguments").invoicePath),
				model: "invoice"
			});
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

		onSaveCustomer() {		
			var sCustomerId = this.getView().byId("customerId").getValue();
			var sFirstName = this.getView().byId("firstName").getValue();
			var sLastName = this.getView().byId("lastName").getValue();
			var sEmailId = this.getView().byId("emailId").getValue();
			var sDateOfBirth = this.getView().byId("DP4").getValue();
			var sSex = this.getView().byId("radioGroup").getSelectedButton().getText();
			var sMobileNumber = this.getView().byId("mobileNumber").getValue();			
			var sYearOfExperience = this.getView().byId("box0").getSelectedItem().getText();		
			var sQualification = this.getView().byId("qualification").getValue();
			var sPassedOut = this.getView().byId("box1").getSelectedItem().getText();			
			var sEnglishKnown = this.getView().byId("CheckBox0").getSelected(); 
			var sTamilKnown = this.getView().byId("CheckBox1").getSelected();  
			var sQueries = this.getView().byId("yourTextAreaId").getValue(); 

			// Create an object with the form data
			var oFormData = {
				customerId: sCustomerId,
				firstName: sFirstName,
				lastName: sLastName,
				emailId: sEmailId,
				dateOfBirth: sDateOfBirth,
				sex: sSex,
				mobileNumber: sMobileNumber,
				yearOfExperience: sYearOfExperience,
				qualification: sQualification,
				passedOut: sPassedOut,
				englishKnown: sEnglishKnown,
				tamilKnown: sTamilKnown,
				queries: sQueries
			};

			jQuery.ajax({
				url: "http://localhost:8083/api/v2/customer",
				method: "POST",
				contentType: "application/json",
				data: JSON.stringify(oFormData),
				success: function (response) {
					console.log("Data added successfully:", response);
					const oHistory = History.getInstance();
					const sPreviousHash = oHistory.getPreviousHash();

					if (sPreviousHash !== undefined) {
						window.history.go(-1);
					} else {
						const oRouter = this.getOwnerComponent().getRouter();
						oRouter.navTo("overview", {}, true);
					}
					oModel.refresh();
				},
				error: function (error) {
					console.error("Error adding data:", error);
				}
			});

			// Log the data (you can send it to the backend or perform other actions)
			console.log("Form Data:", oFormData);
		},

		onSaveCustomer: function () {

		},

		onCreate: function () {
			var oList = this.byId("customerList");
			oBinding = oList.getBinding("items");
			oContext = oBinding.create({
				"UserName": "",
				"FirstName": "",
				"LastName": "",
				"Age": "18"
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

		onCreateCustomer: function () {
			const oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("detail");
		},

		onSearch: function () {
			alert("search")
			var oView = this.getView(),
				sValue = oView.byId("searchField").getValue(),
				oFilter = new Filter("LastName", FilterOperator.Contains, sValue);
			oView.byId("customerList").getBinding("items").filter(oFilter, FilterType.Application);
		},

		onFirstNameSearch: function (oEvent) {
			var oView = this.getView(),
				sValue = oEvent.getParameter("newValue"), // Use newValue from liveChange event
				oFilter = new Filter("LastName", FilterOperator.Contains, sValue);
			oView.byId("customerList").getBinding("items").filter(oFilter, FilterType.Application);
		},
	});
});
