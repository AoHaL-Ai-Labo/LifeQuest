-- Backfill new stat columns from existing JSON (stats, hiddenExp)
UPDATE "SaveData" SET
  "str" = COALESCE((stats::json->>'str')::int, 10),
  "dex" = COALESCE((stats::json->>'dex')::int, 10),
  "end" = COALESCE((stats::json->>'end')::int, 10),
  "int" = COALESCE((stats::json->>'int')::int, 10),
  "fai" = COALESCE((stats::json->>'fai')::int, 10),
  "arc" = COALESCE((stats::json->>'arc')::int, 10),
  "hiddenStr" = COALESCE((("hiddenExp"::json)->>'str')::int, 0),
  "hiddenDex" = COALESCE((("hiddenExp"::json)->>'dex')::int, 0),
  "hiddenEnd" = COALESCE((("hiddenExp"::json)->>'end')::int, 0),
  "hiddenInt" = COALESCE((("hiddenExp"::json)->>'int')::int, 0),
  "hiddenFai" = COALESCE((("hiddenExp"::json)->>'fai')::int, 0),
  "hiddenArc" = COALESCE((("hiddenExp"::json)->>'arc')::int, 0);
