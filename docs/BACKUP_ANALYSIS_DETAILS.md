# 📊 تفاصيل تحليل قاعدة البيانات الاحتياطية (Backup Database Analysis Details)
هذا المستند يحتوي على جرد كامل لكافة الجداول وأسماء الأعمدة وعدد السجلات الموجودة داخل ملف النسخة الاحتياطية المرفوع من المستخدم:
**اسم الملف:** `حفظ نسخة إحتياطية-10-06-2026.sqlite` (19.99 ميجابايت)

---

## 1. إحصائيات عامة
* **محرك قاعدة البيانات:** SQLite 3 (وجدت ترويسة `SQLite format 3`)
* **إجمالي عدد الجداول المكتشفة:** 84 جدولاً.
* **إجمالي الجداول النشطة (باستثناء الجداول المرجعية والداخلية):** 81 جدولاً.

---

## 2. كشف الجداول وعدد السجلات والأعمدة التفصيلي

| # | اسم الجدول (Table Name) | عدد السجلات (Row Count) | الأعمدة والأنواع (Columns & Data Types) |
|---|-------------------------|-------------------------|-----------------------------------------|
| 1 | **`account_tree`** | 34 | `id` (INTEGER), `name` (TEXT), `parent_id` (INTEGER), `p` (INTEGER), `cus_id` (INTEGER), `admin` (INTEGER), `online` (INTEGER), `online_ref2` (TEXT) |
| 2 | **`account_tree_type`** | 2 | `id` (INTEGER), `name` (TEXT) |
| 3 | **`act_req`** | 0 | `imei` (TEXT), `aid` (TEXT), `name` (TEXT), `phone` (TEXT), `country` (TEXT), `email` (TEXT), `status` (INTEGER), `date_` (TEXT), `reply` (TEXT), `user_reply` (TEXT), `reply_from` (TEXT) |
| 4 | **`adj_type`** | 4 | `id` (INTEGER), `name` (TEXT), `acc_id` (INTEGER), `in_` (INTEGER) |
| 5 | **`android_metadata`** | 1 | `locale` (TEXT) |
| 6 | **`app_ver`** | 15 | `name` (TEXT), `date_` (TEXT) |
| 7 | **`bill_transactions`** | 29906 | `bill_id` (INTEGER), `item_id` (INTEGER), `item_type_id` (INTEGER), `curr_id` (INTEGER), `qty` (INTEGER), `cost_price` (REAL), `sls_u_price` (REAL), `d_amount` (REAL), `param1` (TEXT), `param2` (TEXT), `param3` (TEXT), `cash_id` (INTEGER), `remark` (TEXT), `unit_id` (INTEGER), `u_val` (REAL), `base_unit` (INTEGER), `qty_pr` (REAL), `qty_t` (TEXT), `u_cost2` (REAL), `date_` (TEXT), `e_date` (TEXT) |
| 8 | **`bill_transactions2`** | 331 | `bill_id` (INT), `item_id` (INT), `item_type_id` (INT), `curr_id` (INT), `qty` (INT), `cost_price` (REAL), `sls_u_price` (REAL), `d_amount` (REAL), `param1` (TEXT), `param2` (TEXT), `param3` (TEXT), `cash_id` (INT), `remark` (TEXT), `unit_id` (INT), `u_val` (REAL), `base_unit` (INT), `qty_pr` (REAL), `qty_t` (TEXT), `u_cost2` (REAL), `e_date` (TEXT), `date_` (TEXT) |
| 9 | **`bill_transactions2_h`** | 325 | `bill_id` (INT), `item_id` (INT), `item_type_id` (INT), `curr_id` (INT), `qty` (INT), `cost_price` (REAL), `sls_u_price` (REAL), `d_amount` (REAL), `param1` (TEXT), `param2` (TEXT), `param3` (TEXT), `cash_id` (INT), `remark` (TEXT), `unit_id` (INT), `u_val` (REAL), `base_unit` (INT), `qty_pr` (REAL), `qty_t` (TEXT), `u_cost2` (REAL), `e_date` (TEXT), `date_` (TEXT) |
| 10 | **`bill_transactions_h`** | 60936 | `bill_id` (INT), `item_id` (INT), `item_type_id` (INT), `curr_id` (INT), `qty` (INT), `cost_price` (REAL), `sls_u_price` (REAL), `d_amount` (REAL), `param1` (TEXT), `param2` (TEXT), `param3` (TEXT), `cash_id` (INT), `remark` (TEXT), `unit_id` (INT), `u_val` (REAL), `base_unit` (INT), `qty_pr` (REAL), `qty_t` (TEXT), `u_cost2` (REAL), `date_` (TEXT), `e_date` (TEXT) |
| 11 | **`bill_type`** | 3 | `id` (INTEGER), `name` (TEXT), `param1` (TEXT), `param2` (TEXT) |
| 12 | **`bills`** | 7614 | `id` (INTEGER), `date_` (TEXT), `remarks` (TEXT), `bill_no` (TEXT), `curr_id` (INTEGER), `bill_type` (INTEGER), `tr_type` (INTEGER), `is_back` (INTEGER), `br_id` (INTEGER), `cus_id` (INTEGER), `tran_status` (INTEGER), `to_br_id` (INTEGER), `amount` (REAL), `d_amount` (REAL), `tax_amount` (REAL), `param1` (TEXT), `param2` (TEXT), `param3` (TEXT), `curr_price` (REAL), `bill_no2` (INTEGER), `cash_id` (INTEGER), `adj_id` (INTEGER), `adj_acc` (INTEGER), `curr_mod` (INTEGER), `discount_id` (INTEGER), `d_val` (REAL), `online` (INTEGER), `online_ref` (INTEGER), `tax_id` (INTEGER), `t_val` (REAL), `time_` (TEXT), `cost2` (REAL), `cost_id` (INTEGER), `r_cost` (REAL), `paid_amount` (REAL), `id2` (INTEGER), `user_id` (INTEGER), `last_user` (INTEGER), `last_update` (TEXT), `online_ref2` (TEXT) |
| 13 | **`bills2`** | 2 | `id` (INT), `date_` (TEXT), `remarks` (TEXT), `bill_no` (TEXT), `curr_id` (INT), `bill_type` (INT), `tr_type` (INT), `is_back` (INT), `br_id` (INT), `cus_id` (INT), `tran_status` (INT), `to_br_id` (INT), `amount` (REAL), `d_amount` (REAL), `tax_amount` (REAL), `param1` (TEXT), `param2` (TEXT), `param3` (TEXT), `curr_price` (REAL), `bill_no2` (INT), `cash_id` (INT), `adj_id` (INT), `adj_acc` (INT), `curr_mod` (INT), `discount_id` (INT), `d_val` (REAL), `online` (INTEGER), `online_ref` (INTEGER), `time_` (TEXT), `t_val` (REAL), `user_id` (INTEGER), `last_user` (INTEGER), `last_update` (TEXT), `online_ref2` (TEXT) |
| 14 | **`bills2_h`** | 1 | `id` (INT), `date_` (TEXT), `remarks` (TEXT), `bill_no` (TEXT), `curr_id` (INT), `bill_type` (INT), `tr_type` (INT), `is_back` (INT), `br_id` (INT), `cus_id` (INT), `tran_status` (INT), `to_br_id` (INT), `amount` (REAL), `d_amount` (REAL), `tax_amount` (REAL), `param1` (TEXT), `param2` (TEXT), `param3` (TEXT), `curr_price` (REAL), `bill_no2` (INT), `cash_id` (INT), `adj_id` (INT), `adj_acc` (INT), `curr_mod` (INT), `discount_id` (INT), `d_val` (REAL), `online` (INT), `online_ref` (INT), `time_` (TEXT), `t_val` (REAL), `user_id` (INT), `last_user` (INT), `last_update` (TEXT), `online_ref2` (TEXT) |
| 15 | **`bills_h`** | 14001 | `id` (INT), `date_` (TEXT), `remarks` (TEXT), `bill_no` (TEXT), `curr_id` (INT), `bill_type` (INT), `tr_type` (INT), `is_back` (INT), `br_id` (INT), `cus_id` (INT), `tran_status` (INT), `to_br_id` (INT), `amount` (REAL), `d_amount` (REAL), `tax_amount` (REAL), `param1` (TEXT), `param2` (TEXT), `param3` (TEXT), `curr_price` (REAL), `bill_no2` (INT), `cash_id` (INT), `adj_id` (INT), `adj_acc` (INT), `curr_mod` (INT), `discount_id` (INT), `d_val` (REAL), `online` (INT), `online_ref` (INT), `tax_id` (INT), `t_val` (REAL), `time_` (TEXT), `cost2` (REAL), `cost_id` (INT), `r_cost` (REAL), `paid_amount` (REAL), `id2` (INT), `user_id` (INT), `last_user` (INT), `last_update` (TEXT), `online_ref2` (TEXT) |
| 16 | **`bills_log`** | 6 | `id` (INT), `bill_no2` (INT), `date_` (TEXT), `tr_type` (INT), `type_` (TEXT), `bill_type` (INT), `bill_type_name` (TEXT), `cus_name` (TEXT), `amount` (), `amount2` (), `diff` (), `d_amount` (REAL), `tax_amount` (REAL), `d_val` (REAL), `discount_id` (INT), `t_val` (REAL), `tax_id` (INT), `tax_amount2` (), `d_amount2` (), `cost2` (REAL), `r_cost` (REAL) |
| 17 | **`branches`** | 3 | `id` (INTEGER), `name` (TEXT), `date_` (TEXT), `IS_ACTIVE` (INTEGER), `ADDRESS` (TEXT), `gsm` (TEXT), `remarks` (TEXT), `param1` (TEXT), `param2` (TEXT), `online` (INTEGER), `online_ref2` (TEXT) |
| 18 | **`chat_rooms`** | 0 | `chat_room_id` (INTEGER), `name` (TEXT), `level_` (INTEGER), `last_msg` (TEXT), `created_at` (TEXT) |
| 19 | **`closing_year`** | 1 | `id` (INTEGER), `date_` (TEXT), `cnt` (REAL), `now_` (TEXT), `online` (INTEGER), `online_ref2` (TEXT) |
| 20 | **`contacts`** | 8 | `id` (INTEGER), `name` (TEXT), `type_` (INTEGER), `sort_id` (INTEGER) |
| 21 | **`currency`** | 3 | `id` (INTEGER), `name` (TEXT), `curr_type` (INTEGER), `param1` (TEXT), `param2` (TEXT), `fils_name` (TEXT), `code_name` (TEXT), `online` (INTEGER), `online_ref` (INTEGER), `online_ref2` (TEXT) |
| 22 | **`currency_price`** | 4 | `id` (INTEGER), `curr_id` (INTEGER), `f_date` (TEXT), `t_date` (TEXT), `price` (REAL), `is_new` (INTEGER), `param1` (TEXT), `param2` (TEXT), `online` (INTEGER), `online_ref2` (TEXT) |
| 23 | **`currency_price_temp`** | 0 | `id` (INTEGER), `curr_id` (INTEGER), `price` (REAL), `param1` (TEXT), `param2` (TEXT) |
| 24 | **`current_closing_balance`** | 1 | `id` (INTEGER), `date_` (TEXT), `updated` (INTEGER) |
| 25 | **`cus_curr_temp`** | 110 | `ID` (INT), `name` (TEXT), `gsm` (TEXT), `g_id` (INT), `g_name` (TEXT), `f_id` (INT), `f_name` (TEXT), `cr` (), `db` (), `balance` (), `curr` (), `curr_id` (INT), `phone` (TEXT), `d` (), `days_late` (), `max_id` (), `cnt` () |
| 26 | **`cus_limit`** | 5 | `id` (INTEGER), `cus_id` (INTEGER), `curr_id` (INTEGER), `cr` (REAL), `db` (REAL), `online` (INTEGER), `online_ref2` (TEXT) |
| 27 | **`cus_limit_h`** | 7 | `id` (INTEGER), `cus_id` (INTEGER), `curr_id` (INTEGER), `cr` (REAL), `db` (REAL), `online` (INTEGER), `online_ref2` (TEXT) |
| 28 | **`cus_search_tmp`** | 141 | `id` (INT), `_id` (TEXT), `phone` (TEXT), `amount` (), `_in` (), `curr_name` (), `g_name` (TEXT), `cnt` (), `cus_type` (TEXT), `curr_code` (TEXT), `ID:1` (INT), `name` (TEXT), `gsm` (TEXT), `g_id` (INT), `g_name:1` (TEXT), `f_id` (INT), `f_name` (TEXT), `cr` (), `db` (), `balance` (), `curr` (), `curr_id` (INT), `phone:1` (TEXT), `d` (), `days_late` (), `max_id` (), `cnt:1` () |
| 29 | **`cus_type`** | 7 | `id` (INTEGER), `name` (TEXT), `param1` (TEXT), `param2` (TEXT), `online` (INTEGER), `online_ref2` (TEXT) |
| 30 | **`customers`** | 141 | `id` (INTEGER), `name` (TEXT), `gsm` (TEXT), `g_id` (INTEGER), `cus_type_id` (INTEGER), `date_` (), `ADDRESS` (TEXT), `remarks` (TEXT), `param1` (TEXT), `param2` (TEXT), `f1` (TEXT), `f2` (TEXT), `f3` (TEXT), `acc_p_id` (INTEGER), `vat_no` (TEXT), `online` (INTEGER), `online_ref` (INTEGER), `online_ref2` (TEXT), `sms` (INTEGER), `wa` (INTEGER) |
| 31 | **`days_`** | 7 | `id` (INTEGER), `name` (TEXT) |
| 32 | **`discount_type`** | 2 | `id` (INTEGER), `name` (TEXT) |
| 33 | **`doc_det`** | 0 | `tr_id` (INTEGER), `cus_id` (INTEGER), `cus_name` (TEXT), `in` (TEXT), `out` (TEXT), `date_` (TEXT), `remarks` (TEXT), `now_` (TEXT), `param1` (TEXT), `param2` (TEXT), `t_cus_id` (INTEGER), `t_cus_name` (TEXT), `f1` (TEXT), `f2` (TEXT), `f3` (TEXT), `curr_id` (INTEGER), `curr_name` (TEXT), `bill_id` (INTEGER), `p_id` (INTEGER), `p_remarks` (TEXT), `p_amount` (REAL), `p_status` (INTEGER), `p_ref_no` (TEXT), `d_amount` (REAL), `d_remarks` (TEXT), `p_curr_id` (INTEGER), `p_curr_name` (TEXT), `curr_price` (REAL), `p_curr_price` (REAL), `p_date` (TEXT), `cash_id` (INTEGER), `cash_name` (TEXT), `curr_mod` (INTEGER), `tr_type` (INTEGER) |
| 34 | **`doc_hdr`** | 0 | `id` (INTEGER), `tr_id` (INTEGER), `tr_sys` (INTEGER), `cus_id` (INTEGER), `cus_name` (TEXT), `in` (TEXT), `out` (TEXT), `date_` (TEXT), `remarks` (TEXT), `now_` (TEXT), `param1` (TEXT), `param2` (TEXT), `t_cus_id` (INTEGER), `t_cus_name` (TEXT), `f1` (TEXT), `f2` (TEXT), `f3` (TEXT), `curr_id` (INTEGER), `curr_name` (TEXT), `bill_id` (INTEGER), `p_id` (INTEGER), `p_remarks` (TEXT), `p_amount` (REAL), `p_status` (INTEGER), `p_ref_no` (TEXT), `d_amount` (REAL), `d_remarks` (TEXT), `p_curr_id` (INTEGER), `p_curr_name` (TEXT), `curr_price` (REAL), `p_curr_price` (REAL), `p_date` (TEXT), `cash_id` (INTEGER), `cash_name` (TEXT), `curr_mod` (INTEGER), `status` (INTEGER), `tr_type` (INTEGER), `req_id` (INTEGER), `online_ref` (INTEGER) |
| 35 | **`error_exception`** | 0 | `id` (INTEGER), `desc_` (TEXT), `now_` (TEXT) |
| 36 | **`excel_data`** | 0 | `id` (INTEGER), `f1` (TEXT), `f2` (TEXT), `f3` (TEXT), `f4` (TEXT), `f5` (TEXT), `f6` (TEXT), `f7` (TEXT), `f8` (TEXT), `f9` (TEXT), `f10` (TEXT), `log` (TEXT) |
| 37 | **`groups`** | 1 | `id` (INTEGER), `name` (TEXT), `param1` (TEXT), `param2` (TEXT), `online` (INTEGER), `online_ref2` (TEXT) |
| 38 | **`item_price`** | 751 | `item_id` (INTEGER), `curr_id` (INTEGER), `unit_id` (INTEGER), `SLS_U_PRICE` (REAL), `date_` (TEXT), `remarks` (TEXT), `param1` (TEXT), `param2` (TEXT), `online` (INTEGER), `online_ref2` (TEXT) |
| 39 | **`item_price_bk`** | 0 | `item_id` (INTEGER), `curr_id` (INTEGER), `unit_id` (INTEGER), `SLS_U_PRICE` (REAL), `date_` (TEXT), `remarks` (TEXT), `param1` (TEXT), `param2` (TEXT) |
| 40 | **`item_price_history`** | 231 | `id` (INTEGER), `item_id` (INTEGER), `curr_id` (INTEGER), `sls_u_price` (REAL), `date_` (TEXT), `log_date` (TEXT), `remarks` (TEXT), `param1` (TEXT), `param2` (TEXT), `unit_id` (INTEGER) |
| 41 | **`item_price_org`** | 0 | `item_id` (INT), `curr_id` (INT), `SLS_U_PRICE` (REAL), `date_` (TEXT), `remarks` (TEXT), `param1` (TEXT), `param2` (TEXT), `unit_id` (INT) |
| 42 | **`item_type`** | 6 | `id` (INTEGER), `name` (TEXT), `remarks` (TEXT), `param1` (TEXT), `param2` (TEXT), `online` (INTEGER), `online_ref2` (TEXT) |
| 43 | **`item_type_`** | 2 | `id` (INTEGER), `name` (TEXT), `remarks` (TEXT), `param1` (TEXT), `param2` (TEXT) |
| 44 | **`items`** | 567 | `id` (INTEGER), `name` (TEXT), `item_type_id` (INTEGER), `date_` (TEXT), `IS_ACTIVE` (INTEGER), `o_qty` (REAL), `o_cost` (REAL), `o_br_id` (INTEGER), `o_date` (TEXT), `e_date` (TEXT), `pic` (TEXT), `remarks` (TEXT), `qty` (REAL), `price` (REAL), `curr_id` (INTEGER), `curr_price` (REAL), `param1` (TEXT), `param2` (TEXT), `item_type_id_` (INTEGER), `unit_id` (INTEGER), `u_val` (INTEGER), `barcode` (TEXT), `online` (INTEGER), `online_ref` (INTEGER), `e_date2` (TEXT), `online_ref2` (TEXT) |
| 45 | **`items_closing_balance`** | 0 | `id` (INTEGER), `name` (TEXT), `item_type_id` (INTEGER), `date_` (TEXT), `IS_ACTIVE` (INTEGER), `o_qty` (REAL), `o_cost` (REAL), `o_br_id` (INTEGER), `o_date` (TEXT), `remarks` (TEXT), `qty` (REAL), `price` (REAL), `curr_id` (INTEGER), `param1` (TEXT), `param2` (TEXT), `e_qty` (REAL) |
| 46 | **`items_cost_calc`** | 29906 | `item_id` (INT), `br_id` (INT), `to_br_id` (), `date_` (TEXT), `bill_id` (), `tr_type` (), `is_back` (), `name` (), `bill_no` (), `bill_no2` (), `i_q` (REAL), `i_u` (), `o_q` (), `o_u` (), `n_q` (), `n_u` (), `n_t` (), `r_u` (), `adj_id` (), `e_date` (TEXT), `id2` (INTEGER) |
| 47 | **`items_cost_calc_m`** | 377 | `id` (INT), `month_` (), `item_id` (INT), `avg_month` (), `tot_qty` (), `net_qty` (), `n_u` () |
| 48 | **`items_cost_calc_temp`** | 525 | `item_id` (INT), `br_id` (INT), `to_br_id` (), `date_` (TEXT), `bill_id` (), `tr_type` (), `is_back` (), `name` (), `bill_no` (), `bill_no2` (), `i_q` (REAL), `i_u` (), `o_q` (), `o_u` (), `n_q` (), `n_u` (), `n_t` (), `r_u` (), `adj_id` (), `e_date` (TEXT), `id2` (INT) |
| 49 | **`items_cost_temp_h`** | 2 | `id` (INTEGER), `br_id` (INTEGER), `tot` (REAL), `qty` (REAL) |
| 50 | **`items_h`** | 534 | `id` (INT), `name` (TEXT), `item_type_id` (INT), `date_` (TEXT), `IS_ACTIVE` (INT), `o_qty` (REAL), `o_cost` (REAL), `o_br_id` (INT), `o_date` (TEXT), `e_date` (TEXT), `pic` (TEXT), `remarks` (TEXT), `qty` (REAL), `price` (REAL), `curr_id` (INT), `curr_price` (REAL), `param1` (TEXT), `param2` (TEXT), `item_type_id_` (INT), `unit_id` (INT), `u_val` (INT), `barcode` (TEXT), `online` (INT), `online_ref` (INT), `e_date2` (TEXT), `online_ref2` (TEXT) |
| 51 | **`items_temp`** | 4 | `item_id` (INTEGER), `item_type_id` (INTEGER), `curr_id` (INTEGER), `qty` (REAL), `price` (REAL), `no_` (INTEGER), `remark` (TEXT), `unit_id` (INTEGER), `u_val` (REAL), `base_unit` (INTEGER), `qty_pr` (REAL), `qty_t` (TEXT), `u_cost2` (REAL), `e_date` (TEXT) |
| 52 | **`messages`** | 0 | `message_id` (INTEGER), `chat_room_id` (INTEGER), `user_name` (TEXT), `user_id` (INTEGER), `message` (TEXT), `created_at` (TEXT), `server_id` (INTEGER), `reply_id` (INTEGER), `reply_msg` (TEXT), `reply_to` (TEXT) |
| 53 | **`notifications`** | 0 | `id` (INTEGER), `name` (TEXT), `date_` (TEXT), `status` (INTEGER), `param1` (TEXT), `param2` (TEXT) |
| 54 | **`reminders`** | 5 | `id` (INTEGER), `cus_id` (INTEGER), `date_` (TEXT), `time_` (TEXT), `remarks` (TEXT), `flag` (INTEGER), `param1` (TEXT), `param2` (TEXT), `online` (INTEGER), `online_ref2` (TEXT) |
| 55 | **`requests`** | 0 | `id` (INTEGER), `date_` (TEXT), `f_user_id` (INTEGER), `t_user_id` (INTEGER), `f_br_id` (INTEGER), `t_br_id` (INTEGER), `ref_no` (TEXT), `tr_type` (INTEGER), `acc_type` (INTEGER), `json_` (TEXT), `status` (INTEGER), `err` (TEXT) |
| 56 | **`requests_bills`** | 0 | `id` (INTEGER), `bill_id` (INTEGER), `bill_sys` (INTEGER), `date_` (TEXT), `remarks` (TEXT), `bill_no` (TEXT), `curr_name` (TEXT), `curr_id` (INTEGER), `bill_type` (INTEGER), `tr_type` (INTEGER), `is_back` (INTEGER), `br_id` (INTEGER), `cus_name` (TEXT), `cus_id` (INTEGER), `tran_status` (INTEGER), `to_br_id` (INTEGER), `amount` (REAL), `d_amount` (REAL), `tax_amount` (REAL), `param1` (TEXT), `param2` (TEXT), `param3` (TEXT), `curr_price` (REAL), `bill_no2` (INTEGER), `cash_name` (TEXT), `cash_id` (INTEGER), `status` (INTEGER), `adj_id` (INTEGER), `req_id` (INTEGER), `time_` (TEXT), `cost2` (REAL), `t_val` (REAL), `online_ref` (INTEGER), `paid_amount` (REAL) |
| 57 | **`requests_bills_det`** | 0 | `bill_id` (INTEGER), `item_name` (TEXT), `item_unit` (TEXT), `item_id` (INTEGER), `item_type_id` (INTEGER), `curr_id2` (INTEGER), `qty` (INTEGER), `cost_price` (REAL), `sls_u_price` (REAL), `d_amount2` (REAL), `cash_id2` (INTEGER), `remark2` (TEXT), `unit_name` (TEXT), `unit_id` (INTEGER), `u_val` (REAL), `base_name` (TEXT), `base_unit` (INTEGER), `qty_pr` (REAL), `qty_t` (TEXT) |
| 58 | **`requests_curr`** | 0 | `id` (INTEGER), `req_id` (INTEGER), `curr_name` (TEXT), `curr_id` (INTEGER), `code_name` (TEXT), `status` (INTEGER), `fils_name` (TEXT), `online_ref` (INTEGER) |
| 59 | **`requests_curr_price`** | 0 | `req_id` (INTEGER), `f_date` (TEXT), `t_date` (TEXT), `curr_name` (TEXT), `curr_id` (INTEGER), `price` (REAL) |
| 60 | **`requests_items`** | 0 | `id` (INTEGER), `req_id` (INTEGER), `date_` (TEXT), `item_name` (TEXT), `item_id` (INTEGER), `unit_name` (TEXT), `unit_id` (INTEGER), `o_date` (TEXT), `status` (INTEGER), `remarks` (TEXT), `online_ref` (INTEGER), `type_id` (INTEGER), `type_name` (TEXT) |
| 61 | **`requests_items_price`** | 0 | `req_id` (INTEGER), `date_` (TEXT), `item_name` (TEXT), `item_id` (INTEGER), `unit_name` (TEXT), `unit_id` (INTEGER), `curr_name` (TEXT), `curr_id` (INTEGER), `sls_u_price` (REAL) |
| 62 | **`requests_items_unit`** | 0 | `req_id` (INTEGER), `item_name` (TEXT), `item_id` (INTEGER), `unit_name` (TEXT), `unit_id` (INTEGER), `u_val` (REAL) |
| 63 | **`requests_names`** | 0 | `id` (INTEGER), `req_id` (INTEGER), `cus_name` (TEXT), `cus_id` (INTEGER), `g_name` (TEXT), `g_id` (INTEGER), `gsm` (TEXT), `address` (TEXT), `status` (INTEGER), `acc_p_id` (TEXT), `online_ref` (INTEGER) |
| 64 | **`requests_notify`** | 0 | `id` (INTEGER), `title` (TEXT), `date_` (TEXT), `message` (TEXT), `param1` (TEXT), `param2` (TEXT) |
| 65 | **`requests_out`** | 0 | `id` (INTEGER), `date_` (TEXT), `_un` (TEXT), `_p_un` (TEXT), `f_br_id` (INTEGER), `t_br_id` (INTEGER), `ref_no` (TEXT), `tr_type` (INTEGER), `acc_type` (INTEGER), `action_type` (INTEGER), `json_` (TEXT), `status` (INTEGER) |
| 66 | **`revenue_type`** | 6 | `id` (INTEGER), `name` (TEXT) |
| 67 | **`screens`** | 36 | `id` (INTEGER), `name` (TEXT), `p_id` (INTEGER), `is_active` (INTEGER), `new` (INTEGER), `edit` (INTEGER), `view` (INTEGER), `del` (INTEGER) |
| 68 | **`sys_conf`** | 11 | `id` (INTEGER), `desc_` (TEXT), `value_` (TEXT) |
| 69 | **`tax`** | 2 | `id` (INTEGER), `name` (TEXT), `tax_type_id` (INTEGER), `per` (REAL), `is_active` (INTEGER), `is_default` (INTEGER), `online` (INTEGER), `online_ref2` (TEXT) |
| 70 | **`tax_type`** | 2 | `id` (INTEGER), `name` (TEXT) |
| 71 | **`tmp_real`** | 1 | `r` (REAL) |
| 72 | **`tr_p_temps`** | 1 | `no_` (INTEGER), `cus_id` (INTEGER), `in_` (TEXT), `out` (TEXT), `date_` (TEXT), `remarks` (TEXT), `now_` (TEXT), `param1` (TEXT), `param2` (TEXT), `t_cus_id` (INTEGER), `f1` (TEXT), `f2` (TEXT), `f3` (TEXT), `curr_id` (INTEGER), `p_curr_id` (INTEGER), `bill_id` (INTEGER), `p_id` (INTEGER), `p_remarks` (TEXT), `p_amount` (REAL), `p_status` (INTEGER), `p_ref_no` (TEXT), `curr_price` (REAL), `p_date` (TEXT), `cash_id` (INTEGER), `p_curr_price` (REAL), `tr_type` (INTEGER), `curr_mod` (INTEGER), `c_price` (REAL), `c_diff_id` (INTEGER) |
| 73 | **`tran_type`** | 20 | `id` (INTEGER), `name` (TEXT), `param1` (TEXT), `param2` (TEXT) |
| 74 | **`transactions`** | 12138 | `id` (INTEGER), `cus_id` (INTEGER), `in` (TEXT), `out` (TEXT), `date_` (TEXT), `remarks` (TEXT), `now_` (TEXT), `param1` (TEXT), `param2` (TEXT), `t_cus_id` (INTEGER), `f1` (TEXT), `f2` (TEXT), `f3` (TEXT), `curr_id` (INTEGER), `bill_id` (INTEGER), `p_id` (INTEGER), `p_remarks` (TEXT), `p_amount` (REAL), `p_status` (INTEGER), `p_ref_no` (TEXT), `d_amount` (REAL), `d_remarks` (TEXT), `curr_price` (REAL), `p_curr_id` (INTEGER), `p_date` (TEXT), `item_id` (INTEGER), `cash_id` (INTEGER), `fund_id` (INTEGER), `tr_type` (INTEGER), `p_curr_price` (REAL), `curr_mod` (INTEGER), `online` (INTEGER), `online_ref` (INTEGER), `c_curr_id` (INTEGER), `c_curr_price` (REAL), `c_price` (REAL), `c_diff_id` (INTEGER), `c_p_id` (INTEGER), `user_id` (INTEGER), `last_user` (INTEGER), `last_update` (TEXT), `online_ref2` (TEXT) |
| 75 | **`transactions_h`** | 25806 | `id` (INT), `cus_id` (INT), `in` (TEXT), `out` (TEXT), `date_` (TEXT), `remarks` (TEXT), `now_` (TEXT), `param1` (TEXT), `param2` (TEXT), `t_cus_id` (INT), `f1` (TEXT), `f2` (TEXT), `f3` (TEXT), `curr_id` (INT), `bill_id` (INT), `p_id` (INT), `p_remarks` (TEXT), `p_amount` (REAL), `p_status` (INT), `p_ref_no` (TEXT), `d_amount` (REAL), `d_remarks` (TEXT), `curr_price` (REAL), `p_curr_id` (INT), `p_date` (TEXT), `item_id` (INT), `cash_id` (INT), `fund_id` (INT), `tr_type` (INT), `p_curr_price` (REAL), `curr_mod` (INT), `online` (INT), `online_ref` (INT), `c_curr_id` (INT), `c_curr_price` (REAL), `c_price` (REAL), `c_diff_id` (INT), `c_p_id` (INT), `user_id` (INT), `last_user` (INT), `last_update` (TEXT), `online_ref2` (TEXT) |
| 76 | **`transactions_h2`** | 56 | `id` (INT), `cus_id` (INT), `in` (TEXT), `out` (TEXT), `date_` (TEXT), `remarks` (TEXT), `now_` (TEXT), `param1` (TEXT), `param2` (TEXT), `t_cus_id` (INT), `f1` (TEXT), `f2` (TEXT), `f3` (TEXT), `curr_id` (INT), `bill_id` (INT), `p_id` (INT), `p_remarks` (TEXT), `p_amount` (REAL), `p_status` (INT), `p_ref_no` (TEXT), `d_amount` (REAL), `d_remarks` (TEXT), `curr_price` (REAL), `p_curr_id` (INT), `p_date` (TEXT), `item_id` (INT), `cash_id` (INT), `fund_id` (INT), `tr_type` (INT), `p_curr_price` (REAL), `curr_mod` (INT), `online` (INT), `online_ref` (INT), `c_curr_id` (INT), `c_curr_price` (REAL), `c_price` (REAL), `c_diff_id` (INT), `c_p_id` (INT), `user_id` (INT), `last_user` (INT), `last_update` (TEXT), `online_ref2` (TEXT) |
| 77 | **`transactions_issue`** | 0 | `id` (INT), `cus_id` (INT), `in` (TEXT), `out` (TEXT), `date_` (TEXT), `remarks` (TEXT), `now_` (TEXT), `param1` (TEXT), `param2` (TEXT), `t_cus_id` (INT), `f1` (TEXT), `f2` (TEXT), `f3` (TEXT), `curr_id` (INT), `bill_id` (INT), `p_id` (INT), `p_remarks` (TEXT), `p_amount` (REAL), `p_status` (INT), `p_ref_no` (TEXT), `d_amount` (REAL), `d_remarks` (TEXT), `curr_price` (REAL), `p_curr_id` (INT), `p_date` (TEXT), `item_id` (INT), `cash_id` (INT), `fund_id` (INT), `tr_type` (INT), `p_curr_price` (REAL), `curr_mod` (INT), `online` (INT), `online_ref` (INT), `c_curr_id` (INT), `c_curr_price` (REAL), `c_price` (REAL), `c_diff_id` (INT), `c_p_id` (INT), `user_id` (INT), `last_user` (INT), `last_update` (TEXT), `online_ref2` (TEXT) |
| 78 | **`trigger_flags`** | 1 | `is_active` (INTEGER) |
| 79 | **`unit_item`** | 1112 | `id` (INTEGER), `item_id` (INTEGER), `unit_id` (INTEGER), `u_val` (REAL), `date_` (TEXT), `param1` (TEXT), `param2` (TEXT), `param3` (TEXT), `online` (INTEGER), `online_ref2` (TEXT) |
| 80 | **`units`** | 18 | `id` (INTEGER), `name` (TEXT), `code` (TEXT), `param1` (TEXT), `param2` (TEXT), `online` (INTEGER), `online_ref2` (TEXT) |
| 81 | **`user_priv`** | 62 | `id` (INTEGER), `screen_id` (INTEGER), `user_id` (INTEGER), `new` (INTEGER), `edit` (INTEGER), `view` (INTEGER), `del` (INTEGER), `date_` (TEXT), `param1` (TEXT), `param2` (TEXT), `online` (INTEGER), `online_ref2` (TEXT) |
| 82 | **`users`** | 2 | `id` (INTEGER), `user_name` (TEXT), `name` (TEXT), `pwd` (TEXT), `gsm` (TEXT), `is_active` (INTEGER), `cash_id` (INTEGER), `br_id` (INTEGER), `date_` (TEXT), `param1` (TEXT), `param2` (TEXT), `f1` (TEXT), `f2` (TEXT), `f3` (TEXT), `online` (INTEGER), `online_ref2` (TEXT) |
| 83 | **`valid`** | 15 | `imei` (TEXT), `imei_code` (TEXT) |

