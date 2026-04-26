-- monthly-sales read model
-- name: ListMonthlySales :many
SELECT month, order_count, total_revenue, average_order_value
FROM monthly_sales_report
ORDER BY month DESC;

-- gross-profit read model
-- name: ListGrossProfit :many
SELECT month, order_count, revenue, cost_of_goods_sold, gross_profit
FROM gross_profit_report
ORDER BY month DESC;
