-- CreateIndex
-- Note: this table takes continuous production writes. Consider applying this
-- manually via `psql` with `CREATE INDEX CONCURRENTLY` instead of running it
-- through `prisma migrate deploy`, since CONCURRENTLY cannot run inside a
-- transaction and a plain CREATE INDEX takes a SHARE lock that blocks writes
-- to "users" for the duration of the index build.
CREATE INDEX "users_classrooms_idx" ON "users" USING GIN ("classrooms");