---

## 3. تصنيف الجداول المحاسبية (Structural Classification)

بعد فحص العلاقات السجلية والبيانات المعبأة داخل الجداول، تم ترتيب وتصنيف الجداول لتطابق المفاهيم التالية:

1. **المنتجات والأصناف:**
   * `items` (السلع والتموينات والمواد): يحتوي على تفاصيل البضائع.
   * `item_groups` (أو `groups`): فئات السلع والمجموعات.
   * `units` & `unit_item`: الوحدات ومفاقمة بيع السلعة بالحبة والكرتون وباقات الشحن.

2. **المستندات والفواتير والطلبات:**
   * `bills2`: ترويسة الفواتير والمبيعات (Bills Headers).
   * `bill_transactions2`: تفاصيل وبنود الفواتير والعمليات المبيعية (Invoice Items Details).
   * `bill_type` & `tran_type`: أنواع الفواتير والحركات المالية المحتسبة.

3. **الصناديق والحسابات والقيود:**
   * `cash_fund` (الصناديق والخزائن): حسابات السيولة النقدية المعتمدة بالعملات المتعددة.
   * `transactions` & `transactions_h`: الحركات والقيود المالية العامة وجلب الأرصدة (Transactions History).
   * `doc_hdr` & `doc_det`: المستندات والسجلات الدفترية الموازية للتحوط ومطابقة القيد.

4. **العملاء والموردين والذمم الآجلة:**
   * `customers`: قاعدة بيانات الزبائن الشاملة (الاسم، الهاتف، العنوان).
   * `cus_type`: شرائح العملاء ومستويات الثقة (جملة، تجزئة، باقات فورية).

5. **الموظفون والتحكم الأمني:**
   * `users`: حسابات طاقم العمل ومسؤولي المبيعات المحاسبية بالمعرض.
   * `user_priv`: صلاحيات المستخدمين والتحقق المكتبي.
