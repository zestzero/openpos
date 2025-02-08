# Entity Relationship  Diagram (ERD)
ER diagram is generated using [Mermaidjs](https://mermaid.js.org/)

```mermaidjs
erDiagram
    INVOICE ||--|{ ORDER : covers
    ORDER ||--|{ ORDER-ITEM : includes
    PRODUCT-CATEGORY ||--|{ PRODUCT : contains
    PRODUCT ||--o{ ORDER-ITEM : "ordered in"
```
