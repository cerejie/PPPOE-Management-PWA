# Template — Page

Pages compose. They do not contain business logic, deep JSX, or styling decisions.

## Responsibilities

**Owns:** route params/search state, calling the feature hooks, layout composition, page-level states.
**Never:** business rules, direct Axios/api imports, inline styling, components over a few lines defined inline.

## Skeleton

```tsx
export function InvoiceListPage() {
  const { filters, setFilters } = useInvoiceFilters();      // URL-backed
  const { data, isLoading, isError, refetch } = useInvoices(filters);

  return (
    <PageShell
      title="Invoices"
      actions={<CreateInvoiceButton />}
    >
      <InvoiceFilters value={filters} onChange={setFilters} />

      {isLoading && <InvoiceListSkeleton />}
      {isError && <ErrorState onRetry={refetch} />}
      {data?.length === 0 && <InvoiceEmptyState />}
      {data?.length ? <InvoiceCollection data={data} /> : null}
    </PageShell>
  );
}
```

`InvoiceCollection` decides table (desktop) vs cards (mobile). The page does not know which.

## Required decisions per page

| Question | Answer before coding |
|---|---|
| What is the user finishing here? | |
| Single primary action? | |
| Which state belongs in the URL? | filters, tab, page, search — always |
| Desktop layout? | |
| Mobile layout (375px)? | table → cards/drawer/list |
| Loading shape? | skeleton matching content |
| Empty copy + next action? | |
| Error copy + retry? | |
| Offline behaviour? | |
| Who is allowed here? | route guard **and** server-side check |

## Rules

- Page under ~150 lines. Past that, extract sections.
- Search params are the source of truth for shareable state — never mirror them into a store.
- Route guards are UX; the server still authorises every request.
- Page-level error boundary so one broken widget does not blank the route.
- Document title set per page.
