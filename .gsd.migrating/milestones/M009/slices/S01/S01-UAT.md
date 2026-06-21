# S01: Deal API — UAT

**Milestone:** M009
**Written:** 2026-06-21T09:28:33.163Z

## UAT: Deal API

### 1. Create Deal
```bash
curl -X POST http://localhost:3000/api/deals \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Deal","pipelineId":"default-pipeline-id","stageId":"default-new-stage-id","amount":100000}'
```

Expected: 201 response, deal with number С-2026-XXXXX

### 2. List Deals
```bash
curl http://localhost:3000/api/deals?pipelineId=default-pipeline-id
```

Expected: 200 response with deals array

### 3. Move Deal Stage
```bash
curl -X POST http://localhost:3000/api/deals/{id}/move \
  -H "Content-Type: application/json" \
  -d '{"stageId":"default-qualified-stage-id","changedBy":"user-id"}'
```

Expected: 200 response, DealHistory record created
