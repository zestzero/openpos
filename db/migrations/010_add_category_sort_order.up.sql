ALTER TABLE categories
ADD COLUMN sort_order BIGINT NOT NULL DEFAULT 0;

WITH ordered_categories AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY name, created_at, id) - 1 AS sort_order
    FROM categories
)
UPDATE categories AS c
SET sort_order = ordered_categories.sort_order
FROM ordered_categories
WHERE c.id = ordered_categories.id;

ALTER TABLE categories
ALTER COLUMN sort_order DROP DEFAULT;

CREATE INDEX idx_categories_sort_order ON categories(sort_order);
