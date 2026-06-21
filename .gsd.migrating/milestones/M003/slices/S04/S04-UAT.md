# S04: Contract Repository, API, and Deal Conversion — UAT

**Milestone:** M003
**Written:** 2026-06-21T15:41:42.525Z

# UAT: Contract Repository, API, and Deal Conversion

## Preconditions
- Dev server running or API routes accessible
- Database initialized with test data (contacts, deals)
- User has access to API testing tools (curl, Postman, or similar)

## Test Cases

### 1. Deal Conversion Creates Contract with Bidirectional Link
**Steps:**
1. Create a test deal via POST /api/deals with contactId and amount
2. Call POST /api/deals/[dealId]/convert
3. Verify response contains contract with Д-YYYY-NNNNN number format
4. Query the deal via GET /api/deals/[dealId] — confirm contractId is set
5. Query the contract via GET /api/contracts/[contractId] — confirm dealId is set

**Expected Outcome:** Contract created with auto-numbered Д-YYYY-NNNNN format; both deal.contractId and contract.dealId reference each other

**Edge Cases:**
- Converting already-converted deal returns 409 error
- Converting non-existent deal returns 404 error

### 2. Contract Version Management
**Steps:**
1. Create a contract via POST /api/contracts
2. Call POST /api/contracts/[contractId]/versions with fileUrl and changes
3. Call GET /api/contracts/[contractId]/versions

**Expected Outcome:** Version number auto-increments (v1, v2, v3...); versions returned in descending order

### 3. Contract Signer Management
**Steps:**
1. Create a contract via POST /api/contracts
2. Call POST /api/contracts/[contractId]/signers with name and optional position
3. Call GET /api/contracts/[contractId]/signers

**Expected Outcome:** Signers created with name/position; returned in ascending ID order

### 4. Contract Filtering
**Steps:**
1. Create multiple contracts with different statuses (draft, active, signed)
2. Call GET /api/contracts?status=active
3. Call GET /api/contracts?contactId=[someContactId]

**Expected Outcome:** Filter parameters correctly subset results; soft-deleted contracts excluded from default queries

---

## UAT Type
Functional Testing — Verifies business logic for contract lifecycle, deal conversion, versioning, and signer management

## Not Proven By This UAT
- UI integration (covered by S05 contract pages)
- Concurrent transaction scenarios (single-threaded test environment)
- Performance under load (no stress testing performed)
