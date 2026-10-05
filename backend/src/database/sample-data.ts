export const sampleBooks = [
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '9780061120084', category: 'Fiction', publishedYear: 1960, totalCopies: 4 },
  { title: '1984', author: 'George Orwell', isbn: '9780451524935', category: 'Fiction', publishedYear: 1949, totalCopies: 5 },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '9780743273565', category: 'Fiction', publishedYear: 1925, totalCopies: 3 },
  { title: 'Pride and Prejudice', author: 'Jane Austen', isbn: '9780141439518', category: 'Classics', publishedYear: 1813, totalCopies: 3 },
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '9780547928227', category: 'Fantasy', publishedYear: 1937, totalCopies: 4 },
  { title: "Harry Potter and the Sorcerer's Stone", author: 'J.K. Rowling', isbn: '9780590353427', category: 'Fantasy', publishedYear: 1997, totalCopies: 6 },
  { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', category: 'Technology', publishedYear: 2008, totalCopies: 3 },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt & David Thomas', isbn: '9780135957059', category: 'Technology', publishedYear: 2019, totalCopies: 2 },
  { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316097', category: 'History', publishedYear: 2011, totalCopies: 4 },
  { title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '9780553380163', category: 'Science', publishedYear: 1988, totalCopies: 2 },
  { title: 'The Alchemist', author: 'Paulo Coelho', isbn: '9780062315007', category: 'Fiction', publishedYear: 1988, totalCopies: 5 },
  { title: 'Atomic Habits', author: 'James Clear', isbn: '9780735211292', category: 'Self-Help', publishedYear: 2018, totalCopies: 4 },
  { title: 'Wings of Fire', author: 'A.P.J. Abdul Kalam', isbn: '9788173711466', category: 'Biography', publishedYear: 1999, totalCopies: 3 },
  { title: 'The God of Small Things', author: 'Arundhati Roy', isbn: '9780679457312', category: 'Fiction', publishedYear: 1997, totalCopies: 2 },
  { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '9780262046305', category: 'Technology', publishedYear: 2022, totalCopies: 2 },
  { title: 'Dune', author: 'Frank Herbert', isbn: '9780441172719', category: 'Science Fiction', publishedYear: 1965, totalCopies: 3 },
];

export const sampleMembers = [
  { name: 'Aarav Sharma', email: 'aarav.sharma@example.com', phone: '9876543210', active: true },
  { name: 'Priya Patel', email: 'priya.patel@example.com', phone: '9876501234', active: true },
  { name: 'Rohan Mehta', email: 'rohan.mehta@example.com', phone: '9123456780', active: true },
  { name: 'Ananya Iyer', email: 'ananya.iyer@example.com', phone: '9988776655', active: true },
  { name: 'John Smith', email: 'john.smith@example.com', phone: '5550100200', active: true },
  { name: 'Emily Johnson', email: 'emily.johnson@example.com', phone: '5550100300', active: true },
  { name: 'Vikram Singh', email: 'vikram.singh@example.com', phone: '9012345678', active: false },
  { name: 'Sara Khan', email: 'sara.khan@example.com', phone: null, active: true },
];

/** Indexes refer to sampleBooks / sampleMembers; day offsets are relative to "now". */
export const sampleLoans: Array<{
  book: number;
  member: number;
  borrowedDaysAgo: number;
  loanDays: number;
  returnedDaysAgo?: number;
}> = [
  { book: 0, member: 0, borrowedDaysAgo: 3, loanDays: 14 },
  { book: 6, member: 0, borrowedDaysAgo: 10, loanDays: 14 },
  { book: 1, member: 1, borrowedDaysAgo: 20, loanDays: 14 },
  { book: 4, member: 2, borrowedDaysAgo: 5, loanDays: 14 },
  { book: 8, member: 3, borrowedDaysAgo: 30, loanDays: 14, returnedDaysAgo: 12 },
  { book: 5, member: 4, borrowedDaysAgo: 25, loanDays: 14, returnedDaysAgo: 15 },
  { book: 11, member: 5, borrowedDaysAgo: 18, loanDays: 14 },
  { book: 12, member: 7, borrowedDaysAgo: 2, loanDays: 7 },
  { book: 1, member: 3, borrowedDaysAgo: 40, loanDays: 14, returnedDaysAgo: 28 },
  { book: 9, member: 2, borrowedDaysAgo: 15, loanDays: 21 },
  { book: 14, member: 4, borrowedDaysAgo: 1, loanDays: 14 },
  { book: 5, member: 5, borrowedDaysAgo: 9, loanDays: 14 },
];
