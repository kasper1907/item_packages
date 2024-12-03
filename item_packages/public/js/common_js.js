/*
                  
              args = {
                  "item_code": itemdoc.item_code,
                  "warehouse": None,
                  "customer": doc.customer,
                  "company":doc.company,
                  "conversion_rate": 1.0,
                  "selling_price_list": doc.selling_price_list,
                  "price_list_currency":doc.price_list_currency,
                  "plc_conversion_rate": 1.0,
                  "doctype": "Sales Order",
                  "name": "",
                  "supplier": None,
                  "transaction_date": None,
                  "conversion_rate": 1.0,
                  "buying_price_list": None,
                  "ignore_pricing_rule": doc.ignore_pricing_rule,
                  "project":doc.project,
                  "set_warehouse": doc.set_warehouse
              }
                  */

// [
//   "Sales Order",
//   "Sales Invoice",
//   "Delivery Note",
//   "Opportunity",
//   "Quotation",
// ].forEach((doctype) => {

// });
let common_script = {
    // refresh: function(frm) {
  
    // }
    get_packages_items: function (frm) {
  
      frm.doc.items = frm.doc.items.filter((x) => !x.package);
      (frm.doc.packages || []).forEach((package_row) => {
        package_row.qty = package_row.qty || 0;
        if (package_row.qty && package_row.package) {
          frappe.db
            .get_doc("Item Package", package_row.package)
            .then((package_detials) => {
              (package_detials.items || []).forEach(async (detail) => {
                // q
                let item = frm.add_child("items", {
                  item_code: detail.item_code,
                  qty: detail.qty * package_row.qty,
                  uom: detail.uom,
                  description: detail.description,
                  package: package_row.package,
                  discount_percent: detail.discount_percent,
                });
                await frm.script_manager.trigger(
                  "item_code",
                  item.doctype,
                  item.name
                );
                item.package = package_row.package;
                // item.rate = item.rate * detail.discount_percent /100
                item.discount_percent = detail.discount_percent;
                // alert(package_row.discount_percent)
                console.log(detail.discount_percent, item.rate);
                // console.log(detail)
  
                await frm.script_manager.trigger(
                  "discount_percent",
                  item.doctype,
                  item.name
                );
                console.log(detail.discount_percent, item.rate);
              });
              package_row.discount_percent = package_detials.discount_percent;
  
              frm.refresh_fields(["items", "packages"]);
              frm.refresh();
            });
        }
      });
      
    },
  
  };
  
  
  frappe.ui.form.on("Opportunity", common_script);
  frappe.ui.form.on("Quotation", common_script);
  frappe.ui.form.on("Sales Order", common_script);
  frappe.ui.form.on("Sales Invoice", common_script);
  frappe.ui.form.on("Delivery Note", common_script);
  
  frappe.ui.form.on("Item Packages Detail", {
    add_discount(frm, cdt, cdn) {
      let row = locals[cdt][cdn];
      if (!row.discount_percent) {
        return;
      }
      if (row.discount_is_added) {
        frappe.throw(__("Discount is added before for this package"));
      }
      (frm.doc.items || []).forEach(async (item) => {
        if (item.package == row.package) {
          item.rate = item.rate - (item.rate * row.discount_percent) / 100;
  
          await frm.script_manager.trigger("rate", item.doctype, item.name);
          row.discount_is_added = 1;
          frappe.model.set_value(cdt, cdn, "discount_is_added", row.discount_is_added);
        }
      });
  
      frm.refresh_fields(["items", "packages"]);
      frm.refresh();
    },
  });
  