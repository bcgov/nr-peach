import { db } from "./db/index.ts";

db.insertInto("pies.concept")
  .values({
    class: ["a", "b"],
    concept: "concept",
    version: "version",
    created_by: "test"
  })
  .execute();

db.selectFrom("pies.concept")
  .selectAll()
  .execute()
  .then((rows) => {
    console.log(rows);
  });
