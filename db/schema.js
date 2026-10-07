import {sqliteTable,text,integer,primaryKey,index,uniqueIndex} from 'drizzle-orm/sqlite-core';
import {sql} from 'drizzle-orm';
export const children=sqliteTable('children',{
  id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),name:text('name').notNull(),createdAt:integer('created_at').notNull(),
},t=>[index('children_owner_idx').on(t.ownerId)]);
export const attempts=sqliteTable('attempts',{
  id:text('id').primaryKey(),childId:text('child_id').notNull().references(()=>children.id),week:integer('week').notNull(),
  contentVersion:text('content_version').notNull(),optionOrder:text('option_order').notNull().default('{}'),startedAt:integer('started_at').notNull(),completedAt:integer('completed_at'),
},t=>[index('attempts_child_week_idx').on(t.childId,t.week),uniqueIndex('one_draft_per_week_idx').on(t.childId,t.week).where(sql`${t.completedAt} IS NULL`)]);
export const answers=sqliteTable('answers',{
  attemptId:text('attempt_id').notNull().references(()=>attempts.id),question:integer('question').notNull(),choice:text('choice').notNull(),
  isCorrect:integer('is_correct').notNull(),answeredAt:integer('answered_at').notNull(),
},t=>[primaryKey({columns:[t.attemptId,t.question]})]);
export const progress=sqliteTable('week_progress',{
  childId:text('child_id').notNull().references(()=>children.id),week:integer('week').notNull(),
  firstAttemptId:text('first_attempt_id').notNull().references(()=>attempts.id),firstCompletedAt:integer('first_completed_at').notNull(),
},t=>[primaryKey({columns:[t.childId,t.week]})]);
export const journals=sqliteTable('journals',{
  childId:text('child_id').notNull().references(()=>children.id),week:integer('week').notNull(),note:text('note').notNull(),
  done:integer('done').notNull(),updatedAt:integer('updated_at').notNull(),
},t=>[primaryKey({columns:[t.childId,t.week]})]);
export const assessments=sqliteTable('assessment_revisions',{
  id:text('id').primaryKey(),childId:text('child_id').notNull().references(()=>children.id),period:text('period').notNull(),
  ratings:text('ratings').notNull(),evidence:text('evidence').notNull(),note:text('note').notNull(),nextStep:text('next_step').notNull(),
  snapshot:text('snapshot').notNull(),createdAt:integer('created_at').notNull(),
},t=>[index('assessments_child_period_idx').on(t.childId,t.period,t.createdAt)]);
