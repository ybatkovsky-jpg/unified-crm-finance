# S04: Contract API — UAT

**Milestone:** M009
**Written:** 2026-06-21T09:39:02.346Z

## UAT: Contract API

### 1. Create Contract
```bash
curl -X POST http://localhost:3000/api/contracts \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Contract","contactId":"contact-id","amount":500000}'
```

Expected: 201 response, contract with number Д-2026-XXXXX

### 2. List Contracts
```bash
curl http://localhost:3000/api/contracts?status=draft
```

Expected: 200 response with contracts array

### 3. Add Version
```bash
curl -X POST http://localhost:3000/api/contracts/{id}/versions \
  -H "Content-Type: application/json" \
  -d '{"contentMd":"# Contract v1\nTerms...","createdBy":"user-id"}'
```

Expected: 201 response, version.number = 1

### 4. Add Signer
```bash
curl -X POST http://localhost:3000/api/contracts/{id}/signers \
  -H "Content-Type: application/json" \
  -d '{"name":"Ivan Ivanov","position":"Director"}'
```

Expected: 201 response, signer created

### 5. Convert Deal to Contract
```bash
curl -X POST http://localhost:3000/api/deals/{id}/convert \
  -H "Content-Type: application/json" \
  -d '{"title":"Contract from Deal"}'
```

Expected: 201 response, contract created, deal.contractId set
