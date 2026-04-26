CREATE OR REPLACE VIEW monthly_sales_report AS
SELECT
    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
    COUNT(*)::BIGINT AS order_count,
    COALESCE(SUM(total_amount), 0)::BIGINT AS total_revenue,
    COALESCE(ROUND(AVG(total_amount)), 0)::BIGINT AS average_order_value
FROM orders
GROUP BY 1;

CREATE OR REPLACE VIEW gross_profit_report AS
SELECT
    TO_CHAR(DATE_TRUNC('month', o.created_at), 'YYYY-MM') AS month,
    COUNT(DISTINCT o.id)::BIGINT AS order_count,
    COALESCE(SUM(oi.subtotal), 0)::BIGINT AS revenue,
    COALESCE(SUM(oi.quantity * COALESCE(oi.cost_at_sale, 0)), 0)::BIGINT AS cost_of_goods_sold,
    (COALESCE(SUM(oi.subtotal), 0)::BIGINT - COALESCE(SUM(oi.quantity * COALESCE(oi.cost_at_sale, 0)), 0)::BIGINT)::BIGINT AS gross_profit
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
GROUP BY 1;
