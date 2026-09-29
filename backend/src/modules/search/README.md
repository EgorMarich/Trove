# Search engine

`searchTours` is the first real Trove aggregation pipeline.

- providers are queried in parallel;
- provider-specific schemas are hidden behind `TravelProvider`;
- equivalent hotel/date/duration offers are deduplicated;
- filters are applied to normalized data;
- results are sorted by Trove recommendation, price, rating or duration;
- pagination happens after aggregation.

This is intentionally provider-agnostic so real APIs can be added without changing the frontend contract.
