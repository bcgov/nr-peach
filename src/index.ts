import { db } from './db/index.ts';

// db.insertInto("pies.concept")
//   .values({
//     class: ["a", "b"],
//     concept: "concept",
//     version: "version",
//     created_by: "test"
//   })
//   .execute();

// db.insertInto("pies.process_event")
//   .values({
//     tx_id: "0195cab8-7d03-74b2-af02-553a6873b528",
//     system_record_id: 1,
//     start_date: new Date(),
//     is_datetime: false,
//     concept_id: 1,
//     created_by: "test"
//   })
//   .execute();

void db
  .selectFrom('pies.process_event')
  .innerJoin('pies.concept', 'pies.concept.id', 'pies.process_event.concept_id')
  .selectAll()
  .execute()
  .then((rows) => {
    console.log(rows);
  });
