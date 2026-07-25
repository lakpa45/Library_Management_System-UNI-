-- CreateTable
CREATE TABLE "Member" (
    "memberId" SERIAL NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),

    CONSTRAINT "Member_pkey" PRIMARY KEY ("memberId")
);

-- CreateTable
CREATE TABLE "library" (
    "library_id" SERIAL NOT NULL,
    "library_name" TEXT,
    "librarian_id" INTEGER,

    CONSTRAINT "library_pkey" PRIMARY KEY ("library_id")
);

-- CreateTable
CREATE TABLE "Librarian" (
    "librarianId" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),

    CONSTRAINT "Librarian_pkey" PRIMARY KEY ("librarianId")
);

-- CreateTable
CREATE TABLE "category" (
    "category_id" SERIAL NOT NULL,
    "category_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "category_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "book" (
    "book_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "category_id" INTEGER,

    CONSTRAINT "book_pkey" PRIMARY KEY ("book_id")
);

-- CreateTable
CREATE TABLE "book_copy" (
    "copy_id" SERIAL NOT NULL,
    "barcode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "book_id" INTEGER NOT NULL,

    CONSTRAINT "book_copy_pkey" PRIMARY KEY ("copy_id")
);

-- CreateTable
CREATE TABLE "issue" (
    "issue_id" SERIAL NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "return_date" TIMESTAMP(3),
    "member_id" INTEGER NOT NULL,
    "copy_id" INTEGER NOT NULL,
    "library_id" INTEGER,

    CONSTRAINT "issue_pkey" PRIMARY KEY ("issue_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Librarian_email_key" ON "Librarian"("email");

-- CreateIndex
CREATE UNIQUE INDEX "book_isbn_key" ON "book"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "book_copy_barcode_key" ON "book_copy"("barcode");

-- AddForeignKey
ALTER TABLE "library" ADD CONSTRAINT "library_librarian_id_fkey" FOREIGN KEY ("librarian_id") REFERENCES "Librarian"("librarianId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book" ADD CONSTRAINT "book_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_copy" ADD CONSTRAINT "book_copy_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "book"("book_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue" ADD CONSTRAINT "issue_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member"("memberId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue" ADD CONSTRAINT "issue_copy_id_fkey" FOREIGN KEY ("copy_id") REFERENCES "book_copy"("copy_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue" ADD CONSTRAINT "issue_library_id_fkey" FOREIGN KEY ("library_id") REFERENCES "library"("library_id") ON DELETE SET NULL ON UPDATE CASCADE;
