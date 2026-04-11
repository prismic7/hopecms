# HopeCMS — Database ERD

**PR-03: docs/db-erd**
Branch: `docs/db-erd` | Engineer: M3

---

## Notes

- `record_status` and `stamp` exist **only** on `customer` and `user`. All other core tables (`sales`, `salesDetail`, `product`, `priceHist`) are structurally unchanged from HopeDB.
- `salesDetail` and `priceHist` use **composite primary keys** (`PK-FK`).
- `user_module` and `UserModule_Rights` are pure **junction tables** with composite PKs.
- `empNo` on `sales` is stored as plain `VARCHAR` — the `employee` table is outside the scope of this Supabase project and no FK is enforced.
- The current price of any product is always `MAX(effDate)` per `prodCode` in `priceHist` — see the `product_current_price` view (Sprint 2, PR-03).

---

```mermaid
erDiagram
  customer {
    VARCHAR5  custno        PK
    VARCHAR20 custname
    VARCHAR50 address
    VARCHAR3  payterm
    VARCHAR10 record_status
    VARCHAR60 stamp
  }
  sales {
    VARCHAR8 transNo   PK
    DATE     salesDate
    VARCHAR5 custNo    FK
    VARCHAR5 empNo
  }
  salesDetail {
    VARCHAR8  transNo  PK, FK
    VARCHAR6  prodCode PK, FK
    DECIMAL   quantity
  }
  product {
    VARCHAR6  prodCode    PK
    VARCHAR30 description
    VARCHAR3  unit
  }
  priceHist {
    DATE     effDate   PK
    VARCHAR6 prodCode  PK, FK
    DECIMAL  unitPrice
  }
  user {
    TEXT       userId        PK
    VARCHAR50  username
    VARCHAR100 email
    VARCHAR12  user_type
    VARCHAR10  record_status
    VARCHAR60  stamp
  }
  Module {
    VARCHAR10 moduleCode PK
    VARCHAR30 moduleName
    VARCHAR10 record_status
    VARCHAR60 stamp
  }
  rights {
    VARCHAR12 rightCode     PK
    VARCHAR40 rightDesc
    INTEGER   right_default
    VARCHAR10 moduleCode    FK
    VARCHAR10 record_status
    VARCHAR60 stamp
  }
  user_module {
    TEXT      userId      PK, FK
    VARCHAR10 moduleCode  PK, FK
    INTEGER   rights_value
  }
  UserModule_Rights {
    TEXT      userId      PK, FK
    VARCHAR12 rightCode   PK, FK
    INTEGER   right_value
  }

  customer          ||--o{ sales             : "has"
  sales             ||--o{ salesDetail       : "contains"
  product           ||--o{ salesDetail       : "referenced in"
  product           ||--o{ priceHist         : "has price history"
  user              ||--o{ user_module       : "mapped to"
  Module            ||--o{ user_module       : "maps"
  Module            ||--o{ rights            : "owns"
  user              ||--o{ UserModule_Rights : "has"
  rights            ||--o{ UserModule_Rights : "assigned via"
```