-- Version MSSQL --

CREATE TABLE Users (
  users_id INT IDENTITY(1,1) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'users' CHECK (role IN ('admin', 'users')),
  created_date DATETIME DEFAULT GETDATE(),
  updated_date DATETIME DEFAULT GETDATE()
);

CREATE TABLE Categories (
  category_id INT IDENTITY(1,1) PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6'
);

CREATE TABLE Books (
  book_id INT IDENTITY(1,1) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(150),
  publisher VARCHAR(150),
  publish_year INT,
  isbn INT,
  pages INT,
  stock INT NOT NULL DEFAULT 0,
  location VARCHAR(500),
  description VARCHAR(500),
  category_id INT,
  FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);

CREATE TABLE BookImages (
  image_id INT IDENTITY(1,1) PRIMARY KEY,
  book_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL, 
  is_primary BIT DEFAULT 0, 
  uploaded_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (book_id) REFERENCES Books(book_id)
);

CREATE TABLE Borrowings (
  borrowing_id INT IDENTITY(1,1) PRIMARY KEY,
  users_id INT NOT NULL,             
  book_id INT NOT NULL,
  borrow_date DATE,
  due_date DATE,
  return_date DATE NULL,
  quantity INT NOT NULL DEFAULT 1,
  approved_by INT NULL,
  approved_date DATETIME NULL,
  notes VARCHAR(500) NULL,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Borrowed', 'Returned', 'Extended', 'Overdue', 'Waiting Return')),
  FOREIGN KEY (users_id) REFERENCES Users(users_id),
  FOREIGN KEY (book_id) REFERENCES Books(book_id),
  FOREIGN KEY (approved_by) REFERENCES Users(users_id)
);

CREATE TABLE Returns (
  return_id INT IDENTITY(1,1) PRIMARY KEY,
  borrowing_id INT NOT NULL,
  return_date DATE NOT NULL,
  fine DECIMAL(10,2) DEFAULT 0.00,
  FOREIGN KEY (borrowing_id) REFERENCES Borrowings(borrowing_id)
);

CREATE TABLE Register (
  register_id INT IDENTITY(1,1) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  requested_role VARCHAR(20) DEFAULT 'users' CHECK (requested_role IN ('users')), 
  register_date DATETIME DEFAULT GETDATE(),
  updated_date DATETIME DEFAULT GETDATE(),
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected'))
);

CREATE TABLE Ratings (
  rating_id INT IDENTITY(1,1) PRIMARY KEY,
  users_id INT NOT NULL,     
  book_id INT NOT NULL,     
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment VARCHAR(500),
  rating_date DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (users_id) REFERENCES Users(users_id),
  FOREIGN KEY (book_id) REFERENCES Books(book_id),
  CONSTRAINT UQ_UserBook UNIQUE (users_id, book_id)
);

CREATE TABLE Bookmarks (
  bookmark_id INT IDENTITY(1,1) PRIMARY KEY,
  users_id INT NOT NULL,
  book_id INT NOT NULL,
  bookmark_date DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (users_id) REFERENCES Users(users_id),
  FOREIGN KEY (book_id) REFERENCES Books(book_id),
  CONSTRAINT UQ_UserBookBookmark UNIQUE (users_id, book_id)
);

CREATE TABLE ReadingProgress (
  progress_id INT IDENTITY(1,1) PRIMARY KEY,
  borrowing_id INT NOT NULL,
  progress_percentage INT DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_updated DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (borrowing_id) REFERENCES Borrowings(borrowing_id)
);

-- Insert default admin user with MD5 hashed password
INSERT INTO Users (name, email, password, role, created_date, updated_date) 
VALUES (
  'Admin', 
  'admin@digitallibrary.com', 
  CONVERT(VARCHAR(32), HASHBYTES('MD5', 'admin'), 2), 
  'admin', 
  GETDATE(), 
  GETDATE()
);

-- Version SQL --

CREATE TABLE Users (
  users_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'users') NOT NULL DEFAULT 'users',
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE Categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6'
);

CREATE TABLE Books (
  book_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(150),
  publisher VARCHAR(150),
  publish_year INT,
  isbn VARCHAR(20),
  pages INT,
  stock INT NOT NULL DEFAULT 0,
  location VARCHAR(500),
  description VARCHAR(500),
  category_id INT,
  FOREIGN KEY (category_id) REFERENCES Categories(category_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

CREATE TABLE BookImages (
  image_id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES Books(book_id)
    ON DELETE CASCADE
);

CREATE TABLE Borrowings (
  borrowing_id INT AUTO_INCREMENT PRIMARY KEY,
  users_id INT NOT NULL,
  book_id INT NOT NULL,
  borrow_date DATE,
  due_date DATE,
  return_date DATE NULL,
  quantity INT NOT NULL DEFAULT 1,
  approved_by INT NULL,
  approved_date DATETIME NULL,
  notes VARCHAR(500) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status ENUM('Pending', 'Borrowed', 'Returned', 'Extended', 'Overdue', 'Waiting Return') DEFAULT 'Pending',
  FOREIGN KEY (users_id) REFERENCES Users(users_id)
    ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES Books(book_id)
    ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES Users(users_id)
    ON DELETE SET NULL
);

CREATE TABLE Returns (
  return_id INT AUTO_INCREMENT PRIMARY KEY,
  borrowing_id INT NOT NULL,
  return_date DATE NOT NULL,
  fine DECIMAL(10,2) DEFAULT 0.00,
  FOREIGN KEY (borrowing_id) REFERENCES Borrowings(borrowing_id)
    ON DELETE CASCADE
);

CREATE TABLE Register (
  register_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  requested_role ENUM('users') DEFAULT 'users',
  register_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending'
);

CREATE TABLE Ratings (
  rating_id INT AUTO_INCREMENT PRIMARY KEY,
  users_id INT NOT NULL,
  book_id INT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment VARCHAR(500),
  rating_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY UQ_UserBook_Rating (users_id, book_id),
  FOREIGN KEY (users_id) REFERENCES Users(users_id)
    ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES Books(book_id)
    ON DELETE CASCADE
);

CREATE TABLE Bookmarks (
  bookmark_id INT AUTO_INCREMENT PRIMARY KEY,
  users_id INT NOT NULL,
  book_id INT NOT NULL,
  bookmark_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY UQ_UserBook_Bookmark (users_id, book_id),
  FOREIGN KEY (users_id) REFERENCES Users(users_id)
    ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES Books(book_id)
    ON DELETE CASCADE
);

CREATE TABLE ReadingProgress (
  progress_id INT AUTO_INCREMENT PRIMARY KEY,
  borrowing_id INT NOT NULL,
  progress_percentage INT DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (borrowing_id) REFERENCES Borrowings(borrowing_id)
    ON DELETE CASCADE
);

INSERT INTO Users (name, email, password, role)
VALUES (
  'Admin',
  'admin@digitallibrary.com',
  MD5('admin'),
  'admin'
);
