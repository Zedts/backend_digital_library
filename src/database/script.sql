CREATE TABLE Users (
  users_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'users') NOT NULL 
);

CREATE TABLE Categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL
);

CREATE TABLE Books (
  book_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(150),
  publisher VARCHAR(150),
  publish_year YEAR,
  stock INT NOT NULL DEFAULT 0,
  category_id INT,
  FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);

CREATE TABLE BookImages (
  image_id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL, 
  is_primary BOOLEAN DEFAULT FALSE, 
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES Books(book_id)
);

CREATE TABLE Borrowings (
  borrowing_id INT AUTO_INCREMENT PRIMARY KEY,
  users_id INT NOT NULL,             
  book_id INT NOT NULL,
  borrow_date DATE,
  due_date DATE,
  status ENUM('Pending', 'Borrowed', 'Returned', 'Extended') DEFAULT 'Pending',
  FOREIGN KEY (users_id) REFERENCES Users(users_id),
  FOREIGN KEY (book_id) REFERENCES Books(book_id)
);

CREATE TABLE Returns (
  return_id INT AUTO_INCREMENT PRIMARY KEY,
  borrowing_id INT NOT NULL,
  return_date DATE NOT NULL,
  fine DECIMAL(10,2) DEFAULT 0.00,
  FOREIGN KEY (borrowing_id) REFERENCES Borrowings(borrowing_id)
);

CREATE TABLE Register (
  register_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  requested_role ENUM('users') DEFAULT 'users', 
  register_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending'
);

CREATE TABLE Ratings (
  rating_id INT AUTO_INCREMENT PRIMARY KEY,
  users_id INT NOT NULL,     
  book_id INT NOT NULL,     
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  rating_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (users_id) REFERENCES Users(users_id),
  FOREIGN KEY (book_id) REFERENCES Books(book_id),
  UNIQUE (users_id, book_id)
);

CREATE TABLE Bookmarks (
  bookmark_id INT AUTO_INCREMENT PRIMARY KEY,
  users_id INT NOT NULL,
  book_id INT NOT NULL,
  bookmark_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (users_id) REFERENCES Users(users_id),
  FOREIGN KEY (book_id) REFERENCES Books(book_id),
  UNIQUE (users_id, book_id)
);